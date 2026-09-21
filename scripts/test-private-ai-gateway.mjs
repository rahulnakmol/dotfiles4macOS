import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('../', import.meta.url).pathname;
const setup = join(root, 'scripts/setup-private-ai-gateway.sh');

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'private-ai-gateway-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const home = join(dir, 'home'), bin = join(dir, 'vendor-bin'), managed = join(home, '.local/bin');
  mkdirSync(home); mkdirSync(bin); mkdirSync(managed, { recursive: true });
  const calls = join(dir, 'calls');
  const executable = (name, body = 'printf "%s\\n" "$0 $*" >> "$CALLS"') =>
    writeFileSync(join(bin, name), `#!/bin/bash\nset -eu\n${body}\n`, { mode: 0o755 });
  executable('uname', 'echo Darwin');
  executable('id', 'echo fixture-user');
  executable('claude'); executable('codex'); executable('opencode');
  executable('curl', `
input="$(cat)"; [[ "$input" == *"Authorization: Bearer fixture-secret"* ]]
url="\${@: -1}"
if [[ "$url" == */v1/models ]]; then
  printf '%s\\n' '{"data":[{"id":"z-model"},{"id":"a-model"},{"id":"z-model"}]}'
  exit 0
fi
output=''
for ((i=1; i<=$#; i++)); do
  if [[ "\${!i}" == --output ]]; then j=$((i+1)); output="\${!j}"; fi
done
case "$url" in
  */v1/messages) printf '%s\\n' '{"content":[{"type":"text","text":"OK"}]}' > "$output" ;;
  */v1/chat/completions) printf '%s\\n' '{"choices":[{"message":{"content":"OK"}}]}' > "$output" ;;
  */v1/responses) printf '%s\\n' '{"id":"resp_fixture","output":[]}' > "$output" ;;
  *) exit 22 ;;
esac
printf 200`);
  executable('herdr', 'printf "%s|%s|%s|%s\\n" "${CLAUDE_CONFIG_DIR:-}" "${CODEX_HOME:-}" "$HOME" "$*" >> "$CALLS"; if [[ "$*" == "integration install opencode" ]]; then mkdir -p "$HOME/.config/opencode/plugins"; printf integration > "$HOME/.config/opencode/plugins/herdr-agent-state.js"; fi');
  const config = join(home, '.config/private-ai-gateway');
  mkdirSync(config, { recursive: true, mode: 0o700 });
  writeFileSync(join(config, 'endpoint'), 'https://gateway.example.test/base\n', { mode: 0o600 });
  writeFileSync(join(config, 'client.key'), 'fixture-secret\n', { mode: 0o600 });
  writeFileSync(join(config, 'default-model'), 'z-model\n', { mode: 0o600 });
  writeFileSync(join(config, 'model-aliases.json'), '{"fable":"a-model","opus-fast":"a-model","astra":"z-model"}\n', { mode: 0o600 });
  writeFileSync(join(config, 'protocol-models.json'), '{"anthropic":"a-model","chat":"z-model","responses":"z-model"}\n', { mode: 0o600 });
  const env = { ...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, CALLS: calls };
  return { home, config, managed, calls, env, executable, run: args => spawnSync('/bin/bash', [setup, ...args], { env, encoding: 'utf8' }) };
}

test('gateway setup is neutral, secret-safe, complete, and idempotent', t => {
  const f = fixture(t);
  for (let run = 0; run < 2; run++) {
    const result = f.run([]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!result.stdout.includes('fixture-secret'));
    assert.ok(!result.stderr.includes('fixture-secret'));
  }
  for (const file of ['endpoint', 'client.key', 'default-model', 'model-aliases.json', 'protocol-models.json', 'codex-home', 'opencode/opencode.json'])
    assert.equal(statSync(join(f.config, file)).mode & 0o777, 0o600, file);
  const codexHome = join(f.config, 'codex');
  assert.equal(statSync(codexHome).mode & 0o777, 0o700);
  assert.equal(statSync(join(codexHome, 'config.toml')).mode & 0o777, 0o600);
  const codex = readFileSync(join(codexHome, 'config.toml'), 'utf8');
  assert.match(codex, /wire_api = "responses"/);
  assert.match(codex, /command = "\/bin\/cat"/);
  assert.match(codex, new RegExp(`args = \\["${f.config.replaceAll('/', '\\/')}\\/client\\.key"\\]`));
  assert.match(codex, /gateway\.example\.test\/base\/v1/);
  assert.match(codex, /model = "z-model"/);
  assert.ok(!codex.includes('fixture-secret'));
  for (const file of ['AGENTS.md', 'hooks.json', 'keybindings.json', 'rules/dotfiles.rules'])
    assert.ok(lstatSync(join(codexHome, file)).isSymbolicLink(), file);
  const gatewayBindings = JSON.parse(readFileSync(join(codexHome, 'keybindings.json')));
  assert.deepEqual(gatewayBindings.find(binding => binding.command === 'openAvatarOverlay'), { command: 'openAvatarOverlay', key: null });
  const opencode = JSON.parse(readFileSync(join(f.config, 'opencode/opencode.json')));
  assert.deepEqual(Object.keys(opencode.provider.private_gateway.models), ['a-model', 'z-model']);
  assert.equal(opencode.model, 'private_gateway/z-model');
  assert.equal(opencode.provider.private_gateway.options.apiKey, `{file:${f.config}/client.key}`);
  assert.ok(!JSON.stringify(opencode).includes('fixture-secret'));
  const claude = readFileSync(join(f.managed, 'claude'), 'utf8');
  assert.match(claude, /ANTHROPIC_BASE_URL='https:\/\/gateway\.example\.test\/base'/);
  assert.match(claude, /ANTHROPIC_AUTH_TOKEN=\$\(<'.*client\.key'\)/);
  assert.ok(!claude.includes('fixture-secret'));
  assert.match(readFileSync(join(f.managed, 'opencode'), 'utf8'), /OPENCODE_CONFIG_DIR=.*private-ai-gateway\/opencode/);
  const codexWrapper = readFileSync(join(f.managed, 'codex'), 'utf8');
  assert.match(codexWrapper, /CODEX_HOME=\$\(<'.*\/private-ai-gateway\/codex-home'\)/);
  assert.match(codexWrapper, /unset CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME/);
  assert.doesNotMatch(codexWrapper, /export CODEX_PROFILE_NAME=/);
  assert.doesNotMatch(codexWrapper, /\.codex['"]/);
  assert.ok(!existsSync(join(f.managed, 'chatgpt-aigateway')));
  const modelRouter = readFileSync(join(f.managed, 'gateway-model'), 'utf8');
  assert.match(modelRouter, /jq -er --arg name "\$alias_name" '\.\[\$name\] \/\/ empty'/);
  const modelCall = spawnSync(join(f.managed, 'gateway-model'), ['codex', 'astra', '--version'], {env: {...f.env, PATH: `${f.managed}:${f.env.PATH}`}, encoding:'utf8'});
  assert.equal(modelCall.status, 0, modelCall.stderr);
  assert.match(readFileSync(f.calls, 'utf8'), /codex --model z-model --version/);
  const opencodeModelCall = spawnSync(join(f.managed, 'gateway-model'), ['opencode', 'opus-fast'], {env: {...f.env, PATH: `${f.managed}:${f.env.PATH}`}, encoding:'utf8'});
  assert.equal(opencodeModelCall.status, 0, opencodeModelCall.stderr);
  assert.match(readFileSync(f.calls, 'utf8'), /opencode --model private_gateway\/a-model/);
  const unavailable = spawnSync(join(f.managed, 'gateway-model'), ['codex', 'sol'], {env: {...f.env, PATH: `${f.managed}:${f.env.PATH}`}, encoding:'utf8'});
  assert.equal(unavailable.status, 1);
  assert.match(unavailable.stderr, /alias 'sol' is unavailable/);
  assert.ok(!existsSync(join(f.managed, 'chatgpt-subscription')));
  assert.equal([...codex.matchAll(/client\.key/g)].length, 2, 'Codex config stores only a denied-path entry and one file-backed auth reference');
  assert.equal(readFileSync(join(f.config, 'opencode/plugins/herdr-agent-state.js'), 'utf8'), 'integration');
  assert.ok(!existsSync(join(f.managed, 'cursor-agent')));
  const integrations = readFileSync(f.calls, 'utf8');
  assert.match(integrations, /private-ai-gateway\/claude\|\|.*\/home\|integration install claude/);
  assert.doesNotMatch(integrations, /integration install codex/);
  assert.match(integrations, /\|\|\/.*private-ai-gateway-herdr\.[^|]+\|integration install opencode/);
});

test('gateway setup diagnoses a failed compatibility API without replacing saved configuration', t => {
  const f = fixture(t);
  const beforeKey = readFileSync(join(f.config, 'client.key'), 'utf8');
  const beforeEndpoint = readFileSync(join(f.config, 'endpoint'), 'utf8');
  f.executable('curl', `
input="$(cat)"; url="\${@: -1}"
if [[ "$url" == */v1/models ]]; then printf '%s\\n' '{"data":[{"id":"z-model"},{"id":"a-model"}]}'; exit 0; fi
output=''; for ((i=1; i<=$#; i++)); do if [[ "\${!i}" == --output ]]; then j=$((i+1)); output="\${!j}"; fi; done
if [[ "$url" == */v1/chat/completions ]]; then printf '%s\\n' '{"error":{"message":"not enabled"}}' > "$output"; printf 404; exit 0; fi
case "$url" in */v1/messages) printf '%s\\n' '{"content":[]}' > "$output";; */v1/responses) printf '%s\\n' '{"id":"resp_fixture"}' > "$output";; esac
printf 200`);
  const result = f.run([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Chat Completions API check failed: the compatibility endpoint is not enabled/);
  assert.match(result.stderr, /No gateway credential or client configuration was changed/);
  assert.ok(!result.stderr.includes('fixture-secret'));
  assert.equal(readFileSync(join(f.config, 'client.key'), 'utf8'), beforeKey);
  assert.equal(readFileSync(join(f.config, 'endpoint'), 'utf8'), beforeEndpoint);
});

test('gateway setup distinguishes rejected authentication and malformed success responses', t => {
  for (const failure of ['auth','shape']) {
    const f=fixture(t);
    f.executable('curl', `
input="$(cat)"; url="\${@: -1}"
if [[ "$url" == */v1/models ]]; then printf '%s\\n' '{"data":[{"id":"z-model"},{"id":"a-model"}]}'; exit 0; fi
output=''; for ((i=1; i<=$#; i++)); do if [[ "\${!i}" == --output ]]; then j=$((i+1)); output="\${!j}"; fi; done
if [[ '${failure}' == auth && "$url" == */v1/messages ]]; then printf '%s\\n' '{"error":{}}' > "$output"; printf 401; exit 0; fi
if [[ '${failure}' == shape && "$url" == */v1/responses ]]; then printf '%s\\n' '{"output":[]}' > "$output"; printf 200; exit 0; fi
case "$url" in */v1/messages) printf '%s\\n' '{"content":[]}' > "$output";; */v1/chat/completions) printf '%s\\n' '{"choices":[{}]}' > "$output";; */v1/responses) printf '%s\\n' '{"id":"resp_fixture"}' > "$output";; esac
printf 200`);
    const result=f.run([]);
    assert.equal(result.status,1);
    if(failure==='auth') assert.match(result.stderr,/authentication was rejected/);
    else assert.match(result.stderr,/did not contain the expected successful response shape/);
    assert.ok(!result.stderr.includes('fixture-secret'));
  }
});

test('gateway validation succeeds without installed client binaries and reports skipped wrappers', t => {
  const f = fixture(t);
  for (const client of ['claude','codex','opencode']) rmSync(join(f.env.PATH.split(':')[0],client));
  const result=f.run([]);
  assert.equal(result.status,0,result.stderr);
  for(const client of ['claude','codex','opencode']) {
    assert.match(result.stdout,new RegExp(`${client === 'claude' ? 'Claude Code' : client === 'codex' ? 'Codex' : 'OpenCode'} CLI not found`,'i'));
    assert.ok(!existsSync(join(f.managed,client)));
  }
  assert.ok(existsSync(join(f.config,'codex/config.toml')));
  assert.ok(existsSync(join(f.managed,'gateway-model')));
});

test('catalog refresh validates aliases without rewriting the key or inventing model IDs', t => {
  const f = fixture(t);
  const beforeKey = readFileSync(join(f.config, 'client.key'), 'utf8');
  const result = f.run([]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(f.config, 'client.key'), 'utf8'), beforeKey);
  assert.deepEqual(JSON.parse(readFileSync(join(f.config, 'model-aliases.json'))), {fable:'a-model', 'opus-fast':'a-model', astra:'z-model'});
  writeFileSync(join(f.config, 'model-aliases.json'), '{"fable":"retired-model"}\n', {mode:0o600});
  const rejected = f.run([]);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /invalid or no longer advertised/);
  assert.equal(readFileSync(join(f.config, 'client.key'), 'utf8'), beforeKey);
});

test('status is read-only, reports modes, and keeps Cursor excluded', t => {
  const f = fixture(t);
  const before = execFileSync('find', [f.home, '-type', 'f', '-exec', 'shasum', '{}', ';'], { encoding: 'utf8' });
  const result = f.run(['--status']);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /gateway key:\s+present \(mode 600\)/);
  assert.match(result.stdout, /cursor-agent\s+excluded/);
  const after = execFileSync('find', [f.home, '-type', 'f', '-exec', 'shasum', '{}', ';'], { encoding: 'utf8' });
  assert.equal(after, before);
});

test('public files contain no private endpoint, credential, or Cursor gateway wiring', () => {
  const text = readFileSync(setup, 'utf8');
  assert.ok(!/CURSOR_API_(?:KEY|ENDPOINT)/.test(text));
  const literalUrls = [...text.matchAll(/["'](https:\/\/[^"']+)["']/g)].map(match => match[1]);
  assert.deepEqual(literalUrls, ['https://opencode.ai/config.json']);
  assert.ok(!/(?:sk-|Bearer )[A-Za-z0-9_-]{12,}/.test(text));
  for (const file of ['zsh/.zshrc.d/aliases.zsh','bash/.bashrc.d/aliases.sh','tmux/.config/tmux/tmux.conf']) {
    const tracked = readFileSync(join(root, file), 'utf8');
    assert.doesNotMatch(tracked, /gpt-[0-9]|claude-[0-9].*(?:fable|astra|sol|grok)|(?:fable|astra|sol|grok)[-_/][0-9]/i, file);
  }
});

test('tracked Claude and OpenCode modules remain reusable and gateway-neutral', () => {
  for (const module of ['claude', 'opencode']) {
    const files = execFileSync('git', ['ls-files', `${module}/`], {cwd: root, encoding:'utf8'}).trim().split('\n').filter(Boolean);
    for (const file of files) {
      const text = readFileSync(join(root, file), 'utf8');
      assert.doesNotMatch(text, /gateway\.example|fixture-secret|private-ai-gateway\/client\.key/, file);
    }
  }
});

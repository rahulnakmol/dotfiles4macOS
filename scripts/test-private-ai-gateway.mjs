import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
  executable('curl', 'input="$(cat)"; [[ "$input" == *"Authorization: Bearer fixture-secret"* ]]; printf \'%s\\n\' \'{"data":[{"id":"z-model"},{"id":"a-model"},{"id":"z-model"}]}\'');
  executable('herdr', 'printf "%s|%s|%s|%s\\n" "${CLAUDE_CONFIG_DIR:-}" "${CODEX_HOME:-}" "$HOME" "$*" >> "$CALLS"; if [[ "$*" == "integration install opencode" ]]; then mkdir -p "$HOME/.config/opencode/plugins"; printf integration > "$HOME/.config/opencode/plugins/herdr-agent-state.js"; fi');
  const config = join(home, '.config/private-ai-gateway');
  mkdirSync(config, { recursive: true, mode: 0o700 });
  writeFileSync(join(config, 'endpoint'), 'https://gateway.example.test/base\n', { mode: 0o600 });
  writeFileSync(join(config, 'client.key'), 'fixture-secret\n', { mode: 0o600 });
  writeFileSync(join(config, 'default-model'), 'z-model\n', { mode: 0o600 });
  const env = { ...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, CALLS: calls };
  return { home, config, managed, calls, env, run: args => spawnSync('/bin/bash', [setup, ...args], { env, encoding: 'utf8' }) };
}

test('gateway setup is neutral, secret-safe, complete, and idempotent', t => {
  const f = fixture(t);
  for (let run = 0; run < 2; run++) {
    const result = f.run([]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!result.stdout.includes('fixture-secret'));
    assert.ok(!result.stderr.includes('fixture-secret'));
  }
  for (const file of ['endpoint', 'client.key', 'default-model', 'codex/config.toml', 'opencode/opencode.json'])
    assert.equal(statSync(join(f.config, file)).mode & 0o777, 0o600, file);
  const codex = readFileSync(join(f.config, 'codex/config.toml'), 'utf8');
  assert.match(codex, /wire_api = "responses"/);
  assert.match(codex, /command = "\/bin\/cat"/);
  assert.match(codex, /gateway\.example\.test\/base\/v1/);
  assert.ok(!codex.includes('fixture-secret'));
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
  assert.equal(readFileSync(join(f.config, 'opencode/plugins/herdr-agent-state.js'), 'utf8'), 'integration');
  assert.ok(!existsSync(join(f.managed, 'cursor-agent')));
  const integrations = readFileSync(f.calls, 'utf8');
  assert.match(integrations, /private-ai-gateway\/claude\|\|.*\/home\|integration install claude/);
  assert.match(integrations, /\|.*private-ai-gateway\/codex\|.*\/home\|integration install codex/);
  assert.match(integrations, /\|\|\/.*private-ai-gateway-herdr\.[^|]+\|integration install opencode/);
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
});

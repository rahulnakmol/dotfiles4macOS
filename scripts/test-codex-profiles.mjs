import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('../', import.meta.url).pathname;
const installer = join(root, 'scripts/setup-codex-profiles.sh');

function executable(path, body) {
  writeFileSync(path, `#!/bin/bash\nset -euo pipefail\n${body}\n`);
  chmodSync(path, 0o755);
}

function prepareGateway(home) {
  const prepared = join(home, '.config/private-ai-gateway/codex');
  mkdirSync(join(prepared, 'rules'), {recursive:true});
  writeFileSync(join(home, '.config/private-ai-gateway/client.key'), 'fixture-key\n');
  for (const file of ['config.toml','AGENTS.md','hooks.json','keybindings.json']) writeFileSync(join(prepared,file), `${file}\n`);
  writeFileSync(join(prepared,'rules/dotfiles.rules'), 'rules\n');
  return prepared;
}

function subscriptionBootstrap(root, calls) {
  executable(join(root, 'scripts/bootstrap-codex.sh'), `
mkdir -p "$HOME/.codex/rules"
for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
  source="${root}/codex/.codex/$relative"; target="$HOME/.codex/$relative"
  mkdir -p "$(dirname "$source")" "$(dirname "$target")"
  [[ -e "$source" ]] || printf '%s\\n' "$relative" > "$source"
  rm -f "$target"; ln -s "$source" "$target"
done
printf subscription > "$HOME/.codex/subscription-state"
echo subscription >> '${calls}'`);
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'codex-profiles-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const home = join(dir, 'home'), bin = join(dir, 'bin'), app = join(dir, 'ChatGPT.app');
  const profile = join(dir, 'codex-profile'), calls = join(dir, 'calls');
  mkdirSync(home); mkdirSync(bin); mkdirSync(join(app, 'Contents/MacOS'), {recursive: true});
  mkdirSync(join(home, '.codex')); mkdirSync(join(home, '.codex-aigateway'));
  writeFileSync(join(home, '.codex/config.toml'), 'model = "subscription-fixture"\n');
  writeFileSync(join(home, '.codex-aigateway/config.toml'), 'model = "gateway-fixture"\n');
  writeFileSync(join(app, 'Contents/Info.plist'), '<plist/>');
  executable(join(app, 'Contents/MacOS/ChatGPT'), 'exit 0');
  executable(profile, `
case "\${1:-}" in
  version) echo 'codex-profile 1.2.0' ;;
  app)
    name="\${2:?profile required}"; workspace="\${3:-$HOME}"
    if [[ "$name" == default ]]; then
      codex_home="$HOME/.codex"; electron=''
    else
      codex_home="$HOME/.codex-$name"; electron="$codex_home/electron-user-data"
      mkdir -p "$electron"
    fi
    mkdir -p "$codex_home/logs"; chmod 700 "$codex_home" "$codex_home/logs"; : > "$codex_home/logs/desktop.log"; chmod 600 "$codex_home/logs/desktop.log"
    args=(-n --env "CODEX_HOME=$codex_home" --env "CODEX_ELECTRON_USER_DATA_PATH=$electron" --stdout "$codex_home/logs/desktop.log" --stderr "$codex_home/logs/desktop.log" -a "$CHATGPT_APP" "$workspace")
    [[ -z "$electron" ]] || args+=(--args "--user-data-dir=$electron")
    open "\${args[@]}"
    ;;
  *) exit 2 ;;
esac`);
  executable(join(bin, 'uname'), 'echo Darwin');
  executable(join(bin, 'open'), 'printf "%s\\n" "$*" >> "$CALLS"');
  executable(join(bin, 'defaults'), 'echo ChatGPT');
  executable(join(bin, 'plutil'), 'case "$*" in *CFBundleExecutable*) echo ChatGPT;; *CFBundleDisplayName*) echo ChatGPT;; *CFBundleIdentifier*) echo com.openai.codex;; esac');
  const env = {...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, CALLS: calls, CHATGPT_APP: app, CODEX_PROFILE_NO_UPDATE_CHECK: '1'};
  return {dir, home, bin, app, profile, calls, env};
}

test('pinned codex-profile launches stock and gateway desktops with separate homes and Electron state', t => {
  const f = fixture(t);
  for (const name of ['default', 'aigateway', 'default', 'aigateway']) {
    const result = spawnSync(f.profile, ['app', name, f.home], {env: {
      ...f.env,
      CODEX_ACCESS_TOKEN: '', CODEX_HOME: '/wrong/home', CODEX_SQLITE_HOME: '/wrong/sqlite',
      CODEX_ELECTRON_USER_DATA_PATH: '/wrong/electron', CODEX_PROFILE_NAME: 'wrong',
    }, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
  }
  const calls = readFileSync(f.calls, 'utf8').trim().split('\n');
  assert.equal(calls.length, 4);
  assert.match(calls[0], /-n --env CODEX_HOME=.*\/\.codex --env CODEX_ELECTRON_USER_DATA_PATH= /);
  assert.doesNotMatch(calls[0], /--user-data-dir/);
  assert.match(calls[1], /-n --env CODEX_HOME=.*\/\.codex-aigateway/);
  assert.match(calls[1], /CODEX_ELECTRON_USER_DATA_PATH=.*\/\.codex-aigateway\/electron-user-data/);
  assert.match(calls[1], /--user-data-dir=.*\/\.codex-aigateway\/electron-user-data/);
  assert.ok(calls.every(call => call.includes(`-a ${f.app}`)));
  assert.ok(calls.every(call => !call.includes('/wrong/')));
  assert.equal(statSync(join(f.home, '.codex-aigateway')).mode & 0o777, 0o700);
  assert.equal(statSync(join(f.home, '.codex-aigateway/logs/desktop.log')).mode & 0o777, 0o600);
});

test('desktop wrapper clears conflicting profile variables and discloses no secret', t => {
  const f = fixture(t);
  executable(join(f.bin, 'codex-profile'), 'printf "%s|%s|%s|%s|%s|%s\\n" "${CODEX_HOME:-}" "${CODEX_ACCESS_TOKEN:-}" "${CODEX_SQLITE_HOME:-}" "${CODEX_ELECTRON_USER_DATA_PATH:-}" "${CODEX_PROFILE_NAME:-}" "$*" >> "$CALLS"');
  const source = readFileSync(installer, 'utf8');
  const body = source.match(/write_launcher\(\) \{[\s\S]*?^\}/m)[0];
  const script = `set -euo pipefail\n${body}\nwrite_launcher '${f.bin}/chatgpt-aigateway' aigateway`;
  const generated = spawnSync('/bin/bash', ['-c', script], {env: f.env, encoding: 'utf8'});
  assert.equal(generated.status, 0, generated.stderr);
  const result = spawnSync(join(f.bin, 'chatgpt-aigateway'), [], {env: {...f.env, PATH: `${f.bin}:/usr/bin:/bin`, CODEX_HOME:'/wrong', CODEX_ACCESS_TOKEN:'fixture-secret', CODEX_SQLITE_HOME:'/wrong', CODEX_ELECTRON_USER_DATA_PATH:'/wrong', CODEX_PROFILE_NAME:'wrong'}, encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const call = readFileSync(f.calls, 'utf8');
  assert.equal(call, '|||||app aigateway\n');
  assert.ok(!readFileSync(join(f.bin, 'chatgpt-aigateway'), 'utf8').includes('fixture-secret'));
});

test('installer exposes subscription, gateway and both modes without touching Cursor', () => {
  const text = readFileSync(installer, 'utf8');
  assert.match(text, /--mode subscription\|gateway\|both/);
  assert.match(text, /Choose --mode subscription, gateway, or both/);
  assert.match(text, /8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a/);
  assert.match(text, /COMMIT=d2260b800297a2b6441b3341c5c3ac48b67d59a1/);
  assert.doesNotMatch(text, /CURSOR_API_KEY|cursor-agent|\.cursor/);
});

test('installer mode selection is idempotent and invokes only the selected journeys', t => {
  for (const mode of ['subscription', 'gateway', 'both']) {
    const dir = mkdtempSync(join(tmpdir(), `codex-installer-${mode}-`));
    t.after(() => rmSync(dir, {recursive: true, force: true}));
    const home = join(dir, 'home'), bin = join(dir, 'bin'), fakeRoot = join(dir, 'root'), calls = join(dir, 'calls');
    mkdirSync(home); mkdirSync(bin); mkdirSync(join(fakeRoot, 'scripts'), {recursive: true});
    const downloaded = join(dir, 'codex-profile-fixture');
    executable(downloaded, `[[ "\${1:-}" == version ]] && echo 'codex-profile 1.2.0'`);
    const checksum = createHash('sha256').update(readFileSync(downloaded)).digest('hex');
    executable(join(bin, 'uname'), 'echo Darwin');
    executable(join(bin, 'herdr'), 'printf "herdr:%s:%s\\n" "${CODEX_HOME:-}" "$*" >> "$CALLS"');
    executable(join(bin, 'curl'), `cp '${downloaded}' "\${@: -1}"`);
    subscriptionBootstrap(fakeRoot, calls);
    executable(join(fakeRoot, 'scripts/setup-private-ai-gateway.sh'), 'echo SHOULD-NOT-RUN >> "$CALLS"; exit 1');
    prepareGateway(home);
    const env = {...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, CALLS: calls, DOTFILES_ROOT: fakeRoot, CODEX_PROFILE_SHA256: checksum};
    for (let run = 0; run < 2; run++) {
      const result = spawnSync('/bin/bash', [installer, '--mode', mode], {env, encoding:'utf8'});
      assert.equal(result.status, 0, result.stderr);
    }
    const entries = readFileSync(calls, 'utf8').trim().split('\n');
    const setupEntries = entries.filter(entry => !entry.startsWith('herdr:'));
    const expected = mode === 'both' ? ['subscription']
      : mode === 'gateway' ? [] : ['subscription'];
    assert.deepEqual(setupEntries, expected);
    const herdrEntries = entries.filter(entry => entry.startsWith('herdr:'));
    assert.equal(herdrEntries.length, mode === 'both' ? 4 : 2);
    if (mode === 'both') assert.ok(herdrEntries.some(entry => entry.includes(`${home}/.codex-aigateway:integration install codex`)));
    else assert.ok(herdrEntries.every(entry => entry.includes(`${home}/.codex:integration install codex`)));
    assert.equal(statSync(join(home, '.local/bin/codex-profile')).mode & 0o777, 0o755);
    assert.equal(statSync(join(home, '.local/bin', mode === 'gateway' ? 'chatgpt-aigateway' : 'chatgpt-subscription')).mode & 0o777, 0o700);
    assert.equal(existsSync(join(home,'.codex-aigateway')), mode === 'both');
  }
});

test('mode transitions preserve isolated homes and expose two homes only in both mode', t => {
  const dir = mkdtempSync(join(tmpdir(), 'codex-transition-'));
  t.after(() => rmSync(dir, {recursive:true, force:true}));
  const home=join(dir,'home'), bin=join(dir,'bin'), fakeRoot=join(dir,'root'), calls=join(dir,'calls');
  mkdirSync(home); mkdirSync(bin); mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
  const downloaded=join(dir,'codex-profile-fixture');
  executable(downloaded, `[[ "\${1:-}" == version ]] && echo 'codex-profile 1.2.0'`);
  const checksum=createHash('sha256').update(readFileSync(downloaded)).digest('hex');
  executable(join(bin,'uname'),'echo Darwin');
  executable(join(bin,'curl'),`cp '${downloaded}' "\${@: -1}"`);
  executable(join(bin,'herdr'),'printf "herdr:%s:%s\\n" "${CODEX_HOME:-}" "$*" >> "$CALLS"');
  subscriptionBootstrap(fakeRoot, calls);
  executable(join(fakeRoot,'scripts/setup-private-ai-gateway.sh'),'echo SHOULD-NOT-RUN >> "$CALLS"; exit 1');
  const prepared=prepareGateway(home);
  mkdirSync(join(home,'.local/bin'),{recursive:true});
  executable(join(home,'.local/bin/codex'),'exit 0');
  const env={...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,CALLS:calls,DOTFILES_ROOT:fakeRoot,CODEX_PROFILE_SHA256:checksum};
  const run=mode=>spawnSync('/bin/bash',[installer,'--mode',mode],{env,encoding:'utf8'});

  assert.equal(run('subscription').status,0);
  assert.ok(existsSync(join(home,'.codex/subscription-state')));
  assert.ok(!existsSync(join(home,'.codex-aigateway')));

  assert.equal(run('both').status,0);
  assert.ok(existsSync(join(home,'.codex/subscription-state')));
  assert.ok(existsSync(join(home,'.codex-aigateway/config.toml')));

  assert.equal(run('gateway').status,0);
  assert.ok(existsSync(join(home,'.codex/config.toml')));
  assert.ok(!existsSync(join(home,'.codex/subscription-state')));
  assert.ok(!existsSync(join(home,'.codex-aigateway')));
  assert.ok(existsSync(join(home,'.local/state/dotfiles/codex-profiles/subscription-home/subscription-state')));

  assert.equal(run('both').status,0);
  assert.ok(existsSync(join(home,'.codex/subscription-state')));
  assert.ok(existsSync(join(home,'.codex-aigateway/config.toml')));

  assert.equal(run('subscription').status,0);
  assert.ok(existsSync(join(home,'.codex/subscription-state')));
  assert.ok(!existsSync(join(home,'.codex-aigateway')));
  assert.ok(existsSync(join(home,'.local/state/dotfiles/codex-profiles/gateway-home/config.toml')));
  assert.equal(readFileSync(join(home,'.config/private-ai-gateway/codex-home'),'utf8'),`${prepared}\n`);
  assert.ok(existsSync(join(home,'.local/bin/codex')));
  assert.equal(readFileSync(join(home,'.local/state/dotfiles/codex-profiles/mode'),'utf8'),'subscription\n');
  assert.doesNotMatch(readFileSync(calls,'utf8'),/SHOULD-NOT-RUN/);
});

test('gateway profile mode fails safely when gateway setup has not been prepared', t => {
  const dir=mkdtempSync(join(tmpdir(),'codex-no-gateway-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const home=join(dir,'home'), bin=join(dir,'bin'), fakeRoot=join(dir,'root');
  mkdirSync(home); mkdirSync(bin); mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
  executable(join(bin,'uname'),'echo Darwin');
  const result=spawnSync('/bin/bash',[installer,'--mode','gateway'],{
    env:{...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,DOTFILES_ROOT:fakeRoot},encoding:'utf8'
  });
  assert.equal(result.status,1);
  assert.match(result.stderr,/Gateway configuration is not prepared/);
  assert.match(result.stderr,/Run scripts\/setup-private-ai-gateway\.sh/);
  assert.ok(!existsSync(join(home,'.codex')));
  assert.ok(!existsSync(join(home,'.codex-aigateway')));
});

test('all desktop modes require the separately validated gateway before changing homes', t => {
  for (const mode of ['subscription', 'gateway', 'both']) {
    const dir=mkdtempSync(join(tmpdir(),`codex-requires-gateway-${mode}-`));
    t.after(()=>rmSync(dir,{recursive:true,force:true}));
    const home=join(dir,'home'), bin=join(dir,'bin'), fakeRoot=join(dir,'root');
    mkdirSync(home); mkdirSync(bin); mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
    executable(join(bin,'uname'),'echo Darwin');
    const result=spawnSync('/bin/bash',[installer,'--mode',mode],{
      env:{...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,DOTFILES_ROOT:fakeRoot},encoding:'utf8'
    });
    assert.equal(result.status,1);
    assert.match(result.stderr,/Gateway configuration is not prepared/);
    assert.ok(!existsSync(join(home,'.codex')));
    assert.ok(!existsSync(join(home,'.codex-aigateway')));
  }
});

test('active setup lock prevents concurrent Codex home transitions', t => {
  const dir=mkdtempSync(join(tmpdir(),'codex-profile-lock-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const home=join(dir,'home'), bin=join(dir,'bin'), fakeRoot=join(dir,'root');
  mkdirSync(home); mkdirSync(bin); mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
  executable(join(bin,'uname'),'echo Darwin');
  prepareGateway(home);
  const lock=join(home,'.local/state/dotfiles/codex-profiles/setup.lock');
  mkdirSync(lock,{recursive:true});
  writeFileSync(join(lock,'pid'),`${process.pid}\n`);
  const result=spawnSync('/bin/bash',[installer,'--mode','gateway'],{
    env:{...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,DOTFILES_ROOT:fakeRoot},encoding:'utf8'
  });
  assert.equal(result.status,1);
  assert.match(result.stderr,/Another Codex profile setup is already running/);
  assert.ok(!existsSync(join(home,'.codex')));
});

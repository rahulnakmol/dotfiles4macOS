import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('../', import.meta.url).pathname;
const installer = join(root, 'scripts/setup-codex-profiles.sh');

function executable(path, body) {
  writeFileSync(path, `#!/bin/bash\nset -euo pipefail\n${body}\n`);
  chmodSync(path, 0o755);
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
  const source = readFileSync(join(root, 'scripts/setup-private-ai-gateway.sh'), 'utf8');
  const body = source.match(/printf -v gateway_desktop_body[\s\S]*?write_wrapper "\$BIN_DIR\/chatgpt-aigateway" "\$gateway_desktop_body"/)[0];
  const script = `set -euo pipefail\nBIN_DIR='${f.bin}'\nwrite_wrapper(){ printf '#!/usr/bin/env bash\\nset -euo pipefail\\n%s\\n' "$2" > "$1"; chmod 700 "$1"; }\n${body}`;
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
  assert.match(text, /MODE=both/);
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
    executable(join(bin, 'curl'), `cp '${downloaded}' "\${@: -1}"`);
    executable(join(fakeRoot, 'scripts/bootstrap-codex.sh'), 'echo subscription >> "$CALLS"');
    executable(join(fakeRoot, 'scripts/setup-private-ai-gateway.sh'), 'echo gateway >> "$CALLS"');
    const env = {...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin`, CALLS: calls, DOTFILES_ROOT: fakeRoot, CODEX_PROFILE_SHA256: checksum};
    for (let run = 0; run < 2; run++) {
      const result = spawnSync('/bin/bash', [installer, '--mode', mode], {env, encoding:'utf8'});
      assert.equal(result.status, 0, result.stderr);
    }
    const entries = readFileSync(calls, 'utf8').trim().split('\n');
    const expected = mode === 'both' ? ['subscription','gateway','gateway','subscription','gateway','gateway']
      : mode === 'gateway' ? Array(4).fill('gateway') : ['subscription','subscription'];
    assert.deepEqual(entries, expected);
    assert.equal(statSync(join(home, '.local/bin/codex-profile')).mode & 0o777, 0o755);
    assert.equal(statSync(join(home, '.local/bin', mode === 'gateway' ? 'chatgpt-aigateway' : 'chatgpt-subscription')).mode & 0o777, 0o700);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const root=new URL('../',import.meta.url).pathname;
const installer=join(root,'scripts/setup-codex-profiles.sh');
const launchLibrary=join(root,'raycast/.config/raycast/lib/codex-profile.sh');

function executable(path,body) {
  writeFileSync(path,`#!/bin/bash\nset -euo pipefail\n${body}\n`);
  chmodSync(path,0o755);
}

function prepareGateway(home) {
  const prepared=join(home,'.config/private-ai-gateway/codex');
  mkdirSync(join(prepared,'rules'),{recursive:true});
  writeFileSync(join(home,'.config/private-ai-gateway/client.key'),'fixture-key\n');
  for(const file of ['config.toml','AGENTS.md','hooks.json','keybindings.json'])writeFileSync(join(prepared,file),`${file}\n`);
  writeFileSync(join(prepared,'rules/dotfiles.rules'),'rules\n');
  return prepared;
}

function subscriptionBootstrap(fakeRoot,calls) {
  executable(join(fakeRoot,'scripts/bootstrap-codex.sh'),`
mkdir -p "$HOME/.codex/rules"
for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
  source="${fakeRoot}/codex/.codex/$relative"; target="$HOME/.codex/$relative"
  mkdir -p "$(dirname "$source")" "$(dirname "$target")"
  [[ -e "$source" ]] || printf '%s\\n' "$relative" >"$source"
  rm -f "$target"; ln -s "$source" "$target"
done
printf subscription >"$HOME/.codex/subscription-state"
echo subscription >>'${calls}'`);
}

function installStowFixture(bin,fakeRoot) {
  executable(join(bin,'stow'),`
[[ " $* " == *" -n "* ]] && exit 0
mkdir -p "$HOME/.config/raycast/scripts/codex" "$HOME/.config/raycast/lib" "$HOME/.config/raycast/workstation"
for relative in scripts/codex/chatgpt-subscription.sh scripts/codex/chatgpt-aigateway.sh lib/codex-profile.sh workstation/workstation.json workstation/aliases.json workstation/hotkeys.json; do
  source="${fakeRoot}/raycast/.config/raycast/$relative"; target="$HOME/.config/raycast/$relative"
  rm -f "$target"; ln -s "$source" "$target"
done`);
}

function fixture(t) {
  const dir=mkdtempSync(join(tmpdir(),'codex-profiles-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const home=join(dir,'home'),bin=join(dir,'bin'),fakeRoot=join(dir,'root'),calls=join(dir,'calls');
  mkdirSync(home);mkdirSync(bin);mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
  cpSync(join(root,'raycast'),join(fakeRoot,'raycast'),{recursive:true});
  const downloaded=join(dir,'codex-profile-fixture');
  executable(downloaded,`case "\${1:-}" in version) echo 'codex-profile 1.2.0';; app) printf 'app:%s\\n' "\${2:-}" >>"$CALLS";; *) exit 2;; esac`);
  const checksum=createHash('sha256').update(readFileSync(downloaded)).digest('hex');
  executable(join(bin,'uname'),'echo Darwin');
  executable(join(bin,'curl'),`cp '${downloaded}' "\${@: -1}"`);
  executable(join(bin,'herdr'),'printf "herdr:%s:%s\\n" "${CODEX_HOME:-}" "$*" >>"$CALLS"');
  installStowFixture(bin,fakeRoot);
  subscriptionBootstrap(fakeRoot,calls);
  executable(join(fakeRoot,'scripts/setup-private-ai-gateway.sh'),'echo SHOULD-NOT-RUN >>"$CALLS"; exit 1');
  prepareGateway(home);
  const env={...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,CALLS:calls,DOTFILES_ROOT:fakeRoot,CODEX_PROFILE_SHA256:checksum};
  return {dir,home,bin,fakeRoot,calls,env,run:mode=>spawnSync('/bin/bash',[installer,'--mode',mode],{env,encoding:'utf8'})};
}

test('installer exposes three desktop modes and keeps gateway credentials separate',()=>{
  const text=readFileSync(installer,'utf8');
  assert.match(text,/--mode subscription\|gateway\|both/);
  assert.match(text,/setup-private-ai-gateway\.sh/);
  assert.match(text,/PROFILE_ROOT=.*\.config\/codex-profiles/);
  assert.match(text,/PROFILE_BIN="\$PROFILE_ROOT\/bin\/codex-profile"/);
  assert.doesNotMatch(text,/CURSOR_API_KEY|\.cursor|write_launcher/);
});

test('every mode Stows both official-template Raycast commands and uses no desktop launcher in local bin',t=>{
  for(const mode of ['subscription','gateway','both']) {
    const f=fixture(t);
    const result=f.run(mode);
    assert.equal(result.status,0,result.stderr);
    for(const name of ['chatgpt-subscription.sh','chatgpt-aigateway.sh']) {
      const path=join(f.home,'.config/raycast/scripts/codex',name);
      assert.ok(existsSync(path));
      const text=readFileSync(path,'utf8');
      for(const field of ['schemaVersion','title','mode','packageName'])assert.match(text,new RegExp(`@raycast\\.${field}`));
    }
    assert.equal(statSync(join(f.home,'.config/codex-profiles/bin/codex-profile')).mode&0o777,0o755);
    assert.ok(!existsSync(join(f.home,'.local/bin/chatgpt-subscription')));
    assert.ok(!existsSync(join(f.home,'.local/bin/chatgpt-aigateway')));
    assert.equal(existsSync(join(f.home,'.codex-aigateway')),mode==='both');
  }
});

test('mode transitions are repeatable and expose a second active home only in both mode',t=>{
  const f=fixture(t);
  for(const mode of ['subscription','subscription','both','gateway','both','subscription']) {
    const result=f.run(mode);
    assert.equal(result.status,0,`${mode}: ${result.stderr}`);
    assert.equal(existsSync(join(f.home,'.codex-aigateway')),mode==='both');
    assert.equal(readFileSync(join(f.home,'.local/state/dotfiles/codex-profiles/mode'),'utf8'),`${mode}\n`);
  }
  assert.ok(existsSync(join(f.home,'.codex/subscription-state')));
  assert.ok(existsSync(join(f.home,'.local/state/dotfiles/codex-profiles/gateway-home/config.toml')));
  assert.doesNotMatch(readFileSync(f.calls,'utf8'),/SHOULD-NOT-RUN/);
});

test('missing gateway state fails before changing Codex homes',t=>{
  const f=fixture(t);
  rmSync(join(f.home,'.config/private-ai-gateway'),{recursive:true,force:true});
  const result=f.run('gateway');
  assert.equal(result.status,1);
  assert.match(result.stderr,/Gateway configuration is not prepared/);
  assert.ok(!existsSync(join(f.home,'.codex')));
});

test('legacy repository-owned Raycast links migrate while unrelated files are refused',t=>{
  const owned=fixture(t);
  const legacy=join(owned.home,'.config/raycast-workstation');
  mkdirSync(legacy,{recursive:true});
  for(const name of ['workstation.json','aliases.json','hotkeys.json'])symlinkSync(join(owned.fakeRoot,'raycast/.config/raycast-workstation',name),join(legacy,name));
  assert.equal(owned.run('gateway').status,0);
  assert.ok(!existsSync(legacy));

  const personal=fixture(t);
  const personalLegacy=join(personal.home,'.config/raycast-workstation');
  mkdirSync(personalLegacy,{recursive:true});
  writeFileSync(join(personalLegacy,'notes.txt'),'mine\n');
  const result=personal.run('gateway');
  assert.equal(result.status,1);
  assert.match(result.stderr,/files not owned by this repository/);
  assert.equal(readFileSync(join(personalLegacy,'notes.txt'),'utf8'),'mine\n');
});

function launchFixture(t,mode='both') {
  const dir=mkdtempSync(join(tmpdir(),'codex-launch-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const home=join(dir,'home'),profile=join(home,'.config/codex-profiles/bin/codex-profile'),calls=join(dir,'calls');
  mkdirSync(join(home,'.config/codex-profiles/bin'),{recursive:true});
  mkdirSync(join(home,'.local/state/dotfiles/codex-profiles'),{recursive:true});
  writeFileSync(join(home,'.local/state/dotfiles/codex-profiles/mode'),`${mode}\n`);
  executable(profile,'printf "%s|%s|%s|%s|%s|%s\\n" "${CODEX_HOME:-}" "${CODEX_ACCESS_TOKEN:-}" "${CODEX_SQLITE_HOME:-}" "${CODEX_ELECTRON_USER_DATA_PATH:-}" "${CODEX_PROFILE_NAME:-}" "$*" >>"$CALLS"');
  const env={...process.env,HOME:home,CALLS:calls,TMPDIR:join(dir,'tmp'),CODEX_HOME:'/wrong',CODEX_ACCESS_TOKEN:'secret',CODEX_SQLITE_HOME:'/wrong',CODEX_ELECTRON_USER_DATA_PATH:'/wrong',CODEX_PROFILE_NAME:'wrong'};
  mkdirSync(env.TMPDIR);
  const run=route=>spawnSync('/bin/bash',['-c',`source '${launchLibrary}'; launch_codex_profile '${route}'`],{env,encoding:'utf8'});
  return {dir,home,calls,env,run};
}

test('profile launcher clears inherited credentials, routes modes, suppresses repeats, and recovers stale locks',t=>{
  const f=launchFixture(t);
  assert.equal(f.run('subscription').status,0);
  assert.equal(f.run('subscription').status,0);
  assert.equal(readFileSync(f.calls,'utf8'),'|||||app default\n');
  assert.equal(f.run('gateway').status,0);
  assert.match(readFileSync(f.calls,'utf8'),/app aigateway/);

  const lock=join(f.env.TMPDIR,`dotfiles-chatgpt-gateway-${process.getuid()}.lock`);
  rmSync(lock,{recursive:true,force:true});
  mkdirSync(lock);
  writeFileSync(join(lock,'launched-at'),'1\n');
  assert.equal(f.run('gateway').status,0);
  assert.equal(readFileSync(f.calls,'utf8').trim().split('\n').length,3);

  const disabled=launchFixture(t,'subscription');
  assert.equal(disabled.run('gateway').status,64);
});

test('active setup lock prevents concurrent home transitions',t=>{
  const f=fixture(t);
  const lock=join(f.home,'.local/state/dotfiles/codex-profiles/setup.lock');
  mkdirSync(lock,{recursive:true});
  writeFileSync(join(lock,'pid'),`${process.pid}\n`);
  const result=f.run('gateway');
  assert.equal(result.status,1);
  assert.match(result.stderr,/Another Codex profile setup is already running/);
});

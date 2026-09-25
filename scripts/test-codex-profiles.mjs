import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const root=new URL('../',import.meta.url).pathname;
const installer=join(root,'scripts/setup-codex-profiles.sh');
const cleanup=join(root,'scripts/cleanup-codex-profiles.sh');

function fixture(t) {
  const dir=mkdtempSync(join(tmpdir(),'codex-cleanup-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const home=join(dir,'home'),bin=join(dir,'bin'),state=join(home,'.local/state/dotfiles/codex-profiles');
  const prepared=join(home,'.config/private-ai-gateway/codex');
  mkdirSync(home);mkdirSync(bin);mkdirSync(state,{recursive:true});mkdirSync(prepared,{recursive:true});
  writeFileSync(join(prepared,'config.toml'),'model_provider = "private_gateway"\n');
  writeFileSync(join(home,'.config/private-ai-gateway/client.key'),'fixture-only\n');
  writeFileSync(join(home,'.config/private-ai-gateway/codex-home'),join(home,'.codex-aigateway')+'\n');
  const executable=(name,body)=>{const path=join(bin,name);writeFileSync(path,`#!/bin/bash\nset -eu\n${body}\n`);chmodSync(path,0o755);};
  executable('uname','echo Darwin');
  executable('herdr','printf "%s\\n" "${CODEX_HOME:-}" >> "$CALLS"');
  const fakeRoot=join(dir,'root');mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
  symlinkSync(cleanup,join(fakeRoot,'scripts/cleanup-codex-profiles.sh'));
  executable('open','echo "$*" >> "$CALLS"');
  const bootstrap=join(fakeRoot,'scripts/bootstrap-codex.sh');
  writeFileSync(bootstrap,`#!/bin/bash\nmkdir -p "$HOME/.codex"\nprintf 'subscription-config\\n' > "$HOME/.codex/config.toml"\n`,{mode:0o755});
  const calls=join(dir,'calls');
  const env={...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,DOTFILES_ROOT:fakeRoot,CALLS:calls};
  const run=(script,args=[])=>spawnSync('/bin/bash',[script,...args],{env,encoding:'utf8'});
  return {home,state,prepared,calls,env,run};
}

test('fresh setup keeps desktop subscription and terminal gateway isolated; rerun is idempotent',t=>{
  const f=fixture(t);
  for(let n=0;n<2;n++){
    const result=f.run(installer);
    assert.equal(result.status,0,result.stderr);
  }
  assert.equal(readFileSync(join(f.home,'.codex/config.toml'),'utf8'),'subscription-config\n');
  assert.equal(readFileSync(join(f.home,'.config/private-ai-gateway/codex-home'),'utf8'),f.prepared+'\n');
  assert.equal(readFileSync(f.calls,'utf8'),f.prepared+'\n'+f.prepared+'\n');
  assert.ok(!existsSync(join(f.home,'.codex-aigateway')));
  assert.ok(!existsSync(join(f.state,'mode')));
  assert.ok(!existsSync(join(f.home,'.local/share/dotfiles/codex-profile-archives')));
});

test('both-mode cleanup archives gateway state and retains subscription history',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex'),gateway=join(f.home,'.codex-aigateway');
  mkdirSync(desktop);mkdirSync(gateway);writeFileSync(join(desktop,'subscription-history'),'keep');
  writeFileSync(join(gateway,'gateway-history'),'archive');writeFileSync(join(f.state,'mode'),'both\n');
  const result=f.run(cleanup);
  assert.equal(result.status,0,result.stderr);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'keep');
  assert.equal(readFileSync(join(desktop,'config.toml'),'utf8'),'subscription-config\n');
  assert.ok(!existsSync(gateway));
  const archive=join(f.home,'.local/share/dotfiles/codex-profile-archives');
  assert.equal(readFileSync(join(archive,readdirSync(archive)[0],'gateway-desktop-home/gateway-history'),'utf8'),'archive');
  assert.equal(readFileSync(join(f.home,'.config/private-ai-gateway/codex-home'),'utf8'),f.prepared+'\n');
  assert.equal(f.run(cleanup).status,0);
  assert.equal(readdirSync(archive).length,1);
});

test('gateway-only cleanup restores the parked subscription home and archives both gateway homes',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex'),parked=join(f.state,'subscription-home');
  mkdirSync(desktop);mkdirSync(parked);mkdirSync(join(f.state,'gateway-home'));
  writeFileSync(join(desktop,'gateway-session'),'gateway');
  symlinkSync(join(f.prepared,'config.toml'),join(desktop,'config.toml'));
  writeFileSync(join(parked,'subscription-session'),'subscription');
  writeFileSync(join(f.state,'gateway-home/other-session'),'old-gateway');
  writeFileSync(join(f.state,'mode'),'gateway\n');
  const result=f.run(cleanup);
  assert.equal(result.status,0,result.stderr);
  assert.equal(readFileSync(join(desktop,'subscription-session'),'utf8'),'subscription');
  const archive=join(f.home,'.local/share/dotfiles/codex-profile-archives');
  const saved=join(archive,readdirSync(archive)[0]);
  assert.equal(readFileSync(join(saved,'gateway-default-home/gateway-session'),'utf8'),'gateway');
  assert.equal(readFileSync(join(saved,'parked-gateway-home/other-session'),'utf8'),'old-gateway');
  assert.ok(!existsSync(join(f.state,'mode')));
});

test('gateway cleanup refuses an unrelated active config without moving subscription history',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex'),parked=join(f.state,'subscription-home');
  mkdirSync(desktop);mkdirSync(parked);
  writeFileSync(join(desktop,'config.toml'),'personal config');
  writeFileSync(join(parked,'subscription-session'),'keep');
  writeFileSync(join(f.state,'mode'),'gateway\n');
  const result=f.run(cleanup);
  assert.equal(result.status,1);
  assert.match(result.stderr,/not the prepared gateway link/);
  assert.equal(readFileSync(join(parked,'subscription-session'),'utf8'),'keep');
  assert.ok(!existsSync(join(f.home,'.local/share/dotfiles/codex-profile-archives')));
});

test('cleanup rejects a foreign launcher before moving homes',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  mkdirSync(desktop);writeFileSync(join(desktop,'history'),'keep');
  writeFileSync(join(f.state,'mode'),'gateway\n');
  const launcher=join(f.home,'.config/codex-profiles/bin/codex-profile');
  mkdirSync(join(f.home,'.config/codex-profiles/bin'),{recursive:true});
  writeFileSync(launcher,'user owned');
  const result=f.run(cleanup);
  assert.equal(result.status,1);
  assert.match(result.stderr,/unrecognized profile launcher/);
  assert.equal(readFileSync(join(desktop,'history'),'utf8'),'keep');
});

test('cleanup removes only exact old Raycast links and retains unrelated scripts',t=>{
  const f=fixture(t),scripts=join(f.home,'.config/raycast/scripts/codex');
  mkdirSync(scripts,{recursive:true});
  for(const name of ['chatgpt-subscription.sh','chatgpt-aigateway.sh'])
    symlinkSync(join(f.env.DOTFILES_ROOT,'raycast/.config/raycast/scripts/codex',name),join(scripts,name));
  writeFileSync(join(scripts,'personal.sh'),'keep');
  const result=f.run(cleanup);
  assert.equal(result.status,0,result.stderr);
  assert.equal(readFileSync(join(scripts,'personal.sh'),'utf8'),'keep');
  assert.ok(!existsSync(join(scripts,'chatgpt-aigateway.sh')));
});

test('old desktop mode flags stop safely; status is read-only',t=>{
  const f=fixture(t);
  const old=f.run(installer,['--mode','both']);
  assert.equal(old.status,2);
  assert.match(old.stderr,/retired/);
  assert.ok(!existsSync(join(f.home,'.codex')));
  const status=f.run(installer,['--status']);
  assert.equal(status.status,1);
  assert.match(status.stdout,/desktop codex\s+subscription home absent/);
});

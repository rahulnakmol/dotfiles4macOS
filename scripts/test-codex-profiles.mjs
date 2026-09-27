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
  executable('pgrep','exit 1');
  executable('brew',`if [[ "$1" == --prefix ]]; then echo "$BREW_PREFIX"; elif [[ "$1 $2" == 'list --cask' ]]; then [[ -f "$BREW_PREFIX/installed" ]]; elif [[ "$1 $2 $3" == 'install --cask codex' ]]; then touch "$BREW_PREFIX/installed"; else exit 1; fi`);
  const brewPrefix=join(dir,'brew');mkdirSync(join(brewPrefix,'bin'),{recursive:true});
  writeFileSync(join(brewPrefix,'bin/codex'),'#!/bin/sh\nexit 0\n',{mode:0o755});
  const app=join(home,'Applications/ChatGPT.app/Contents/Resources');mkdirSync(app,{recursive:true});
  writeFileSync(join(app,'codex'),'#!/bin/sh\nexit 0\n',{mode:0o755});
  for(const relative of ['AGENTS.md','hooks.json','keybindings.json','rules/dotfiles.rules']){
    const path=join(prepared,relative);mkdirSync(join(path,'..'),{recursive:true});writeFileSync(path,'fixture');
  }
  const fakeRoot=join(dir,'root');mkdirSync(join(fakeRoot,'scripts'),{recursive:true});
  symlinkSync(cleanup,join(fakeRoot,'scripts/cleanup-codex-profiles.sh'));
  writeFileSync(join(fakeRoot,'scripts/setup-private-ai-gateway.sh'),`#!/bin/bash\nmkdir -p "$HOME/.local/bin"\nprintf '#!/bin/sh\\nexit 0\\n' > "$HOME/.local/bin/codex"\nchmod +x "$HOME/.local/bin/codex"\necho refresh >> "$CALLS"\n`,{mode:0o755});
  executable('open','echo "$*" >> "$CALLS"');
  executable('curl','for ((i=1;i<=$#;i++)); do if [[ "${!i}" == --output ]]; then j=$((i+1)); cp "$PROFILE_FIXTURE" "${!j}"; fi; done');
  const launcher=join(dir,'codex-profile');
  writeFileSync(launcher,`#!/bin/bash\ncase "$1" in version) echo 'codex-profile 1.2.0';; init) echo "init $2" >> "$CALLS";; app) echo "app $2" >> "$CALLS";; *) exit 1;; esac\n`,{mode:0o755});
  executable('shasum',`if [[ "$*" == '-a 256 '* && ( "$3" == "$PROFILE_FIXTURE" || "$3" == */codex-profile.* || "$3" == "$HOME/.config/codex-profiles/bin/codex-profile" ) && "$(/usr/bin/shasum -a 256 "$3" | cut -d' ' -f1)" == "$(/usr/bin/shasum -a 256 "$PROFILE_FIXTURE" | cut -d' ' -f1)" ]]; then echo '8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a  '"$3"; else /usr/bin/shasum "$@"; fi`);
  const bootstrap=join(fakeRoot,'scripts/bootstrap-codex.sh');
  writeFileSync(bootstrap,`#!/bin/bash\nmkdir -p "$HOME/.codex"\nif [[ "$1" == apply ]]; then printf 'subscription-config\\n' > "$HOME/.codex/config.toml"; fi\n`,{mode:0o755});
  const calls=join(dir,'calls');
  const env={...process.env,HOME:home,PATH:`${bin}:/usr/bin:/bin`,DOTFILES_ROOT:fakeRoot,CALLS:calls,BREW_PREFIX:brewPrefix,PROFILE_FIXTURE:launcher};
  const run=(script,args=[])=>spawnSync('/bin/bash',[script,...args],{env,encoding:'utf8'});
  return {home,state,prepared,calls,env,run,brewPrefix};
}

test('fresh setup keeps desktop subscription and terminal gateway isolated; rerun is idempotent',t=>{
  const f=fixture(t);
  for(let n=0;n<2;n++){
    const result=f.run(installer);
    assert.equal(result.status,0,result.stderr);
  }
  assert.equal(readFileSync(join(f.home,'.codex/config.toml'),'utf8'),'subscription-config\n');
  assert.equal(readFileSync(join(f.home,'.config/private-ai-gateway/codex-home'),'utf8'),f.prepared+'\n');
  assert.ok(readFileSync(f.calls,'utf8').includes(f.prepared));
  assert.equal(readFileSync(join(f.brewPrefix,'installed'),'utf8'),'');
  assert.ok(!existsSync(join(f.home,'.codex-aigateway')));
  assert.equal(readFileSync(join(f.state,'mode'),'utf8'),'subscription\n');
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

test('invalid desktop modes stop safely; status is read-only',t=>{
  const f=fixture(t);
  const old=f.run(installer,['--mode','unsupported']);
  assert.equal(old.status,2);
  assert.match(old.stderr,/Usage:/);
  assert.ok(!existsSync(join(f.home,'.codex')));
  const status=f.run(installer,['--status']);
  assert.equal(status.status,1);
  assert.match(status.stdout,/desktop home\s+absent/);
});

test('switches one desktop between subscription and gateway without changing CLI or histories',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'subscription');
  const gateway=f.run(installer,['--mode','gateway']);
  assert.equal(gateway.status,0,gateway.stderr);
  assert.equal(readFileSync(join(f.state,'subscription-home/subscription-history'),'utf8'),'subscription');
  assert.equal(readFileSync(join(desktop,'config.toml'),'utf8'),'model_provider = "private_gateway"\n');
  writeFileSync(join(desktop,'gateway-history'),'gateway');
  assert.equal(f.run(installer,['--mode','gateway']).status,0);
  const subscription=f.run(installer,['--mode','subscription']);
  assert.equal(subscription.status,0,subscription.stderr);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'subscription');
  assert.equal(readFileSync(join(f.state,'gateway-home/gateway-history'),'utf8'),'gateway');
  assert.equal(readFileSync(join(f.home,'.config/private-ai-gateway/codex-home'),'utf8'),f.prepared+'\n');
  assert.equal(f.run(installer,['--mode','gateway']).status,0);
  assert.equal(readFileSync(join(desktop,'gateway-history'),'utf8'),'gateway');
  assert.ok(!existsSync(join(f.home,'.codex-aigateway')));
  const refused=f.run(cleanup);
  assert.equal(refused.status,1);
  assert.match(refused.stderr,/--mode subscription/);
});

test('switch refuses a running desktop before moving homes',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'keep');
  writeFileSync(join(f.env.PATH.split(':')[0],'pgrep'),'#!/bin/bash\nexit 0\n',{mode:0o755});
  const result=f.run(installer,['--mode','gateway']);
  assert.equal(result.status,1);
  assert.match(result.stderr,/Quit ChatGPT/);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'keep');
  assert.ok(!existsSync(join(f.state,'subscription-home')));
});

test('gateway setup failure before switch retains the desktop home',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'keep');
  writeFileSync(join(f.env.DOTFILES_ROOT,'scripts/setup-private-ai-gateway.sh'),'#!/bin/bash\nexit 1\n',{mode:0o755});
  const result=f.run(installer,['--mode','gateway']);
  assert.equal(result.status,1);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'keep');
  assert.ok(!existsSync(join(f.state,'subscription-home')));
});

test('mid-switch gateway link failure restores the subscription home and retains incomplete state',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'keep');
  writeFileSync(join(f.env.PATH.split(':')[0],'ln'),'#!/bin/bash\nexit 1\n',{mode:0o755});
  const result=f.run(installer,['--mode','gateway']);
  assert.equal(result.status,1);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'keep');
  assert.equal(readFileSync(join(f.state,'mode'),'utf8'),'subscription\n');
  assert.ok(readdirSync(f.state).some(name=>name.startsWith('incomplete-')));
  assert.ok(!existsSync(join(f.state,'setup.lock')));
});

test('both mode preserves separate desktop histories and named launcher routes across switches',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex'),second=join(f.home,'.codex-aigateway');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'subscription');
  const both=f.run(installer,['--mode','both']);
  assert.equal(both.status,0,both.stderr);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'subscription');
  assert.equal(readFileSync(join(second,'config.toml'),'utf8'),'model_provider = "private_gateway"\n');
  assert.match(readFileSync(f.calls,'utf8'),/init default\ninit aigateway/);
  writeFileSync(join(second,'gateway-history'),'gateway');
  assert.equal(f.run(installer,['--mode','both']).status,0);
  const sub=f.run(installer,['--mode','subscription']);
  assert.equal(sub.status,0,sub.stderr);
  assert.equal(readFileSync(join(f.state,'gateway-home/gateway-history'),'utf8'),'gateway');
  assert.ok(!existsSync(second));
  assert.equal(f.run(installer,['--mode','both']).status,0);
  assert.equal(readFileSync(join(second,'gateway-history'),'utf8'),'gateway');
  assert.equal(f.run(installer,['--mode','gateway']).status,0);
  assert.equal(readFileSync(join(desktop,'gateway-history'),'utf8'),'gateway');
  assert.equal(readFileSync(join(f.state,'subscription-home/subscription-history'),'utf8'),'subscription');
  assert.equal(f.run(installer,['--mode','both']).status,0);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'subscription');
  assert.equal(readFileSync(join(second,'gateway-history'),'utf8'),'gateway');
  assert.equal(readFileSync(join(f.home,'.config/private-ai-gateway/codex-home'),'utf8'),f.prepared+'\n');
});

test('failed gateway-to-both transition restores gateway and subscription without losing new data',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'subscription');
  assert.equal(f.run(installer,['--mode','gateway']).status,0);
  writeFileSync(join(desktop,'gateway-history'),'gateway');
  writeFileSync(join(f.env.DOTFILES_ROOT,'scripts/bootstrap-codex.sh'),'#!/bin/bash\nexit 1\n',{mode:0o755});
  const failed=f.run(installer,['--mode','both']);
  assert.equal(failed.status,1);
  assert.equal(readFileSync(join(desktop,'gateway-history'),'utf8'),'gateway');
  assert.equal(readFileSync(join(f.state,'subscription-home/subscription-history'),'utf8'),'subscription');
  assert.ok(!existsSync(join(f.home,'.codex-aigateway')));
  assert.equal(readFileSync(join(f.state,'mode'),'utf8'),'gateway\n');
});

test('failed fresh both setup preserves incomplete gateway home and leaves subscription active',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'subscription');
  writeFileSync(join(f.env.PATH.split(':')[0],'ln'),'#!/bin/bash\nexit 1\n',{mode:0o755});
  const failed=f.run(installer,['--mode','both']);
  assert.equal(failed.status,1);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'subscription');
  assert.ok(!existsSync(join(f.home,'.codex-aigateway')));
  assert.equal(readFileSync(join(f.state,'mode'),'utf8'),'subscription\n');
  assert.ok(readdirSync(f.state).some(name=>name.startsWith('incomplete-')));
});

test('failed both setup does not archive a pre-existing gateway desktop home',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex'),second=join(f.home,'.codex-aigateway');
  assert.equal(f.run(installer).status,0);
  writeFileSync(join(desktop,'subscription-history'),'subscription');
  mkdirSync(second);
  symlinkSync(join(f.prepared,'config.toml'),join(second,'config.toml'));
  writeFileSync(join(second,'gateway-history'),'keep');
  writeFileSync(join(f.env.PATH.split(':')[0],'herdr'),'#!/bin/bash\nexit 1\n',{mode:0o755});
  const failed=f.run(installer,['--mode','both']);
  assert.equal(failed.status,1);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'subscription');
  assert.equal(readFileSync(join(second,'gateway-history'),'utf8'),'keep');
  assert.equal(readFileSync(join(f.state,'mode'),'utf8'),'subscription\n');
  assert.ok(!readdirSync(f.state).some(name=>name.startsWith('incomplete-')));
});

test('failed both-to-gateway transition restores both original homes',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex'),second=join(f.home,'.codex-aigateway');
  assert.equal(f.run(installer,['--mode','both']).status,0);
  writeFileSync(join(desktop,'subscription-history'),'subscription');
  writeFileSync(join(second,'gateway-history'),'gateway');
  writeFileSync(join(f.env.PATH.split(':')[0],'herdr'),'#!/bin/bash\nexit 1\n',{mode:0o755});
  const failed=f.run(installer,['--mode','gateway']);
  assert.equal(failed.status,1);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'subscription');
  assert.equal(readFileSync(join(second,'gateway-history'),'utf8'),'gateway');
  assert.equal(readFileSync(join(f.state,'mode'),'utf8'),'both\n');
  assert.ok(!existsSync(join(f.state,'subscription-home')));
});

test('both-mode marker refuses to switch if the second home is missing',t=>{
  const f=fixture(t),desktop=join(f.home,'.codex');
  assert.equal(f.run(installer,['--mode','both']).status,0);
  writeFileSync(join(desktop,'subscription-history'),'keep');
  rmSync(join(f.home,'.codex-aigateway'),{recursive:true});
  const failed=f.run(installer,['--mode','gateway']);
  assert.equal(failed.status,1);
  assert.match(failed.stderr,/Both-mode marker disagrees/);
  assert.equal(readFileSync(join(desktop,'subscription-history'),'utf8'),'keep');
  assert.ok(!existsSync(join(f.state,'subscription-home')));
});

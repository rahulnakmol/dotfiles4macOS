import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
const installer=join(root,'install.sh');
function fixture(t) {
  const dir=mkdtempSync(join(tmpdir(),'dotfiles-install-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const bin=join(dir,'bin'),checkout=join(dir,'checkout');
  mkdirSync(bin);mkdirSync(join(checkout,'scripts'),{recursive:true});
  const file=(name,body)=>writeFileSync(join(bin,name),'#!/bin/bash\nset -eu\n'+body+'\n',{mode:0o755});
  file('uname','if [[ "$1" == -s ]]; then echo Darwin; else echo arm64; fi');
  file('xcode-select','if [[ "${MISSING_CLT:-0}" == 1 ]]; then echo "$*" >> "$EVENTS"; exit 1; fi');
  file('xcrun','echo /mock/clang');
  file('brew','echo "brew $*" >> "$EVENTS"');
  file('git','echo "git $*" >> "$EVENTS"; if [[ "$1" == -C ]]; then echo "$2"; fi; if [[ "$1" == clone ]]; then mkdir -p "$3/scripts"; cp "$MOCK_SETUP" "$3/scripts/setup-workstation.sh"; fi');
  file('node','echo mock-node');file('stow','echo mock-stow');
  file('open','echo "open $*" >> "$EVENTS"');
  writeFileSync(join(checkout,'scripts/setup-workstation.sh'),'#!/bin/bash\necho "setup $*" >> "$EVENTS"\nif [[ "$1" == apply && "${FAIL_APPLY:-0}" == 1 ]]; then exit 1; fi\nif [[ "$1" == check && "${PENDING_CHECK:-0}" == 1 ]]; then exit 1; fi\n');
  const env={...process.env,PATH:bin+':'+process.env.PATH,DOTFILES_BOOTSTRAP_DIR:checkout,DOTFILES_BOOTSTRAP_STATE_DIR:join(dir,'state'),EVENTS:join(dir,'events'),MOCK_SETUP:join(checkout,'scripts/setup-workstation.sh')};
  return {dir,env,run:(args=[],extra={})=>spawnSync('/bin/bash',[installer,...args],{env:{...env,...extra},encoding:'utf8',timeout:10000}),events:()=>existsSync(env.EVENTS)?readFileSync(env.EVENTS,'utf8'):''};
}
const native={skip:process.getuid?.()===0?'Installer intentionally refuses root':false};
test('preview and invalid profile cannot install, clone or create state',t=>{
  const f=fixture(t),preview=f.run(['--profile','fde','--plan']);
  assert.equal(preview.status,0);assert.match(preview.stdout,/Productivity: 0/);
  assert.equal(f.events(),'');assert.ok(!existsSync(f.env.DOTFILES_BOOTSTRAP_STATE_DIR));
  assert.equal(f.run(['--profile','../tf']).status,1);
  assert.equal(f.events(),'');
});
test('missing Command Line Tools pauses with a verified resume path and unverified state',native,t=>{
  const f=fixture(t),r=f.run(['--profile','tf','--no-open'],{MISSING_CLT:'1'});
  assert.equal(r.status,2);assert.match(r.stdout,/Step 1 of 5/);
  assert.match(r.stdout,/Complete the macOS Command Line Tools installer/);
  assert.match(f.events(),/--install/);assert.ok(!f.events().includes('setup '));
  assert.match(readFileSync(join(f.env.DOTFILES_BOOTSTRAP_STATE_DIR,'tf.log'),'utf8'),/command-line-tools\tunverified/);
  assert.equal(f.run(['--profile','tf','--no-open']).status,0);
});
test('core setup runs plan/apply/check, keeps productivity off and never updates existing checkout',native,t=>{
  const f=fixture(t),r=f.run(['--profile','fde']);
  assert.equal(r.status,0,r.stderr);const events=f.events();
  assert.match(events,/setup plan --profile fde\nsetup apply --profile fde\nsetup check --profile fde/);
  assert.ok(!events.includes('--productivity'));
  assert.ok(!/git (?:clone|pull|reset|checkout|switch)|brew install/.test(events));
  assert.match(events,/open https:\/\/github.com\/rahulnakmol\/dotfiles4macOS\/blob\/main\/docs\/profiles\/fde.md#finish-setup-human-checklist/);
  const state=readFileSync(join(f.env.DOTFILES_BOOTSTRAP_STATE_DIR,'fde.log'),'utf8');
  assert.match(state,/profile-check\tverified/);assert.match(state,/human-checklist\tunverified/);
});
test('productivity opt-in is explicit at every stage and pending checks are not reported as complete',native,t=>{
  const f=fixture(t),r=f.run(['--profile','tf','--productivity','--no-open'],{PENDING_CHECK:'1'});
  assert.equal(r.status,2);assert.equal((f.events().match(/--productivity/g)||[]).length,3);
  assert.ok(!f.events().includes('open '));assert.match(r.stdout,/checks still need attention/);
  assert.match(readFileSync(join(f.env.DOTFILES_BOOTSTRAP_STATE_DIR,'tf.log'),'utf8'),/profile-check\tunverified/);
});
test('failed apply stops before check and records an actionable GitHub handoff',native,t=>{
  const f=fixture(t),r=f.run(['--profile','fde','--no-open'],{FAIL_APPLY:'1'});
  assert.notEqual(r.status,0);assert.ok(!f.events().includes('setup check'));
  assert.match(r.stdout,/Human checklist: https:\/\/github.com/);
  assert.match(readFileSync(join(f.env.DOTFILES_BOOTSTRAP_STATE_DIR,'fde.log'),'utf8'),/setup\tincomplete/);
});
test('fresh destination clones once and subsequent runs reuse it',native,t=>{
  const f=fixture(t),dest=join(f.dir,'new-checkout');
  for(let i=0;i<2;i++)assert.equal(f.run(['--profile','tf','--directory',dest,'--no-open']).status,0);
  assert.equal((f.events().match(/git clone /g)||[]).length,1);
  assert.ok(existsSync(join(dest,'scripts/setup-workstation.sh')));
});
test('double-click launchers keep role and productivity choices explicit and support ZIP downloads',()=>{
  for(const role of ['FDE','TF'])for(const suffix of ['','-Productivity']) {
    const s=readFileSync(join(root,'setup',role+suffix+'.command'),'utf8');
    assert.ok(s.includes('--profile '+role.toLowerCase()));
    assert.equal(s.includes('--productivity'),Boolean(suffix));
    assert.ok(s.includes('"$setup_dir/.git"'));
    assert.equal(spawnSync('/bin/bash',['-n',join(root,'setup',role+suffix+'.command')]).status,0);
  }
});

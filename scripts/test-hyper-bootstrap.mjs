import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, realpathSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { makePlan, applyPlan, rollback, preferenceTargets } from './bootstrap-hyper.mjs';
import { buildWorkflow } from './build-hyper-config.mjs';
const config=JSON.parse(readFileSync(new URL('./hyper-config.json',import.meta.url)));
const local='a'.repeat(40);
const read=(p)=>JSON.parse(execFileSync('plutil',['-convert','json','-o','-',p]));
const write=(p,d)=>{mkdirSync(join(p,'..'),{recursive:true});writeFileSync(p,execFileSync('plutil',['-convert','xml1','-o','-','--','-'],{input:JSON.stringify(d)}));};
function fixture(t) {
  const base=mkdtempSync(join(tmpdir(),'hyper-bootstrap-test-'));t.after(()=>rmSync(base,{recursive:true,force:true}));
  const root=join(base,'dotfiles'),home=join(base,'home'),backup=join(base,'backup');
  mkdirSync(join(root,'scripts'),{recursive:true});mkdirSync(home);
  writeFileSync(join(root,'scripts/hyper-config.json'),JSON.stringify(config));
  for(const m of ['alfred','karabiner','rectangle-pro']) {mkdirSync(join(root,m,'.config',m),{recursive:true});writeFileSync(join(root,m,'.config',m,'fixture'),'source');}
  return {root,home,backup};
}

test('plan is read-only and reports conflicts without reading runtime data',t=>{
  const {root,home,backup}=fixture(t);
  mkdirSync(join(home,'.config/karabiner'),{recursive:true});
  const p=makePlan(root,home,local);
  assert.deepEqual(p.conflicts,[join(home,'.config/karabiner')]);
  assert.ok(!existsSync(backup));
  assert.ok(!existsSync(preferenceTargets(root,local)[0].path));
  assert.throws(()=>applyPlan(p,backup,root,home),/Stow conflicts/);
  assert.ok(!existsSync(backup));
});

test('apply is repeatable and rollback preserves unrelated preferences and source',t=>{
  const {root,home,backup}=fixture(t);
  const path=preferenceTargets(root,local)[1].path;
  const launcher=preferenceTargets(root,local).find(p=>p.path.endsWith('/hotkey/prefs.plist')).path;
  const oldLauncher={default:{key:49,mod:524288,string:'Space'}};write(launcher,oldLauncher);
  const before={hotkey:{key:8,mod:1572864,string:'C'},persistFor:1,blacklist:['1Password','My private app'],unrelated:'keep'};
  write(path,before);
  applyPlan(makePlan(root,home,local),backup,root,home);
  assert.equal(read(path).hotkey.key,9);
  assert.equal(read(path).persistFor,0);
  assert.deepEqual(read(launcher).default,{key:49,mod:1048576,string:'Space'});
  assert.deepEqual(read(path).blacklist,before.blacklist);
  for(const m of ['alfred','karabiner','rectangle-pro']) assert.equal(realpathSync(join(home,'.config',m)),realpathSync(join(root,m,'.config',m)));
  const again=makePlan(root,home,local);
  assert.ok(again.patches.every(p=>p.changes.length===0));
  applyPlan(again,backup+'-second',root,home);
  rollback(backup+'-second',root,home);
  assert.ok(existsSync(join(home,'.config/karabiner')),'Second no-op rollback must retain first-run links');
  const changed=read(path);changed.unrelated='later edit';write(path,changed);
  rollback(backup,root,home);
  assert.deepEqual(read(path),{...before,unrelated:'later edit'});
  assert.deepEqual(read(launcher),oldLauncher);
  assert.ok(!existsSync(join(home,'.config/karabiner')));
  assert.ok(existsSync(join(root,'karabiner/.config/karabiner/fixture')));
  assert.equal(rollback(backup,root,home).status,'rolled-back');
});

test('rollback refuses drift before restoring any other managed field',t=>{
  const {root,home,backup}=fixture(t);
  applyPlan(makePlan(root,home,local),backup,root,home);
  const path=preferenceTargets(root,local)[1].path;const d=read(path);d.persistFor=3;write(path,d);
  assert.throws(()=>rollback(backup,root,home),/changed since apply/);
  assert.equal(read(path).hotkey.key,9);
  assert.ok(existsSync(join(home,'.config/karabiner')));
});

test('rollback rejects foreign and out-of-scope journal records',t=>{
  const {root,home,backup}=fixture(t);applyPlan(makePlan(root,home,local),backup,root,home);
  assert.throws(()=>rollback(backup,root,home+'other'),/another repository/);
  const p=join(backup,'journal.json');const journal=JSON.parse(readFileSync(p));journal.records.push({type:'plist',path:join(home,'unrelated.plist'),key:'arbitrary',before:{exists:false},after:{exists:false}});writeFileSync(p,JSON.stringify(journal));
  assert.throws(()=>rollback(backup,root,home),/Invalid preference record/);
});

test('fresh setup does not invent an Alfred machine ID or copy another Mac’s local directory',t=>{
  const {root,home}=fixture(t);const plan=makePlan(root,home,null);
  assert.equal(plan.localReady,false);assert.equal(plan.patches.length,3);
  assert.throws(()=>preferenceTargets(root,'../../escape'),/Invalid Alfred/);
});

test('Meh native and workflow hotkeys are unique and leave DockFlow numbers and Rectangle alone',()=>{
  const actions=config.mehActions;
  assert.equal(actions.length,6);assert.equal(new Set(actions.map(a=>a.keyCode)).size,6);
  const rectangle=JSON.parse(readFileSync(new URL('../rectangle-pro/.config/rectangle-pro/RectangleProConfig.json',import.meta.url)));
  const reserved=Object.values(rectangle.shortcuts).filter(x=>x.modifierFlags===917504).map(x=>x.keyCode);
  for(const a of actions) assert.ok(!reserved.includes(a.keyCode));
  const workflow=buildWorkflow(config,{objects:[]});
  const triggers=workflow.plist.objects.filter(o=>o.type==='alfred.workflow.trigger.hotkey' && o.config.hotmod===917504);
  assert.deepEqual(triggers.map(o=>o.config.hotkey),[8,49,36]);
  for(const t of triggers) assert.match(workflow.plist.connections[t.uid][0].destinationuid,/^menu-(capture|tools|layouts)$/);
  assert.ok(!workflow.script.includes('osascript'));
  for(const a of config.captureActions) assert.ok(workflow.script.includes('cleanshot://'+a.command));
  assert.ok(!workflow.script.includes('action=upload'));
});


test('dangling Stow links are conflicts and redirected preference paths are refused',t=>{
  const {root,home}=fixture(t);
  mkdirSync(join(home,'.config'));
  symlinkSync(join(home,'missing'),join(home,'.config/karabiner'));
  assert.deepEqual(makePlan(root,home,local).conflicts,[join(home,'.config/karabiner')]);
  const path=preferenceTargets(root,local)[0].path;
  mkdirSync(join(path,'..'),{recursive:true});
  const other=join(home,'unrelated.plist');write(other,{keep:true});
  symlinkSync(other,path);
  assert.throws(()=>makePlan(root,home,local),/Symlinked preference path/);
  assert.deepEqual(read(other),{keep:true});
  unlinkSync(path);
  const parent=join(path,'..');rmSync(parent,{recursive:true});
  symlinkSync(home,parent);
  assert.throws(()=>makePlan(root,home,local),/Symlinked preference path/);
});

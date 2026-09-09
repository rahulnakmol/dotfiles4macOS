import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolveProfile, commonFormulae } from './workstation-profiles.mjs';
import { workstationFiles, buildDockWorkflow } from './build-workstation.mjs';
import { desiredLinks, linkPlan, inspectGenerated, applyWorkstation, undoWorkstation, packagePlan, appInstalled } from './setup-workstation.mjs';
import { presetNames, requireUniquePreset, dockflowCommand } from './dockflow.mjs';
import { sanitizePresets } from './sanitize-dockflow.mjs';
import { renderManual, manualHTML } from './workstation-manual.mjs';

const wf='alfred/.config/alfred/Alfred.alfredpreferences/workflows/user.workflow.hyper/';
function fixture(t){const p=realpathSync(mkdtempSync(join(tmpdir(),'workstation-test-')));t.after(()=>rmSync(p,{recursive:true,force:true}));const home=join(p,'home');mkdirSync(home);return {p,home,backup:join(p,'backup')};}

test('TF has exactly Claude Desktop and Amp with two complete sessions; FDE retains every variation',()=>{
  const tf=resolveProfile('TF'),fde=resolveProfile('FDE');
  assert.throws(()=>resolveProfile('../tf'),/Choose/);
  assert.equal(tf.profile,'Hyperland');
  assert.deepEqual(tf.focusSessions.map(s=>s.id),['work','amp']);
  assert.deepEqual(tf.focusSessions[0].apps,['edge','teams','claude']);
  assert.deepEqual(tf.focusSessions[1].apps,['chrome','ghostty','amp']);
  assert.deepEqual(tf.focusSessions.map(s=>s.durationMinutes),[30,45]);
  assert.deepEqual(fde.focusSessions.map(s=>s.id),['work','amp','claude','cursor','codex']);
  assert.deepEqual(fde.focusSessions[0].apps,['edge','teams']);
  for(const id of ['cursor','codex','opencode'])assert.ok(!tf.apps.some(a=>a.id===id));
  assert.equal(tf.dockPresets.length,4);assert.equal(fde.dockPresets.length,7);
  for(const app of tf.apps)assert.equal(app.key,fde.apps.find(a=>a.id===app.id).key);
  for(const c of [tf,fde])for(const layout of c.layouts)for(const [app] of layout.windows)assert.ok(app==='global'||c.apps.some(a=>a.id===app));
});

test('install plans avoid Karabiner cask, wrong Session, personal credentials and duplicate apps',()=>{
  const tf=resolveProfile('tf');
  assert.deepEqual(tf.install.formulae,commonFormulae);
  const names=tf.install.casks.map(a=>a.cask);
  for(const forbidden of ['karabiner-elements','session','cursor','chatgpt','claude-code'])assert.ok(!names.includes(forbidden));
  assert.ok(names.includes('claude'));
  assert.deepEqual(packagePlan(tf,commonFormulae,['font-jetbrains-mono-nerd-font'],()=>true),{formulae:[],casks:[],guided:[]});
  assert.equal(packagePlan(tf,[],[],()=>false).guided.length,3);
  assert.ok(!packagePlan(resolveProfile('fde'),[],[],()=>true,()=>true).casks.includes('claude-code'));
  for(const id of ['tf','fde'])for(const p of workstationFiles(id).keys())assert.ok(!/^(git|ssh|1password|gh|codex|claude|cursor|opencode)\//.test(p),p);
});

test('generated TF hotkeys, menus, native layouts and docs agree and have no full-profile launchers',()=>{
  const files=workstationFiles('tf'),c=resolveProfile('tf');
  const plist=JSON.parse(execFileSync('plutil',['-convert','json','-o','-','--','-'],{input:files.get(wf+'info.plist')}));
  const menu=plist.objects.find(o=>o.uid==='menu-focus');
  assert.deepEqual(JSON.parse(menu.config.items).map(i=>i.title),['Focus Session: Work','Focus Session: Code + Amp']);
  const launches=JSON.parse(files.get('karabiner/.config/karabiner/karabiner.json')).profiles[0].complex_modifications.rules.find(r=>r.description==='Hyper: launch or focus apps').manipulators;
  assert.equal(launches.length,c.apps.length);
  assert.equal(new Set(launches.map(m=>m.from.key_code)).size,c.apps.length);
  const rect=JSON.parse(files.get('rectangle-pro/.config/rectangle-pro/RectangleProConfig.json'));
  assert.deepEqual(JSON.parse(rect.defaults.appSpecs.string).map(l=>l.name),c.layouts.map(l=>l.name));
  const focus=JSON.parse(files.get(wf+'focus-sessions.json'));
  assert.equal(focus[0].dockName,'1. Work');assert.equal(focus[0].dockURL,null);
  const dock=buildDockWorkflow(c);assert.equal(dock.objects.filter(o=>o.type.endsWith('trigger.hotkey')).length,4);
  assert.ok(!files.get(wf+'dispatch.zsh').toString().includes('dockflow://'));
  assert.ok(!files.get(wf+'dispatch.zsh').toString().includes('app:cursor'));
  assert.match(renderManual(c),/fs amp/);assert.match(manualHTML(c),/TF macOS manual/);
});

test('DockFlow name lookup refuses missing and duplicate names without applying anything',()=>{
  const output='Fetching presets...\n- 1. Work (ID: 2)\n- 2. Code (ID: 3)\n';
  assert.deepEqual(presetNames(output),['1. Work','2. Code']);
  assert.throws(()=>requireUniquePreset('1. Work',output+output),/exactly one/);
  const calls=[],run=(p,args)=>{calls.push(args);return output;};
  dockflowCommand('apply','work',resolveProfile('tf').dockPresets,'cli',run);
  assert.deepEqual(calls,[['list'],['apply','--name','1. Work']]);
  assert.throws(()=>dockflowCommand('apply','author',resolveProfile('tf').dockPresets,'cli',run),/Unknown/);
  assert.throws(()=>dockflowCommand('apply','zen',resolveProfile('tf').dockPresets,'cli',run),/exactly one/);
  assert.equal(calls.filter(a=>a[0]==='apply').length,1);
});

test('DockFlow native exports are portable and TF packs contain only approved app sets',()=>{
  const raw=[{name:'Work',apps:JSON.stringify(['file:///Applications/Claude.app/','file:///Users/example/private.app/','https://example.com','dockflow-spacer-0']),folderStacks:['private'],actions:['private'],appMetadata:{}}];
  const clean=sanitizePresets(raw)[0];
  assert.deepEqual(JSON.parse(clean.apps),['file:///Applications/Claude.app/','dockflow-spacer-0']);
  assert.deepEqual(clean.folderStacks,[]);assert.ok(!('actions'in clean));
  for(const id of ['fde','tf']) {
    const data=JSON.parse(readFileSync(new URL('../dockflow/presets/'+id+'.json',import.meta.url)));
    assert.deepEqual(data,sanitizePresets(data));
    assert.deepEqual(data.map(p=>p.name),resolveProfile(id).dockPresets.map(p=>p.name));
    assert.ok(!JSON.stringify(data).includes('/Users/'));
  }
  const tf=JSON.parse(readFileSync(new URL('../dockflow/presets/tf.json',import.meta.url)));
  assert.equal(JSON.parse(tf.find(p=>p.name==='2. Code').apps).length,3);
  assert.ok(!JSON.stringify(tf).match(/Cursor|ChatGPT|codex|OpenCode/));
});

test('plan reports unmanaged files and never changes them',t=>{
  const {home,p}=fixture(t),files=workstationFiles('tf'),target=join(p,'target');
  writeFileSync(join(home,'.zshrc'),'personal');
  const plan=linkPlan(files,target,home);
  assert.ok(plan.conflicts.includes(join(home,'.zshrc')));
  assert.equal(readFileSync(join(home,'.zshrc'),'utf8'),'personal');
  assert.ok(!existsSync(target));
  assert.equal(desiredLinks(files,target,home).filter(l=>l.path===join(home,'.config/karabiner')).length,1);
});

test('generated parent redirects are refused before any backup or write',t=>{
  const {home,backup,p}=fixture(t),target=join(home,'.local/share/dotfiles/workstations/tf');
  mkdirSync(target,{recursive:true});const elsewhere=join(p,'elsewhere');mkdirSync(elsewhere);
  symlinkSync(elsewhere,join(target,'alfred'));
  assert.throws(()=>applyWorkstation('tf',home,backup),/Redirected/);
  assert.ok(!existsSync(backup));
});

test('app detection validates bundle identity rather than accepting any similarly named app',t=>{
  const {home}=fixture(t),path=join(home,'Applications/Fixture.app/Contents');mkdirSync(path,{recursive:true});
  writeFileSync(join(path,'Info.plist'),execFileSync('plutil',['-convert','xml1','-o','-','--','-'],{input:JSON.stringify({CFBundleIdentifier:'example.correct'})}));
  assert.equal(appInstalled({name:'Fixture',bundleId:'example.correct'},home),true);
  assert.equal(appInstalled({name:'Fixture',bundleId:'example.wrong'},home),false);
});

test('profile apply, no-op, switching and rollback preserve previous links and private Alfred files',t=>{
  const {home,backup,p}=fixture(t);
  applyWorkstation('tf',home,backup);
  const tf=join(home,'.local/share/dotfiles/workstations/tf');
  assert.equal(realpathSync(join(home,'.config/karabiner')),join(tf,'karabiner/.config/karabiner'));
  const privatePath=join(tf,'alfred/.config/alfred/personal-note.txt');writeFileSync(privatePath,'keep');
  applyWorkstation('tf',home,backup+'-noop');undoWorkstation(backup+'-noop',home);
  assert.ok(existsSync(join(home,'.config/alfred')));
  applyWorkstation('fde',home,backup+'-switch');
  assert.match(realpathSync(join(home,'.config/alfred')),/workstations\/fde\//);
  undoWorkstation(backup+'-switch',home);
  assert.match(realpathSync(join(home,'.config/alfred')),/workstations\/tf\//);
  assert.equal(readFileSync(privatePath,'utf8'),'keep');
  const before=readFileSync(join(tf,wf+'dispatch.zsh'));
  writeFileSync(join(tf,wf+'dispatch.zsh'),'personal edit');
  assert.ok(inspectGenerated(workstationFiles('tf'),tf).length);
  assert.throws(()=>undoWorkstation(backup,home),/changed since apply/);
  writeFileSync(join(tf,wf+'dispatch.zsh'),before);
  undoWorkstation(backup,home);
  assert.equal(readFileSync(privatePath,'utf8'),'keep');
  assert.ok(!existsSync(join(home,'.config/karabiner')));
  assert.ok(!existsSync(join(home,'.local/state/dotfiles/workstation.json')));
});

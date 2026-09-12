import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolveProfile, commonFormulae } from './workstation-profiles.mjs';
import { workstationFiles, buildDockWorkflow } from './build-workstation.mjs';
import { desiredLinks, linkPlan, inspectGenerated, applyWorkstation, undoWorkstation, packagePlan, appInstalled, machineReport } from './setup-workstation.mjs';
import { presetNames, requireUniquePreset, dockflowCommand } from './dockflow.mjs';
import { sanitizePresets } from './sanitize-dockflow.mjs';
import { renderManual, manualHTML } from './workstation-manual.mjs';

const wf='alfred/.config/alfred/Alfred.alfredpreferences/workflows/user.workflow.hyper/';
function fixture(t){const p=realpathSync(mkdtempSync(join(tmpdir(),'workstation-test-')));t.after(()=>rmSync(p,{recursive:true,force:true}));const home=join(p,'home');mkdirSync(home);return {p,home,backup:join(p,'backup')};}

test('TF has Work, Code + Cursor and Innovate + Codex; FDE retains every variation',()=>{
  const tf=resolveProfile('TF'),fde=resolveProfile('FDE');
  assert.throws(()=>resolveProfile('../tf'),/Choose/);
  assert.equal(tf.profile,'Hyperland');
  assert.deepEqual(tf.focusSessions.map(s=>s.id),['work','code','innovate']);
  assert.deepEqual(tf.focusSessions.map(s=>s.categoryName),['Work','Code','Innovate']);
  assert.deepEqual(fde.focusSessions.map(s=>s.categoryName),['Work','Code','Code','Code','Code']);
  assert.deepEqual(tf.focusSessions[0].apps,['edge','teams','claude']);
  assert.deepEqual(tf.focusSessions[1].apps,['zen-browser','ghostty','slack','cursor']);
  assert.deepEqual(tf.focusSessions[2].apps,['zen-browser','ghostty','slack','codex']);
  assert.deepEqual(tf.focusSessions.map(s=>s.durationMinutes),[30,45,45]);
  assert.deepEqual(fde.focusSessions.map(s=>s.id),['work','amp','claude','cursor','codex']);
  assert.deepEqual(fde.focusSessions[0].apps,['edge','teams']);
  for(const id of ['amp','chrome','opencode'])assert.ok(!tf.apps.some(a=>a.id===id));
  assert.equal(tf.dockPresets.length,5);assert.equal(fde.dockPresets.length,7);
  for(const app of tf.apps)assert.equal(app.key,fde.apps.find(a=>a.id===(app.id==='zen-browser'?'chrome':app.id)).key);
  for(const c of [tf,fde])for(const layout of c.layouts)for(const [app] of layout.windows)assert.ok(app==='global'||c.apps.some(a=>a.id===app));
});

test('install plans avoid Karabiner cask, wrong Session, personal credentials and duplicate apps',()=>{
  const tf=resolveProfile('tf',{productivity:true});
  assert.deepEqual(tf.install.formulae,commonFormulae);
  const names=tf.install.casks.map(a=>a.cask);
  for(const forbidden of ['karabiner-elements','session','google-chrome','claude-code'])assert.ok(!names.includes(forbidden));
  for(const name of ['claude','cursor','chatgpt','zen','slack'])assert.ok(names.includes(name));
  assert.deepEqual(packagePlan(tf,commonFormulae,['font-jetbrains-mono-nerd-font'],()=>true),{formulae:[],casks:[],guided:[]});
  assert.equal(packagePlan(tf,[],[],()=>false).guided.length,2);
  assert.ok(!packagePlan(resolveProfile('fde'),[],[],()=>true,()=>true).casks.includes('claude-code'));
  for(const id of ['tf','fde'])for(const p of workstationFiles(id).keys())assert.ok(!/^(git|ssh|1password|gh|codex|claude|cursor|opencode)\//.test(p),p);
});

test('generated TF hotkeys, menus, native layouts and docs agree and have no full-profile launchers',()=>{
  const files=workstationFiles('tf',{productivity:true}),c=resolveProfile('tf');
  const plist=JSON.parse(execFileSync('plutil',['-convert','json','-o','-','--','-'],{input:files.get(wf+'info.plist')}));
  const menu=plist.objects.find(o=>o.uid==='menu-focus');
  assert.deepEqual(JSON.parse(menu.config.items).map(i=>i.title),['Focus Session: Work','Focus Session: Code + Cursor','Focus Session: Innovate + Codex']);
  const launches=JSON.parse(files.get('karabiner/.config/karabiner/karabiner.json')).profiles[0].complex_modifications.rules.find(r=>r.description==='Hyper: launch or focus apps').manipulators;
  assert.equal(launches.length,c.apps.length);
  assert.equal(new Set(launches.map(m=>m.from.key_code)).size,c.apps.length);
  const rect=JSON.parse(files.get('rectangle-pro/.config/rectangle-pro/RectangleProConfig.json'));
  assert.deepEqual(JSON.parse(rect.defaults.appSpecs.string).map(l=>l.name),c.layouts.map(l=>l.name));
  const focus=JSON.parse(files.get(wf+'focus-sessions.json'));
  assert.equal(focus[0].dockName,'1. Work');assert.equal(focus[0].dockURL,null);
  const dock=buildDockWorkflow(c);assert.equal(dock.objects.filter(o=>o.type.endsWith('trigger.hotkey')).length,5);
  assert.ok(!files.get(wf+'dispatch.zsh').toString().includes('dockflow://'));
  assert.ok(!files.get(wf+'dispatch.zsh').toString().includes('app:amp'));
  assert.match(renderManual(c),/fs innovate/);assert.match(manualHTML(c),/TF macOS manual/);
  assert.ok(manualHTML(c).includes('href="https://brew.sh"'));
  assert.ok(!manualHTML(c).includes('href="https://brew.sh."'));
});

test('both profile guides include manual Session categories and explain automatic selection',()=>{
  for(const id of ['fde','tf']) {
    const c=resolveProfile(id);
    for(const guide of [renderManual(c),manualHTML(c)]) {
      assert.match(guide,/Session categories — human setup/);
      assert.match(guide,/type @/);
      assert.match(guide,/automatically pass categoryName/);
      assert.match(guide,/create only missing ones/);
      assert.match(guide,/session-url-scheme/);
    }
    const section=renderManual(c).split('## Session categories — human setup')[1].split('## Four desktops')[0];
    assert.match(section,/\| Work \| fs work \|/);
    assert.match(section,/\| Code \|/);
    if(id==='tf')assert.match(section,/\| Innovate \| fs innovate — Codex \|/);
    else {assert.match(section,/fs amp, fs claude, fs cursor and fs codex/);assert.ok(!section.includes('| Innovate |'));}
  }
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
  assert.equal(JSON.parse(tf.find(p=>p.name==='2. Code').apps).length,4);
  assert.ok(!JSON.stringify(tf).match(/Amp|Google Chrome|OpenCode/));
});

test('plan reports unmanaged files and never changes them',t=>{
  const {home,p}=fixture(t),files=workstationFiles('tf',{productivity:true}),target=join(p,'target');
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
  assert.throws(()=>applyWorkstation('tf',home,backup,undefined,{productivity:true}),/Redirected/);
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
  applyWorkstation('tf',home,backup,undefined,{productivity:true});
  const tf=join(home,'.local/share/dotfiles/workstations/tf');
  assert.equal(realpathSync(join(home,'.config/karabiner')),join(tf,'karabiner/.config/karabiner'));
  const privatePath=join(tf,'alfred/.config/alfred/personal-note.txt');writeFileSync(privatePath,'keep');
  applyWorkstation('tf',home,backup+'-noop',undefined,{productivity:true});undoWorkstation(backup+'-noop',home);
  assert.ok(existsSync(join(home,'.config/alfred')));
  applyWorkstation('fde',home,backup+'-switch',undefined,{productivity:true});
  assert.match(realpathSync(join(home,'.config/alfred')),/workstations\/fde\//);
  undoWorkstation(backup+'-switch',home);
  assert.match(realpathSync(join(home,'.config/alfred')),/workstations\/tf\//);
  assert.equal(readFileSync(privatePath,'utf8'),'keep');
  const before=readFileSync(join(tf,wf+'dispatch.zsh'));
  writeFileSync(join(tf,wf+'dispatch.zsh'),'personal edit');
  assert.ok(inspectGenerated(workstationFiles('tf',{productivity:true}),tf).length);
  assert.throws(()=>undoWorkstation(backup,home),/changed since apply/);
  writeFileSync(join(tf,wf+'dispatch.zsh'),before);
  undoWorkstation(backup,home);
  assert.equal(readFileSync(privatePath,'utf8'),'keep');
  assert.ok(!existsSync(join(home,'.config/karabiner')));
  assert.ok(!existsSync(join(home,'.local/state/dotfiles/workstation.json')));
});


test('both profiles default to core settings and skip productivity packages and machine checks',t=>{
  const {home,p}=fixture(t);
  for(const id of ['fde','tf']) {
    const config=resolveProfile(id),files=workstationFiles(id);
    assert.equal(config.productivity,false);
    assert.deepEqual(config.install.guided.map(a=>a.name),id==='fde'?['Amp']:[]);
    for(const name of ['alfred','karabiner','rectangle-pro','dockflow','cleanshot','session']) {
      assert.ok(!config.install.modules.includes(name));
      assert.ok(!config.install.casks.some(a=>a.cask===name));
      assert.ok(![...files.keys()].some(path=>path.startsWith(name+'/')));
    }
    assert.ok(!files.has('scripts/hyper-config.json'));
    const plan=packagePlan(config,[],[],()=>false,()=>false);
    assert.deepEqual(plan.guided.map(a=>a.name),id==='fde'?['Amp']:[]);
    assert.equal(machineReport(config,join(p,id),home).productivityChecks,'skipped');
    assert.ok(!desiredLinks(files,join(p,id),home).some(l=>/alfred|karabiner|rectangle-pro/.test(l.path)));
    assert.ok(resolveProfile(id,{productivity:true}).install.modules.includes('alfred'));
  }
});

test('default apply leaves existing productivity preferences alone and rollback restores core only',t=>{
  const {home,backup}=fixture(t);
  for(const name of ['alfred','karabiner','rectangle-pro']) {
    mkdirSync(join(home,'.config',name),{recursive:true});
    writeFileSync(join(home,'.config',name,'personal'),'keep');
  }
  const journal=applyWorkstation('tf',home,backup);
  assert.equal(journal.productivity,false);
  assert.ok(!existsSync(join(backup,'alfred')));
  assert.ok(!journal.records.some(r=>r.path.includes('/alfred/')));
  assert.ok(existsSync(join(home,'.zshrc')));
  undoWorkstation(backup,home);
  for(const name of ['alfred','karabiner','rectangle-pro'])assert.equal(readFileSync(join(home,'.config',name,'personal'),'utf8'),'keep');
});

test('core reapply preserves opted-in files, links and hashes, then can opt in again',t=>{
  const {home,backup}=fixture(t);
  applyWorkstation('tf',home,backup,undefined,{productivity:true});
  const target=join(home,'.local/share/dotfiles/workstations/tf');
  const path=join(target,wf+'dispatch.zsh'),before=readFileSync(path);
  const manifest=()=>JSON.parse(readFileSync(join(target,'managed-files.json')));
  const digest=manifest()[wf+'dispatch.zsh'];
  applyWorkstation('tf',home,backup+'-core');
  assert.deepEqual(readFileSync(path),before);
  assert.equal(manifest()[wf+'dispatch.zsh'],digest);
  assert.match(realpathSync(join(home,'.config/alfred')),/workstations\/tf\//);
  // A core profile switch also leaves the old productivity profile active.
  applyWorkstation('fde',home,backup+'-fde-core');
  assert.match(realpathSync(join(home,'.config/alfred')),/workstations\/tf\//);
  undoWorkstation(backup+'-fde-core',home);
  undoWorkstation(backup+'-core',home);
  applyWorkstation('tf',home,backup+'-again',undefined,{productivity:true});
  undoWorkstation(backup+'-again',home);
  undoWorkstation(backup,home);
});


test('TF Code and Innovate arrange four apps, select matching Dock presets and expose launch menus',()=>{
  const config=resolveProfile('tf',{productivity:true}),files=workstationFiles('tf',{productivity:true});
  const plist=JSON.parse(execFileSync('plutil',['-convert','json','-o','-','--','-'],{input:files.get(wf+'info.plist')}));
  const sessions=JSON.parse(files.get(wf+'focus-sessions.json'));
  const rectangle=JSON.parse(files.get('rectangle-pro/.config/rectangle-pro/RectangleProConfig.json'));
  const native=JSON.parse(rectangle.defaults.appSpecs.string);
  for(const [id,agent,name,dock] of [['code','cursor','Code','2. Code'],['innovate','codex','Innovate','3. Innovate']]) {
    const session=sessions.find(s=>s.id===id);
    assert.deepEqual(session.apps.map(a=>a.id),['zen-browser','ghostty','slack',agent]);
    assert.equal(session.dockName,dock);
    assert.equal(session.durationMinutes,45);
    assert.equal(session.layoutURL,'rectangle-pro://execute-layout?name='+name);
    assert.equal(session.pairLayoutURL,'rectangle-pro://execute-layout?name=Code%20Reference');
    assert.deepEqual(config.layouts.find(l=>l.name===name).windows,[['zen-browser',2],['ghostty',21],['slack',24],[agent,2]]);
    assert.ok(native.some(l=>l.name===name));
    const menu=plist.objects.find(o=>o.uid==='menu-'+id);
    assert.ok(JSON.parse(menu.config.items).some(i=>i.arg==='layout:'+name));
  }
  const html=manualHTML(config);
  assert.match(html,/Ghostty<br>⅔/);assert.match(html,/Slack<br>⅓/);
  const keyboard=files.get('karabiner/.config/karabiner/karabiner.json').toString();
  assert.ok(keyboard.includes('zen-browser'));
  assert.ok(!keyboard.includes('Chrome'));
  assert.match(html,/Zen Browser<br>Maximized/);assert.match(html,/Desktop 3/);
  assert.deepEqual(config.layouts.find(l=>l.name==='Work').windows,[['edge',21],['teams',24],['claude',2]]);
});

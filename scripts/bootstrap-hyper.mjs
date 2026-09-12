#!/usr/bin/env node
// macOS setup with narrow, reversible preference patches. No history or credential stores.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, lstatSync, realpathSync, unlinkSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const absent = { exists:false };
const modules = ['alfred','karabiner','rectangle-pro'];
const preferences = 'alfred/.config/alfred/Alfred.alfredpreferences/preferences';
const run = (program, args, options = {}) => execFileSync(program, args, { encoding:'utf8', stdio:['pipe','pipe','pipe'], ...options });
const exists = (path) => { try { lstatSync(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
const sameTarget = (path, target) => {
  try { return lstatSync(path).isSymbolicLink() && realpathSync(path)===realpathSync(target); }
  catch (error) { if (error.code==='ENOENT') return false; throw error; }
};
const assertPreferencePath = (path) => {
  // Refuse redirected preference files before reading or writing their contents.
  let current=path;
  while (current.includes('/Alfred.alfredpreferences/')) {
    if (exists(current) && lstatSync(current).isSymbolicLink()) throw new Error(`Symlinked preference path: ${current}`);
    current=resolve(current,'..');
  }
};
const readPlist = (path) => { assertPreferencePath(path); return exists(path) ? JSON.parse(run('plutil',['-convert','json','-o','-',path])) : {}; };
const writePlist = (path, value) => {
  assertPreferencePath(path);
  mkdirSync(resolve(path,'..'), { recursive:true });
  writeFileSync(path, run('plutil',['-convert','xml1','-o','-','--','-'], { input:JSON.stringify(value) }));
};
const field = (data, key) => Object.hasOwn(data,key) ? { exists:true, value:data[key] } : absent;

export function preferenceTargets(root, localId) {
  const config = JSON.parse(readFileSync(join(root,'scripts/hyper-config.json')));
  const binding = (id) => { const a=config.mehActions.find((item)=>item.id===id); return {key:a.keyCode,mod:917504,string:a.key}; };
  const targets = [
    { path:join(root,preferences,'features/filesearch/actions/prefs.plist'), values:{ finderSelectionHotkey:binding('actions') } },
    { path:join(root,preferences,'features/clipboard/prefs.plist'), values:{ hotkey:binding('clipboard'),persistFor:0,ignoreConcealed:true } },
    { path:join(root,preferences,'features/snippets/prefs.plist'), values:{ hotkey:binding('snippets') } },
  ];
  if (localId) {
    if (!/^[a-f0-9]{40}$/.test(localId)) throw new Error('Invalid Alfred local identifier');
    targets.push({path:join(root,preferences,'local',localId,'features/clipboard/prefs.plist'),values:{enabled:true,enabledImages:false,enabledFiles:false}});
    targets.push({path:join(root,preferences,'local',localId,'hotkey/prefs.plist'),values:{default:{key:49,mod:1048576,string:'Space'}}});
  }
  return targets;
}

export function makePlan(root, home, localId) {
  const links = modules.map((module) => ({path:join(home,'.config',module),target:join(root,module,'.config',module)}));
  const conflicts = links.filter((item)=>exists(item.path) && !(sameTarget(item.path,item.target))).map((item)=>item.path);
  const patches = preferenceTargets(root,localId).map((target)=>({...target,changes:Object.entries(target.values).filter(([key,value])=>!isDeepStrictEqual(readPlist(target.path)[key],value)).map(([key])=>key)}));
  return {links,conflicts,patches,localReady:Boolean(localId)};
}

export function applyPlan(plan, backup, root, home) {
  if (plan.conflicts.length) throw new Error(`Stow conflicts; merge these configurations first: ${plan.conflicts.join(', ')}`);
  if (exists(backup)) throw new Error('Backup directory already exists; choose a new run');
  mkdirSync(backup,{recursive:true,mode:0o700});
  const journal={version:1,root:resolve(root),home:resolve(home),status:'applying',records:[]};
  const save=()=>writeFileSync(join(backup,'journal.json'),JSON.stringify(journal,null,2)+'\n',{mode:0o600});
  save();
  for (const patch of plan.patches) {
    const data=readPlist(patch.path);
    for (const key of patch.changes) {
      journal.records.push({type:'plist',path:patch.path,key,before:field(data,key),after:{exists:true,value:patch.values[key]}});
      save();
      data[key]=patch.values[key];
    }
    if (patch.changes.length) writePlist(patch.path,data);
  }
  for (const link of plan.links) {
    if (!exists(link.path)) journal.records.push({type:'link',...link});
  }
  save();
  // .config remains a real directory so Karabiner receives a directory symlink.
  mkdirSync(join(home,'.config'),{recursive:true});
  run('stow',['-d',root,'-t',home,...modules]);
  journal.status='applied';save();
  return journal;
}

export function rollback(backup, root, home) {
  const path=join(backup,'journal.json');
  const journal=JSON.parse(readFileSync(path));
  if (journal.version!==1 || journal.root!==resolve(root) || journal.home!==resolve(home)) throw new Error('Backup belongs to another repository or home');
  if (journal.status==='rolled-back') return journal;
  const allowedBase=join(root,preferences)+ '/';
  const allowedShared=new Map(preferenceTargets(root,null).map((p)=>[p.path,new Set(Object.keys(p.values))]));
  // Validate every record and current value before modifying anything.
  for (const record of journal.records) {
    if (record.type==='link') {
      if (!modules.some((m)=>record.path===join(home,'.config',m) && record.target===join(root,m,'.config',m))) throw new Error('Invalid link record');
      if (exists(record.path) && !(sameTarget(record.path,record.target))) throw new Error(`Link changed since apply: ${record.path}`);
    } else if (record.type==='plist') {
      const local=record.path.startsWith(allowedBase) && /^local\/[a-f0-9]{40}\/(features\/clipboard|hotkey)\/prefs\.plist$/.test(record.path.slice(allowedBase.length));
      const permitted=allowedShared.get(record.path)?.has(record.key) || (local && ['enabled','enabledImages','enabledFiles','default'].includes(record.key));
      if (!permitted) throw new Error('Invalid preference record');
      const current=field(readPlist(record.path),record.key);
      if (!isDeepStrictEqual(current,record.after) && !isDeepStrictEqual(current,record.before)) throw new Error(`Preference changed since apply: ${record.path} (${record.key})`);
    } else throw new Error('Unknown backup record');
  }
  for (const record of [...journal.records].reverse()) {
    if (record.type==='link') { if (exists(record.path)) unlinkSync(record.path); }
    else {
      const data=readPlist(record.path);
      if (record.before.exists) data[record.key]=record.before.value; else delete data[record.key];
      writePlist(record.path,data);
    }
  }
  journal.status='rolled-back';writeFileSync(path,JSON.stringify(journal,null,2)+'\n');
  return journal;
}

function appPresent(names) {
  return names.some((name)=>['/Applications','/Applications/Setapp',join(homedir(),'Applications')].some((dir)=>existsSync(join(dir,name+'.app'))));
}
function main() {
  const [mode='plan',...args]=process.argv.slice(2);
  if (!['plan','apply','check','rollback'].includes(mode)) throw new Error('Usage: bootstrap-hyper.sh plan|apply|check|rollback BACKUP [--local-id ID]');
  if (process.platform!=='darwin') throw new Error('macOS only');
  const root=sourceRoot,home=homedir();
  const localArg=args.indexOf('--local-id');
  let localId=localArg<0 ? null : args[localArg+1];
  // Alfred's own machine ID; never use a copied local folder from another Mac.
  let alfredLocation=null;
  try { alfredLocation=JSON.parse(readFileSync(join(home,'Library/Application Support/Alfred/prefs.json'),'utf8')); } catch { /* Alfred not initialized yet. */ }
  if (!localId) localId=alfredLocation?.localhash ?? process.env.alfred_preferences_localhash ?? null;
  if (localId && !/^[a-f0-9]{40}$/.test(localId)) localId=null;
  if (mode==='rollback') {
    if (!args[0] || args[0].startsWith('--')) throw new Error('Provide the backup directory printed by apply');
    rollback(resolve(args[0]),root,home);
    console.log('Restored only this run’s managed preferences and new links. Restart Alfred to reload. Installed software and personal data are retained.');return;
  }
  const plan=makePlan(root,home,localId);
  const packages=[['Alfred 5','alfred'],['Rectangle Pro','rectangle-pro']];
  const karabinerReady=appPresent(['Karabiner-Elements']);
  const missingApps=packages.filter(([name])=>!appPresent([name]));
  const stowReady=spawnSync('which',['stow']).status===0;
  const captureReady=appPresent(['CleanShot X']);
  const workflowRoot=join(root,'alfred/.config/alfred/Alfred.alfredpreferences/workflows');
  const installed=new Set();
  if (existsSync(workflowRoot)) for (const dir of readdirSync(workflowRoot)) {
    const info=join(workflowRoot,dir,'info.plist');
    try { installed.add(run('plutil',['-extract','bundleid','raw','-o','-',info]).trim()); } catch { /* Not a workflow. */ }
  }
  const config=JSON.parse(readFileSync(join(root,'scripts/hyper-config.json')));
  const missingWorkflows=[...new Set(config.systemTools.map((t)=>t.bundleId).filter(Boolean))].filter((id)=>!installed.has(id));
  const expectedPrefs=join(root,'alfred/.config/alfred/Alfred.alfredpreferences');
  const connected=alfredLocation?.current && exists(alfredLocation.current) && realpathSync(alfredLocation.current)===realpathSync(expectedPrefs);
  const report={mode,alfredConnected:Boolean(connected),missingWorkflows,profile:'Hyperland',localSettingsReady:plan.localReady,missingPackages:[...(stowReady?[]:['stow']),...missingApps.map(([,cask])=>cask)],cleanShotInstalled:captureReady,conflicts:plan.conflicts,preferencesToChange:plan.patches.filter((p)=>p.changes.length).map((p)=>({path:p.path,keys:p.changes})),linksToCreate:plan.links.filter((p)=>!exists(p.path)).map((p)=>p.path)};
  console.log(JSON.stringify(report,null,2));
  if(!karabinerReady)console.log('Install Karabiner from https://karabiner-elements.pqrs.org/: open the official DMG, run Karabiner-Elements.pkg, and complete the driver/services/input prompts. Homebrew is not used for Karabiner.');
  if (mode==='apply') {
    if (plan.conflicts.length) throw new Error('Resolve reported Stow conflicts before apply; nothing changed');
    if ((!stowReady || missingApps.length) && spawnSync('which',['brew']).status!==0) throw new Error('Install Homebrew from brew.sh, then rerun apply');
    if (!stowReady) run('brew',['install','stow'],{stdio:'inherit'});
    for (const [,cask] of missingApps) run('brew',['install','--cask',cask],{stdio:'inherit'});
    run('node',[join(root,'scripts/build-hyper-config.mjs'),'--check']);
    run('node',[join(root,'scripts/render-hyper-guide.mjs'),'--check']);
    const backup=join(process.env.XDG_STATE_HOME || join(home,'.local/state'),'dotfiles/backups',`hyper-bootstrap-${Date.now()}`);
    applyPlan(plan,backup,root,home);
    console.log(`Backup: ${backup}\nRollback: bash scripts/bootstrap-hyper.sh rollback '${backup}'`);
  }
  if (mode==='check') {
    run('node',[join(root,'scripts/build-hyper-config.mjs'),'--check']);
    run('node',[join(root,'scripts/render-hyper-guide.mjs'),'--check']);
    const pending=plan.conflicts.length || !karabinerReady || !plan.localReady || report.preferencesToChange.length || report.linksToCreate.length || missingApps.length || !stowReady || !captureReady || !connected || missingWorkflows.length;
    console.log(pending?'Managed setup has pending items.':'Managed files, feature preferences, links and installed core apps match.');
    if (pending) process.exitCode=1;
  }
  console.log('Per-Mac completion: connect Alfred preferences; restart Alfred after file changes; activate licenses and grant permissions directly; import Rectangle snapshot; restore vendor workflows; transfer DockFlow presets; enable login; create desktops and run setup-hyper-macos.sh; verify CleanShot capture keys and Spotlight/Raycast ownership; test hardware keys and fresh login. See docs/modules/hyper-bootstrap.md.');
  if (!localId) console.log('Alfred local ID unavailable. Launch Alfred once and connect its preferences folder, then rerun; or pass --local-id with the ID from Alfred’s current local settings directory.');
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`Hyper setup: ${error.message}`); process.exitCode=1; }
}

#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readlinkSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, readdirSync, realpathSync, symlinkSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { resolveProfile } from './workstation-profiles.mjs';
import { workstationFiles, root } from './build-workstation.mjs';
import { makePlan, applyPlan, rollback as rollbackAlfred } from './bootstrap-hyper.mjs';
import { requireUniquePreset } from './dockflow.mjs';

const run=(p,a,options={})=>execFileSync(p,a,{encoding:'utf8',stdio:['pipe','pipe','pipe'],...options});
const has=p=>{try{lstatSync(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const hash=b=>createHash('sha256').update(b).digest('hex');
const write=(p,b)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,b);};
const statePath=home=>join(home,'.local/state/dotfiles/workstation.json');
const destination=(home,id)=>join(home,'.local/share/dotfiles/workstations',id);
const saveJSON=(p,v)=>write(p,JSON.stringify(v,null,2)+'\n');
const presentFile=p=>has(p)?readFileSync(p).toString('base64'):null;
function assertLocalPath(path, home) {
  for(let current=path;current!==home&&current.startsWith(home+'/');current=dirname(current)) {
    if(has(current)&&lstatSync(current).isSymbolicLink())throw new Error('Redirected managed path: '+current);
  }
}

export function desiredLinks(files, target, home) {
  const links=new Map();
  for(const path of files.keys()) {
    const [module,...tail]=path.split('/');
    if(!['alfred','karabiner','rectangle-pro',...resolveProfile('tf').install.modules].includes(module))continue;
    const top=tail[0]==='.config'?tail.slice(0,2).join('/'):tail[0];
    links.set(join(home,top),{path:join(home,top),target:join(target,module,top)});
  }
  return [...links.values()];
}

export function linkPlan(files, target, home, source=root) {
  const links=desiredLinks(files,target,home), conflicts=[];
  if(has(join(home,'.config')) && lstatSync(join(home,'.config')).isSymbolicLink())conflicts.push(join(home,'.config'));
  for(const link of links) {
    link.before=has(link.path)&&lstatSync(link.path).isSymbolicLink()?readlinkSync(link.path):null;
    link.change=!link.before || resolve(dirname(link.path),link.before)!==link.target;
    if(has(link.path) && !link.before){conflicts.push(link.path);continue;}
    if(link.before && link.change) {
      const old=resolve(dirname(link.path),link.before);
      // Only an exact corresponding link from this checkout or a managed profile may switch.
      const relative=link.target.slice(target.length+1);
      if(![join(source,relative),destination(home,'fde')+'/'+relative,destination(home,'tf')+'/'+relative].includes(old))conflicts.push(link.path);
    }
  }
  return {links,conflicts};
}

export function inspectGenerated(files, target) {
  const manifest=join(target,'managed-files.json');
  const previous=has(manifest)?JSON.parse(readFileSync(manifest)):{};
  const conflicts=[];
  for(const [path,content] of files) {
    const full=join(target,path);
    if(has(full)) {
      if(lstatSync(full).isSymbolicLink()) {conflicts.push(full);continue;}
      const digest=hash(readFileSync(full));
      if(digest!==hash(content) && digest!==previous[path])conflicts.push(full);
    }
  }
  return conflicts;
}

export function applyWorkstation(id, home, backup, source=root, options={}) {
  const config=resolveProfile(id,options), target=destination(home,id), files=workstationFiles(id,options);
  const plan=linkPlan(files,target,home,source);
  for(const path of files.keys())assertLocalPath(join(target,path),home);
  assertLocalPath(join(target,'managed-files.json'),home);assertLocalPath(statePath(home),home);
  const conflicts=[...plan.conflicts,...inspectGenerated(files,target)];
  if(conflicts.length)throw new Error('Resolve configuration conflicts first: '+conflicts.join(', '));
  if(has(backup))throw new Error('Backup already exists');
  mkdirSync(backup,{recursive:true,mode:0o700});
  const records=[...files].map(([p,b])=>({path:join(target,p),before:presentFile(join(target,p)),after:b.toString('base64')}));
  const previousManifest=has(join(target,'managed-files.json'))?JSON.parse(readFileSync(join(target,'managed-files.json'))):{};
  records.push({path:join(target,'managed-files.json'),before:presentFile(join(target,'managed-files.json')),after:Buffer.from(JSON.stringify({...previousManifest,...Object.fromEntries([...files].map(([p,b])=>[p,hash(b)]))},null,2)+'\n').toString('base64')});
  const selector={profile:id,source:resolve(source),productivity:config.productivity};
  records.push({path:statePath(home),before:presentFile(statePath(home)),after:Buffer.from(JSON.stringify(selector,null,2)+'\n').toString('base64')});
  const journal={version:1,profile:id,productivity:config.productivity,source:resolve(source),home:resolve(home),target,links:plan.links.filter(l=>l.change),records,status:'applying'};
  const journalPath=join(backup,'workstation.json');saveJSON(journalPath,journal);
  // Save restoration data before writes. Partial runs can be rolled back with this same journal.
  for(const r of records.filter(r=>r.path!==statePath(home)))write(r.path,Buffer.from(r.after,'base64'));
  mkdirSync(join(home,'.config'),{recursive:true});
  for(const l of journal.links)if(has(l.path))unlinkSync(l.path);
  const modules=config.install.modules;
  try {
    run('stow',['-n','-d',target,'-t',home,...modules]);
    run('stow',['-d',target,'-t',home,...modules]);
    if(config.productivity) {
      let localId=null;
      try{localId=JSON.parse(readFileSync(join(home,'Library/Application Support/Alfred/prefs.json'))).localhash;}catch{}
      if(!/^[a-f0-9]{40}$/.test(localId??''))localId=null;
      applyPlan(makePlan(target,home,localId),join(backup,'alfred'),target,home);
    }
    const selected=records.at(-1);write(selected.path,Buffer.from(selected.after,'base64'));
    journal.status='applied';saveJSON(journalPath,journal);
  } catch(error) {throw new Error(`${error.message}\nPartial apply journal: ${backup}\nRun setup-workstation.sh rollback '${backup}'`);}
  return journal;
}

export function undoWorkstation(backup, home, source=root) {
  const path=join(backup,'workstation.json'),j=JSON.parse(readFileSync(path));
  if(j.version!==1||j.home!==resolve(home)||j.source!==resolve(source)||!['fde','tf'].includes(j.profile)||j.target!==destination(home,j.profile))throw new Error('Foreign or invalid journal');
  if(j.status==='rolled-back')return;
  const files=workstationFiles(j.profile,{productivity:j.productivity??true}); // Legacy journals included productivity.
  const allowed=new Set([...files.keys()].map(p=>join(j.target,p)));
  allowed.add(join(j.target,'managed-files.json'));allowed.add(statePath(home));
  const linkAllowed=new Map(desiredLinks(files,j.target,home).map(l=>[l.path,l.target]));
  for(const r of j.records) {
    assertLocalPath(r.path,home);
    if(!allowed.has(r.path)||has(r.path)&&lstatSync(r.path).isSymbolicLink())throw new Error('Invalid file record');
    const current=presentFile(r.path);
    if(current!==r.before&&current!==r.after)throw new Error('File changed since apply: '+r.path);
  }
  for(const l of j.links) {
    if(linkAllowed.get(l.path)!==l.target)throw new Error('Invalid link record');
    if(l.before) {
      const old=resolve(dirname(l.path),l.before),relative=l.target.slice(j.target.length+1);
      if(![join(source,relative),destination(home,'fde')+'/'+relative,destination(home,'tf')+'/'+relative].includes(old))throw new Error('Invalid previous link');
    }
    if(has(l.path)&&(!lstatSync(l.path).isSymbolicLink()||![l.target,l.before].includes(readlinkSync(l.path))&&resolve(dirname(l.path),readlinkSync(l.path))!==l.target))throw new Error('Link changed since apply: '+l.path);
  }
  if(has(join(backup,'alfred/journal.json')))rollbackAlfred(join(backup,'alfred'),j.target,home);
  // Stow may have made relative links. Restore the original text exactly.
  for(const l of [...j.links].reverse()) {
    if(has(l.path))unlinkSync(l.path);
    if(l.before)symlinkSync(l.before,l.path);
  }
  for(const r of [...j.records].reverse()) {
    if(r.before===null){if(has(r.path))unlinkSync(r.path);}
    else write(r.path,Buffer.from(r.before,'base64'));
  }
  j.status='rolled-back';saveJSON(path,j);
}

export function appInstalled(spec, home=homedir()) {
  const names=spec.name==='Karabiner-Elements'?['Karabiner-Elements']:spec.name==='Alfred 5'?['Alfred 5','Alfred']:spec.name==='ChatGPT'?['ChatGPT','Codex']:[spec.name];
  for(const dir of ['/Applications','/Applications/Setapp',join(home,'Applications')])for(const name of names) {
    const path=join(dir,name+'.app/Contents/Info.plist');
    if(!existsSync(path))continue;
    const bundle=run('plutil',['-extract','CFBundleIdentifier','raw','-o','-',path]).trim();
    const ids=spec.name==='CleanShot X'?['com.getcleanshot.app-setapp','com.getcleanshot.app','pl.maketheweb.cleanshotx']:spec.bundleIds??[spec.bundleId];
    if(ids.includes(bundle)||(spec.name==='ChatGPT'&&bundle==='com.openai.chat'))return true;
  }
  return false;
}

export function packagePlan(config, installedFormulae, installedCasks, detect=appInstalled, detectCommand=command=>spawnSync('which',[command]).status===0) {
  return {
    formulae:config.install.formulae.filter(f=>!installedFormulae.includes(f)),
    casks:config.install.casks.filter(a=>a.bundleId?!detect(a):!installedCasks.includes(a.cask)&&!(a.command&&detectCommand(a.command))).map(a=>a.cask),
    guided:config.install.guided.filter(a=>!detect(a)),
  };
}

function packages(config) {
  if(spawnSync('which',['brew']).status!==0)return {formulae:config.install.formulae,casks:config.install.casks.map(a=>a.cask),guided:config.install.guided.filter(a=>!appInstalled(a)),homebrewMissing:true};
  return packagePlan(config,run('brew',['list','--formula','-1']).trim().split('\n'),run('brew',['list','--cask','-1']).trim().split('\n'));
}
export function machineReport(config,target,home) {
  if(!config.productivity)return {productivityChecks:'skipped',manualVerification:['Complete role app installation and test shell/terminal settings']};
  let location=null;
  try{location=JSON.parse(readFileSync(join(home,'Library/Application Support/Alfred/prefs.json')));}catch{}
  const prefs=join(target,'alfred/.config/alfred/Alfred.alfredpreferences');
  const connected=Boolean(location?.current&&existsSync(location.current)&&existsSync(prefs)&&realpathSync(location.current)===realpathSync(prefs));
  const bundleIds=new Set(),dir=join(prefs,'workflows');
  if(existsSync(dir))for(const name of readdirSync(dir))try{bundleIds.add(run('plutil',['-extract','bundleid','raw','-o','-',join(dir,name,'info.plist')]).trim());}catch{}
  const missingWorkflows=[...new Set(config.systemTools.map(t=>t.bundleId).filter(Boolean))].filter(id=>!bundleIds.has(id));
  const pendingPresets=[];
  const cli=['/Applications/DockFlow.app/Contents/MacOS/DockFlowCLI',join(home,'Applications/DockFlow.app/Contents/MacOS/DockFlowCLI')].find(existsSync);
  let listed='';try{if(cli)listed=run(cli,['list']);}catch{}
  for(const p of config.dockPresets)try{requireUniquePreset(p.name,listed);}catch{pendingPresets.push(p.name);}
  let alfredPreferencesPending=true;
  if(existsSync(join(target,'scripts/hyper-config.json'))) {
    const local=/^[a-f0-9]{40}$/.test(location?.localhash??'')?location.localhash:null;
    const p=makePlan(target,home,local);
    alfredPreferencesPending=!local||p.patches.some(x=>x.changes.length);
  }
  return {alfredConnected:connected,alfredPreferencesPending,missingWorkflows,pendingPresets,
    manualVerification:['Activate licenses and sign in directly','Import the selected Rectangle snapshot and DockFlow pack','Verify native desktop assignments','Verify permissions, physical Hyper/Meh keys and fresh login','Verify Session countdown; app presence does not prove Pro automation']};
}
async function main() {
  if(process.platform!=='darwin')throw new Error('macOS only');
  if(process.arch!=='arm64')throw new Error('These shared shell defaults support Apple Silicon Macs. No configuration changed.');
  const [mode='plan',...args]=process.argv.slice(2),home=homedir();
  if(!['plan','apply','check','rollback'].includes(mode))throw new Error('Use plan, apply, check, or rollback BACKUP');
  if(mode==='rollback'){if(!args[0])throw new Error('Provide the backup directory');undoWorkstation(resolve(args[0]),home);console.log('Managed configuration restored; reconnect Alfred and restore native Rectangle/DockFlow imports if needed.');return;}
  const index=args.indexOf('--profile');
  if(args.some((a,i)=>!(a==='--productivity'||a==='--profile'||i===index+1&&index>=0)))throw new Error('Use --profile fde|tf and optionally --productivity');
  let id=index>=0?args[index+1]:null;
  if(!id)try{id=JSON.parse(readFileSync(statePath(home))).profile;}catch{}
  if(!id&&process.stdin.isTTY) {
    const prompt=createInterface({input:process.stdin,output:process.stdout});
    try{id=await prompt.question('Choose setup: FDE (full) or TF (Tech Founder): ');}finally{prompt.close();}
  }
  if(!id)throw new Error('Choose --profile fde or --profile tf');
  const options={productivity:args.includes('--productivity')};
  const config=resolveProfile(id,options);id=config.setupProfile.toLowerCase();
  const target=destination(home,id),files=workstationFiles(id,options),plan=linkPlan(files,target,home);
  for(const path of files.keys())assertLocalPath(join(target,path),home);
  assertLocalPath(join(target,'managed-files.json'),home);assertLocalPath(statePath(home),home);
  const drift=inspectGenerated(files,target),install=packages(config),machine=machineReport(config,target,home);
  const missingFiles=[...files.keys()].filter(p=>!existsSync(join(target,p)));
  const outdated=[...files].filter(([p,b])=>existsSync(join(target,p))&&hash(readFileSync(join(target,p)))!==hash(b)).map(([p])=>p);
  const report={mode,profile:config.setupProfile,productivity:config.productivity,target,conflicts:[...plan.conflicts,...drift],linksToChange:plan.links.filter(l=>l.change).map(l=>l.path),missingFiles:missingFiles.length,outdatedFiles:outdated,install,...machine};
  console.log(JSON.stringify(report,null,2));
  if(mode==='apply') {
    if(report.conflicts.length)throw new Error('Resolve the reported conflicts first; nothing installed or changed');
    if(install.homebrewMissing)throw new Error('Install Homebrew from brew.sh first');
    if(install.formulae.length)run('brew',['install',...install.formulae],{stdio:'inherit'});
    for(const cask of install.casks)run('brew',['install','--cask',cask],{stdio:'inherit'});
    const backup=join(home,'.local/state/dotfiles/backups','workstation-'+Date.now());
    applyWorkstation(id,home,backup,root,options);
    console.log(`Applied ${config.setupProfile}. Backup: ${backup}\nRollback: bash scripts/setup-workstation.sh rollback '${backup}'\nComplete the guided steps in docs/profiles/${id}.html. Productivity is ${config.productivity?'enabled; repeat --productivity on apply/check':'skipped; existing productivity settings remain untouched'}.`);
  }
  if(mode==='check') {
    const pending=report.conflicts.length||report.linksToChange.length||missingFiles.length||outdated.length||install.formulae.length||install.casks.length||install.guided.length||(config.productivity&&(!machine.alfredConnected||machine.alfredPreferencesPending||machine.missingWorkflows.length||machine.pendingPresets.length));
    console.log(pending?'Pending items listed above.':'Managed configuration and detected dependencies match. Physical/native checks still require verification.');
    if(pending)process.exitCode=1;
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{console.error('Workstation setup: '+e.message);process.exitCode=1;});

#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProfile } from './workstation-profiles.mjs';
import { buildKarabiner, buildRectangle, buildWorkflow, buildGoogleWorkspace } from './build-hyper-config.mjs';
import { renderManual, manualHTML } from './workstation-manual.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const wf='alfred/.config/alfred/Alfred.alfredpreferences/workflows';
const read=(p)=>readFileSync(join(root,p));
const json=(p)=>JSON.parse(read(p));
const plist=(p)=>JSON.parse(execFileSync('plutil',['-convert','json','-o','-',join(root,p)]));
const xml=(v)=>execFileSync('plutil',['-convert','xml1','-o','-','--','-'],{input:JSON.stringify(v)});

export function buildDockWorkflow(config) {
  const objects=[],connections={},uidata={};
  const add=(uid,type,data,version=1)=>{objects.push({uid,type:'alfred.workflow.'+type,version,config:data});uidata[uid]={xpos:100,ypos:objects.length*80};};
  const link=(a,b)=>{connections[a]=[{destinationuid:b,modifiers:0,modifiersubtext:'',vitoclose:false}];};
  add('run','action.script',{concurrently:false,escaping:0,scriptargtype:1,type:5,script:'export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"\nnode ./dockflow.mjs apply "$1"',scriptfile:''},2);
  add('result','output.notification',{title:'DockFlow',text:'{query}',onlyshowifquerypopulated:true},0);link('run','result');
  add('menu','input.listfilter',{keyword:'dp',argumenttype:1,withspace:true,fixedorder:true,matchmode:0,title:'DockFlow Profile',subtext:'Choose a preset',items:JSON.stringify(config.dockPresets.map(p=>({title:'DockFlow Profile: '+p.name.replace(/^\d+\. /,''),subtitle:'Meh+'+p.key+' · '+p.keyword,arg:p.id})))});link('menu','run');
  for (const p of config.dockPresets) {
    add(p.id+'-key','trigger.hotkey',{hotkey:p.code,hotmod:917504,hotstring:p.key,action:0,argument:0},2);
    add(p.id+'-input','input.keyword',{keyword:p.keyword,argumenttype:2,withspace:false,text:'DockFlow Profile: '+p.name,subtext:'Switch Dock only'});
    add(p.id+'-arg','utility.argument',{argument:p.id,passthroughargument:false,variables:{}});
    link(p.id+'-key',p.id+'-arg');link(p.id+'-input',p.id+'-arg');link(p.id+'-arg','run');
  }
  return {name:'DockFlow Profiles',bundleid:'com.rahulnakmol.dockflow-profiles',createdby:'Rahul N Akmol',description:'Portable Dock presets selected by name',version:'2.0',disabled:false,objects,connections,uidata,readme:renderManual(config)};
}

// Only reviewed tracked source is copied; no local settings, licenses or runtime databases.
export function workstationFiles(id) {
  const config=resolveProfile(id), files=new Map();
  const put=(p,value)=>files.set(p,Buffer.isBuffer(value)?value:Buffer.from(value));
  const data=(p,value)=>put(p,JSON.stringify(value,null,2)+'\n');
  const tracked=execFileSync('git',['ls-files','-z','--',...config.install.modules],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  for (const path of tracked) put(path,read(path));
  data('scripts/hyper-config.json',config); // Existing narrow Alfred preference planner consumes this.
  data('karabiner/.config/karabiner/karabiner.json',buildKarabiner(json('karabiner/.config/karabiner/karabiner.json'),config));
  data('rectangle-pro/.config/rectangle-pro/RectangleProConfig.json',buildRectangle(json('rectangle-pro/.config/rectangle-pro/RectangleProConfig.json'),config));
  const hyper=buildWorkflow(config,{objects:[]});
  hyper.plist.readme=renderManual(config);
  hyper.plist.name='Hyper';
  hyper.plist.description=config.setupProfile+' — apps, focus sessions and layouts';
  // Alfred does not inherit a login shell's Homebrew PATH.
  for (const o of hyper.plist.objects.filter(o=>o.type==='alfred.workflow.action.script')) o.config.script='export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"\n'+o.config.script;
  put(`${wf}/user.workflow.hyper/info.plist`,xml(hyper.plist));
  put(`${wf}/user.workflow.hyper/dispatch.zsh`,hyper.script);
  put(`${wf}/user.workflow.hyper/guide.html`,manualHTML(config));
  const url=(s)=>s?'rectangle-pro://execute-layout?name='+encodeURIComponent(s):null;
  data(`${wf}/user.workflow.hyper/focus-sessions.json`,config.focusSessions.map(s=>({
    id:s.id,name:s.name,durationMinutes:s.durationMinutes,apps:s.apps.map(id=>config.apps.find(a=>a.id===id)),
    dockName:config.dockPresets.find(p=>p.id===s.mode)?.name??null,dockURL:null,pairLayoutURL:url(s.pairLayout),layoutURL:url(s.layout),
  })));
  for (const name of ['FocusSession.swift','focus-session.zsh','icon.png']) put(`${wf}/user.workflow.hyper/${name}`,read(`${wf}/user.workflow.hyper/${name}`));
  put(`${wf}/user.workflow.dockflow-profiles/info.plist`,xml(buildDockWorkflow(config)));
  put(`${wf}/user.workflow.google-workspace/info.plist`,xml(buildGoogleWorkspace(plist(`${wf}/user.workflow.google-workspace/info.plist`))));
  for (const name of ['dockflow-profiles','google-workspace']) put(`${wf}/user.workflow.${name}/icon.png`,read(`${wf}/user.workflow.${name}/icon.png`));
  for (const name of ['hyper','dockflow-profiles']) {
    put(`${wf}/user.workflow.${name}/dockflow.mjs`,read('scripts/dockflow.mjs'));
    data(`${wf}/user.workflow.${name}/dock-presets.json`,config.dockPresets);
  }
  put('guide.html',manualHTML(config));
  put('README.md',renderManual(config));
  return files;
}

export function writeWorkstation(id, destination) {
  const files=workstationFiles(id);
  for (const [path,content] of files) {mkdirSync(dirname(join(destination,path)),{recursive:true});writeFileSync(join(destination,path),content);}
  return files;
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  const [id,destination]=process.argv.slice(2);
  if (!destination) throw new Error('Usage: node scripts/build-workstation.mjs fde|tf OUTPUT_DIRECTORY');
  writeWorkstation(id,destination);
  console.log('Built '+resolveProfile(id).setupProfile+' at '+destination);
}

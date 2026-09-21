#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveProfile, profileIds } from './workstation-profiles.mjs';
import { renderManual, manualHTML } from './workstation-manual.mjs';
const check=process.argv.includes('--check');
for(const id of profileIds) {
  const c=resolveProfile(id);
  const full=renderManual(c);
  const start=full.indexOf('## Choose the right command');
  const end=full.indexOf('## Import and export DockFlow');
  if(start<0 || end<=start) throw new Error('Missing shortcut reference boundaries');
  const guide=full.slice(0,start)+`## Commands and hotkeys

Use the [Alfred stack module](../../modules/alfred.md#hotkeys-and-commands) for the Alfred, Karabiner and Rectangle Pro map. Raycast has a separate shared configuration and hotkey reference.

`+full.slice(end);
  for(const [ext,data] of [['md',guide],['html',manualHTML(c,{compact:true})]]) {
    const path=new URL(`../docs/guides/profiles/${id}.${ext}`,import.meta.url);
    if(check){if(readFileSync(path,'utf8')!==data)throw new Error('Regenerate '+path.pathname);}
    else{mkdirSync(new URL('../docs/guides/profiles/',import.meta.url),{recursive:true});writeFileSync(path,data);}
  }
}
console.log(check?'FDE/TF guides are current.':'FDE/TF guides generated.');

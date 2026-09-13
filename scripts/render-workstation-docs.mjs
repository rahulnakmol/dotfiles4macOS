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
  const hotkeys=`# Alfred ${c.setupProfile} hotkeys

Use this reference with the **${c.setupProfile} Alfred profile**. For installation, see the [Alfred guide](../guides/alfred.md) or [${c.setupProfile} profile guide](../guides/profiles/${id}.md). For Raycast, use its [own shortcuts](raycast-hotkeys.md).

${full.slice(start,end)}`;
  const guide=full.slice(0,start)+`## Commands and hotkeys

See the [Alfred ${c.setupProfile} hotkey reference](../../modules/alfred-${id}-hotkeys.md) for app keys, window actions, layouts, focus sessions and timers.

`+full.slice(end);
  const reference=new URL(`../docs/modules/alfred-${id}-hotkeys.md`,import.meta.url);
  if(check){if(readFileSync(reference,'utf8')!==hotkeys)throw new Error('Regenerate '+reference.pathname);}
  else writeFileSync(reference,hotkeys);
  for(const [ext,data] of [['md',guide],['html',manualHTML(c)]]) {
    const path=new URL(`../docs/guides/profiles/${id}.${ext}`,import.meta.url);
    if(check){if(readFileSync(path,'utf8')!==data)throw new Error('Regenerate '+path.pathname);}
    else{mkdirSync(new URL('../docs/guides/profiles/',import.meta.url),{recursive:true});writeFileSync(path,data);}
  }
}
console.log(check?'FDE/TF guides are current.':'FDE/TF guides generated.');

#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveProfile, profileIds } from './workstation-profiles.mjs';
import { renderManual, manualHTML } from './workstation-manual.mjs';
const check=process.argv.includes('--check');
for(const id of profileIds) {
  const c=resolveProfile(id);
  for(const [ext,data] of [['md',renderManual(c)],['html',manualHTML(c)]]) {
    const path=new URL(`../docs/profiles/${id}.${ext}`,import.meta.url);
    if(check){if(readFileSync(path,'utf8')!==data)throw new Error('Regenerate '+path.pathname);}
    else{mkdirSync(new URL('../docs/profiles/',import.meta.url),{recursive:true});writeFileSync(path,data);}
  }
}
console.log(check?'FDE/TF guides are current.':'FDE/TF guides generated.');

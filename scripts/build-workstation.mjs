#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveProfile, commonModules } from './workstation-profiles.mjs';
import { renderManual, manualHTML } from './workstation-manual.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const read=(p)=>readFileSync(join(root,p));

// Only reviewed tracked source is copied; no local settings, licenses or runtime databases.
export function workstationFiles(id, options={}) {
  const config=resolveProfile(id,options), files=new Map();
  const put=(p,value)=>files.set(p,Buffer.isBuffer(value)?value:Buffer.from(value));
  const data=(p,value)=>put(p,JSON.stringify(value,null,2)+'\n');
  const tracked=execFileSync('git',['ls-files','-z','--',...commonModules],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  for (const path of tracked) put(path,read(path));
  put('guide.html',manualHTML(config));
  put('README.md',renderManual(config));
  return files;
}

export function writeWorkstation(id, destination, options={}) {
  const files=workstationFiles(id,options);
  for (const [path,content] of files) {mkdirSync(dirname(join(destination,path)),{recursive:true});writeFileSync(join(destination,path),content);}
  return files;
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  const [id,destination,...flags]=process.argv.slice(2);
  if(flags.some(f=>f!=='--productivity'))throw new Error('Only --productivity is supported');
  if (!destination) throw new Error('Usage: node scripts/build-workstation.mjs fde|tf OUTPUT_DIRECTORY [--productivity]');
  writeWorkstation(id,destination,{productivity:flags.includes('--productivity')});
  console.log('Built '+resolveProfile(id).setupProfile+' at '+destination);
}

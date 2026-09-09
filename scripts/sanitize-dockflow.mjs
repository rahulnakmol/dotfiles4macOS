#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function sanitizePresets(input) {
  if(!Array.isArray(input))throw new Error('Expected DockFlow preset export array');
  return input.map(p=>{
    if(typeof p.name!=='string'||typeof p.apps!=='string')throw new Error('Invalid DockFlow export');
    const apps=JSON.parse(p.apps).filter(s=>typeof s==='string'&&(/^(file:\/\/\/(System\/)?Applications\/[^/]+\.app\/?)$/.test(s)||/^dockflow-spacer-\d+$/.test(s)));
    const appMetadata={};
    for(const path of apps) {
      const m=p.appMetadata?.[path];
      if(!m)continue;
      if(!/^[a-zA-Z0-9_.-]+$/.test(m.bundleIdentifier??''))continue;
      appMetadata[path]={bundleIdentifier:m.bundleIdentifier,appName:String(m.appName??''),appType:'regular'};
    }
    return {name:p.name,apps:JSON.stringify(apps),folderStacks:[],appMetadata,createdAt:'2026-09-09T00:00:00Z'};
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw new Error('Usage: node scripts/sanitize-dockflow.mjs PRIVATE_EXPORT OUTPUT');
  writeFileSync(output,JSON.stringify(sanitizePresets(JSON.parse(readFileSync(input))),null,2)+'\n');
}

#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function presetNames(output) {
  return output.split('\n').flatMap(line=>{
    const match=line.match(/^- (.+) \(ID: [^)]+\)$/);
    return match ? [match[1]] : [];
  });
}
export function requireUniquePreset(name, output) {
  if (presetNames(output).filter(n=>n===name).length!==1) throw new Error(`DockFlow needs exactly one preset named "${name}". Import the selected pack; rename duplicates before retrying.`);
}
export function dockflowCommand(mode, id, presets, cli, run=execFileSync) {
  if (!['check','apply'].includes(mode)) throw new Error('Use check or apply');
  const preset=presets.find(p=>p.id===id);
  if (!preset) throw new Error('Unknown DockFlow preset');
  if (process.env.HYPER_DRY_RUN==='1') return `DockFlow ${mode}: ${preset.name}`;
  requireUniquePreset(preset.name,run(cli,['list'],{encoding:'utf8'}));
  if (mode==='apply') run(cli,['apply','--name',preset.name],{stdio:'pipe'});
  return `DockFlow ${mode}: ${preset.name}`;
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  try {
    const folder=dirname(fileURLToPath(import.meta.url));
    const presets=JSON.parse(readFileSync(join(folder,'dock-presets.json')));
    const locations=['/Applications/DockFlow.app',join(process.env.HOME,'Applications/DockFlow.app'),'/Applications/Setapp/DockFlow.app'];
    const cli=locations.map(p=>join(p,'Contents/MacOS/DockFlowCLI')).find(existsSync);
    if (!cli && process.env.HYPER_DRY_RUN!=='1') throw new Error('Install DockFlow first');
    console.log(dockflowCommand(process.argv[2],process.argv[3],presets,cli));
  } catch(error) { console.error(error.message); process.exitCode=1; }
}

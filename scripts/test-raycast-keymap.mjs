import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildKeymap} from './build-raycast-keymap.mjs';
const config=JSON.parse(readFileSync(new URL('../raycast/.config/raycast-workstation/workstation.json',import.meta.url)));
test('native Raycast manifest needs no legacy keyboard configuration',()=>{
  const original=structuredClone(config);
  const result=buildKeymap(config);
  assert.deepEqual(Object.keys(result),['hotkeys','aliases']);
  assert.deepEqual(config,original);
  assert.deepEqual(buildKeymap(config),result);
  assert.ok(result.hotkeys.every(h=>['Applications','Workmode','Window Management','Raycast'].includes(h.owner)));
});
test('unique hotkeys and protected Codex voice/dictation/pet',()=>{
  const {hotkeys}=buildKeymap(config);
  assert.equal(new Set(hotkeys.map(h=>h.layer+h.key)).size,hotkeys.length);
  assert.ok(!hotkeys.some(h=>h.layer==='Hyper'&&['B','V','M'].includes(h.key)));
  assert.equal(hotkeys.filter(h=>h.command.startsWith('DockFlow:')).length,8);
  assert.ok(hotkeys.some(h=>h.key==='Z'&&h.command==='Final Cut Pro'&&h.owner==='Applications'&&h.optional));
});
test('every app has one native application binding, without custom launch commands',()=>{
  const {hotkeys}=buildKeymap(config);
  const apps=hotkeys.filter(h=>h.owner==='Applications');
  assert.equal(apps.length,config.apps.length);
  assert.equal(new Set(apps.map(h=>h.bundleId)).size,apps.length);
  for(const app of config.apps)assert.equal(apps.find(h=>h.bundleId===app.bundleId)?.key,app.key.toUpperCase());
  const manifest=JSON.parse(readFileSync(new URL('../extensions/raycast-workstation/package.json',import.meta.url)));
  assert.ok(!manifest.commands.some(c=>c.name.startsWith('launch-')));
});
test('rejects conflicting app chords before emitting a keymap',()=>{
  const duplicate=structuredClone(config);
  duplicate.apps[1].key=duplicate.apps[0].key;
  assert.throws(()=>buildKeymap(duplicate),/Duplicate hotkey/);
  const protectedKey=structuredClone(config);
  protectedKey.apps[0].key='b';
  assert.throws(()=>buildKeymap(protectedKey),/Codex owns Hyper\+B/);
});
test('Control Option preserves Rectangle fractions and separates Space movement from halves',()=>{
  const {hotkeys}=buildKeymap(config);
  const command=key=>hotkeys.find(h=>h.layer==='Control+Option'&&h.key===key)?.command;
  assert.equal(command(','),'Move to Previous Space');
  assert.equal(command('.'),'Move to Next Space');
  assert.equal(command('Left'),'Left Half');
  assert.equal(command('Right'),'Right Half');
  assert.equal(command('D'),'First Third');
  assert.equal(command('F'),'Center Third');
  assert.equal(command('G'),'Last Third');
  assert.equal(command('E'),'First Two Thirds');
  assert.equal(command('T'),'Last Two Thirds');
  assert.equal(command('-'),'Make Smaller');
  assert.equal(command('='),'Make Larger');
  assert.ok(!hotkeys.some(h=>h.owner==='Window Management'&&h.layer==='Hyper'));
});
test('Workmode branding preserves installed extension and command identities',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../extensions/raycast-workstation/package.json',import.meta.url)));
  assert.equal(manifest.title,'Workmode');
  assert.equal(manifest.name,'workstation');
  assert.equal(manifest.commands.find(c=>c.name==='workstation')?.title,'Workmode');
  assert.equal(manifest.commands.find(c=>c.name==='check')?.title,'Check Workmode Setup');
});

test('aliases cover every app, mode, extension command and mapped window action uniquely',()=>{
  const {hotkeys,aliases}=buildKeymap(config);
  assert.equal(new Set(aliases.map(a=>a.alias)).size,aliases.length);
  assert.ok(aliases.every(a=>/^[a-z0-9]{2,4}$/.test(a.alias)));
  assert.equal(aliases.find(a=>a.commandId==='dock-default')?.alias,'dff');
  for(const a of config.apps)assert.equal(aliases.filter(x=>x.bundleId===a.bundleId).length,1);
  const manifest=JSON.parse(readFileSync(new URL('../extensions/raycast-workstation/package.json',import.meta.url)));
  for(const c of manifest.commands)assert.equal(aliases.filter(a=>a.commandId===c.name).length,1);
  for(const h of hotkeys.filter(h=>h.owner==='Window Management'))assert.equal(aliases.filter(a=>a.owner===h.owner&&a.command===h.command).length,1);
  assert.equal(aliases.find(a=>a.commandId==='dock')?.alias,'df');
  assert.equal(aliases.find(a=>a.commandId==='focus')?.alias,'fs');
  assert.equal(aliases.find(a=>a.command==='First Two Thirds')?.alias,'w23l');
  const invalid=structuredClone(config);invalid.apps[0].id='unmapped-app';
  assert.throws(()=>buildKeymap(invalid),/Invalid or missing alias/);
  const duplicate=structuredClone(config);duplicate.modes[0].id=duplicate.modes[1].id;
  assert.throws(()=>buildKeymap(duplicate),/Duplicate alias/);
});

test('direct layout and focus aliases select the matching mode through a preview',()=>{
  const {aliases}=buildKeymap(config);
  const expected={wff:'layout-default',wwo:'layout-work',wco:'layout-code',wau:'layout-author',wde:'layout-design',win:'layout-innovate',wvi:'layout-video',wze:'layout-zen',fwo:'focus-work',fco:'focus-code',fau:'focus-author',fde:'focus-design',fin:'focus-innovate',fvi:'focus-video',fze:'focus-zen'};
  const manifest=JSON.parse(readFileSync(new URL('../extensions/raycast-workstation/package.json',import.meta.url)));
  for(const [alias,id] of Object.entries(expected)) {
    assert.equal(aliases.find(a=>a.alias===alias)?.commandId,id);
    assert.equal(manifest.commands.find(c=>c.name===id)?.mode,'view');
    const source=readFileSync(new URL(`../extensions/raycast-workstation/src/${id}.tsx`,import.meta.url),'utf8');
    assert.ok(source.includes(`modeId="${id.replace(/^(layout|focus)-/,'')}"`));
    assert.ok(source.includes(`kind="${id.startsWith('layout')?'layouts':'focus'}"`));
  }
  assert.ok(!aliases.some(a=>a.commandId==='focus-default'));
});

test('focus commands share a valid dedicated icon distinct from the extension icon',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../extensions/raycast-workstation/package.json',import.meta.url)));
  const focus=manifest.commands.filter(c=>c.name==='focus'||c.name.startsWith('focus-'));
  assert.equal(focus.length,8);
  for(const command of focus)assert.equal(command.icon,'focus.png');
  assert.notEqual(manifest.icon,focus[0].icon);
  const png=readFileSync(new URL('../extensions/raycast-workstation/assets/focus.png',import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),png.readUInt32BE(20));
});

test('T3 Code is absent from layouts and focus commands',()=>{
  const modes=config.modes;
  assert.ok(!modes.some(m=>m.placements.some(p=>p.app==='t3code')));
  assert.ok(!buildKeymap(config).aliases.some(a=>a.alias==='ft3'));
  const bundled=JSON.parse(readFileSync(new URL('../extensions/raycast-workstation/assets/workstation.json',import.meta.url)));
  assert.deepEqual(bundled,config);
});

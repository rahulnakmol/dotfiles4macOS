import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configSchema} from './core.ts';
import {currentSpace,desktopRoles,modeNeeds,unassignedDesktops} from './setup-model.ts';
const config=configSchema.parse(JSON.parse(readFileSync(new URL('../assets/workstation.json',import.meta.url),'utf8')));
const space=(id:string,active=true)=>({id,active,type:'User',screenId:'Laptop'});
test('layout menu identifies incomplete setup before attempting to arrange',()=>{
  const c=structuredClone(config);c.desktopIds={'1':'home'};
  const innovate=c.modes.find(m=>m.id==='innovate')!;
  assert.deepEqual(unassignedDesktops(c,innovate),[2,3,4]);
  c.desktopIds={'1':'home','2':'connect','3':'create','4':'focus'};
  assert.deepEqual(unassignedDesktops(c,innovate),[]);
});
test('named desktop roles preserve numbered assignments and explain their purpose',()=>{
  assert.deepEqual(desktopRoles.map(r=>[r.number,r.name]),[[1,'Home'],[2,'Connect'],[3,'Create'],[4,'Focus']]);
  assert.ok(desktopRoles.every(r=>r.description.length>0));
});
test('single active Space resolves without exposing or asking for IDs',()=>assert.equal(currentSpace([space('opaque-a'),space('opaque-b',false)]).id,'opaque-a'));
test('multiple displays resolve from focused app instead of first active flag',()=>assert.equal(currentSpace([space('a'),space('b')],'b').id,'b'));
test('ambiguous or fullscreen-only context requires a retry',()=>{
  assert.throws(()=>currentSpace([space('a'),space('b')]));
  assert.throws(()=>currentSpace([{...space('full'),type:'FullScreen'}]));
});
test('readiness explains missing apps, assignments and presets separately',()=>{
  const video=config.modes.find(m=>m.id==='video')!;
  const needs=modeNeeds(config,video,new Set(),[], '');
  assert.ok(needs.includes('Install Final Cut Pro'));
  assert.ok(needs.includes('Assign Desktop 3'));
  assert.ok(needs.some(n=>n.includes('6. Video')));
});
test('ready modes have all required apps, live assignments and a unique preset',()=>{
  const c=structuredClone(config);const m=c.modes.find(m=>m.id==='work')!;
  c.desktopIds={'2':'b','3':'c'};
  const apps=new Set(c.apps.map(a=>a.bundleId));
  assert.deepEqual(modeNeeds(c,m,apps,[space('b'),space('c')],'- 1. Work (ID: 2)'),[]);
  assert.ok(modeNeeds(c,m,apps,[space('b')],'- 1. Work (ID: 2)').includes('Assign Desktop 3'));
});

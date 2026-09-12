import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configSchema} from './core.ts';
import {selectModes} from './mode-selection.ts';
const config=configSchema.parse(JSON.parse(readFileSync(new URL('../assets/workstation.json',import.meta.url),'utf8')));
test('direct commands select exactly their mode',()=>{
  const original=structuredClone(config);
  for(const mode of config.modes) {
    assert.deepEqual(selectModes(config,'layouts',mode.id),[mode]);
    if(mode.minutes)assert.deepEqual(selectModes(config,'focus',mode.id),[mode]);
  }
  assert.deepEqual(config,original);
});
test('unknown modes and untimed focus fail instead of selecting another mode',()=>{
  assert.throws(()=>selectModes(config,'layouts','missing'),/Unknown mode/);
  assert.throws(()=>selectModes(config,'focus','default'),/no focus session/);
});
test('general menu retains all eight modes',()=>{
  assert.deepEqual(selectModes(config,'layouts'),config.modes);
});

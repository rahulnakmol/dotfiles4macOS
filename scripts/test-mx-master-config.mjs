import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildKarabiner } from './build-hyper-config.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const config = read('../karabiner/.config/karabiner/karabiner.json');
const profile = config.profiles.find((item) => item.selected);
const rule = profile.complex_modifications.rules.find((item) => item.description.startsWith('MX Master:'));
const mouse = { vendor_id: 1133, product_id: 45108, is_pointing_device: true };

// Evaluate the device/app conditions against representative foreground contexts.
const output = (button, app, device = mouse) => rule.manipulators.find((item) =>
  item.from.pointing_button === button && item.conditions.every((condition) => {
    if (condition.type === 'device_if') return condition.identifiers.some((id) =>
      Object.entries(id).every(([key, value]) => device[key] === value));
    const matches = condition.bundle_identifiers.some((pattern) => new RegExp(pattern).test(app));
    return condition.type === 'frontmost_application_if' ? matches : !matches;
  }))?.to;

test('installed browsers and Finder receive single back/forward shortcuts', () => {
  for (const app of ['com.apple.Safari', 'com.google.Chrome', 'com.microsoft.edgemac', 'com.apple.finder']) {
    assert.deepEqual(output('button4', app), [{ key_code: 'open_bracket', modifiers: ['left_command'], repeat: false }]);
    assert.deepEqual(output('button5', app), [{ key_code: 'close_bracket', modifiers: ['left_command'], repeat: false }]);
  }
});

test('other apps get held Meh on forward and retain their original back button', () => {
  for (const app of ['com.openai.codex', 'com.mitchellh.ghostty', 'com.apple.Safari.fake', '']) {
    assert.deepEqual(output('button5', app), [{ key_code: 'left_option', modifiers: ['left_control', 'left_shift'] }]);
    assert.equal(output('button4', app), undefined);
  }
});

test('thumb supplies held Hyper everywhere without tap or delayed actions', () => {
  for (const app of ['com.apple.finder', 'com.google.Chrome', 'com.openai.codex', '']) {
    assert.deepEqual(output('button6', app), [{ key_code: 'left_shift', modifiers: ['left_control', 'left_option', 'left_command'] }]);
  }
  for (const item of rule.manipulators) {
    assert.equal(item.type, 'basic');
    assert.deepEqual(item.from.modifiers, { optional: ['any'] });
    assert.equal(item.to_if_alone, undefined);
    assert.equal(item.to_after_key_up, undefined);
  }
});

test('other mice and ordinary click buttons are unaffected', () => {
  for (const button of ['button4', 'button5', 'button6']) {
    assert.equal(output(button, 'com.google.Chrome', { ...mouse, product_id: 1 }), undefined);
    assert.equal(output(button, 'com.openai.codex', { ...mouse, vendor_id: 1 }), undefined);
  }
  for (const button of ['button1', 'button2', 'button3']) assert.equal(output(button, 'com.apple.finder'), undefined);
  assert.ok(profile.devices.some((item) => !item.ignore && item.identifiers.product_id === mouse.product_id));
});

test('regenerating the keyboard setup preserves the mouse mappings', () => {
  assert.deepEqual(buildKarabiner(config, read('./hyper-config.json')), config);
});

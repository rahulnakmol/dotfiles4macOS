import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import test from 'node:test';
import { buildKarabiner, buildRectangle, buildWorkflow, buildDockflow } from './build-hyper-config.mjs';

import { desktopShortcuts } from './setup-hyper-macos.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = (path) => JSON.parse(readFileSync(root + path));
const plist = (path) => JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', root + path]));
const wf = 'alfred/.config/alfred/Alfred.alfredpreferences/workflows/';
const config = json('scripts/hyper-config.json');
const karabiner = json('karabiner/.config/karabiner/karabiner.json');
const rectangle = json('rectangle-pro/.config/rectangle-pro/RectangleProConfig.json');
const dockflow = plist(wf + 'user.workflow.dockflow-profiles/info.plist');
const workflow = buildWorkflow(config, dockflow);

test('Right Option supplies Meh without changing Left Option; DockFlow stays off Hyper', () => {
  const mappings = karabiner.profiles[0].complex_modifications.rules.flatMap((r) => r.manipulators);
  const meh = mappings.filter((m) => m.from.key_code === 'right_option');
  assert.equal(meh.length, 1);
  assert.deepEqual(new Set([meh[0].to[0].key_code, ...meh[0].to[0].modifiers]), new Set(['left_control', 'left_option', 'left_shift']));
  assert.ok(!mappings.some((m) => m.from.key_code === 'left_option'));
  const hotkeys = dockflow.objects.filter((o) => o.type === 'alfred.workflow.trigger.hotkey');
  assert.equal(hotkeys.length, 7);
  assert.ok(hotkeys.every((o) => o.config.hotmod === 917504));
  const old = structuredClone(dockflow);
  old.objects.filter((o) => o.type === 'alfred.workflow.trigger.hotkey').forEach((o) => { o.config.hotmod = 1966080; });
  assert.deepEqual(buildDockflow(old), dockflow);
  assert.deepEqual(buildDockflow(dockflow), dockflow);
  assert.deepEqual(buildKarabiner(buildKarabiner(karabiner, config), config), karabiner);
});

test('Hyper numbers translate to native direct desktop shortcuts with no DockFlow side effects', () => {
  const mappings = karabiner.profiles[0].complex_modifications.rules.flatMap((r) => r.manipulators);
  const desired = desktopShortcuts();
  const keyCodes = { '1':18, '2':19, '3':20, '4':21, '5':23, '6':22, '7':26, '8':28, '9':25, '0':29 };
  for (const [index, key] of [...'1234567890'].entries()) {
    const matches = mappings.filter((m) => m.from.key_code === key);
    assert.equal(matches.length, 1);
    assert.deepEqual(matches[0].to, [{ key_code:key, modifiers:['left_control','left_option'], repeat:false }]);
    assert.deepEqual(new Set(matches[0].from.modifiers.mandatory), new Set(['control','option','shift','command']));
    assert.deepEqual(desired[String(118 + index)], { enabled:true, value:{ parameters:[65535,keyCodes[key],786432], type:'standard' } });
  }
  assert.equal(Object.keys(desired).length, 10);
});

test('global Hyper keys have one owner and preserve Codex app bindings', () => {
  const codeNames = { 18:'1', 19:'2', 20:'3', 21:'4', 23:'5', 25:'9', 29:'0', 33:'open_bracket', 30:'close_bracket', 42:'backslash', 41:'semicolon', 39:'quote', 22:'6', 26:'7', 28:'8', 123:'left_arrow', 124:'right_arrow', 49:'spacebar', 44:'slash', 27:'hyphen', 24:'equal_sign' };
  const keys = new Map();
  const reserve = (key, owner) => { assert.ok(key); assert.ok(!keys.has(key), `${key}: ${owner} conflicts with ${keys.get(key)}`); keys.set(key, owner); };
  for (const rule of karabiner.profiles[0].complex_modifications.rules.slice(1)) {
    for (const m of rule.manipulators) {
      if (m.from.modifiers?.mandatory?.length === 4) reserve(m.from.key_code, 'Karabiner');
    }
  }
  for (const [name, binding] of Object.entries(rectangle.shortcuts)) {
    if (binding.modifierFlags === 1966080) reserve(codeNames[binding.keyCode], `Rectangle ${name}`);
  }
  for (const data of [dockflow, workflow.plist]) {
    for (const o of data.objects.filter((o) => o.type === 'alfred.workflow.trigger.hotkey')) {
      if (o.config.hotmod === 1966080) reserve(codeNames[o.config.hotkey], data.name);
    }
  }
  for (const b of json('codex/.codex/keybindings.json')) {
    if (b.key?.startsWith('Command+Control+Alt+Shift+')) assert.ok(!keys.has(b.key.split('+').at(-1).toLowerCase()));
  }
});

test('all daily apps use native portable launch/focus and never send shell input', () => {
  const launches = karabiner.profiles[0].complex_modifications.rules.find((r) => r.description === 'Hyper: launch or focus apps').manipulators;
  assert.equal(new Set(config.apps.map((a) => a.bundleId)).size, 18);
  assert.equal(launches.length, 18, 'No app aliases, including the former Ghostty Return alias');
  assert.deepEqual(Object.fromEntries(config.apps.map((a) => [a.id, a.key])), {
    chrome:'d', ghostty:'h', finder:'f', codex:'j', cursor:'k', claude:'l', amp:'a',
    obsidian:'n', edge:'e', teams:'i', slack:'s', word:'w', excel:'o', powerpoint:'p',
    safari:'r', finalcut:'z', motion:'x', compressor:'c',
  });
  for (const app of config.apps) {
    const matches = launches.filter((m) => m.to[0]?.software_function?.open_application?.bundle_identifier === app.bundleId);
    assert.equal(matches.length, 1, `${app.name} must have exactly one direct Hyper key`);
    const m = matches[0];
    assert.equal(m.from.key_code, app.key);
    assert.deepEqual(m.to, [{ software_function: { open_application: { bundle_identifier: app.bundleId } }, repeat: false }]);
    assert.match(app.bundleId, /^[a-zA-Z0-9.-]+$/);
  }
  assert.ok(!JSON.stringify(karabiner).includes('shell_command'));
  assert.deepEqual(buildKarabiner(karabiner, config), karabiner);
});

test('window aliases resolve to existing native Rectangle shortcuts', () => {
  const aliases = karabiner.profiles[0].complex_modifications.rules.find((r) => r.description === 'Hyper: size windows and change displays').manipulators;
  const outputs = { return_or_enter:['maximize','return_or_enter'], delete_or_backspace:['restore','delete_or_backspace'], comma:['leftHalf','left_arrow'], period:['rightHalf','right_arrow'], left_arrow:['previousDisplay','left_arrow'], right_arrow:['nextDisplay','right_arrow'] };
  const codeNames = { 36:'return_or_enter', 51:'delete_or_backspace', 41:'semicolon', 39:'quote', 22:'6', 26:'7', 28:'8', 123:'left_arrow', 124:'right_arrow' };
  const flags = { left_control:262144, left_option:524288, left_command:1048576 };
  for (const m of aliases) {
    const [name, key] = outputs[m.from.key_code];
    assert.equal(m.to[0].key_code, key);
    assert.equal(codeNames[rectangle.shortcuts[name].keyCode], key);
    assert.equal(m.to[0].modifiers.reduce((sum, v) => sum + flags[v], 0), rectangle.shortcuts[name].modifierFlags);
  }
});

test('portable layouts omit captured titles, pixel frames, Space IDs and destructive behavior', () => {
  const layouts = JSON.parse(rectangle.defaults.appSpecs.string);
  assert.equal(layouts.length, 16);
  assert.deepEqual(layouts.map((l) => l.name), config.layouts.map((l) => l.name));
  const ids = [];
  for (const l of layouts) {
    ids.push(l.id);
    assert.deepEqual(Object.keys(l).sort(), ['bringToFront','children',...(l.name === 'Default' ? ['frontmost'] : []),'id','isGroup','launchApps','loc','name'].sort());
    for (const w of l.children) {
      ids.push(w.id);
      assert.deepEqual(Object.keys(w).sort(), [...(l.name === 'Default' ? [] : ['bundleId']),'display','id','loc','titleMatching','windowAction'].sort());
      assert.equal(w.display, 0);
      assert.equal(w.titleMatching, 1);
    }
  }
  assert.equal(new Set(ids).size, ids.length);
  for (const name of ['Work','Code']) assert.deepEqual(layouts.find((l) => l.name === name).children.map((c) => c.windowAction), [21,24]);
  for (const name of ['Work Balanced','Code Balanced','Office']) assert.deepEqual(layouts.find((l) => l.name === name).children.map((c) => c.windowAction), [0,1]);
  for (const name of ['Agents','Zen']) assert.equal(layouts.find((l) => l.name === name).launchApps, false);
  assert.equal(layouts.find((l) => l.name === 'Default').frontmost, true);
  assert.deepEqual(buildRectangle(rectangle, config), rectangle);
});

test('all menu items dispatch known actions; shell-looking and empty queries are rejected', () => {
  const script = root + wf + 'user.workflow.hyper/dispatch.zsh';
  const items = workflow.plist.objects.filter((o) => o.type === 'alfred.workflow.input.listfilter').flatMap((o) => JSON.parse(o.config.items));
  for (const item of items.filter((i) => !config.systemTools.some((t) => t.query === i.arg))) {
    const r = spawnSync('zsh', [script, item.arg], { env: { ...process.env, HYPER_DRY_RUN:'1' }, encoding:'utf8' });
    assert.equal(r.status, 0, item.arg + ': ' + r.stderr);
    assert.ok(r.stdout.length);
    if (item.arg.startsWith('app:')) assert.match(r.stdout, /^-b\n[a-zA-Z0-9.-]+\n$/);
    if (item.arg.startsWith('layout:')) assert.ok(r.stdout.includes('rectangle-pro://execute-layout?name='));
  }
  for (const arg of ['', 'layout:Missing', 'app:$(touch /tmp/should-not-exist)', 'guide; echo injected']) {
    const r = spawnSync('zsh', [script, arg], { env: { ...process.env, HYPER_DRY_RUN:'1' }, encoding:'utf8' });
    assert.equal(r.status, 64);
    assert.equal(r.stdout, '');
  }
});

test('native workflow graph is connected and each hotkey reaches a valid action', () => {
  const data = workflow.plist;
  const objects = new Map(data.objects.map((o) => [o.uid, o]));
  assert.equal(objects.size, data.objects.length);
  for (const o of data.objects) {
    if (['dispatch','show-tool','focus-result'].includes(o.uid)) continue;
    const edges = data.connections[o.uid];
    assert.equal(edges.length, 1);
    assert.ok(objects.has(edges[0].destinationuid));
  }
  assert.equal(data.connections['menu-hotkey'][0].destinationuid, 'menu');
  assert.deepEqual(data.objects.filter((o) => o.type === 'alfred.workflow.input.listfilter').map((o) => o.config.keyword), ['hyper','focus','work','code','zen','default','capture','tools','layouts']);
  assert.equal(data.createdby, 'Rahul N Akmol');
});

test('generated files are current and only owned workflow source is Git-allowlisted', () => {
  execFileSync('node', ['scripts/build-hyper-config.mjs','--check'], { cwd:root });
  for (const file of ['info.plist','dispatch.zsh','guide.html','icon.png']) {
    assert.equal(spawnSync('git', ['check-ignore','--no-index','-q',wf+'user.workflow.hyper/'+file], { cwd:root }).status, 1);
  }
  assert.equal(spawnSync('git', ['check-ignore','--no-index','-q',wf+'user.workflow.hyper/prefs.plist'], { cwd:root }).status, 0);
});

test('offline guide contains the current map, valid section links and parseable interactions', () => {
  execFileSync('node', ['scripts/render-hyper-guide.mjs','--check'], { cwd:root });
  const html = readFileSync(root + wf + 'user.workflow.hyper/guide.html', 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), target);
  for (const item of [...config.apps, ...config.layouts]) assert.ok(html.includes(item.name), item.name);
  assert.ok(!/<(?:script|img)[^>]+src=|<link[^>]+href=/i.test(html), 'Guide should work without external assets');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  assert.ok(html.includes('physical'));
  assert.ok(html.endsWith('</body></html>'));
});


test('punctuation owns fractions and former desktop aliases do not intercept them', () => {
  const expected = { firstThird:33, centerThird:30, lastThird:42, firstTwoThirds:41, lastTwoThirds:39 };
  for (const [name, code] of Object.entries(expected)) {
    assert.deepEqual(rectangle.shortcuts[name], { keyCode:code, modifierFlags:1966080 });
  }
  const mappings = karabiner.profiles[0].complex_modifications.rules.flatMap((r) => r.manipulators);
  assert.ok(!mappings.some((m) => ['open_bracket','close_bracket','backslash'].includes(m.from.key_code)));
  assert.ok(!config.navigation.some((n) => n.key.includes('[')));
  const legacy = structuredClone(rectangle);
  legacy.shortcuts.firstThird.keyCode = 32;
  legacy.shortcuts.centerThird.keyCode = 34;
  legacy.shortcuts.lastThird.keyCode = 31;
  assert.deepEqual(buildRectangle(legacy, config), rectangle);
  assert.ok(workflow.plist.readme.includes('Control+Left/Right'));
  assert.ok(!workflow.plist.readme.includes('Hyper+U/I/O'));
});

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = 'alfred/.config/alfred/Alfred.alfredpreferences';
const workflow = `${bundle}/workflows/user.workflow.google-workspace/info.plist`;
const rectangleConfig = 'rectangle-pro/.config/rectangle-pro/RectangleProConfig.json';

test('Rectangle import has native metadata, startup enabled and drag snapping disabled', () => {
  const config = JSON.parse(readFileSync(join(root, rectangleConfig), 'utf8'));
  assert.equal(config.bundleId, 'com.knollsoft.Hookshot');
  assert.ok(config.version);
  assert.ok(config.timestamp);
  assert.deepEqual(config.defaults.launchOnLogin, { bool: true });
  assert.deepEqual(config.defaults.windowSnapping, { int: 2 });
  assert.ok(config.defaults.appSpecs.string);
  assert.deepEqual(Object.keys(config).sort(), ['bundleId', 'defaults', 'shortcuts', 'timestamp', 'version']);
});

test('Rectangle Hyper shortcuts reserve desktop numbers and avoid Codex Hyper bindings', () => {
  const config = JSON.parse(readFileSync(join(root, rectangleConfig), 'utf8'));
  const expected = {
    firstThird: 33, centerThird: 30, lastThird: 42,
    firstTwoThirds: 41, lastTwoThirds: 39,
  };
  const hyper = Object.entries(config.shortcuts).filter(([, value]) => value.modifierFlags === 1966080);
  assert.equal(hyper.length, 5);
  for (const [name, keyCode] of Object.entries(expected)) {
    assert.deepEqual(config.shortcuts[name], { keyCode, modifierFlags: 1966080 });
  }
  const numberKeyCodes = new Set([18, 19, 20, 21, 23, 22, 26, 28, 25, 29]);
  for (const [, shortcut] of hyper) assert.ok(!numberKeyCodes.has(shortcut.keyCode));
  const codex = JSON.parse(readFileSync(join(root, 'codex/.codex/keybindings.json'), 'utf8'));
  const reserved = new Set(codex.filter((binding) => binding.key?.startsWith('Command+Control+Alt+Shift+'))
    .map((binding) => binding.key.split('+').at(-1).toUpperCase()));
  for (const key of ['[', ']', '\\', ';', "'"]) assert.ok(!reserved.has(key));
});

test('inventory accounts for every installed plugin and retains command identifiers', () => {
  const inventory = JSON.parse(readFileSync(join(root, 'docs/raycast-extensions.json'), 'utf8'));
  assert.equal(inventory.extensions.length, 23);
  assert.equal(new Set(inventory.extensions.map((entry) => entry.name)).size, 23);
  for (const entry of inventory.extensions) {
    assert.deepEqual(Object.keys(entry).sort(), ['commands', 'name', 'title']);
    assert.ok(entry.commands.length > 0);
    assert.equal(new Set(entry.commands.map((command) => command.name)).size, entry.commands.length);
    for (const command of entry.commands) {
      assert.deepEqual(Object.keys(command).sort(), ['name', 'title']);
    }
  }
});

test('Caps Lock retains all four Hyper modifiers and tap Escape alongside navigation', () => {
  const config = JSON.parse(readFileSync(join(root, 'karabiner/.config/karabiner/karabiner.json')));
  assert.equal(config.profiles.length, 1);
  assert.equal(config.profiles[0].name, 'Hyperland');
  assert.equal(config.profiles[0].selected, true);
  assert.equal(config.profiles[0].virtual_hid_keyboard.keyboard_type_v2, 'ansi');
  const rules = config.profiles[0].complex_modifications.rules;
  assert.equal(rules.length, 5);
  assert.equal(rules[0].manipulators.length, 1);
  const mapping = rules[0].manipulators[0];
  assert.equal(mapping.from.key_code, 'caps_lock');
  assert.deepEqual(mapping.to_if_alone, [{ key_code: 'escape' }]);
  assert.deepEqual(new Set([mapping.to[0].key_code, ...mapping.to[0].modifiers]),
    new Set(['left_shift', 'left_control', 'left_option', 'left_command']));
  assert.equal(mapping.to.length, 1);
  assert.equal(mapping.to[0].shell_command, undefined);
});

test('native Google workflow has five connected keywords with fixed vendor destinations',
  { skip: process.platform !== 'darwin' }, () => {
    const data = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', join(root, workflow)]));
    const expected = new Map([
      ['gdoc', 'https://docs.new'], ['gsheet', 'https://sheets.new'],
      ['gslides', 'https://slides.new'], ['gform', 'https://forms.new'],
      ['gdrive', 'https://drive.google.com/'],
    ]);
    assert.equal(data.objects.length, 10);
    const keywords = data.objects.filter((object) => object.type === 'alfred.workflow.input.keyword');
    assert.equal(keywords.length, 5);
    assert.equal(new Set(keywords.map((object) => object.config.keyword)).size, 5);
    for (const keyword of keywords) {
      assert.equal(keyword.config.argumenttype, 2);
      const connections = data.connections[keyword.uid];
      assert.equal(connections.length, 1);
      const action = data.objects.find((object) => object.uid === connections[0].destinationuid);
      assert.equal(action.type, 'alfred.workflow.action.openurl');
      assert.equal(action.config.url, expected.get(keyword.config.keyword));
      assert.equal(action.config.browser, '');
    }
  });

test('Git ignores new private Alfred state and third-party workflows by default', () => {
  for (const path of [
    `${bundle}/preferences/local/mac/prefs.plist`, `${bundle}/snippets/personal.json`,
    `${bundle}/workflows/user.workflow.external/info.plist`,
    `${bundle}/workflows/user.workflow.google-workspace/prefs.plist`,
    `${bundle}/workflows/user.workflow.dockflow-profiles/prefs.plist`,
    'alfred/.config/alfred/license.dat', 'private-backup.rayconfig',
  ]) {
    const result = spawnSync('git', ['check-ignore', '--no-index', '-q', path], { cwd: root });
    assert.equal(result.status, 0, `Not ignored: ${path}`);
  }
  assert.equal(spawnSync('git', ['check-ignore', '--no-index', '-q', workflow], { cwd: root }).status, 1);
});

test('DockFlow keywords and Meh numbers target the same seven integration links',
  { skip: process.platform !== 'darwin' }, () => {
    const path = join(root, bundle, 'workflows/user.workflow.dockflow-profiles/info.plist');
    const data = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', path]));
    const expected = [
      ['default', 'ddef', '0', 29, '68FBB9EF-7C52-46B1-9483-E0A6F625ED1E'],
      ['work', 'dwork', '1', 18, '01BAE638-6C40-47C3-A97D-F52F4CB3A9A3'],
      ['code', 'dcode', '2', 19, 'D405D7FD-6999-4EC7-8428-7E361C0D51A2'],
      ['author', 'dauthor', '3', 20, '843F75F4-4CF2-46DB-92B8-EB2F5A4DCB80'],
      ['create', 'dcreate', '4', 21, '36DE5127-17EC-4F8E-BA5B-D4091B34062E'],
      ['video', 'dvideo', '5', 23, 'FAFBC05C-3C0D-496D-B660-A015E77EF8DF'],
      ['zen', 'dzen', '9', 25, '48FF680F-04C9-4EC1-8E23-2E6BC88A3702'],
    ];
    assert.equal(data.disabled, false);
    assert.equal(data.objects.length, 21);
    assert.equal(new Set(data.objects.map((object) => object.uid)).size, 21);
    for (const [name, keyword, key, keyCode, presetId] of expected) {
      const input = data.objects.find((object) => object.uid === `${name}-input`);
      const hotkey = data.objects.find((object) => object.uid === `${name}-hotkey`);
      const action = data.objects.find((object) => object.uid === `${name}-open`);
      assert.equal(input.type, 'alfred.workflow.input.keyword');
      assert.equal(input.config.keyword, keyword);
      assert.equal(input.config.argumenttype, 2);
      assert.equal(hotkey.type, 'alfred.workflow.trigger.hotkey');
      assert.equal(hotkey.config.hotkey, keyCode);
      assert.equal(hotkey.config.hotmod, 917504);
      assert.equal(hotkey.config.hotstring, key);
      assert.equal(hotkey.config.action, 0);
      assert.equal(hotkey.config.argument, 0);
      assert.equal(action.type, 'alfred.workflow.action.openurl');
      assert.equal(action.config.url, `dockflow://switch?id=${presetId}`);
      assert.equal(action.config.browser, '');
      for (const trigger of [input, hotkey]) {
        assert.equal(data.connections[trigger.uid].length, 1);
        assert.equal(data.connections[trigger.uid][0].destinationuid, action.uid);
      }
    }
  });

test('owned workflows include the requested author and tracked PNG icons',
  { skip: process.platform !== 'darwin' }, () => {
    for (const name of ['google-workspace', 'dockflow-profiles', 'hyper']) {
      const folder = `${bundle}/workflows/user.workflow.${name}`;
      const data = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', join(root, folder, 'info.plist')]));
      assert.equal(data.createdby, 'Rahul N Akmol');
      for (const heading of ['## Usage', '## Examples', '## Setup', '## Customisation', '## Troubleshooting', '## Saved configuration']) {
        assert.ok(data.readme.includes(heading), `${name}: missing ${heading}`);
      }
      for (const input of data.objects.filter((object) => object.type === 'alfred.workflow.input.keyword')) {
        assert.ok(data.readme.includes(`\`${input.config.keyword}\``), `${name}: undocumented keyword`);
      }
      const icon = readFileSync(join(root, folder, 'icon.png'));
      assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.ok(icon.readUInt32BE(16) >= 128);
      assert.ok(icon.readUInt32BE(20) >= 128);
      for (const file of ['info.plist', 'icon.png']) {
        assert.equal(spawnSync('git', ['check-ignore', '--no-index', '-q', `${folder}/${file}`], { cwd: root }).status, 1);
      }
    }
  });

test('Stow creates reload-compatible directory links and unstows without deleting source', () => {
  const target = mkdtempSync(join(tmpdir(), 'dotfiles-launcher-'));
  try {
    mkdirSync(join(target, '.config'));
    for (const module of ['alfred', 'karabiner', 'rectangle-pro']) {
      execFileSync('stow', ['--dir', root, '--target', target, module]);
      assert.equal(realpathSync(join(target, '.config', module)), realpathSync(join(root, module, '.config', module)));
      execFileSync('stow', ['--dir', root, '--target', target, '--delete', module]);
      assert.ok(realpathSync(join(root, module, '.config', module)));
    }
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('third-party catalog records Gallery sources and keeps runtime folders ignored', () => {
  const catalog = JSON.parse(readFileSync(join(root, 'docs/alfred-workflows.json'), 'utf8'));
  assert.equal(catalog.workflows.length, 17);
  assert.equal(new Set(catalog.workflows.map((entry) => entry.bundleId)).size, 17);
  for (const entry of catalog.workflows) {
    assert.equal(new URL(entry.galleryUrl).origin, 'https://alfred.app');
    assert.ok(entry.version);
    if (entry.alreadyInstalled) continue;
    assert.match(entry.downloadSha256, /^[a-f0-9]{64}$/);
    assert.equal(new URL(entry.downloadUrl).origin, 'https://alfred.app');
    assert.match(entry.folder, /^user\.workflow\.[a-z0-9-]+$/);
    for (const file of ['info.plist', 'prefs.plist']) {
      assert.equal(spawnSync('git', ['check-ignore', '--no-index', '-q', `${bundle}/workflows/${entry.folder}/${file}`], { cwd: root }).status, 0);
    }
    for (const key of Object.keys(entry.defaults)) {
      assert.ok(['github_username', 'local_repo_folder', 'show_results', 'output_language', 'input_language'].includes(key));
    }
  }
});

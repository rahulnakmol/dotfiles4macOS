import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { codexArtifacts } from './codex-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('Codex inherits ordinary defaults and reserves Hyper for voice, dictation and the pet', () => {
  const bindings = JSON.parse(fs.readFileSync(path.join(root, 'codex/.codex/keybindings.json'), 'utf8'));
  const active = bindings.filter((b) => b.key !== null);
  assert.deepEqual(new Set(active.map((b) => b.command)), new Set(['composer.startVoiceMode', 'composer.startDictation', 'openAvatarOverlay']));
  for (const [command, defaultKey, hyperKey] of [
    ['composer.startVoiceMode', 'Ctrl+Shift+V', 'Command+Control+Alt+Shift+V'],
    ['composer.startDictation', 'Ctrl+Shift+D', 'Command+Control+Alt+Shift+M'],
  ]) {
    assert.deepEqual(new Set(active.filter((b) => b.command === command).map((b) => b.key)), new Set([defaultKey, hyperKey]));
  }
  // Omitting ordinary commands restores defaults; null would disable them.
  assert.ok(bindings.filter((b) => b.key === null).every((b) => ['globalDictationHold', 'globalDictationToggle'].includes(b.command)));
  assert.deepEqual(active.filter(b=>b.command==='openAvatarOverlay'),[{command:'openAvatarOverlay',key:'Command+Control+Alt+Shift+B'}], 'OS-global pet command supports exactly one binding');
  assert.equal(active.length, 5);
});

test('desktop keybindings have valid entries without conflicting accelerators', () => {
  const bindings = JSON.parse(fs.readFileSync(path.join(root, 'codex/.codex/keybindings.json'), 'utf8'));
  assert.ok(Array.isArray(bindings));
  const accelerators = new Set();
  const commands = new Map();
  const aliases = {cmd: 'meta', command: 'meta', cmdorctrl: 'meta', control: 'ctrl', option: 'alt'};
  for (const binding of bindings) {
    assert.deepEqual(Object.keys(binding).sort(), ['command', 'key']);
    assert.equal(typeof binding.command, 'string');
    assert.ok(binding.command.length > 0);
    assert.ok(binding.key === null || (typeof binding.key === 'string' && binding.key.trim().length > 0));
    const keys = commands.get(binding.command) ?? [];
    keys.push(binding.key);
    commands.set(binding.command, keys);
    if (binding.key === null) continue;
    const canonical = binding.key.toLowerCase().split('+').map(key => aliases[key] ?? key).sort().join('+');
    assert.ok(!accelerators.has(canonical), `Duplicate accelerator: ${binding.key}`);
    accelerators.add(canonical);
  }
  for (const [command, keys] of commands) {
    assert.ok(!keys.includes(null) || keys.length === 1, `Disabled command also has bindings: ${command}`);
  }
});
test('reviewed common Codex settings and policy stay in parity across both homes', () => {
  const subscription = fs.readFileSync(path.join(root, 'codex/.codex/config.toml'), 'utf8');
  const gateway = fs.readFileSync(path.join(root, 'scripts/templates/codex-aigateway-config.toml'), 'utf8');
  for (const setting of ['model_reasoning_effort', 'model_reasoning_summary', 'model_verbosity', 'service_tier', 'web_search', 'approval_policy', 'default_permissions']) {
    const pattern = new RegExp(`^${setting} = (.+)$`, 'm');
    assert.equal(subscription.match(pattern)?.[1], gateway.match(pattern)?.[1], setting);
  }
  const policy = text => text.slice(text.indexOf('# BEGIN GENERATED DOTFILES POLICY'));
  assert.equal(policy(subscription), policy(gateway));
  for (const denied of ['~/.codex/auth.json', '~/.codex-aigateway/auth.json', '~/.config/private-ai-gateway/client.key'])
    assert.match(policy(subscription), new RegExp(denied.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('gateway keybindings share app-local actions but disable duplicate global pet ownership', () => {
  const subscription = JSON.parse(fs.readFileSync(path.join(root, 'codex/.codex/keybindings.json'), 'utf8'));
  const gateway = JSON.parse(fs.readFileSync(path.join(root, 'codex-aigateway/.codex-aigateway/keybindings.json'), 'utf8'));
  const withoutPet = bindings => bindings.filter(binding => binding.command !== 'openAvatarOverlay');
  assert.deepEqual(withoutPet(gateway), withoutPet(subscription));
  assert.deepEqual(subscription.find(binding => binding.command === 'openAvatarOverlay'), {command:'openAvatarOverlay', key:'Command+Control+Alt+Shift+B'});
  assert.deepEqual(gateway.find(binding => binding.command === 'openAvatarOverlay'), {command:'openAvatarOverlay', key:null});
});
test('a guidance change reaches both clients and keeps its scope', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-policy-'));
  try {
    fs.cpSync(path.join(root, 'agent-policy'), path.join(fixture, 'agent-policy'), {recursive: true});
    fs.cpSync(path.join(root, 'codex'), path.join(fixture, 'codex'), {recursive: true});
    fs.cpSync(path.join(root, 'codex-aigateway'), path.join(fixture, 'codex-aigateway'), {recursive: true});
    fs.mkdirSync(path.join(fixture, 'scripts/templates'), {recursive: true});
    fs.copyFileSync(path.join(root, 'scripts/templates/codex-aigateway-config.toml'), path.join(fixture, 'scripts/templates/codex-aigateway-config.toml'));
    fs.appendFileSync(path.join(fixture, 'agent-policy/instructions/python.md'), '\nFixture: verify service boundaries.\n');
    const files = codexArtifacts(fixture);
    assert.match(files['claude/.claude/rules/python.md'], /Fixture: verify service boundaries/);
    assert.match(files['codex/.codex/AGENTS.md'], /Fixture: verify service boundaries/);
    assert.equal(files['codex/.codex/AGENTS.md'], files['codex-aigateway/.codex-aigateway/AGENTS.md']);
    assert.match(files['codex/.codex/AGENTS.md'], /Applies to: \*\*\/\*\.py/);
    fs.writeFileSync(path.join(fixture, 'agent-policy/instructions/python.md'), 'missing frontmatter');
    assert.throws(() => codexArtifacts(fixture), /Invalid stack guidance/);
  } finally { fs.rmSync(fixture, {recursive: true, force: true}); }
});
test('generated instructions fit alongside project instructions', () => {
  assert.ok(Buffer.byteLength(codexArtifacts(root)['codex/.codex/AGENTS.md']) < 24000);
});
test('all generated adapters match checked-in sources', () => {
  for (const [name, expected] of Object.entries(codexArtifacts(root))) {
    assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), expected, name);
  }
});
test('generated instructions and command rules contain no device installation paths', () => {
  const files = codexArtifacts(root);
  for (const [name, text] of Object.entries(files).filter(([name]) => name.startsWith('codex/') && !name.endsWith('.toml'))) {
    assert.doesNotMatch(text, /\/Users\/|\/Applications\//, name);
  }
});
test('policy regeneration preserves current model and runtime settings', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-policy-'));
  try {
    fs.cpSync(path.join(root, 'agent-policy'), path.join(fixture, 'agent-policy'), {recursive: true});
    fs.cpSync(path.join(root, 'codex'), path.join(fixture, 'codex'), {recursive: true});
    fs.cpSync(path.join(root, 'codex-aigateway'), path.join(fixture, 'codex-aigateway'), {recursive: true});
    fs.mkdirSync(path.join(fixture, 'scripts/templates'), {recursive: true});
    fs.copyFileSync(path.join(root, 'scripts/templates/codex-aigateway-config.toml'), path.join(fixture, 'scripts/templates/codex-aigateway-config.toml'));
    const file = path.join(fixture, 'codex/.codex/config.toml');
    const settings = fs.readFileSync(file, 'utf8').replace(/model_reasoning_effort = "[^"]*"/, 'model_reasoning_effort = "medium"');
    fs.writeFileSync(file, settings);
    const rendered = codexArtifacts(fixture)['codex/.codex/config.toml'];
    assert.match(rendered, /model_reasoning_effort = "medium"/);
    assert.equal(rendered.split('# BEGIN GENERATED DOTFILES POLICY')[0], settings.split('# BEGIN GENERATED DOTFILES POLICY')[0]);
    fs.writeFileSync(file, settings.replace('# BEGIN GENERATED DOTFILES POLICY', '# missing marker'));
    assert.throws(() => codexArtifacts(fixture), /one marked policy block/);
  } finally { fs.rmSync(fixture, {recursive: true, force: true}); }
});

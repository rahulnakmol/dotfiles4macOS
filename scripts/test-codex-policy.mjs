import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { codexArtifacts } from './codex-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('a guidance change reaches both clients and keeps its scope', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-policy-'));
  try {
    fs.cpSync(path.join(root, 'agent-policy'), path.join(fixture, 'agent-policy'), {recursive: true});
    fs.cpSync(path.join(root, 'codex'), path.join(fixture, 'codex'), {recursive: true});
    fs.appendFileSync(path.join(fixture, 'agent-policy/instructions/python.md'), '\nFixture: verify service boundaries.\n');
    const files = codexArtifacts(fixture);
    assert.match(files['claude/.claude/rules/python.md'], /Fixture: verify service boundaries/);
    assert.match(files['codex/.codex/AGENTS.md'], /Fixture: verify service boundaries/);
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

#!/usr/bin/env node
// Native Mission Control preferences. No Space IDs or window state are copied.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function desktopShortcuts() {
  // Desktop 1 was verified in System Settings: ID 118, virtual key 18. Use Control+Option to preserve Codex’s Control+1/2/3.
  const keyCodes = [18, 19, 20, 21, 23, 22, 26, 28, 25, 29];
  return Object.fromEntries(keyCodes.map((code, index) => [String(118 + index), {
    enabled: true, value: { parameters: [65535, code, 786432], type: 'standard' },
  }]));
}

const defaults = (...args) => execFileSync('/usr/bin/defaults', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const read = (domain, key) => { try { return defaults('read', domain, key).trim(); } catch { return null; } };
const readShortcuts = () => {
  if (read('com.apple.symbolichotkeys', 'AppleSymbolicHotKeys') === null) return {};
  return JSON.parse(execFileSync('/usr/bin/plutil', ['-convert', 'json', '-o', '-', '--', '-'], {
    input: defaults('export', 'com.apple.symbolichotkeys', '-'), encoding: 'utf8',
  })).AppleSymbolicHotKeys ?? {};
};

function main() {
  const mode = process.argv[2] ?? 'plan';
  if (mode === 'plan') {
    console.log('Enable Control+Option+1…9/0 for Desktop 1…10; disable automatic Space rearrangement; switch to an app’s open Space on activation.');
    console.log('Apply backs up only managed preferences and preserves other shortcuts. Create desktops in Mission Control; log out and back in after applying.');
    return;
  }
  if (!['apply', 'check'].includes(mode)) throw new Error('Usage: bash scripts/setup-hyper-macos.sh plan|apply|check');
  if (process.platform !== 'darwin') throw new Error('macOS only');
  const desired = desktopShortcuts();
  const current = readShortcuts();
  if (mode === 'apply') {
    const state = join(process.env.XDG_STATE_HOME || join(homedir(), '.local/state'), 'dotfiles/backups');
    mkdirSync(state, { recursive: true });
    const backup = mkdtempSync(join(state, 'hyper-mission-control-'));
    for (const key of ['mru-spaces', 'workspaces-auto-swoosh']) {
      writeFileSync(join(backup, key), (read('com.apple.dock', key) ?? 'unset') + '\n');
    }
    writeFileSync(join(backup, 'desktop-shortcuts.json'), JSON.stringify(Object.fromEntries(
      Object.keys(desired).map((id) => [id, current[id] ?? null]),
    ), null, 2) + '\n');
    defaults('write', 'com.apple.dock', 'mru-spaces', '-bool', 'false');
    defaults('write', 'com.apple.dock', 'workspaces-auto-swoosh', '-bool', 'true');
    for (const [id, shortcut] of Object.entries(desired)) {
      const xml = execFileSync('/usr/bin/plutil', ['-convert', 'xml1', '-o', '-', '--', '-'], { input: JSON.stringify(shortcut), encoding: 'utf8' });
      // Add one dictionary member at a time, leaving unrelated user shortcuts intact.
      defaults('write', 'com.apple.symbolichotkeys', 'AppleSymbolicHotKeys', '-dict-add', id, xml);
    }
    console.log(`Saved previous values in ${backup}`);
    console.log('Preferences saved. Log out and back in to load native desktop shortcuts. No apps or desktops were closed.');
    return;
  }
  if (read('com.apple.dock', 'mru-spaces') !== '0' || read('com.apple.dock', 'workspaces-auto-swoosh') !== '1') throw new Error('Mission Control preferences differ.');
  for (const [id, expected] of Object.entries(desired)) {
    const actual = current[id];
    if (actual?.enabled !== true || actual.value?.type !== expected.value.type || JSON.stringify(actual.value?.parameters) !== JSON.stringify(expected.value.parameters)) {
      throw new Error(`Desktop ${Number(id) - 117} shortcut differs. Run apply.`);
    }
  }
  console.log('Saved Mission Control preferences and all ten desktop shortcuts match. Live activation requires login or a native settings change.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

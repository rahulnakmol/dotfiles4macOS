import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise the real shell entry point in an isolated checkout. External tools
// record calls instead of installing software, touching Raycast or changing HOME.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'workmode setup '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'bin', 'home/Applications/Raycast.app', 'extensions/raycast-workstation/assets', 'raycast/.config/raycast-workstation']) mkdirSync(join(root, dir), { recursive: true });
  copyFileSync(new URL('./setup-raycast-workstation.sh', import.meta.url), join(root, 'scripts/setup-raycast-workstation.sh'));
  writeFileSync(join(root, 'raycast/.config/raycast-workstation/workstation.json'), '{}\n');
  const tool = `#!/bin/bash
name="$(basename "$0")"
printf '%s %s\\n' "$name" "$*" >> "$CALL_LOG"
case "$name" in
  uname) echo "\${TEST_OS:-Darwin}" ;;
  node) if [[ "\${1:-}" == -e && "\${OLD_NODE:-0}" == 1 ]]; then exit 1; fi ;;
  npm) [[ "$*" != "\${FAIL_NPM:-never}" ]] ;;
  stow) [[ "\${CONFLICT:-0}" != 1 ]] ;;
  xcrun) if [[ "\${1:-}" == swiftc ]]; then touch assets/desktop-helper; chmod +x assets/desktop-helper; fi ;;
esac
`;
  for (const name of ['uname', 'node', 'npm', 'stow', 'xcrun']) {
    const path = join(root, 'bin', name); writeFileSync(path, tool); chmodSync(path, 0o755);
  }
  const log = join(root, 'calls'); writeFileSync(log, '');
  return {
    run(action, extra = {}) {
      const result = spawnSync('/bin/bash', [join(root, 'scripts/setup-raycast-workstation.sh'), action], {
        env: { ...process.env, HOME: join(root, 'home'), PATH: `${join(root, 'bin')}:/usr/bin:/bin`, CALL_LOG: log, ...extra }, encoding: 'utf8',
      });
      return { ...result, calls: readFileSync(log, 'utf8').split('\n').filter(Boolean) };
    },
  };
}

test('plan explains local installation without running tools', t => {
  const r = fixture(t).run('plan');
  assert.equal(r.status, 0); assert.deepEqual(r.calls, []);
  assert.match(r.stdout, /install/); assert.match(r.stdout, /Control\+C/);
});
test('all operational commands reject non-macOS before changing anything', t => {
  for (const action of ['build', 'install', 'apply', 'check', 'rollback']) {
    const r = fixture(t).run(action, { TEST_OS: 'Linux' });
    assert.notEqual(r.status, 0); assert.match(r.stderr, /macOS/);
    assert.deepEqual(r.calls, ['uname -s']);
  }
});
test('build validates a locked install without Stow or Raycast import', t => {
  const r = fixture(t).run('build');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.calls.includes('npm ci --ignore-scripts'));
  assert.ok(r.calls.includes('npm test')); assert.ok(r.calls.includes('npm run typecheck'));
  assert.ok(r.calls.includes('npm run build'));
  assert.ok(!r.calls.some(c => c.startsWith('stow ') || c === 'npm run dev'));
});
test('install previews Stow, builds, links, then imports with the official CLI', t => {
  const r = fixture(t).run('install');
  assert.equal(r.status, 0, r.stderr);
  const preview = r.calls.findIndex(c => c.startsWith('stow -n '));
  const build = r.calls.indexOf('npm run build');
  const link = r.calls.findIndex(c => c.startsWith('stow --no-folding '));
  assert.ok(preview >= 0 && preview < build && build < link);
  assert.equal(r.calls.at(-1), 'npm run dev');
});
test('Stow conflicts and failed builds never link or import', t => {
  for (const extra of [{ CONFLICT: '1' }, { FAIL_NPM: 'run build' }]) {
    const r = fixture(t).run('install', extra);
    assert.notEqual(r.status, 0);
    assert.ok(!r.calls.some(c => c.startsWith('stow --no-folding ') || c === 'npm run dev'));
  }
});
test('outdated Node fails with an actionable message before npm or Stow', t => {
  const r = fixture(t).run('install', { OLD_NODE: '1' });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /Node.*22\.18/);
  assert.ok(!r.calls.some(c => c.startsWith('npm ') || c.startsWith('stow ')));
});
test('apply stays compatible as prepare-only and rollback only unstows', t => {
  const apply = fixture(t).run('apply');
  assert.equal(apply.status, 0, apply.stderr);
  assert.ok(apply.calls.some(c => c.startsWith('stow --no-folding ')));
  assert.ok(!apply.calls.includes('npm run dev'));
  const rollback = fixture(t).run('rollback');
  assert.equal(rollback.status, 0, rollback.stderr);
  assert.equal(rollback.calls.length, 3);
  assert.ok(rollback.calls.slice(1).every(c => c.startsWith('stow ') && c.includes('-D')));
});

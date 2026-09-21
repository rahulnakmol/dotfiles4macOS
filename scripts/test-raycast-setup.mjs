import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise the real shell entry point in an isolated checkout. External tools
// record calls instead of installing software, touching Raycast or changing HOME.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'workmode setup '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'bin', 'home/Applications/Raycast.app', 'extensions/raycast-workstation/assets', 'extensions/raycast-workstation/node_modules/.bin', 'raycast/.config/raycast/workstation']) mkdirSync(join(root, dir), { recursive: true });
  copyFileSync(new URL('./setup-raycast-workstation.sh', import.meta.url), join(root, 'scripts/setup-raycast-workstation.sh'));
  writeFileSync(join(root, 'raycast/.config/raycast/workstation/workstation.json'), '{}\n');
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
  const ray = join(root, 'extensions/raycast-workstation/node_modules/.bin/ray');
  writeFileSync(ray, `#!/bin/bash
printf 'ray %s\\n' "$*" >> "$CALL_LOG"
if [[ "\${RAY_EXIT_EARLY:-0}" == 1 ]]; then echo 'development failed' >&2; exit 7; fi
if [[ "\${RAY_NEVER_READY:-0}" != 1 ]]; then
  if [[ "\${RAY_ANSI_READY:-0}" == 1 ]]; then
    printf '\\033[32mready\\033[0m - \\033[1mbuilt extension successfully\\033[0m\\n'
  else
    echo 'ready - built extension successfully'
  fi
fi
trap 'exit 130' INT
while :; do sleep 1; done
`);
  chmodSync(ray, 0o755);
  const log = join(root, 'calls'); writeFileSync(log, '');
  return {
    root,
    run(action, extra = {}) {
      const result = spawnSync('/bin/bash', [join(root, 'scripts/setup-raycast-workstation.sh'), action], {
        env: { ...process.env, HOME: join(root, 'home'), PATH: `${join(root, 'bin')}:/usr/bin:/bin`, CALL_LOG: log, RAYCAST_IMPORT_SETTLE_SECONDS: '0', ...extra }, encoding: 'utf8',
      });
      return { ...result, calls: readFileSync(log, 'utf8').split('\n').filter(Boolean) };
    },
  };
}

test('plan explains local installation without running tools', t => {
  const r = fixture(t).run('plan');
  assert.equal(r.status, 0); assert.deepEqual(r.calls, []);
  assert.match(r.stdout, /install/); assert.match(r.stdout, /then exit/);
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
test('install previews Stow, builds, links, imports once, and exits cleanly', t => {
  const r = fixture(t).run('install');
  assert.equal(r.status, 0, r.stderr);
  const preview = r.calls.findIndex(c => c.startsWith('stow -n '));
  const build = r.calls.indexOf('npm run build');
  const link = r.calls.findIndex(c => c.startsWith('stow --no-folding '));
  assert.ok(preview >= 0 && preview < build && build < link);
  assert.equal(r.calls.at(-1), 'ray develop --non-interactive --exit-on-error');
  assert.match(r.stdout, /watcher has stopped/);
});
test('install recognizes ANSI-colored Raycast readiness output', t => {
  const r = fixture(t).run('install', { RAY_ANSI_READY: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /watcher has stopped/);
});
test('Stow conflicts and failed builds never link or import', t => {
  for (const extra of [{ CONFLICT: '1' }, { FAIL_NPM: 'run build' }]) {
    const r = fixture(t).run('install', extra);
    assert.notEqual(r.status, 0);
    assert.ok(!r.calls.some(c => c.startsWith('stow --no-folding ') || c.startsWith('ray develop')));
  }
});
test('install fails safely when Raycast exits before ready or import times out', t => {
  const early = fixture(t).run('install', { RAY_EXIT_EARLY: '1' });
  assert.equal(early.status, 1);
  assert.match(early.stderr, /exited before Workmode was ready \(status 7\)/);

  const timeout = fixture(t).run('install', { RAY_NEVER_READY: '1', RAYCAST_IMPORT_TIMEOUT_SECONDS: '1' });
  assert.equal(timeout.status, 1);
  assert.match(timeout.stderr, /Timed out after 1s/);
});
test('install rejects invalid import timing before starting Raycast', t => {
  for (const extra of [
    { RAYCAST_IMPORT_TIMEOUT_SECONDS: '0' },
    { RAYCAST_IMPORT_TIMEOUT_SECONDS: 'soon' },
    { RAYCAST_IMPORT_SETTLE_SECONDS: '-1' },
  ]) {
    const r = fixture(t).run('install', extra);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /must be a (positive|non-negative) integer/);
    assert.ok(!r.calls.some(c => c.startsWith('ray develop')));
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
  assert.ok(!apply.calls.some(c => c.startsWith('ray develop')));
  const rollback = fixture(t).run('rollback');
  assert.equal(rollback.status, 0, rollback.stderr);
  assert.equal(rollback.calls.length, 3);
  assert.ok(rollback.calls.slice(1).every(c => c.startsWith('stow ') && c.includes('-D')));
});

test('install safely migrates only legacy repository-owned configuration links',t=>{
  const owned=fixture(t);
  const legacy=join(owned.root,'home/.config/raycast-workstation');
  mkdirSync(legacy,{recursive:true});
  for(const name of ['workstation.json','aliases.json','hotkeys.json']) {
    const oldSource=join(owned.root,'raycast/.config/raycast-workstation',name);
    mkdirSync(join(owned.root,'raycast/.config/raycast-workstation'),{recursive:true});
    writeFileSync(oldSource,'{}\n');
    symlinkSync(oldSource,join(legacy,name));
  }
  const migrated=owned.run('apply');
  assert.equal(migrated.status,0,migrated.stderr);
  assert.equal(existsSync(legacy),false);

  const personal=fixture(t);
  const personalLegacy=join(personal.root,'home/.config/raycast-workstation');
  mkdirSync(personalLegacy,{recursive:true});
  writeFileSync(join(personalLegacy,'notes.txt'),'mine\n');
  const refused=personal.run('apply');
  assert.equal(refused.status,1);
  assert.match(refused.stderr,/contains files not owned by this repository/);
  assert.equal(readFileSync(join(personalLegacy,'notes.txt'),'utf8'),'mine\n');
  assert.ok(!refused.calls.some(call=>call.startsWith('stow -n ')));
});

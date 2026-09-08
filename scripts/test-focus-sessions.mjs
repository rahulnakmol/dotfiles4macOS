import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const workflow = new URL('../alfred/.config/alfred/Alfred.alfredpreferences/workflows/user.workflow.hyper/',import.meta.url).pathname;
test('native focus switching preserves quit barriers and the five requested app sets',t=>{
  const temp=mkdtempSync(join(tmpdir(),'focus-tests-'));t.after(()=>rmSync(temp,{recursive:true,force:true}));
  const binary=join(temp,'tests');
  execFileSync('xcrun',['swiftc','-D','FOCUS_TEST','-parse-as-library',workflow+'FocusSession.swift',new URL('./focus-tests/FocusSessionTests.swift',import.meta.url).pathname,'-o',binary]);
  const result=execFileSync(binary,[workflow+'focus-sessions.json'],{encoding:'utf8'});
  assert.match(result,/Focus session scenarios passed/);
});
test('focus sources are portable, tracked and cannot force quit apps',()=>{
  for (const file of ['FocusSession.swift','focus-session.zsh','focus-sessions.json']) {
    assert.equal(spawnSync('git',['check-ignore','--no-index','-q',workflow+file]).status,1);
    const text=readFileSync(workflow+file,'utf8');
    assert.ok(!text.includes('/Users/rahulnakmol'));
    assert.ok(!/forceTerminate|killall|SIGKILL|osascript/.test(text));
  }
  const plist=JSON.parse(execFileSync('plutil',['-convert','json','-o','-',workflow+'info.plist'],{encoding:'utf8'}));
  const notice=plist.objects.find(o=>o.uid==='focus-result');
  assert.equal(notice.version,0);
  assert.equal(notice.config.text,'{query}');
  assert.equal(notice.config.onlyshowifquerypopulated,true);
  const source=readFileSync(workflow+'FocusSession.swift','utf8');
  assert.ok(source.includes('flock(fd, LOCK_EX | LOCK_NB)'));
});

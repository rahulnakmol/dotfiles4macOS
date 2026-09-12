import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withModeLock } from "./mode-lock.ts";

test("an abandoned mode lock is recovered on the next attempt",async t=>{
  const dir=await mkdtemp(join(tmpdir(),"workmode-lock-"));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const path=join(dir,"mode-switch.lock");await mkdir(path);
  const past=new Date(Date.now()-120000);await utimes(path,past,past);
  assert.equal(await withModeLock(dir,async()=>"ran"),"ran");
  await assert.rejects(stat(path),{code:"ENOENT"});
});
test("concurrent mode changes cannot enter until the first releases",async t=>{
  const dir=await mkdtemp(join(tmpdir(),"workmode-lock-"));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await withModeLock(dir,async()=>{
    let entered=false;
    await assert.rejects(withModeLock(dir,async()=>{entered=true;}));
    assert.equal(entered,false);
  });
  assert.equal(await withModeLock(dir,async()=>42),42);
});
test("failed mode execution releases its lock for a retry",async t=>{
  const dir=await mkdtemp(join(tmpdir(),"workmode-lock-"));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await assert.rejects(withModeLock(dir,async()=>{throw new Error("Slack failed");}),/Slack failed/);
  assert.equal(await withModeLock(dir,async()=>"retry"),"retry");
});
test("filesystem failures retain their actual cause",async()=>{
  await assert.rejects(withModeLock(join(tmpdir(),"missing-workmode-dir","child"),async()=>{}),{code:"ENOENT"});
});

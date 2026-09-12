import { test } from "node:test";
import assert from "node:assert/strict";
import { constrainedRightThird, alreadyPlaced, ensurePlacement, placementRequest, readInventory, retryWindowLookup, waitForState, type InstalledApp } from "./command-resources.ts";

test("a successful native call with unchanged placement is verified and reapplied",async()=>{
  let state='wrong-space',applies=0;
  const result=await ensurePlacement(async()=>state,async()=>{if(++applies===2)state='correct-space';},s=>s==='correct-space','not settled',{attempts:1,wait:async()=>{}});
  assert.equal(result,'correct-space');assert.equal(applies,2);
});
test("verified placement has no mutation and failed moves stop after three attempts",async()=>{
  let applies=0;
  await ensurePlacement(async()=>true,async()=>{applies++;},Boolean,'failed');
  assert.equal(applies,0);
  await assert.rejects(ensurePlacement(async()=>false,async()=>{applies++;},Boolean,'failed',{attempts:1,wait:async()=>{}}),/failed/);
  assert.equal(applies,3);
});
test("placement never retries an unrelated mutation failure",async()=>{
  let applies=0;
  await assert.rejects(ensurePlacement(async()=>false,async()=>{applies++;throw new Error('Permission denied');},Boolean,'failed',{attempts:1}),/Permission denied/);
  assert.equal(applies,1);
});

test("an already arranged window needs no native mutation, but a different Space or geometry does",()=>{
  const rect={x:0,y:0,width:1710,height:1073};
  const w={desktopId:'connect',bounds:{position:{x:0,y:0},size:{width:1710,height:1073}}};
  assert.equal(alreadyPlaced(w,'connect',rect),true);
  assert.equal(alreadyPlaced(w,'create',rect),false);
  for(const dimension of ['x','y','width','height'] as const)assert.equal(alreadyPlaced(w,'connect',{...rect,[dimension]:rect[dimension]+50}),false);
  assert.equal(alreadyPlaced({...w,bounds:'fullscreen'},'connect',rect),false);
});

test("a transient native window lookup failure retries with a fresh operation", async () => {
  let reads=0;const waits:number[]=[];
  const result=await retryWindowLookup(async()=>{if(++reads===1)throw new Error('Cannot get window');return 'arranged';},async ms=>{waits.push(ms);});
  assert.equal(result,'arranged');assert.equal(reads,2);assert.deepEqual(waits,[200]);
});
test("window retries are bounded and unrelated failures are not retried", async () => {
  let attempts=0;
  await assert.rejects(retryWindowLookup(async()=>{attempts++;throw new Error('Cannot get window');},async()=>{}),/Cannot get window/);
  assert.equal(attempts,3);
  attempts=0;
  await assert.rejects(retryWindowLookup(async()=>{attempts++;throw new Error('Permission denied');},async()=>{}),/Permission denied/);
  assert.equal(attempts,1);
});

test("resize on the assigned Space omits desktopId to avoid Raycast's Cannot get window error", () => {
  const request = placementRequest({ id: "window", desktopId: "connect" }, "connect", { x: 0, y: 0, width: 1200, height: 900 });
  assert.equal(Object.hasOwn(request, "desktopId"), false);
  assert.deepEqual(request, { id: "window", bounds: { position: { x: 0, y: 0 }, size: { width: 1200, height: 900 } } });
});
test("moving to another Space retains the requested destination and bounds", () => {
  const request = placementRequest({ id: "window", desktopId: "home" }, "connect", { x: 800, y: 0, width: 400, height: 900 });
  assert.equal(request.desktopId, "connect");
  assert.equal(request.bounds.position.x, 800);
  assert.equal(request.bounds.size.width, 400);
});

test("inventory starts independent reads together, once, and stays fresh between commands", async () => {
  let appReads = 0, desktopReads = 0;
  let resolveApps!: (apps: InstalledApp[]) => void;
  const apps = new Promise<InstalledApp[]>(resolve => { resolveApps = resolve; });
  const readers = { apps: () => { appReads++; return apps; }, desktops: async () => { desktopReads++; return []; } };
  const pending = readInventory(readers);
  assert.equal(appReads, 1); assert.equal(desktopReads, 1);
  resolveApps([{ path: "/Applications/Test.app", bundleId: "test" }]);
  const snapshot = await pending;
  for (let i = 0; i < 4; i++) assert.equal(snapshot.apps[0].bundleId, "test");
  assert.equal(appReads, 1); assert.equal(desktopReads, 1);
  await readInventory(readers);
  assert.equal(appReads, 2); assert.equal(desktopReads, 2);
});
test("failed inventory aborts preparation", async () => {
  await assert.rejects(readInventory({ apps: async () => { throw new Error("unavailable"); }, desktops: async () => [] }), /unavailable/);
});
test("settled windows incur no artificial wait", async () => {
  let waits = 0, reads = 0;
  assert.equal(await waitForState(async () => { reads++; return "ready"; }, v => v === "ready", "failed", { wait: async () => { waits++; } }), "ready");
  assert.equal(reads, 1); assert.equal(waits, 0);
});
test("window transitions retry only until the requested state appears", async () => {
  const states = ["moving", "moving", "ready"];
  const waits: number[] = [];
  await waitForState(async () => states.shift(), v => v === "ready", "failed", { wait: async ms => { waits.push(ms); } });
  assert.deepEqual(waits, [200, 200]);
});
test("temporary read errors can settle; permanent failures exhaust a bounded budget", async () => {
  let reads = 0, waits = 0;
  await waitForState(async () => { if (++reads === 1) throw new Error("transition"); return true; }, Boolean, "failed", { wait: async () => { waits++; } });
  assert.equal(reads, 2); assert.equal(waits, 1);
  reads = 0; waits = 0;
  await assert.rejects(waitForState(async () => { reads++; return false; }, Boolean, "Window did not settle", { attempts: 3, wait: async () => { waits++; } }), /Window did not settle/);
  assert.equal(reads, 3); assert.equal(waits, 2);
});

test("Slack's observed minimum width fits beside the browser without overlap",()=>{
  const request={x:1140,y:0,width:570,height:1073};
  const slack={desktopId:'connect',bounds:{position:{x:1042,y:0},size:{width:668,height:1073}}};
  assert.deepEqual(constrainedRightThird(slack,'connect',request),{x:1042,y:0,width:668,height:1073});
});
test("width adaptation rejects wrong Spaces, fullscreen, off-edge and oversized windows",()=>{
  const request={x:1140,y:0,width:570,height:1073};
  const slack={desktopId:'connect',bounds:{position:{x:1042,y:0},size:{width:668,height:1073}}};
  assert.equal(constrainedRightThird(slack,'other',request),undefined);
  assert.equal(constrainedRightThird({...slack,bounds:'fullscreen'},'connect',request),undefined);
  for(const bounds of [
    {position:{x:900,y:0},size:{width:668,height:1073}},
    {position:{x:0,y:0},size:{width:1710,height:1073}},
    {position:{x:1042,y:0},size:{width:668,height:600}},
    {position:{x:1140,y:0},size:{width:570,height:1073}},
  ])assert.equal(constrainedRightThird({...slack,bounds},'connect',request),undefined);
});

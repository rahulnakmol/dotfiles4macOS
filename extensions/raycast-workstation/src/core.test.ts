import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { configSchema, quitCandidates, rectangle, requirePreset, runMode, timerURL, type Desktop, type RunningApp } from "./core.ts";
const raw=JSON.parse(readFileSync(new URL("../assets/workstation.json",import.meta.url),"utf8"));
const config=configSchema.parse(raw);
const mode=config.modes.find(m=>m.id==="code")!;
test("Code uses Amp and Innovate offers Codex with the same companion apps",()=>{
  assert.deepEqual(mode.placements.map(p=>p.app),["zen-browser","amp","ghostty","slack"]);
  assert.deepEqual(config.modes.find(m=>m.id==="innovate")!.placements.map(p=>p.app),["zen-browser","codex","ghostty","slack"]);
  assert.equal(mode.minutes,45);
});
test("eight unified modes, Work exception and optional Video prerequisites",()=>{
  assert.equal(config.modes.length,8);
  assert.deepEqual(config.modes.find(m=>m.id==="work")!.placements.map(p=>p.app),["edge","teams","claude"]);
  for(const id of ["code","innovate"])assert.deepEqual(config.modes.find(m=>m.id===id)!.placements.map(p=>p.desktop),[2,3,4,2]);
  assert.deepEqual(config.modes.find(m=>m.id==="video")!.placements.map(p=>p.app),["finalcut","motion","finder"]);
  assert.ok(config.apps.find(a=>a.id==="finalcut")!.optional);
});
test("reject duplicate or conflicting launch keys and Safari",()=>{
  for(const edit of [(c:typeof raw)=>c.apps[0].key="b",(c:typeof raw)=>c.apps[0].key=c.apps[1].key,(c:typeof raw)=>c.apps[0].bundleId="com.apple.Safari"]) {
    const c=structuredClone(raw);edit(c);assert.throws(()=>configSchema.parse(c));
  }
});
test("layout fractions meet without a rounding gap",()=>{
  for(const width of [1365,1710,2560]){
    const l=rectangle("left-two-thirds",width,1000),r=rectangle("right-third",width,1000);
    assert.equal(l.width,r.x);assert.equal(l.width+r.width,width);assert.equal(r.height,1000);
  }
  assert.throws(()=>rectangle("maximize",0,1000));
});
test("timer URL keeps category and intent intact; bad durations rejected",()=>{
  const u=new URL(timerURL(45,"Code & Learn","Code + Cursor"));
  assert.equal(u.searchParams.get("categoryName"),"Code & Learn");assert.equal(u.searchParams.get("intent"),"Code + Cursor");
  assert.equal(new URL(timerURL(25)).searchParams.has("categoryName"),false);
  assert.throws(()=>timerURL(0));
});
test("preset lookup rejects missing and duplicate names",()=>{
  requirePreset("2. Code","Available presets:\n- 2. Code (ID: 3)\n");
  assert.throws(()=>requirePreset("Code","- 2. Code (ID: 3)"));
  assert.throws(()=>requirePreset("2. Code","- 2. Code (ID: 3)\n- 2. Code (ID: 4)"));
});
test("Innovate and Video match the agreed DockFlow numbering",()=>{
  const innovate=config.modes.find(m=>m.id==='innovate')!;
  const video=config.modes.find(m=>m.id==='video')!;
  assert.equal(innovate.dock,'5. Innovate');assert.equal(innovate.key,'5');
  assert.equal(video.dock,'6. Video');assert.equal(video.key,'6');
  const presets='- 6. Video (ID: 6)\n- 5. Innovate (ID: 8)';
  requirePreset(innovate.dock,presets);requirePreset(video.dock,presets);
});
test("only unrelated regular apps are quit; host and Session survive",()=>{
  const apps=config.apps.filter(a=>mode.placements.some(p=>p.app===a.id));
  const running=["com.raycast.macos","com.apple.finder","com.philipyoungg.session-setapp","com.tinyspeck.slackmacgap","unrelated"].map((bundleId,pid)=>({pid,bundleId,name:bundleId}));
  assert.deepEqual(quitCandidates(apps,running).map(a=>a.bundleId),["unrelated"]);
});
function fake(fail?:string):{desktop:Desktop;events:string[]} {
  const events:string[]=[];let apps:RunningApp[]=[{pid:9,bundleId:"other",name:"Other"}];
  const record=async(s:string):Promise<void>=>{events.push(s);if(fail===s)throw new Error(s);};
  return {events,desktop:{
    preflight:()=>record("preflight"),running:async()=>apps,
    quit:async()=>{await record("quit");apps=[];},
    place:async(app)=>record("place:"+app.id),applyDock:()=>record("dock"),openURL:()=>record("url"),finishTimer:()=>record("finish-timer"),startTimer:()=>record("timer"),
  }};
}
test("Arrange never quits or starts a timer",async()=>{
  const f=fake();await runMode(config,mode,false,f.desktop);
  assert.equal(f.events[0],"preflight");assert.ok(!f.events.includes("quit"));assert.ok(!f.events.includes("finish-timer"));assert.ok(!f.events.includes("timer"));assert.equal(f.events.at(-1),"dock");
});
test("Focus preflights before quit and starts once after all placement and Dock work",async()=>{
  const f=fake();await runMode(config,mode,true,f.desktop);
  assert.deepEqual(f.events,["preflight","finish-timer","quit","place:zen-browser","place:amp","place:ghostty","place:slack","dock","timer"]);
});
test("missing prerequisites have no app effects",async()=>{
  const f=fake("preflight");await assert.rejects(runMode(config,mode,true,f.desktop));assert.deepEqual(f.events,["preflight"]);
});
test("cancelled quit, failed placement and failed Dock never start a timer",async()=>{
  for(const step of ["quit","place:amp","dock"]){const f=fake(step);await assert.rejects(runMode(config,mode,true,f.desktop));assert.ok(!f.events.includes("timer"));}
});
test("late-opening unrelated apps abort focus",async()=>{
  const f=fake();f.desktop.running=async()=>[{pid:1,bundleId:"other",name:"Other"}];
  await assert.rejects(runMode(config,mode,true,f.desktop),/still open/);assert.ok(!f.events.some(e=>e.startsWith("place:")));
});
test("Default is arrangement only",async()=>{
  const f=fake();await assert.rejects(runMode(config,config.modes[0],true,f.desktop));assert.deepEqual(f.events,[]);
});

test("Codex stays open only when the selected focus mode includes it",()=>{
  const running=["com.openai.codex","unrelated"].map((bundleId,pid)=>({pid,bundleId,name:bundleId}));
  for(const mode of config.modes.filter(m=>m.minutes>0)) {
    const apps=config.apps.filter(a=>mode.placements.some(p=>p.app===a.id));
    const expected=apps.some(a=>a.bundleId==="com.openai.codex")?["unrelated"]:["com.openai.codex","unrelated"];
    assert.deepEqual(quitCandidates(apps,running).map(a=>a.bundleId),expected);
  }
});

test("a failed timer finish prevents quits and a new timer",async()=>{
  const f=fake("finish-timer");await assert.rejects(runMode(config,mode,true,f.desktop),/finish-timer/);
  assert.deepEqual(f.events,["preflight","finish-timer"]);
});

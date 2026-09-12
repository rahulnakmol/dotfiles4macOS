import { environment, getApplications, open, WindowManagement } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { withModeLock } from "./mode-lock.ts";
import { currentSpace } from "./setup-model.ts";
import { constrainedRightThird, type WindowRect, alreadyPlaced, ensurePlacement, placementRequest, readInventory, retryWindowLookup, waitForState, type Inventory } from "./command-resources.ts";
import { configSchema, rectangle, requirePreset, runMode, sessionIds, type App, type Config, type Desktop, type Mode, type Placement, type RunningApp } from "./core.ts";

const exec=promisify(execFile);
const helper=():string=>join(environment.assetsPath,"desktop-helper");
const mapPath=():string=>join(environment.supportPath,"desktop-map.json");
export function loadConfig():Config {
  const path=join(homedir(),".config/raycast-workstation/workstation.json");
  const config=configSchema.parse(JSON.parse(readFileSync(existsSync(path)?path:join(environment.assetsPath,"workstation.json"),"utf8")));
  if(existsSync(mapPath()))config.desktopIds=z.record(z.string(),z.string()).parse(JSON.parse(readFileSync(mapPath(),"utf8")));
  return config;
}
export async function mapDesktop(role:number,desktopId:string):Promise<void> {
  if(![1,2,3,4].includes(role))throw new Error("Invalid desktop role");
  const active=(await WindowManagement.getDesktops()).find(d=>d.id===desktopId&&d.type===WindowManagement.DesktopType.User);
  if(!active)throw new Error("That desktop is no longer available");
  const config=loadConfig();
  for(const [key,value]of Object.entries(config.desktopIds))if(value===active.id&&key!==String(role))throw new Error(`This desktop is already assigned to role ${key}`);
  config.desktopIds[String(role)]=active.id;
  mkdirSync(environment.supportPath,{recursive:true});
  writeFileSync(mapPath(),JSON.stringify(config.desktopIds,null,2)+"\n");
}
export async function assignCurrentDesktop(role:number):Promise<void> {
  const spaces=await WindowManagement.getDesktops();
  let focused:string|undefined;
  try{focused=(await WindowManagement.getActiveWindow()).desktopId;}catch{/* A single visible desktop is sufficient. */}
  await mapDesktop(role,currentSpace(spaces,focused).id);
}
export async function running():Promise<RunningApp[]> {
  const {stdout}=await exec(helper(),["running"],{timeout:5000});
  return z.array(z.object({pid:z.number().int(),bundleId:z.string(),name:z.string()})).parse(JSON.parse(stdout));
}
async function dockCLI():Promise<string> {
  const app=(await getApplications()).find(a=>a.bundleId==="com.appit.DockFlow");
  if(!app)throw new Error("Install DockFlow first");
  return join(app.path,"Contents/MacOS/DockFlowCLI");
}
export async function dockList():Promise<string> {
  return (await exec(await dockCLI(),["list"],{timeout:10000})).stdout;
}
export async function applyDock(name:string):Promise<void> {
  const cli=await dockCLI();
  requirePreset(name,(await exec(cli,["list"],{timeout:10000})).stdout);
  await exec(cli,["apply","--name",name],{timeout:15000});
}
export async function startTimer(url:string):Promise<void> {
  const session=(await getApplications()).find(a=>sessionIds.includes(a.bundleId??""));
  if(!session)throw new Error("Install Session first");
  await exec("/usr/bin/open",["-g","-b",session.bundleId!,url],{timeout:10000});
}
async function activeAppWindow(app:App):Promise<WindowManagement.Window> {
  return waitForState(()=>WindowManagement.getActiveWindow(),win=>win.application?.bundleId===app.bundleId,
    `${app.name}: could not find its active window after opening the app. Open its main window and retry.`);
}
export function desktopAdapter(config:Config):Desktop {
  let inventory:Inventory|undefined;
  let cli:string|undefined;
  let preparedDock:string|undefined;
  let placements:Placement[]=[];
  const overrides=new Map<string,WindowRect>();
  const adapter:Desktop={
    running,
    async preflight(mode:Mode,apps:App[],focus:boolean):Promise<void> {
      if(!environment.canAccess(WindowManagement))throw new Error("Raycast Pro Window Management access is required");
      if(!existsSync(helper()))throw new Error("Run the workstation setup script to build the native helper");
      inventory=undefined;cli=undefined;preparedDock=undefined;
      const snapshot=await readInventory({apps:getApplications,desktops:()=>WindowManagement.getDesktops()});
      const {apps:installed,desktops}=snapshot;
      for(const app of apps)if(!installed.some(a=>a.bundleId===app.bundleId))throw new Error(`Install ${app.name} before using ${mode.name}`);
      if(focus&&!installed.some(a=>sessionIds.includes(a.bundleId??"")))throw new Error("Install Session before starting focus");
      for(const role of new Set(mode.placements.map(p=>p.desktop))) {
        if(!desktops.some(d=>d.id===config.desktopIds[String(role)]&&d.type===WindowManagement.DesktopType.User))
          throw new Error(`Map Desktop ${role} in Check Workmode Setup before running this mode`);
      }
      const dock=installed.find(a=>a.bundleId==="com.appit.DockFlow");
      if(!dock)throw new Error("Install DockFlow first");
      const path=join(dock.path,"Contents/MacOS/DockFlowCLI");
      requirePreset(mode.dock,(await exec(path,["list"],{timeout:10000})).stdout);
      inventory=snapshot;cli=path;preparedDock=mode.dock;placements=mode.placements;overrides.clear();
    },
    async quit(app:RunningApp):Promise<void> {
      try {await exec(helper(),["quit",String(app.pid),app.bundleId],{timeout:35000});}
      catch {throw new Error(`${app.name} is still open. Resolve its save/quit prompt, then retry. No timer started.`);}
    },
    async place(app:App,placement:Placement):Promise<void> {
      const installed=inventory?.apps.find(a=>a.bundleId===app.bundleId);
      if(!installed)throw new Error(`${app.name} is no longer installed`);
      await open(installed.path);
      let window=await activeAppWindow(app);
      if(window.bounds==="fullscreen")throw new Error(`Exit native fullscreen in ${app.name}, then retry`);
      if(!window.resizable||!window.positionable)throw new Error(`${app.name}'s current window cannot be arranged`);
      const target=inventory?.desktops.find(d=>d.id===config.desktopIds[String(placement.desktop)]);
      if(!target)throw new Error(`Desktop ${placement.desktop} is no longer available`);
      const rect=overrides.get(app.id)??rectangle(placement.shape,target.size.width,target.size.height);
      let resizeRequested=false;
      let adjusted:WindowRect|undefined;
      console.log(JSON.stringify({event:"window.place",app:app.id,windowId:window.id,source:window.desktopId,target:target.id,bounds:window.bounds,requested:rect}));
      const settled=await ensurePlacement(()=>WindowManagement.getActiveWindow(),async current=>{
        if(current.application?.bundleId!==app.bundleId)await open(installed.path);
        window=current.application?.bundleId===app.bundleId?current:await activeAppWindow(app);
        if(window.bounds==="fullscreen"||!window.resizable||!window.positionable)throw new Error(`${app.name}'s window cannot be arranged`);
        try {
          let attempt=0;
          if(!alreadyPlaced(window,target.id,rect))await retryWindowLookup(async()=>{
            if(attempt++>0) {
              window=await activeAppWindow(app);
              if(window.bounds==="fullscreen"||!window.resizable||!window.positionable)throw new Error(`${app.name}'s window cannot be arranged`);
              console.log(JSON.stringify({event:"window.retry",app:app.id,attempt,windowId:window.id}));
            }
            if(!alreadyPlaced(window,target.id,rect)) {
              await WindowManagement.setWindowBounds(placementRequest(window,target.id,rect));
              resizeRequested=true;
            }
          });
        } catch(error) {
          throw new Error(`${app.name}: moving/resizing its window to Desktop ${placement.desktop} failed: ${error instanceof Error?error.message:String(error)}`);
        }
        // Reactivate after moving; a resolved API call alone does not prove placement.
        await open(installed.path);
      },after=>{
        if(after.application?.bundleId!==app.bundleId||after.id!==window.id||after.desktopId!==target.id||after.bounds==="fullscreen")return false;
        if(resizeRequested&&placement.shape==="right-third") {
          adjusted=constrainedRightThird(after,target.id,rect);
          if(adjusted)return true;
        }
        const b=after.bounds;
        return Math.abs(b.size.width-rect.width)<=40&&Math.abs(b.size.height-rect.height)<=100&&Math.abs(b.position.x-rect.x)<=40;
      },`${app.name} did not settle on Desktop ${placement.desktop} after three placement attempts. Check its minimum size, fullscreen state and display. No timer started.`);
      console.log(JSON.stringify({event:"window.verified",app:app.id,desktop:settled.desktopId,bounds:settled.bounds}));
      if(adjusted) {
        const companion=placements.find(p=>p.desktop===placement.desktop&&p.shape==="left-two-thirds");
        console.log(JSON.stringify({event:"window.width-constrained",app:app.id,requestedWidth:rect.width,actualWidth:adjusted.width,companion:companion?.app}));
        if(companion) {
          overrides.set(companion.app,{x:0,y:rect.y,width:adjusted.x,height:rect.height});
          try {await adapter.place(config.apps.find(a=>a.id===companion.app)!,companion);}
          finally {overrides.delete(companion.app);}
        }
      }
    },
    async applyDock(name:string):Promise<void> {
      if(!cli||preparedDock!==name)throw new Error("Dock profile was not prepared");
      // Recheck presets after any save prompts; reuse the resolved CLI, not another app scan.
      requirePreset(name,(await exec(cli,["list"],{timeout:10000})).stdout);
      await exec(cli,["apply","--name",name],{timeout:15000});
    },
    async openURL(url:string):Promise<void> { await open(url,"app.zen-browser.zen"); },
    async finishTimer():Promise<void> {
      const session=inventory?.apps.find(a=>sessionIds.includes(a.bundleId??""));
      if(!session?.bundleId)throw new Error("Session was not prepared");
      await exec("/usr/bin/open",["-g","-b",session.bundleId,"session:///finish"],{timeout:10000});
      console.log(JSON.stringify({event:"timer.finish-requested"}));
    },
    async startTimer(url:string):Promise<void> {
      const session=inventory?.apps.find(a=>sessionIds.includes(a.bundleId??""));
      if(!session?.bundleId)throw new Error("Session was not prepared");
      await exec("/usr/bin/open",["-g","-b",session.bundleId,url],{timeout:10000});
    },
  };
  return adapter;
}
export async function executeMode(config:Config,mode:Mode,focus:boolean):Promise<void> {
  mkdirSync(environment.supportPath,{recursive:true});
  await withModeLock(environment.supportPath,()=>runMode(config,mode,focus,desktopAdapter(config)));
}

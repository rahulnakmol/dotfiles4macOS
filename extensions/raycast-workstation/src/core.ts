import { z } from "zod";

const appSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), bundleId: z.string().min(1),
  key: z.string().length(1), optional: z.boolean().default(false),
});
const placementSchema = z.object({app: z.string(), desktop: z.number().int().min(1).max(4),
  shape: z.enum(["maximize", "left-two-thirds", "right-third"])});
const modeSchema = z.object({id:z.string(), name:z.string(), dock:z.string(), key:z.string(),
  category:z.string(), minutes:z.number().int().min(0).max(60),
  placements:z.array(placementSchema).min(1), urls:z.array(z.string().url()).default([])});
export const configSchema = z.object({version:z.literal(1), apps:z.array(appSchema), modes:z.array(modeSchema),
  desktopIds:z.record(z.string(),z.string()).default({}),
}).superRefine((value, ctx) => {
  for (const [name, values] of [["app IDs",value.apps.map(a=>a.id)], ["bundle IDs",value.apps.map(a=>a.bundleId)],
    ["app keys",value.apps.map(a=>a.key)], ["mode IDs",value.modes.map(m=>m.id)],
    ["Dock keys",value.modes.map(m=>m.key)]] as const) {
    if(new Set(values).size!==values.length)ctx.addIssue({code:"custom",message:`Duplicate ${name}`});
  }
  for(const app of value.apps) {
    if(["b","v","m"].includes(app.key))ctx.addIssue({code:"custom",message:`Codex owns Hyper+${app.key}`});
    if(app.bundleId==="com.apple.Safari")ctx.addIssue({code:"custom",message:"Safari is excluded"});
  }
  for(const mode of value.modes) {
    if(new Set(mode.placements.map(p=>p.app)).size!==mode.placements.length)ctx.addIssue({code:"custom",message:`Duplicate app in ${mode.id}`});
    for(const p of mode.placements)if(!value.apps.some(a=>a.id===p.app))ctx.addIssue({code:"custom",message:`Unknown app: ${p.app}`});
  }
});
export type Config = z.infer<typeof configSchema>;
export type App = z.infer<typeof appSchema>;
export type Mode = z.infer<typeof modeSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type RunningApp = {pid:number;bundleId:string;name:string};
export const sessionIds = ["com.philipyoungg.session-setapp","com.philipyoungg.session-direct","com.philipyoungg.session"];
const support = new Set([...sessionIds,"com.raycast.macos","com.apple.finder","com.appit.DockFlow"]);

export function quitCandidates(apps: App[], running: RunningApp[]): RunningApp[] {
  const keep=new Set([...support,...apps.map(a=>a.bundleId)]);
  return running.filter(a=>!keep.has(a.bundleId));
}
export function timerURL(minutes:number, category?:string, name="Focus"): string {
  if(![20,25,30,45,60].includes(minutes))throw new Error("Choose 20, 25, 30, 45 or 60 minutes");
  const u=new URL("session:///start");
  u.searchParams.set("duration",String(minutes));u.searchParams.set("intent",name);
  if(category)u.searchParams.set("categoryName",category);
  return u.href.replaceAll("+","%20");
}
export function requirePreset(name:string, output:string): void {
  const matches=output.split("\n").filter(s=>s.startsWith(`- ${name} (ID: `)&&s.endsWith(")"));
  if(matches.length!==1)throw new Error(`DockFlow needs exactly one preset named “${name}”. Update/import it first.`);
}
export function rectangle(shape:Placement["shape"],width:number,height:number): {x:number;y:number;width:number;height:number} {
  if(width<=0||height<=0)throw new Error("Invalid desktop dimensions");
  const split=Math.round(width*2/3);
  return {x:shape==="right-third"?split:0,y:0,width:shape==="maximize"?width:shape==="right-third"?width-split:split,height};
}
export interface Desktop {
  preflight(mode:Mode,apps:App[],focus:boolean):Promise<void>;
  running():Promise<RunningApp[]>;
  quit(app:RunningApp):Promise<void>;
  place(app:App,placement:Placement):Promise<void>;
  applyDock(name:string):Promise<void>;
  openURL(url:string):Promise<void>;
  finishTimer():Promise<void>;
  startTimer(url:string):Promise<void>;
}
export async function runMode(config:Config,mode:Mode,focus:boolean,desktop:Desktop):Promise<void> {
  const apps=mode.placements.map(p=>config.apps.find(a=>a.id===p.app)!);
  if(focus&&mode.minutes===0)throw new Error("Default is an arrangement, not a timed focus session");
  await desktop.preflight(mode,apps,focus);
  if(focus) {
    await desktop.finishTimer();
    for(const app of quitCandidates(apps,await desktop.running()))await desktop.quit(app);
    if(quitCandidates(apps,await desktop.running()).length)throw new Error("Other apps are still open. Resolve their save prompts and retry.");
  }
  for(const placement of mode.placements)await desktop.place(config.apps.find(a=>a.id===placement.app)!,placement);
  await desktop.applyDock(mode.dock);
  for(const url of mode.urls)await desktop.openURL(url);
  if(focus)await desktop.startTimer(timerURL(mode.minutes,mode.category,`Focus Session: ${mode.name}`));
}

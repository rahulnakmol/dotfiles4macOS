import { Action, ActionPanel, Alert, confirmAlert, Icon, launchCommand, LaunchType, List, open, showToast, Toast } from "@raycast/api";
import { useState, type ReactElement } from "react";
import { quitCandidates, timerURL, type Mode } from "./core.ts";
import { applyDock, desktopAdapter, executeMode, loadConfig, running, startTimer } from "./runtime.ts";

import { selectModes } from "./mode-selection.ts";
import { unassignedDesktops } from "./setup-model.ts";

type MenuKind="all"|"layouts"|"focus"|"dock"|"timers"|"capture"|"google";
async function report(action:()=>Promise<void>,title:string):Promise<void> {
  const toast=await showToast({style:Toast.Style.Animated,title});
  try{await action();toast.style=Toast.Style.Success;toast.title=title+" — done";console.log(JSON.stringify({event:"mode.completed",mode:title}));}
  catch(error){toast.style=Toast.Style.Failure;toast.title="Workmode stopped";toast.message=error instanceof Error?error.message:String(error);console.error(JSON.stringify({event:"mode.failed",mode:title,message:toast.message}));}
}
const captureActions=[['All-in-one','all-in-one'],['Area','capture-area'],['Window','capture-window'],['Record Screen','record-screen'],['Scrolling Capture','scrolling-capture'],['Text (OCR)','capture-text'],['History','open-history']] as const;
const googleActions=[['New Document','https://docs.new'],['New Spreadsheet','https://sheets.new'],['New Presentation','https://slides.new'],['New Form','https://forms.new'],['Drive','https://drive.google.com'],['Excalidraw','https://excalidraw.com/']] as const;

export function WorkmodeMenu({kind,modeId}:{kind:MenuKind;modeId?:string}):ReactElement {
  const [busy,setBusy]=useState(false);
  const [config]=useState(loadConfig);
  const modes=selectModes(config,kind,modeId);
  const act=async(action:()=>Promise<void>,title:string):Promise<void>=>{
    if(busy)return;setBusy(true);try{await report(action,title);}finally{setBusy(false);}
  };
  const focus=async(mode:Mode):Promise<void>=>{
    const apps=mode.placements.map(p=>config.apps.find(a=>a.id===p.app)!);
    await desktopAdapter(config).preflight(mode,apps,true);
    const quit=quitCandidates(apps,await running());
    if(await confirmAlert({title:`Focus Session: ${mode.name}`,message:`Quit: ${quit.map(a=>a.name).join(", ")||"No unrelated apps"}.\n\nFinish the current Session timer, then arrange ${apps.map(a=>a.name).join(" + ")} and request ${mode.minutes} minutes in Session (${mode.category}). Save prompts are respected. Zen context switching is currently manual.`,primaryAction:{title:"Start Focus",style:Alert.ActionStyle.Destructive}}))await executeMode(config,mode,true);
  };
  return <List isLoading={busy} searchBarPlaceholder="Search modes or actions…">
    {["all","layouts","focus","dock"].includes(kind)&&<List.Section title={kind==="focus"?"Focus · closes unrelated apps":kind==="dock"?"Dock only":"Arrange · keeps other apps open"}>
      {modes.filter(m=>kind!=="focus"||m.minutes>0).map(mode=>{const missing=kind==="dock"?[]:unassignedDesktops(config,mode);return <List.Item key={mode.id} icon={kind==="focus"?"focus.png":Icon.Desktop} title={`${kind==="focus"?"Focus Session":kind==="dock"?"DockFlow Profile":"Window Layout"}: ${mode.name}`} accessories={missing.length?[{text:"Setup needed"}]:[]} subtitle={missing.length?`Assign Desktops ${missing.join(", ")} · wchk`:kind==="dock"?`Meh+${mode.key} · ${mode.dock}`:`${mode.placements.map(p=>config.apps.find(a=>a.id===p.app)!.name).join(" + ")}${kind==="focus"?` · ${mode.minutes} min`:""}`} actions={<ActionPanel>
        {missing.length?<Action title="Set Up Desktops" onAction={()=>launchCommand({name:"check",type:LaunchType.UserInitiated})}/>:kind==="dock"?<Action title="Apply Dock Profile" onAction={()=>act(()=>applyDock(mode.dock),mode.name)}/>:kind==="focus"?<Action title="Preview Focus Session" onAction={()=>act(()=>focus(mode),mode.name)}/>:<Action title="Arrange Windows and Dock" onAction={()=>act(()=>executeMode(config,mode,false),mode.name)}/>}
        {kind==="all"&&mode.minutes>0&&!missing.length&&<Action title="Preview Focus Session" onAction={()=>act(()=>focus(mode),mode.name)}/>}
      </ActionPanel>}/>;}) }
    </List.Section>}
    {["all","timers"].includes(kind)&&<List.Section title="Session Timer · no app or layout changes">
      {[20,25,30,45,60].map(minutes=><List.Item key={minutes} icon={Icon.Clock} title={`Session Timer: ${minutes} Minutes`} subtitle="Uses Session's current/default category" actions={<ActionPanel>
        <Action title="Start Timer" onAction={()=>act(()=>startTimer(timerURL(minutes,undefined,minutes<=25?"Pomodoro":"Focus")),`${minutes}-minute timer requested`)}/>
        {config.modes.filter(m=>m.minutes>0).map(m=><Action key={m.id} title={`Start in ${m.category}`} onAction={()=>act(()=>startTimer(timerURL(minutes,m.category,`Focus Session: ${m.name}`)),`${minutes}-minute ${m.name} timer requested`)}/>)}
      </ActionPanel>}/>) }
    </List.Section>}
    {["all","capture"].includes(kind)&&<List.Section title="CleanShot X">
      {captureActions.map(([label,command])=><List.Item key={command} icon={Icon.Camera} title={`Capture: ${label}`} actions={<ActionPanel><Action title="Open CleanShot Action" onAction={()=>act(()=>open(`cleanshot://${command}`),label)}/></ActionPanel>}/>) }
    </List.Section>}
    {["all","google"].includes(kind)&&<List.Section title="Web links · Zen">
      {googleActions.map(([label,url])=><List.Item key={url} icon={Icon.Globe} title={`Google Workspace: ${label}`} actions={<ActionPanel><Action title="Open in Zen" onAction={()=>act(()=>open(url,"app.zen-browser.zen"),label)}/></ActionPanel>}/>) }
    </List.Section>}
  </List>;
}

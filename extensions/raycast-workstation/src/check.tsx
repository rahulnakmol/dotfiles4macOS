import { Action, ActionPanel, Color, environment, getApplications, Icon, List, showToast, Toast, WindowManagement } from "@raycast/api";
import { useEffect, useState, type ReactElement } from "react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { assignCurrentDesktop, dockList, loadConfig } from "./runtime.ts";
import { desktopRoles, modeNeeds, type Space } from "./setup-model.ts";
import { sessionIds } from "./core.ts";

const instructions = `# Set up your four Spaces

Do this **once on each Mac**. Your Spaces are the desktops across the top of Mission Control.

1. Open Mission Control with **Control + Up Arrow**.
2. Create **four desktops** using **+**, if needed.
3. Click **Desktop 1**, open Raycast with **Option + Space** and run **wchk**.
4. Select **Desktop 1** here and press **Return**.
5. Go to **Desktop 2** and repeat for Desktop 2. Then do Desktop 3 and Desktop 4.

**Do not assign all four from the same Space.** The check marks show saved assignments.

These names describe roles in Workmode; macOS still labels the Spaces Desktop 1–4.

This saves where your apps should go. It does not move windows, close apps or start a timer.
`;

// Raycast requires a default export for command entry points.
export default function Command(): ReactElement {
  const [revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(true);
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [installed,setInstalled]=useState(new Set<string>());
  const [presets,setPresets]=useState("");
  const [problem,setProblem]=useState<string>();
  const config=loadConfig();
  useEffect(()=>{
    let cancelled=false; setBusy(true);
    void (async()=>{
      const failures:string[]=[];
      const [ds,apps,dock]=await Promise.allSettled([WindowManagement.getDesktops(),getApplications(),dockList()]);
      if(cancelled)return;
      if(ds.status==="fulfilled")setSpaces(ds.value);else failures.push("Raycast could not read your Spaces. Check Pro and Accessibility access.");
      if(apps.status==="fulfilled")setInstalled(new Set(apps.value.flatMap(a=>a.bundleId?[a.bundleId]:[])));else failures.push("Could not check installed apps.");
      if(dock.status==="fulfilled")setPresets(dock.value);else failures.push("DockFlow is unavailable. Install/open DockFlow first.");
      if(!existsSync(join(environment.assetsPath,"desktop-helper")))failures.push("Re-run the dotfiles Raycast installer to build its app helper.");
      setProblem(failures.length?failures.join("\n\n"):undefined);setBusy(false);
    })();
    return()=>{cancelled=true;};
  },[revision]);
  const assign=async(role:number):Promise<void>=>{
    setBusy(true);
    try{await assignCurrentDesktop(role);await showToast({style:Toast.Style.Success,title:`Desktop ${role} assigned`,message:role<4?`Now switch to Desktop ${role+1}, reopen wchk and assign it.`:"Review your four assignments below."});}
    catch(error){await showToast({style:Toast.Style.Failure,title:"Desktop not assigned",message:String(error)});}
    finally{setRevision(n=>n+1);}
  };
  const regular=spaces.filter(s=>s.type==="User");
  const count=desktopRoles.filter(r=>regular.some(s=>s.id===config.desktopIds[String(r.number)])).length;
  return <List isLoading={busy} isShowingDetail searchBarPlaceholder="Set up desktops or check a mode…">
    <List.Section title={`1. Assign your Spaces · ${count} of 4 ready`} subtitle={regular.length<4?`Only ${regular.length} detected — add desktops in Mission Control`:undefined}>
      <List.Item title="Start here: assign four desktops" icon={Icon.Info} detail={<List.Item.Detail markdown={instructions}/>} actions={<ActionPanel><Action title="Refresh Checks" onAction={()=>setRevision(n=>n+1)}/></ActionPanel>}/>
      {desktopRoles.map(role=>{
        const ready=regular.some(s=>s.id===config.desktopIds[String(role.number)]);
        return <List.Item key={role.number} title={`Desktop ${role.number} · ${role.name}`} subtitle={role.description} icon={{source:ready?Icon.CheckCircle:Icon.Circle,tintColor:ready?Color.Green:Color.Orange}} accessories={[{text:ready?"Ready":"Needs setup"}]} detail={<List.Item.Detail markdown={`# Desktop ${role.number} · ${role.name}\n\n${role.description}\n\n${ready?"This desktop is assigned. Only press Return to replace its assignment.":"Not assigned yet."}\n\n1. Switch to **Desktop ${role.number}** in Mission Control.\n2. Open Raycast and run **wchk** again.\n3. Select this row and press **Return**.\n\nThe Space you are on will become Desktop ${role.number} for all workstation modes. You do not need its internal ID.\n\n${instructions}`}/>} actions={<ActionPanel><Action title={`Assign This Space to Desktop ${role.number}`} onAction={()=>assign(role.number)}/><Action title="Refresh Checks" onAction={()=>setRevision(n=>n+1)}/></ActionPanel>}/>;
      })}
    </List.Section>
    <List.Section title="2. Check mode prerequisites">
      {config.modes.map(mode=>{
        const needs=modeNeeds(config,mode,installed,spaces,presets);
        if(problem)needs.unshift(problem);
        const ready=needs.length===0;
        return <List.Item key={mode.id} title={mode.name} icon={{source:ready?Icon.CheckCircle:Icon.ExclamationMark,tintColor:ready?Color.Green:Color.Orange}} accessories={[{text:ready?"Ready to arrange":"Needs setup"}]} detail={<List.Item.Detail markdown={`# ${mode.name}\n\n${ready?"**Prerequisites ready.** Run **wl** and choose this mode to test its arrangement.":needs.map(n=>`- ${n}`).join("\n")}\n\n## Window destinations\n\n${mode.placements.map(p=>`- **Desktop ${p.desktop}:** ${config.apps.find(a=>a.id===p.app)!.name} — ${p.shape.replaceAll("-"," ")}`).join("\n")}\n\n${mode.minutes?`Focus also needs Session and an existing **${mode.category}** category. Timer length: **${mode.minutes} minutes**. Categories and live window behaviour still need a manual check.`:"Default does not start a timer."}`}/>} actions={<ActionPanel><Action title="Refresh Checks" onAction={()=>setRevision(n=>n+1)}/></ActionPanel>}/>;
      })}
    </List.Section>
    <List.Section title="3. Session categories">
      <List.Item title="Create categories in Session" subtitle={sessionIds.some(id=>installed.has(id))?"Session installed · check categories":"Install Session first"} icon={Icon.Clock} detail={<List.Item.Detail markdown={`# Session categories\n\nIn Session, create these categories once:\n\n${config.modes.filter(m=>m.minutes).map(m=>`- ${m.category}`).join("\n")}\n\nThe setup check cannot read or create Session categories. **fs** passes the category name when starting the timer. **ss** starts a timer without arranging or closing apps.`}/>} />
    </List.Section>
  </List>;
}

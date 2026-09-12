#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const folder=root+'raycast/.config/raycast-workstation/';
// Describes native Raycast hotkeys. Does not configure another keyboard utility.
// Meh means the physical Control+Option+Shift chord, not a remapped Right Option.
export function buildKeymap(config) {
  const hotkeys=config.apps.map(a=>({layer:'Hyper',key:a.key.toUpperCase(),command:a.name,owner:'Applications',bundleId:a.bundleId,optional:!!a.optional}));
  const windows=[['Return','Maximize'],['Delete','Restore'],['Left','Left Half'],['Right','Right Half'],['Up','Top Half'],['Down','Bottom Half'],['D','First Third'],['F','Center Third'],['G','Last Third'],['E','First Two Thirds'],['T','Last Two Thirds'],[',','Move to Previous Space'],['.','Move to Next Space'],['-','Make Smaller'],['=','Make Larger']];
  hotkeys.push(...windows.map(([key,command])=>({layer:'Control+Option',key,command,owner:'Window Management'})),
    {layer:'Hyper',key:'Space',command:'Workmode',owner:'Workmode'},
    ...[['Return','Window Layout'],['F','Focus Session'],['C','Capture'],['V','Clipboard History'],['S','Search Snippets']].map(([key,command])=>({layer:'Meh',key,command,owner:['Clipboard History','Search Snippets'].includes(command)?'Raycast':'Workmode'})),
    ...config.modes.map(m=>({layer:'Meh',key:m.key,command:`DockFlow: ${m.name}`,owner:'Workmode'})));
  const seen=new Set();
  for(const h of hotkeys){const id=h.layer+'+'+h.key;if(seen.has(id))throw new Error('Duplicate hotkey '+id);seen.add(id);}
  for(const key of ['B','V','M'])if(seen.has('Hyper+'+key))throw new Error('Codex owns Hyper+'+key);
  const appAliases={'zen-browser':'zen',ghostty:'gt',finder:'ff',codex:'cx',cursor:'cu',claude:'cl',amp:'amp',obsidian:'ob',edge:'edge',teams:'tm',slack:'sl',word:'wd',excel:'xl',powerpoint:'ppt',finalcut:'fcp',motion:'mot',compressor:'comp',telegram:'tg',t3code:'t3',figma:'fg',affinity:'af'};
  const windowAliases={'Maximize':'wmax','Restore':'wrst','Left Half':'wlh','Right Half':'wrh','Top Half':'wth','Bottom Half':'wbh','First Third':'w13l','Center Third':'w13c','Last Third':'w13r','First Two Thirds':'w23l','Last Two Thirds':'w23r','Move to Previous Space':'wsp','Move to Next Space':'wsn','Make Smaller':'wsm','Make Larger':'wlg'};
  const dockAliases={default:'dff',work:'dwo',code:'dco',author:'dau',design:'dde',innovate:'din',video:'dvi',zen:'dze'};
  const layoutAliases={default:'wff',work:'wwo',code:'wco',author:'wau',design:'wde',innovate:'win',video:'wvi',zen:'wze'};
  const focusAliases={work:'fwo',code:'fco',author:'fau',design:'fde',innovate:'fin',video:'fvi',zen:'fze'};
  const aliases=[
    ...[['workstation','Workmode','hk'],['layouts','Window Layout','wl'],['focus','Focus Session','fs'],['dock','DockFlow Profile','df'],['timers','Session Timer','ss'],['check','Check Workmode Setup','wchk'],['capture','Capture','cs'],['google','Google Workspace','gw']].map(([commandId,command,alias])=>({owner:'Workmode',commandId,command,alias})),
    ...config.modes.map(m=>({owner:'Workmode',commandId:'dock-'+m.id,command:'DockFlow: '+m.name,alias:dockAliases[m.id]})),
    ...config.modes.map(m=>({owner:'Workmode',commandId:'layout-'+m.id,command:'Window Layout: '+m.name,alias:layoutAliases[m.id]})),
    ...config.modes.filter(m=>m.minutes>0).map(m=>({owner:'Workmode',commandId:'focus-'+m.id,command:'Focus Session: '+m.name,alias:focusAliases[m.id]})),
    ...config.apps.map(a=>({owner:'Applications',command:a.name,bundleId:a.bundleId,alias:appAliases[a.id],optional:!!a.optional})),
    ...windows.map(([,command])=>({owner:'Window Management',command,alias:windowAliases[command]})),
    ...[['Clipboard History','clip'],['Search Snippets','snip'],['Search Files','file'],['Search Emoji & Symbols','emo']].map(([command,alias])=>({owner:'Raycast',command,alias}))
  ];
  const usedAliases=new Set();
  for(const {alias} of aliases){
    if(typeof alias!=='string'||!/^[a-z0-9]{2,4}$/.test(alias))throw new Error('Invalid or missing alias');
    if(usedAliases.has(alias))throw new Error('Duplicate alias '+alias);
    usedAliases.add(alias);
  }
  return {hotkeys,aliases};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const config=JSON.parse(readFileSync(folder+'workstation.json'));
  const {hotkeys,aliases}=buildKeymap(config);
  for(const [name,value]of [['hotkeys.json',hotkeys],['aliases.json',aliases]]) {
    const text=JSON.stringify(value,null,2)+'\n';
    if(process.argv.includes('--check')){if(readFileSync(folder+name,'utf8')!==text)throw new Error('Stale '+name);}
    else writeFileSync(folder+name,text);
  }
}

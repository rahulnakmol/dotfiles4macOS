#!/usr/bin/env node
// Native schemas: Karabiner 16.3, Alfred 5.7 bundled examples, Rectangle Pro 3.90 export.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = 'alfred/.config/alfred/Alfred.alfredpreferences/workflows';
const folder = `${bundle}/user.workflow.hyper`;
const readJSON = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const readPlist = (path) => JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', join(root, path)]));
const hyper = ['control', 'option', 'command', 'shift'];
const from = (key_code) => ({ key_code, modifiers: { mandatory: hyper } });
const mapping = (key, to) => ({ type: 'basic', from: from(key), to: [{ ...to, repeat: false }] });
const appAction = (bundle_identifier) => ({ software_function: { open_application: { bundle_identifier } } });
const stroke = (key_code, modifiers) => ({ key_code, modifiers });
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

export function buildKarabiner(base, config) {
  const result = structuredClone(base);
  const profile = result.profiles.find((p) => p.selected) ?? result.profiles[0];
  profile.name = config.profile;
  const launch = config.apps.map((app) => mapping(app.key, appAction(app.bundleId)));
  const nav = [
    ...'1234567890'.split('').map((key) => mapping(key, stroke(key, ['left_control', 'left_option']))),
    mapping('tab', { software_function: { open_application: { frontmost_application_history_index: 1 } } }),
    mapping('grave_accent_and_tilde', stroke('grave_accent_and_tilde', ['left_command'])),
    mapping('up_arrow', stroke('up_arrow', ['left_control'])),
    mapping('down_arrow', stroke('down_arrow', ['left_control'])),
  ];
  // Alias existing Rectangle shortcuts; their original bindings remain usable.
  const windows = [
    mapping('return_or_enter', stroke('return_or_enter', ['left_control', 'left_option'])),
    mapping('delete_or_backspace', stroke('delete_or_backspace', ['left_control', 'left_option'])),
    mapping('comma', stroke('left_arrow', ['left_control', 'left_option'])),
    mapping('period', stroke('right_arrow', ['left_control', 'left_option'])),
    mapping('left_arrow', stroke('left_arrow', ['left_control', 'left_option', 'left_command'])),
    mapping('right_arrow', stroke('right_arrow', ['left_control', 'left_option', 'left_command'])),
  ];
  const rules = profile.complex_modifications.rules.filter((r) => !r.description.startsWith('Hyper:') && !r.description.startsWith('Meh:'));
  profile.complex_modifications.rules = [...rules,
    { description: 'Meh: Right Option becomes Control + Option + Shift', manipulators: [{
      type: 'basic', from: { key_code: 'right_option', modifiers: { optional: ['any'] } },
      to: [{ key_code: 'left_option', modifiers: ['left_control', 'left_shift'] }],
    }] },
    { description: 'Hyper: launch or focus apps', manipulators: launch },
    { description: 'Hyper: navigate apps and desktops', manipulators: nav },
    { description: 'Hyper: size windows and change displays', manipulators: windows },
  ];
  return result;
}

export function buildRectangle(base, config) {
  const result = structuredClone(base);
  const fractionKeys = { '[': 33, ']': 30, '\\': 42, ';': 41, "'": 39 };
  for (const [action, shortcut] of [['first-third', 'firstThird'], ['center-third', 'centerThird'], ['last-third', 'lastThird'], ['first-two-thirds', 'firstTwoThirds'], ['last-two-thirds', 'lastTwoThirds']]) {
    const key = config.windowActions.find((item) => item.id === action)?.key;
    if (!(key in fractionKeys)) throw new Error(`Unsupported fraction key: ${key}`);
    result.shortcuts[shortcut] = { keyCode: fractionKeys[key], modifierFlags: 1966080 };
  }
  let id = 1000;
  const groups = config.layouts.map((layout) => ({
    id: id++, loc: 0, isGroup: true, name: layout.name,
    bringToFront: true, launchApps: layout.launchApps,
    ...(layout.frontmost ? { frontmost: true } : {}),
    children: layout.windows.map(([appId, action]) => ({
      id: id++, loc: 0, display: 0, windowAction: action, titleMatching: 1,
      ...(appId === 'global' ? {} : { bundleId: config.apps.find((a) => a.id === appId).bundleId }),
    })),
  }));
  result.defaults.appSpecs = { string: JSON.stringify(groups) };
  return result;
}

function namedMenu(base, code, category, label) {
  const result=structuredClone(base);
  const ids=new Set(['category-menu','category-open']);
  result.objects=result.objects.filter((o)=>!ids.has(o.uid));
  const inputs=result.objects.filter((o)=>o.type==='alfred.workflow.input.keyword');
  const items=inputs.map((o)=>{
    const destination=result.connections[o.uid][0].destinationuid;
    const action=result.objects.find((a)=>a.uid===destination);
    o.config.text=`${category}: ${label(o)}`;
    return {title:o.config.text,subtitle:`${o.config.keyword} · ${o.config.subtext}`,arg:action.config.url};
  });
  result.objects.push({uid:'category-menu',type:'alfred.workflow.input.listfilter',version:1,config:{keyword:code,argumenttype:1,argumenttrimmode:0,fixedorder:true,items:JSON.stringify(items),matchmode:0,runningsubtext:'',subtext:'Type to filter; Return to run',title:category,withspace:true}},
    {uid:'category-open',type:'alfred.workflow.action.openurl',version:1,config:{browser:'',skipqueryencode:true,skipvarencode:false,spaces:'',url:'{query}'}});
  result.connections['category-menu']=[{destinationuid:'category-open',modifiers:0,modifiersubtext:'',vitoclose:false}];
  result.uidata ??= {};
  result.uidata['category-menu']={xpos:40,ypos:1000};result.uidata['category-open']={xpos:650,ypos:1000};
  result.readme=result.readme.replaceAll('Option + Space','Command + Space');
  const help=`## Short menu\n\nType \`${code}\` to list every ${category.toLowerCase()} action. Results use **${category}: Name**. Existing direct keywords remain available.\n\n`;
  if (!result.readme.includes('## Short menu')) result.readme=result.readme.replace('## Usage',help+'## Usage');
  return result;
}

export function buildGoogleWorkspace(base) {
  const labels={gdoc:'New Document',gsheet:'New Spreadsheet',gslides:'New Presentation',gform:'New Form',gdrive:'Open Drive'};
  return namedMenu(base,'gw','Google Workspace',(o)=>labels[o.uid.replace('-input','')]);
}

export function buildDockflow(base) {
  const result = namedMenu(base,'dp','DockFlow Profile',(o)=>{const id=o.uid.replace('-input','');return id[0].toUpperCase()+id.slice(1);});
  for (const object of result.objects) {
    if (object.type === 'alfred.workflow.trigger.hotkey') object.config.hotmod = 917504;
  }
  return result;
}

export function buildWorkflow(config, dockflow) {
  const objects = [], connections = {}, uidata = {};
  let row = 0;
  const add = (uid, type, objectConfig, version = 1, xpos = 40) => {
    objects.push({ uid, type: `alfred.workflow.${type}`, version, config: objectConfig });
    uidata[uid] = { xpos, ypos: 30 + row++ * 90 };
    return uid;
  };
  const connect = (source, target) => { connections[source] = [{ destinationuid: target, modifiers: 0, modifiersubtext: '', vitoclose: false }]; };
  const hotkey = (uid, key, code, modifiers = 1966080) => add(uid, 'trigger.hotkey', {
    action: 0, argument: 0, hotkey: code, hotmod: modifiers, hotstring: key,
    focusedappvariable: false, focusedappvariablename: '', leftcursor: false,
    modsmode: 0, relatedAppsMode: 0,
  }, 2);
  const dispatch = add('dispatch', 'action.script', {
    concurrently: false, escaping: 0, scriptargtype: 1, scriptfile: '', type: 5,
    script: '/bin/zsh ./dispatch.zsh "$1" 2>&1 || true',
  }, 2, 650);
  const focusItems = config.focusSessions.map((session) => ({ title: `Focus Session: ${session.name}`, subtitle: `${session.apps.map((id) => config.apps.find((a) => a.id === id).name).join(' + ')} · ${session.durationMinutes} min in Session · Quits other regular apps`, arg: `focus:${session.id}` }));
  const timerItems = config.sessionTimers.map((timer) => ({title:`Session Timer: ${timer.name}`,subtitle:'Start Session timer only · Keeps apps and layouts unchanged',arg:`timer:${timer.minutes}`}));
  const items = [
    ...focusItems,
    ...timerItems,
    ...config.apps.map((app) => ({ title: `App Launcher: ${app.name}`, subtitle: `Hyper+${app.key.toUpperCase()} · ${app.optional ? 'Launch or focus when installed' : 'Launch or focus'}`, arg: `app:${app.id}` })),
    ...config.layouts.map((layout) => ({ title: `Window Layout: ${layout.name}`, subtitle: `${layout.description}${layout.launchApps ? ' · Opens apps' : ' · Open apps first'}`, arg: `layout:${layout.name}` })),
    ...config.windowActions.map((action) => ({ title: `Window Action: ${action.name}`, subtitle: `Hyper+${action.key} · ${action.description}`, arg: `window:${action.id}` })),
    { title: 'Hotkeys: Guide', subtitle: 'Keyboard map, desktops, examples and new-Mac setup', arg: 'guide' },
  ];
  const list = (uid, keyword, values, title) => add(uid, 'input.listfilter', {
    argumenttrimmode: 0, argumenttype: 1, fixedorder: true, items: JSON.stringify(values),
    keyword, matchmode: 0, runningsubtext: '', subtext: 'Type to filter; Return to run', title, withspace: true,
  });
  connect(list('menu', 'hk', items, 'Hyper — apps, layouts and windows'), dispatch);
  const focusDispatch = add('focus-dispatch', 'action.script', { concurrently:false, escaping:0, scriptargtype:1, scriptfile:'', type:5, script:'/bin/zsh ./focus-session.zsh "$1" 2>&1 || true' }, 2, 650);
  const focusResult = add('focus-result', 'output.notification', { title:'Hyper', text:'{query}', onlyshowifquerypopulated:true, removeextension:false, lastpathcomponent:false }, 0);
  connect(focusDispatch, focusResult);
  connect(dispatch, focusResult);
  // Sessions have their own path so failures are visible as notifications.
  connect(list('menu-focus', 'fs', focusItems, 'Switch focus session'), focusDispatch);
  connect(list('menu-timers', 'ss', timerItems, 'Session Timer'), dispatch);
  connect(hotkey('menu-hotkey', 'Space', 49), 'menu');
  for (const mode of [...new Set(['work', 'code', 'zen', 'default', ...config.layouts.map(l=>l.mode).filter(Boolean)])]) {
    const selected = config.layouts.filter((l) => l.mode === mode);
    const values = selected.map((l) => items.find((item) => item.arg === `layout:${l.name}`));
    connect(list(`menu-${mode}`, mode, values, `${mode[0].toUpperCase()}${mode.slice(1)} layouts`), dispatch);
  }
  for (const [uid, key, code, value] of [
    ['guide', '/', 44, 'guide'],
    ['previous-space', '−', 27, 'window:prev-space'],
    ['next-space', '=', 24, 'window:next-space'],
  ]) {
    const arg = add(`${uid}-argument`, 'utility.argument', { argument: value, passthroughargument: false, variables: {} });
    connect(hotkey(`${uid}-hotkey`, key, code), arg);
    connect(arg, dispatch);
  }
  // Native Alfred feature hotkeys (A/V/S) are configured by bootstrap; these three belong to the workflow.
  const show = add('show-tool', 'utility.showalfred', { argument: '{query}', leftcursor: false });
  const capture = list('menu-capture', 'cs', config.captureActions.map((a) => ({ title:`Capture: ${a.name}`, subtitle:'CleanShot X · choose before capture', arg:`capture:${a.id}` })), 'CleanShot X capture tools');
  connect(capture, dispatch);
  const toolMenu = list('menu-tools', 'st', config.systemTools.map((a) => ({ title:`System Tool: ${a.name}`, subtitle:a.bundleId ? 'Open the installed workflow menu' : 'Open Alfred search', arg:a.query })), 'System tools');
  connect(toolMenu, show);
  const layoutMenu = list('menu-layouts', 'wl', config.layouts.map((l) => items.find((i) => i.arg === `layout:${l.name}`)), 'Window layouts');
  connect(layoutMenu, dispatch);
  for (const action of config.mehActions.filter((a) => a.owner === 'alfred-workflow')) {
    connect(hotkey(`meh-${action.id}`, action.key, action.keyCode, 917504), `menu-${action.id}`);
  }
  connect(list('menu-apps','al',items.filter((i)=>i.arg.startsWith('app:')),'App Launcher'),dispatch);
  connect(list('menu-windows','wa',items.filter((i)=>i.arg.startsWith('window:')),'Window Action'),dispatch);
  // Separate native List Filters keep old keywords usable without changing hotkey destinations.
  for (const spec of config.menuKeywords.filter((m)=>m.alias)) {
    const primary=objects.find((o)=>o.type==='alfred.workflow.input.listfilter' && o.config.keyword===spec.code);
    const uid=add(`${primary.uid}-alias`,'input.listfilter',{...primary.config,keyword:spec.alias});
    connect(uid,connections[primary.uid][0].destinationuid);
  }
  const shortMenuTable=config.menuKeywords.map((m)=>`| ${m.code} | ${m.name} | ${m.alias ?? 'Existing direct commands'} |`).join('\n');
  const mehTable = config.mehActions.map((a) => `| ${a.key} | ${a.name} |`).join('\n');
  const nativeTable = config.nativeShortcuts.map((a) => `| ${a.key} | ${a.name} |`).join('\n');
  const appTable = config.apps.map((a) => `| ${a.key.toUpperCase()} | ${a.name} |`).join('\n');
  const layoutTable = config.layouts.map((l) => `| ${l.name} | ${l.description} | ${l.launchApps ? 'Yes' : 'No'} |`).join('\n');
  const readme = `# Hyper | Alfred Workflow

A keyboard-first macOS setup for Work, Code and Zen. Hold Caps Lock for **Hyper** (Control+Option+Command+Shift); tap Caps Lock for Escape. Hold Right Option for **Meh** (Control+Option+Shift) and DockFlow numbers. Left Option stays normal. Karabiner's single profile is **${config.profile}**.

## Usage

Press **Hyper+Space** or type \`hyper\` in Alfred, then search for an app, layout or window action. Press Return to run it. **Hyper+/** opens the illustrated guide. Cmd+Space still opens normal Alfred search.

Type \`work\`, \`code\`, \`zen\` or \`default\` to narrow the menu. The selected layout first switches the corresponding DockFlow profile when one is specified, then asks Rectangle Pro to apply its saved layout. These are desktop layouts, not native fullscreen Spaces. No apps are quit and no agent commands are sent.

### Short menus

| Code | Category | Existing alias |
| --- | --- | --- |
${shortMenuTable}

Type the short code to list its actions. Result names use **Category: Name**. For example, \`fs\` lists **Focus Session: Work** and **Focus Session: Code + Amp/Claude/Cursor/Codex**. Direct DockFlow and Google commands remain available in their own workflows. Third-party workflows retain their vendor names and keywords.

Window Layout: Code Amp/Claude/Cursor/Codex opens the full corresponding three-app set, selects DockFlow Code and arranges it without quitting other apps or starting a timer. Amp/Cursor/Codex use Chrome left two-thirds, Ghostty right third and the chosen coding app maximized. Claude uses Obsidian instead of Chrome. Existing macOS Dock assignments decide which desktop each app opens on; Rectangle only sets geometry.

### Session timers

Type \`ss\` to list standalone Session timers: 20- and 25-minute Pomodoro sessions,
30 minutes, 45 minutes and 1 hour. Filter with \`ss 20\`, \`ss 25\`, \`ss 30\`,
\`ss 45\` or \`ss 60\`, then press Return. These send a timer start request only:
no apps are quit, no layouts or DockFlow profiles change. Session owns breathing,
existing-timer prompts, completion and breaks; this does not create an automatic
Pomodoro cycle. Session with Pro URL support must be installed. The 20/25-minute
options use the intention **Pomodoro**; the others use **Focus**.

### Focus sessions

Type \`fs\` in Alfred or search \`Focus Session\` in Hyper+Space. Work opens only Edge and Teams and applies the Work two-thirds/one-third layout. Code + Amp opens Chrome, Ghostty and Amp. Code + Claude opens Obsidian, Ghostty and Claude. Code + Cursor opens Chrome, Ghostty and Cursor. Code + Codex opens Chrome, Ghostty and Codex.

After the apps and Rectangle layouts are ready, Session receives a timer request: **Work 30 minutes**, **all Code variations 45 minutes**. Session (Setapp, direct or App Store edition) must be installed; its URL API requires Pro access. Each selection requests a timer, including reselecting the same session. Session controls any running-timer prompt, breathing preparation and end-of-session behavior. The workflow does not silently finish or abandon timers, quit apps when time expires, or confirm that a delivered URL actually started counting down.

Focus sessions keep the selected app set and quit all other running regular apps, including unrelated apps such as Slack, Mail and Office. Target apps stay open, including shared Chrome/Ghostty when switching variants. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar agents remain available. Save and terminal prompts are respected; a refusal, timeout or app that remains open stops the switch before target launches, layout changes or a timer request. This applies on first use and when reselecting a session.

The first run compiles a small native helper using Apple Command Line Tools; no apps are installed. Use the existing four macOS desktops and app assignments. The reference/terminal pair is tiled left two-thirds/right third on its assigned desktop; the coding app is maximized on its assigned desktop. Rectangle applies sizes but does not create or assign numbered Spaces. Reimport its snapshot after this update. These focus layouts do not open Slack. Existing layout commands and DockFlow number keys remain layout/profile actions and do not quit apps.

### Launch or focus apps

| Hyper + | App |
| --- | --- |
${appTable}

Each app has exactly one direct Hyper shortcut, stable across Work, Code and Zen. A/S/D/F holds Amp, Slack, Chrome and Finder; H/J/K/L holds Ghostty, ChatGPT/Codex, Cursor and Claude. W/E and I/O/P provide Word/Edge and Teams/Excel/PowerPoint. R is Safari and N is Obsidian notes. Media lives on Z/X/C: Final Cut Pro (edit), Motion (animate), Compressor (export). These three keys work where the apps are installed; this setup does not install them. Hyper+Tab returns to the previous app; Hyper+backtick cycles an app's windows.

### Layouts

| Layout | Arrangement | Launch closed apps |
| --- | --- | --- |
${layoutTable}

Agents and Zen resize apps already open: choose Amp or Cursor using its app key first. Layouts match one normal window per app. Multiple documents, multiple browser windows and native fullscreen windows may need manual placement. On small displays, choose a Balanced layout if the app's minimum width prevents thirds.

### Navigation and window controls

Hyper+1…9 switches to Desktop 1…9; Hyper+0 selects Desktop 10. Create the desktop first in Mission Control; a number shortcut does not create a missing Space. Native Control+Left/Right switches adjacent desktops; Hyper brackets belong to window thirds. Hyper+− / = moves the current window to the previous/next desktop using Rectangle's title-bar drag. Hyper+Up opens Mission Control; Hyper+Down shows the current app's windows. Control+arrow Mission Control shortcuts must remain enabled.

Hyper+Return maximizes; Hyper+Backspace restores. Hyper+, / . uses halves. Hyper+left bracket / right bracket / backslash uses left/centre/right thirds; Hyper+; / ' uses left/right two-thirds. Hyper+Left/Right moves the window to the previous/next display. Maximize keeps the menu bar and normal Space rather than creating a native fullscreen Space.

Meh+number selects DockFlow: 0 Default, 1 Work, 2 Code, 3 Author, 4 Create, 5 Video, 9 Zen. In Codex, Hyper+V toggles voice chat and Hyper+M starts dictation. All other Codex actions use their defaults. These two Hyper keys are app-only; focus Codex with Hyper+J first.

## Meh actions

| Meh + | Action |
| --- | --- |
${mehTable}

Meh+A acts on the selected text, URL or file using Alfred Universal Actions. Meh+V searches text clipboard history (24 hours); password-app and concealed-data exclusions remain enabled. Meh+S searches your snippets; personal snippets and clipboard data are not stored in Git.

Meh+C or keyword \`capture\` opens CleanShot X tools. Select an action explicitly; no screen capture or recording starts merely by opening the menu. Your installed Setapp or standalone edition handles the URL. This setup does not upload captures or change CleanShot's own shortcuts.

Meh+Space or \`tools\` opens Audio Switcher, Timer, Caffeine Dose and atop menus by their configured default keywords. If you customize vendor keywords, update scripts/hyper-config.json. Meh+Return or \`layouts\` shows only window layouts. These commands preserve Meh's DockFlow numbers and the approved Hyper map.

## Native macOS base

| Shortcut | Action |
| --- | --- |
${nativeTable}

Native shortcuts depend on macOS version, keyboard and app support. CleanShot X owns capture in this setup; the native screenshot toolbar is a fallback only. Open CleanShot settings to verify its Cmd+Shift+3/4/5 assignments. Cmd+Space belongs to Alfred. Disable Spotlight’s Show Spotlight Search shortcut and clear Raycast’s launcher binding on each Mac before using it.

## Examples

- Work: Meh+1, then Hyper+1 to visit Desktop 1, open Hyper+Space, type Work, choose Work or Work Balanced. Use another desktop for Office or Present.
- Code: Meh+2, then Hyper+1 to visit Desktop 1, apply Code on the communication desktop. Move to another desktop and apply Terminal. Place open Codex/Claude/Cursor/Amp windows on a third desktop and apply Agents.
- Zen: Meh+9, open your chosen editor with Hyper+A or Hyper+K, Ghostty with Hyper+H and Obsidian with Hyper+N. Place them on the same desktop, then apply Zen. Hyper+Tab switches between the two latest apps.
- Restore a misplaced window: Hyper+Return to maximize, or Hyper+Backspace to restore its previous Rectangle geometry.

## Setup

Run bash scripts/bootstrap-hyper.sh plan, then apply, then check. Use rollback with the printed backup directory to undo only that run's managed preference and link changes. Follow the generated per-Mac checklist for activation, permissions, native imports, vendor workflows and physical/login checks.

Install Alfred and Rectangle Pro through Homebrew. Install Karabiner using the official DMG and Karabiner-Elements.pkg from https://karabiner-elements.pqrs.org/. Stow alfred, karabiner and rectangle-pro. Select the ${config.profile} profile and import RectangleProConfig.json. Choose the Stow-backed Alfred preferences folder and enable startup. Complete each app's macOS permissions and license activation directly on each Mac.

Create ordinary desktops in Mission Control with its + button (use four). Run bash scripts/setup-hyper-macos.sh apply to enable Control+Option+1…9/0 and turn off automatic Space rearrangement. Log out and back in after command-line preference changes. The supported workflow is to visit each desktop and apply its layout; this stack cannot reliably reconstruct every window's numbered Space in one command. This Mac already has four desktops and app assignments. Preserve them. On a new Mac, recreate those assignments with Dock > Options > Assign To > This Desktop.

## Customisation

Edit scripts/hyper-config.json in dotfiles, then run node scripts/build-hyper-config.mjs. Reimport the Rectangle snapshot after a layout or shortcut change. App bundle IDs make launches independent of the current Mac's username or app filename. Hyper numbers belong to desktops; Meh numbers belong to DockFlow. New global keys must avoid Rectangle fractions and Codex's app shortcuts.

## Troubleshooting

If Hyper stops working, check Karabiner's selected profile and permissions. If the menu is absent, check Alfred is running with this preferences bundle. If a layout does nothing, check Rectangle is running, activated and has Accessibility, and that the snapshot was imported. A third may overlap when an app enforces a larger minimum width; try Balanced or maximize. A fullscreen window must leave fullscreen before ordinary tiling. Desktop move actions depend on a draggable title bar and macOS Space-switch shortcuts.

## Saved configuration

Owned source is in user.workflow.hyper within the Stow-backed Alfred preferences bundle, with an explicit Git allowlist. Karabiner config is live; Rectangle config is an import snapshot. License, authentication, personal workflow variables, document titles and macOS Space IDs are excluded. Transfer DockFlow presets through its private backup/import flow and verify integration URLs on the second Mac. Commit/push reviewed source to share it; physical storage in dotfiles alone is not remote backup.

Created by **Rahul N Akmol**.
`;
  const cases = [];
  for (const timer of config.sessionTimers) {
    if (!Number.isInteger(timer.minutes) || timer.minutes < 1 || timer.minutes > 1440) throw new Error('Invalid Session timer duration');
    const url=`session:///start?intent=${encodeURIComponent(timer.intent)}&duration=${timer.minutes}`;
    cases.push(`  ${quote(`timer:${timer.minutes}`)}) launch -g ${quote(url)} ;;`);
  }
  for (const app of config.apps) cases.push(`  ${quote(`app:${app.id}`)}) launch -b ${quote(app.bundleId)} ;;`);
  for (const layout of config.layouts) {
    const profile = dockflow.objects.find((o) => o.uid === `${layout.mode}-open`);
    const named = config.dockPresets?.find(p=>p.id===layout.mode);
    const dock = named ? `node "$workflow_dir/dockflow.mjs" apply ${quote(named.id)}\n    ` : profile ? `launch -g ${quote(profile.config.url)}\n    ` : '';
    cases.push(`  ${quote(`layout:${layout.name}`)}) ${dock}launch -g ${quote(`rectangle-pro://execute-layout?name=${encodeURIComponent(layout.name)}`)} ;;`);
  }
  for (const action of config.windowActions) cases.push(`  ${quote(`window:${action.id}`)}) launch -g ${quote(`rectangle-pro://execute-action?name=${action.id}`)} ;;`);
  for (const session of config.focusSessions) cases.push(`  ${quote(`focus:${session.id}`)}) if [[ \"\${HYPER_DRY_RUN:-0}\" == 1 ]]; then printf '%s\\n' ${quote(`focus:${session.id}`)}; else /bin/zsh \"$workflow_dir/focus-session.zsh\" ${quote(session.id)}; fi ;;`);
  for (const action of config.captureActions) cases.push(`  ${quote(`capture:${action.id}`)}) launch ${quote(`cleanshot://${action.command}`)} ;;`);
  cases.push('  guide) launch "$workflow_dir/guide.html" ;;');
  const script = `#!/bin/zsh
# Generated by scripts/build-hyper-config.mjs. Fixed actions only; never eval a query.
set -eu
workflow_dir="\${0:A:h}"
launch() {
  if [[ "\${HYPER_DRY_RUN:-0}" == 1 ]]; then
    printf '%s\\n' "$@"
  else
    /usr/bin/open "$@"
  fi
}
case "\${1:-}" in
${cases.join('\n')}
  *) printf '%s\\n' 'Unknown Hyper action. Open Hyper+Space and choose an item.' >&2; exit 64 ;;
esac
`;
  return { plist: { bundleid: 'com.rahulnakmol.hyper', category: 'Productivity', createdby: 'Rahul N Akmol', description: 'Keyboard-first apps, desktops and window layouts', disabled: false, name: 'Hyper', readme, version: '1.5.0', objects, connections, uidata }, script };
}

function main() {
  const check = process.argv.includes('--check');
  const config = readJSON('scripts/hyper-config.json');
  const karabinerPath = 'karabiner/.config/karabiner/karabiner.json';
  const rectanglePath = 'rectangle-pro/.config/rectangle-pro/RectangleProConfig.json';
  const dockflowPath = `${bundle}/user.workflow.dockflow-profiles/info.plist`;
  const dockflow = buildDockflow(readPlist(dockflowPath));
  const googlePath=`${bundle}/user.workflow.google-workspace/info.plist`;
  const google=buildGoogleWorkspace(readPlist(googlePath));
  const workflow = buildWorkflow(config, dockflow);
  const focusSessions = config.focusSessions.map((session) => ({
    id:session.id,name:session.name,durationMinutes:session.durationMinutes,apps:session.apps.map((id) => {
      const app=config.apps.find((a) => a.id===id);
      if (!app) throw new Error(`Unknown focus app: ${id}`);
      return {id:app.id,name:app.name,bundleId:app.bundleId};
    }),
    dockURL:dockflow.objects.find((o) => o.uid===`${session.mode}-open`)?.config.url ?? null,
    pairLayoutURL:session.pairLayout ? `rectangle-pro://execute-layout?name=${encodeURIComponent(session.pairLayout)}` : null,
    layoutURL:session.layout ? `rectangle-pro://execute-layout?name=${encodeURIComponent(session.layout)}` : null,
  }));
  const outputs = [
    [`${folder}/focus-sessions.json`, JSON.stringify(focusSessions,null,2)+'\n'],
    [karabinerPath, JSON.stringify(buildKarabiner(readJSON(karabinerPath), config), null, 2) + '\n'],
    [rectanglePath, JSON.stringify(buildRectangle(readJSON(rectanglePath), config), null, 2) + '\n'],
    [`${folder}/dispatch.zsh`, workflow.script],
  ];
  for (const [path, text] of outputs) {
    if (check) {
      if (readFileSync(join(root, path), 'utf8') !== text) throw new Error(`Regenerate ${path}`);
    } else {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
  }
  for (const [path, data] of [[`${folder}/info.plist`, workflow.plist], [dockflowPath, dockflow], [googlePath,google]]) {
    if (check) {
      if (JSON.stringify(readPlist(path)) !== JSON.stringify(data)) {
        // plutil changes dictionary ordering; compare canonical JSON recursively.
        const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
          ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v;
        if (JSON.stringify(canonical(readPlist(path))) !== JSON.stringify(canonical(data))) throw new Error(`Regenerate ${path}`);
      }
    } else {
      const xml = execFileSync('plutil', ['-convert', 'xml1', '-o', '-', '--', '-'], { input: JSON.stringify(data) });
      writeFileSync(join(root, path), xml);
    }
  }
  console.log(check ? 'Hyper generated configuration is current.' : 'Hyper configuration generated. Reimport the Rectangle snapshot.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

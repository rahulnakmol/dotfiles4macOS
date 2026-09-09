#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(root + 'scripts/hyper-config.json', 'utf8'));
const escape = (s) => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const key = (s) => `<kbd>${escape(s)}</kbd>`;
const appRows = config.apps.map((a) => `<tr><td>${key('Hyper')} + ${key(a.key.toUpperCase())}</td><td>${escape(a.name)}</td><td>${a.optional ? 'When installed' : 'Launch or focus'}</td></tr>`).join('');
const navRows = config.navigation.map((a) => `<tr><td>${key('Hyper')} + ${key(a.key)}</td><td>${escape(a.name)}</td></tr>`).join('');
const windowRows = config.windowActions.map((a) => `<tr><td>${key('Hyper')} + ${key(a.key)}</td><td>${escape(a.name)}</td></tr>`).join('');
const mehRows = config.mehActions.map((a) => `<tr><td>${key('Meh')} + ${key(a.key)}</td><td>${escape(a.name)}</td></tr>`).join('');
const nativeRows = config.nativeShortcuts.map((a) => `<tr><td>${key(a.key)}</td><td>${escape(a.name)}</td></tr>`).join('');
const codexCommands = { 'composer.startVoiceMode': 'Toggle voice chat · Codex app', 'composer.startDictation': 'Start dictation · Codex app' };
const codexRows = JSON.parse(readFileSync(root + 'codex/.codex/keybindings.json', 'utf8'))
  .filter((b) => b.key?.startsWith('Command+Control+Alt+Shift+'))
  .map((b) => `<tr><td>${key('Hyper')} + ${key(b.key.split('+').at(-1))}</td><td>${escape(codexCommands[b.command] ?? b.command)}</td></tr>`).join('');
const layouts = config.layouts.map((l) => `<tr><td>${escape(l.name)}</td><td>${escape(l.description)}</td><td>${l.launchApps ? 'Yes' : 'Open apps first'}</td></tr>`).join('');

const appName = (id) => config.apps.find((a) => a.id === id).name;
const focusRows = config.focusSessions.map((s) => `<tr><td><code>fs ${escape(s.id)}</code></td><td>Focus Session: ${escape(s.name)}<br>${s.durationMinutes} minutes in Session</td><td>${escape(s.apps.map(appName).join(' + '))}</td><td>${s.id === 'work' ? 'Edge ⅔ · Teams ⅓' : 'Assigned reference desktop: first app ⅔ · Ghostty ⅓<br>Assigned coding desktop: coding app maximized'}</td></tr>`).join('');
const owned = (name) => JSON.parse(execFileSync('plutil', ['-convert','json','-o','-',root + 'alfred/.config/alfred/Alfred.alfredpreferences/workflows/user.workflow.'+name+'/info.plist']));
const dock = owned('dockflow-profiles');
const dockRows = dock.objects.filter((o) => o.type.endsWith('.input.keyword')).map((o) => {
  const mode=o.uid.replace('-input','');
  return [dock.objects.find((h) => h.uid===mode+'-hotkey')?.config.hotstring, o.config.keyword, mode];
});
const googleRows = owned('google-workspace').objects.filter((o) => o.type.endsWith('.input.keyword')).map((o) => [o.config.keyword,o.config.text]);
const table = (headers, rows) => `<table class="key-table"><thead><tr>${headers.map((h)=>'<th>'+escape(h)+'</th>').join('')}</tr></thead><tbody>${rows.map((r)=>'<tr>'+r.map((c)=>'<td>'+escape(c)+'</td>').join('')+'</tr>').join('')}</tbody></table>`;
const catalog = JSON.parse(readFileSync(root+'docs/alfred-workflows.json','utf8')).workflows;
const menuRows=config.menuKeywords.map((m)=>[m.code,m.name,m.alias ?? 'Direct commands unchanged']);
const mouseRows = [
  ['Back · button4', 'Chrome, Safari, Edge and Finder', 'Command+[ · Back'],
  ['Forward · button5', 'Chrome, Safari, Edge and Finder', 'Command+] · Forward'],
  ['Hold Forward · button5', 'Other apps', 'Meh · Control+Option+Shift'],
  ['Hold thumb · button6', 'All apps', 'Hyper · Control+Option+Command+Shift'],
];
const mouseNotes = 'These mappings target the MX Master 3S Bluetooth device (vendor 1133, product 45108). The desktop counts as Finder, so Forward there navigates rather than supplying Meh. Back retains its normal behavior in other apps. Left, right and middle clicks are unchanged. Hold the modifier button while pressing a keyboard key; thumb + H opens Ghostty. On another Mac, verify the device identifiers in Karabiner-EventViewer before enabling the rule; a receiver or different mouse may report different IDs. Physical button behavior still needs user testing.';
const keywordRows = [...menuRows.map(([code,name])=>[code,name+' menu']),['hyper','All apps, focus sessions, layouts and window actions'],['fs work','Work: Edge and Teams'],['fs amp','Code: Amp, Ghostty and Chrome'],['fs claude','Code: Claude, Ghostty and Obsidian'],['fs cursor','Code: Cursor, Ghostty and Chrome'],['fs codex','Code: Codex, Ghostty and Chrome'],['work / code / zen / default','Layout menus; do not quit apps'],['layouts','All named Rectangle layouts'],['capture','CleanShot X capture menu'],['tools','Audio, timers, keep-awake, activity and settings'],...googleRows];
const mdTable = (headers,rows) => [headers,headers.map(()=> '---'),...rows].map((r)=>'| '+r.map((c)=>String(c).replaceAll('|','\\|').replaceAll('\n',' ')).join(' | ')+' |').join('\n');
const manual = `# macOS Hotkeys

Your Hyperland manual. Hold **Caps Lock** for Hyper (Control + Option + Command + Shift); tap it for Escape. Hold **Right Option** for Meh (Control + Option + Shift). Left Option stays normal.

Open **Hyper+/** for the searchable visual guide, or view [the standalone page](hotkeys.html). This reference is generated from the same configuration as the workflows.

## Short workflow menus

${mdTable(['Code','Category','Existing alias'],menuRows)}

Type a code by itself to list its actions, then type a name to filter. Titles use **Category: Name**, for example **Focus Session: Code + Amp**, **Window Layout: Work**, and **DockFlow Profile: Code**. Long menu aliases and direct Google/DockFlow keywords still work. The convention applies to dotfiles-owned workflows; third-party workflows retain their vendor names and configurable keywords.

## Standalone Session timers

Type **ss** in Alfred to list timers. Press Return after selecting one.

${mdTable(['Alfred filter','Timer','Intention'],config.sessionTimers.map((t)=>['ss '+t.minutes,t.name,t.intent]))}

These start only a Session timer. They do not quit apps, change DockFlow or arrange
windows. Session controls existing-timer prompts, breathing, completion and breaks;
20/25-minute Pomodoro options do not configure an automatic work/break cycle.
Requires an installed Session edition with Pro URL automation.

## Focus sessions

${mdTable(['Alfred command','Session','Minutes','Apps'],config.focusSessions.map((s)=>['fs '+s.id,'Focus Session: '+s.name,s.durationMinutes,s.apps.map(appName).join(' + ')]))}

Work uses Edge on the left two-thirds and Teams on the right third. Code has four variations, using your existing app assignments across **four ordinary macOS desktops**:

- Reference desktop: Chrome (Amp/Cursor/Codex) or Obsidian (Claude) on the left two-thirds; Ghostty on the right third.
- Coding desktop: the chosen Amp, Claude, Cursor or Codex app maximized.

This Mac already has four desktops and its app assignments configured. Preserve them. On a new Mac create four desktops and restore the Dock → Options → Assign To → This Desktop assignments. Rectangle applies geometry on the assigned desktops; it does not create or reassign Spaces. Native fullscreen is not used.

Focus sessions keep the selected app set and quit all other running regular apps, including unrelated apps such as Slack, Mail and Office. Target apps stay open, including shared Chrome/Ghostty when switching variants. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar agents remain available. Save and terminal prompts are respected; a refusal, timeout or app that remains open stops the switch before target launches, layout changes or a timer request. This applies on first use and when reselecting a session.

After app launches and Rectangle layout requests succeed, the workflow sends Session one start request: **Work 30 minutes; every Code variation 45 minutes**. The intention is **Focus Session: Name**. Session must be installed before any app quits; Setapp, direct and App Store editions are supported, and its URL API requires Pro access. Each selection requests a timer, including reselecting the active session. Existing-timer prompts, breathing preparation, pause, completion and breaks remain controlled by Session. Timer delivery is not a countdown acknowledgement. The workflow never automatically retries timer starts, finishes/abandons a timer, or quits your apps when the timer expires. On a new Mac install/activate Session and test its [documented URL API](https://www.stayinsession.com/learn/session-url-scheme); its preferences and history remain outside dotfiles.

The compiled helper and switch lock live in ~/Library/Caches/com.rahulnakmol.hyper, outside Git. Missing target apps stop the switch before any quits. Failed launches can leave a partially opened session; retry. Apple Command Line Tools compile the helper on first use. This switches apps and layouts; it does not change macOS notification Focus modes.

## Launching apps

${mdTable(['Hyper +','App'],config.apps.map((a)=>[a.key.toUpperCase(),a.name+(a.optional?' (when installed)':'')]))}

Each app has one direct shortcut. Final Cut Pro, Motion and Compressor are mapped but not installed by this setup.

## Navigation and Spaces

${mdTable(['Hyper +','Action'],config.navigation.map((a)=>[a.key,a.name]))}

Hyper+1…9/0 selects existing Desktops 1…10. It does not create them. Hyper+Space opens the menu; Hyper+/ opens this manual. Use Control+Left/Right for neighboring desktops. Run the Mission Control helper during new-Mac setup and log out/in to activate its changes.

## Windows and displays

${mdTable(['Hyper +','Action','Notes'],config.windowActions.map((a)=>[a.key,a.name,a.description]))}

Maximize fills the current desktop without creating a native fullscreen Space. Layouts size windows; native Dock assignments provide the two-desktop placement. Multiple restored windows and slow app startup may need reapplying a layout from Meh+Return.

## Shared tools with Meh

${mdTable(['Meh +','Action'],config.mehActions.map((a)=>[a.key,a.name]))}

Universal Actions uses selected text, URLs or files. Clipboard stores text for 24 hours with concealed data and password-app exclusions; images/files are off. Snippet contents stay private. Meh+Up retains Rectangle’s maximize-height shortcut.

## MX Master mouse

${mdTable(['Button','Context','Action'],mouseRows)}

${mouseNotes}

## DockFlow profiles

${mdTable(['Meh +','Alfred keyword','Profile'],dockRows)}

DockFlow numbers change the Dock profile only. They do not quit apps or switch focus sessions. Focus commands select the Work or Code Dock profile automatically. Transfer DockFlow profiles privately on each Mac; their integration links may need updating.

## Alfred keywords

${mdTable(['Keyword','Action'],keywordRows)}

${mdTable(['System tools entry','Alfred query'],config.systemTools.map((a)=>[a.name,a.query]))}

Utility workflows must be installed; the bootstrap checks their IDs. Google Workspace keywords use browser shortcuts, not Google Drive desktop indexing.

## Installed workflow reference

${catalog.map((w)=>'- ['+w.name+']('+w.galleryUrl+')').join('\n')}

These links document vendor-specific actions and configurable keywords. Third-party workflow source, credentials and personal settings remain outside Git. The shared Meh tools above provide the stable entry points.

## Capture with CleanShot X

${mdTable(['Capture menu entry','CleanShot command'],config.captureActions.map((a)=>[a.name,a.command]))}

Meh+C opens the menu without starting a capture. On this Mac, Cmd+Shift+3 captures fullscreen, Cmd+Shift+4 captures an area and Cmd+Shift+5 opens All-in-One. Verify these assignments and enable CleanShot at login on another Mac. The workflow adds no automatic upload. Use the installed Setapp or standalone edition.

## Named layouts

${mdTable(['Layout','Arrangement','Launch closed apps'],config.layouts.map((l)=>[l.name,l.description,l.launchApps?'Yes':'No']))}

Window Layout: Code Amp/Claude/Cursor/Codex opens the full corresponding three-app set, selects DockFlow Code and arranges it without quitting other apps or starting a timer. Amp/Cursor/Codex use Chrome left two-thirds, Ghostty right third and the chosen coding app maximized. Claude uses Obsidian instead of Chrome. Existing macOS Dock assignments decide which desktop each app opens on; Rectangle only sets geometry.

The older Code/Code Balanced communication layouts include Slack. Focus Code uses the separate Code Browser/Code Notes and Code Amp/Claude/Cursor/Codex layouts. Applying an ordinary layout never quits a focus session.

## Native macOS shortcuts

${mdTable(['Shortcut','Action'],config.nativeShortcuts.map((a)=>[a.key,a.name]))}

Alfred’s configured launcher is Cmd+Space. Disable Spotlight’s Show Spotlight Search shortcut and clear Raycast’s launcher binding so Alfred is the sole owner of Cmd+Space. Hardware/Fn behavior varies by keyboard. Native Codex shortcuts remain at defaults; Hyper+V is voice chat and Hyper+M dictation while Codex is focused.

## Terminal and editor reference

Ghostty uses its native app shortcuts; this setup adds no global terminal key overrides. Your tmux configuration has its own Ctrl+A prefix and Option+arrow pane navigation. See [tmux source](../tmux/.config/tmux/tmux.conf), [Ghostty source](../ghostty/.config/ghostty/config) and [module documentation](modules/) for their complete local settings. Native app menus remain the source for editor-specific shortcuts.

## New Mac, checks and rollback

Run from the dotfiles clone:

\`\`\`sh
bash scripts/bootstrap-hyper.sh plan
bash scripts/bootstrap-hyper.sh apply
bash scripts/bootstrap-hyper.sh check
# Undo only the changes recorded by a bootstrap run:
bash scripts/bootstrap-hyper.sh rollback BACKUP_DIRECTORY
\`\`\`

Follow [the bootstrap guide](modules/hyper-bootstrap.md) for Homebrew, Stow, permissions, licenses, login, vendor workflows and rollback boundaries. Set the per-Mac Dock desktop assignments above. Source tests cannot prove physical keys, native app assignments, a fresh login or behavior on a second Mac. Focus quit/launch behavior is tested with substitutes; a live session switch still requires acceptance with saved work.

## Maintain the manual

Edit scripts/hyper-config.json, then regenerate:

\`\`\`sh
node scripts/build-hyper-config.mjs
node scripts/render-hyper-guide.mjs
node --test scripts/test-focus-sessions.mjs scripts/test-hyper-bootstrap.mjs scripts/test-hyper-config.mjs scripts/test-launcher-config.mjs scripts/test-codex-policy.mjs scripts/test-mx-master-config.mjs
\`\`\`

The HTML page, Alfred guide and Markdown reference are generated together. Reimport Rectangle after layout changes. Source is Stow-backed; app licenses, clipboard, snippets and runtime state are not committed.

Structure inspired by [Omarchy’s Hotkeys manual](https://learn.omacom.io/2/the-omarchy-manual/53/hotkeys). Behavior uses [Apple’s normal quit API](https://developer.apple.com/documentation/appkit/nsrunningapplication/terminate()) and [Rectangle’s supported layout API](https://rectangleapp.com/pro/docs/url-api/).

Created by Rahul N Akmol.
`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hotkeys — Hyperland macOS manual</title>
<style>
:root{color-scheme:dark;--bg:#24273a;--panel:#1e2030;--line:#494d64;--text:#cad3f5;--muted:#a5adcb;--accent:#8bd5ca;--blue:#8aadf4;--pink:#f5bde6;--peach:#f5a97f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--accent);text-underline-offset:3px}button,input{font:inherit}button{cursor:pointer}main{max-width:1200px;margin:auto;padding:56px 40px 90px}nav{display:flex;gap:24px;border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:50px;font-size:14px;flex-wrap:wrap}nav a{color:var(--muted);text-decoration:none}.eyebrow{color:var(--accent);text-transform:uppercase;letter-spacing:.15em;font-size:12px;font-weight:700}.hero{display:grid;grid-template-columns:1.4fr 1fr;gap:50px;align-items:center}h1{font-size:clamp(70px,10vw,126px);line-height:.95;letter-spacing:-.065em;margin:20px 0 30px;font-weight:650}h2{font-size:32px;letter-spacing:-.035em;line-height:1.2;margin:0 0 18px}h3{font-size:20px;line-height:1.35;margin:0 0 12px}p{margin:0 0 18px}.lead{font-size:23px;line-height:1.5;max-width:660px}.muted,small{color:var(--muted)}section{margin-top:65px;scroll-margin-top:28px}.caps{background:var(--panel);border:1px solid var(--line);border-bottom:9px solid #181926;border-radius:24px;min-height:225px;padding:32px;display:flex;flex-direction:column;justify-content:space-between;transform:rotate(-3deg)}.caps strong{font-size:34px;letter-spacing:-1px}.caps .mods{display:flex;gap:15px;color:var(--accent);font-size:25px}.caps small{font-size:14px}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:38px}.quick article,.card{border:1px solid var(--line);border-radius:15px;background:var(--panel);padding:21px}.quick article p{margin:12px 0 0;font-size:14px;color:var(--muted)}kbd{display:inline-block;font:600 13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid #5b6078;border-bottom-width:3px;border-radius:6px;background:#363a4f;padding:2px 7px;white-space:nowrap}.callout{border-left:3px solid var(--peach);padding:4px 0 4px 20px;margin:24px 0;color:var(--muted)}.callout strong{color:var(--text)}.tabs{display:flex;gap:8px;margin:25px 0}.tabs button{color:var(--text);border:1px solid var(--line);padding:9px 22px;border-radius:30px;background:var(--panel)}.tabs button[aria-selected=true]{background:var(--accent);color:#181926;border-color:var(--accent);font-weight:700}.spaces{display:grid;grid-template-columns:repeat(3,1fr);gap:17px}.space{border:1px solid var(--line);border-radius:16px;padding:18px;background:var(--panel)}.space .label{display:flex;justify-content:space-between;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:16px}.screen{height:165px;border:5px solid #363a4f;border-radius:9px;display:flex;gap:3px;padding:4px;background:#181926;overflow:hidden}.pane{display:flex;align-items:center;justify-content:center;border-radius:4px;background:var(--blue);color:#181926;font-weight:650;text-align:center;font-size:14px;line-height:1.35;flex:1;padding:8px}.pane.wide{flex:2}.pane.alt{background:var(--pink)}.pane.zen{background:var(--accent)}.space p{font-size:14px;color:var(--muted);margin:16px 0 0}.workspace-intro{color:var(--muted);max-width:850px}.two{display:grid;grid-template-columns:1fr 1fr;gap:28px}.search{width:100%;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:12px;padding:14px 18px;margin:8px 0 20px}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th{text-align:left;text-transform:uppercase;font-size:11px;letter-spacing:.1em;color:var(--muted);padding:12px 10px;border-bottom:1px solid var(--line)}td{padding:11px 10px;border-bottom:1px solid #363a4f;vertical-align:top}tr[hidden]{display:none}td:first-child{white-space:nowrap}.step{display:grid;grid-template-columns:36px 1fr;gap:15px;margin:22px 0}.step b.number{width:30px;height:30px;border-radius:50%;background:var(--accent);color:#181926;text-align:center;line-height:30px;font-size:14px}.step p{margin-bottom:8px}pre{overflow:auto;padding:20px;border:1px solid var(--line);background:var(--panel);border-radius:12px;font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap}ul{padding-left:22px}li{margin:8px 0}.research-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.research-grid p{font-size:15px}.tag{display:inline-block;padding:3px 8px;border:1px solid var(--line);border-radius:6px;color:var(--muted);font-size:12px;margin-bottom:12px}.sources{display:grid;grid-template-columns:1fr 1fr;gap:8px 30px;font-size:13px}.sources a{display:block}.footer{margin-top:65px;padding-top:24px;border-top:1px solid var(--line);display:flex;justify-content:space-between;color:var(--muted);font-size:13px;gap:20px}.no-results{display:none;color:var(--muted)}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid var(--peach);outline-offset:4px}
@media(max-width:780px){main{padding:30px 22px 60px}.hero,.two,.research-grid{grid-template-columns:1fr}.caps{display:none}.quick{grid-template-columns:repeat(2,1fr)}.spaces{grid-template-columns:1fr}.screen{height:180px}.sources{grid-template-columns:1fr}.lead{font-size:20px}.footer{display:block}nav{gap:16px;margin-bottom:28px}}
@media print{body{background:white;color:#17202b;font-size:11px}main{padding:0;max-width:none}nav,.tabs,.search,.print-hide{display:none}.hero{display:block}h1{font-size:50px}.caps{display:none}section{margin-top:26px;break-inside:avoid}h2{font-size:22px}.quick,.spaces,.two,.research-grid{break-inside:avoid}.quick article,.card,.space,pre{background:#fafafa;border-color:#ccc}kbd{color:#111;background:#eee;border-color:#ccc}.muted,small,.space p,.workspace-intro,.callout{color:#444}.footer{margin-top:20px}a{color:#164d58}td,th{border-color:#ddd}.sources{font-size:10px}}
</style></head><body><main>
<nav aria-label="Guide sections"><a href="#start">Start</a><a href="#focus">Focus sessions</a><a href="#desktops">Desktops</a><a href="#keys">Keys</a><a href="#tools">Meh tools</a><a href="#mouse">Mouse</a><a href="#commands">Commands</a><a href="#native">Native keys</a><a href="#layouts">Layouts</a><a href="#setup">New Mac</a><a href="#research">Research</a></nav>
<header class="hero" id="start"><div><div class="eyebrow">macOS · Hyperland · Rahul N Akmol</div><h1>Hotkeys.</h1><p class="lead">Work, Code, Zen.<br>One keyboard vocabulary across your Macs.</p><p class="muted">An Omarchy-inspired setup using Karabiner, Alfred, Rectangle Pro and your existing DockFlow profiles. Hold Caps Lock for Hyper; tap it for Escape. Right Option is Meh (⌃⌥⇧) for shared tools and DockFlow. Left Option stays normal.</p></div><div class="caps" aria-label="Hold Caps Lock for Control Option Command Shift"><strong>Caps Lock</strong><div class="mods"><span>⌃</span><span>⌥</span><span>⌘</span><span>⇧</span></div><small>Hold → Hyper &nbsp; / &nbsp; Tap → Escape</small></div></header>
<div class="quick"><article>${key('Hyper')} + ${key('Space')}<p>Search every app and layout.</p></article><article>${key('Hyper')} + ${key('H')}<p>Open or focus Ghostty.</p></article><article>${key('Hyper')} + ${key('Return')}<p>Maximize on this desktop.</p></article><article>${key('Hyper')} + ${key('Tab')}<p>Return to the previous app.</p></article></div>
<section id="focus"><div class="eyebrow">Work + four Code variations</div><h2>Focus sessions</h2><p>Type <code>fs</code> in Alfred or search for a focus session in Hyper+Space. Starting a session quits all other regular apps before opening the chosen set, retaining the desktop shell and workflow utilities. A normal save or terminal prompt can stop the switch; there is no force quit.</p><div class="table-scroll"><table class="key-table"><thead><tr><th>Command</th><th>Session</th><th>Apps</th><th>Arrangement</th></tr></thead><tbody>${focusRows}</tbody></table></div><div class="two"><article class="card"><h3>Assigned desktop · reference + terminal</h3><div class="screen"><div class="pane wide">Chrome<br>or Obsidian<br>⅔</div><div class="pane alt">Ghostty<br>⅓</div></div></article><article class="card"><h3>Assigned desktop · coding</h3><div class="screen"><div class="pane">Amp / Claude / Cursor / Codex<br>Maximized</div></div></article></div><p class="callout"><strong>Four existing desktops:</strong> this Mac already has app assignments. Preserve them. On a new Mac create four desktops and restore the same Dock → Options → Assign To → This Desktop assignments. Rectangle sizes windows on their assigned desktops and does not create or reassign Spaces. Native fullscreen is not used.</p><p>Focus sessions keep the selected app set and quit all other running regular apps, including unrelated apps such as Slack, Mail and Office. Target apps stay open, including shared Chrome/Ghostty when switching variants. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar agents remain available. Save and terminal prompts are respected; a refusal, timeout or app that remains open stops the switch before target launches, layout changes or a timer request. This applies on first use and when reselecting a session.</p><p><strong>Session timers:</strong> Work requests 30 minutes; all Code variations request 45 minutes after apps and layouts are ready. Each selection requests a timer, including reselecting the active session. Session owns existing-timer prompts, breathing preparation, completion and breaks. No automatic timer retries, finish/abandon commands or app quits at expiry. Install and activate Session on each Mac (Setapp, direct or App Store edition); URL automation requires Pro. A delivered request does not confirm the countdown started. <a href="https://www.stayinsession.com/learn/session-url-scheme">Session URL API</a>.</p><p>The first run compiles a native helper using Apple Command Line Tools. Its binary and switch lock stay in this Mac’s cache. These are app sessions; macOS notification Focus modes are unchanged.</p></section>
<section id="mouse"><div class="eyebrow">MX Master 3S · Bluetooth</div><h2>Mouse navigation and modifiers</h2>${table(['Button','Context','Action'],mouseRows)}<p>${escape(mouseNotes)}</p></section>
<section id="commands"><div class="eyebrow">Searchable Alfred commands</div><h2>Commands and DockFlow</h2><h3>Short workflow menus</h3>${table(['Code','Category','Existing alias'],menuRows)}<p>Result names use <strong>Category: Name</strong>. Type <code>fs</code> to list every focus session, such as <strong>Focus Session: Code + Amp</strong>. Existing keywords remain aliases. Vendor workflows keep their own names and keywords.</p>${table(['Keyword','Action'],keywordRows)}<p>Window Layout: Code Amp/Claude/Cursor/Codex opens the full corresponding three-app set, selects DockFlow Code and arranges it without quitting other apps or starting a timer. Amp/Cursor/Codex use Chrome left two-thirds, Ghostty right third and the chosen coding app maximized. Claude uses Obsidian instead of Chrome. Existing macOS Dock assignments decide which desktop each app opens on; Rectangle only sets geometry.</p><h3>Standalone Session timers</h3>${table(['Alfred filter','Timer','Intention'],config.sessionTimers.map((t)=>['ss '+t.minutes,t.name,t.intent]))}<p>Timer only: no app quits, DockFlow changes or window arrangement. Session owns existing-timer prompts, breathing, completion and breaks. Pomodoro presets do not create an automatic work/break cycle.</p><h3>DockFlow profiles</h3>${table(['Meh +','Keyword','Profile'],dockRows)}<p>DockFlow number keys change the Dock only. Use the explicit focus commands when you want apps to quit.</p><h3>Installed workflow reference</h3><div class="sources">${catalog.map((w)=>`<a href="${escape(w.galleryUrl)}">${escape(w.name)}</a>`).join('')}</div><p>Vendor pages document each workflow’s full commands and configurable keywords. Personal settings remain outside Git.</p><h3>System tools</h3>${table(['Tool','Query'],config.systemTools.map((a)=>[a.name,a.query]))}<h3>CleanShot menu</h3>${table(['Capture action','Command'],config.captureActions.map((a)=>[a.name,a.command]))}</section>
<section id="desktops"><div class="eyebrow">A place for each kind of work</div><h2>Desktop navigation and general layouts</h2><p class="workspace-intro">Use ordinary macOS desktops. Arrange each one, then select them with Hyper+1, 2, 3… (0 selects Desktop 10), or move between neighbours with native Control+Left and Control+Right. Create each desktop first using Mission Control’s + button. App keys keep the same meaning in every mode.</p>
<div class="tabs" role="tablist" aria-label="Workspace mode"><button role="tab" id="tab-work" aria-selected="true" aria-controls="workspace" data-mode="work">Work</button><button role="tab" id="tab-code" aria-selected="false" aria-controls="workspace" data-mode="code">Code</button><button role="tab" id="tab-zen" aria-selected="false" aria-controls="workspace" data-mode="zen">Zen</button></div>
<div id="workspace" role="tabpanel" aria-labelledby="tab-work" aria-live="polite"></div>
<div class="callout"><strong>Maximized is different from native fullscreen.</strong> Maximized windows can share a normal desktop, overlap and tile. Native fullscreen creates a separate Space. Rectangle layouts do not automatically recover numbered Space placement; move windows to the intended desktop before applying its layout.</div>
</section>
<section id="keys"><div class="eyebrow">Muscle memory, with a searchable fallback</div><h2>The key map</h2><p>Hold Caps Lock with the key below. App keys launch or focus without opening an extra agent session. Hyper+/ returns to this guide.</p><label for="key-search" class="muted">Search all shortcut and command tables</label><input class="search" id="key-search" type="search" placeholder="Try: focus, Claude, capture, thirds…" autocomplete="off">
<div class="two"><div><h3>Apps</h3><div class="table-scroll"><table class="key-table"><thead><tr><th>Shortcut</th><th>App</th><th>Action</th></tr></thead><tbody>${appRows}</tbody></table></div><p class="muted" style="margin-top:16px;font-size:13px">A/S/D/F = Amp, Slack, Chrome, Finder. H/J/K/L = Ghostty, Codex, Cursor, Claude. W/E = Word/Edge; I/O/P = Teams/Excel/PowerPoint. R = Safari; N = Obsidian notes. Z/X/C = Final Cut Pro, Motion, Compressor: edit → animate → export. Creative app keys work where installed; no apps are installed by this setup. One direct key per app. On this Mac, ChatGPT is the installed Codex host. Letters prioritize apps and voice; punctuation and arrows control windows. Native Control+Left/Right switches adjacent desktops.</p></div><div><h3>Navigation & windows</h3><div class="table-scroll"><table class="key-table"><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>${navRows}${windowRows}${codexRows}</tbody></table></div></div></div>
<p class="no-results" id="no-results">No matching shortcut. Clear the search to see the full map.</p><p class="callout"><strong>Meh chooses your Dock; Hyper chooses your desktop.</strong> Hold Right Option for Meh (Control+Option+Shift). Meh+0/1/2/3/4/5/9 switches DockFlow Default/Work/Code/Author/Create/Video/Zen. Inside Codex, Hyper+V toggles voice chat and Hyper+M starts dictation. Other Codex actions use their defaults. Hyper+J focuses Codex first. Cmd+Space still opens normal Alfred.</p></section>
<section id="tools"><div class="eyebrow">Right Option · Control + Option + Shift</div><h2>Shared actions with Meh</h2><table class="key-table"><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>${mehRows}</tbody></table><p class="callout">Select text, a URL or file before Meh+A. Clipboard history is plain text for 24 hours, with password-app and concealed-content exclusions. Meh+S searches your own snippets; their contents and history remain local.</p><p>Meh+C opens the CleanShot X menu: all-in-one, area, window, recording, scrolling capture, OCR, annotation and history. Nothing is captured merely by opening the menu. CleanShot uses your existing settings; the workflow adds no automatic cloud upload. Its Setapp and standalone editions use the same URL scheme.</p><p>Meh+Space opens Audio Switcher, Timer, Caffeine Dose and atop through their default keywords. Meh+Return opens only the layout list. Alfred keywords <code>capture</code>, <code>tools</code> and <code>layouts</code> provide searchable alternatives.</p></section>
<section id="native"><div class="eyebrow">Keep macOS and app defaults</div><h2>The native foundation</h2><table class="key-table"><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>${nativeRows}</tbody></table><p class="callout">CleanShot X is the capture owner. Cmd+Shift+3/4/5 are familiar capture keys, but their exact actions must be verified in your CleanShot settings. This setup leaves those assignments intact. Hardware/Fn shortcuts depend on the keyboard and macOS release. Native screenshot controls remain a fallback, not the recommended capture tool.</p><p><a href="https://support.apple.com/en-us/102650">Apple keyboard reference</a> · <a href="https://cleanshot.com/docs-api">CleanShot URL API</a> · <a href="https://www.alfredapp.com/help/features/universal-actions/">Alfred Universal Actions</a></p></section>
<section id="layouts"><div class="eyebrow">Alfred → DockFlow → Rectangle Pro</div><h2>Choose a layout by name</h2><p>Open Hyper+Space and type a name, or type <code>work</code>, <code>code</code>, <code>zen</code> or <code>default</code> in Alfred. A layout with an associated mode switches its DockFlow profile before applying the geometry. Terminal leaves the Dock profile alone.</p><div class="table-scroll"><table class="key-table"><thead><tr><th>Layout</th><th>Arrangement</th><th>Opens closed apps</th></tr></thead><tbody>${layouts}</tbody></table></div><p class="callout"><strong>On a small screen:</strong> Teams or Slack may refuse a narrow third. Use Work Balanced / Code Balanced, or maximize. Agents and Zen arrange the apps already open so you can choose Amp or Cursor. One ordinary window per matching app is targeted; extra windows and documents need deliberate placement.</p></section>
<section id="setup"><div class="eyebrow">Same source, each Mac configured deliberately</div><h2>Set up your Air or Pro</h2><p>Use the backed-up bootstrap for managed links and the six Meh actions:</p><pre>bash scripts/bootstrap-hyper.sh plan
bash scripts/bootstrap-hyper.sh apply
bash scripts/bootstrap-hyper.sh check
# To undo one run:
bash scripts/bootstrap-hyper.sh rollback BACKUP_DIRECTORY</pre><p>Start with Homebrew and Git, clone dotfiles, then run apply. The script installs missing Node/Stow, Alfred and Rectangle Pro. Install Karabiner using the official DMG and PKG installer from karabiner-elements.pqrs.org. CleanShot may come from Setapp or a separate installation; no duplicate copy is installed. Follow <code>docs/modules/hyper-bootstrap.md</code> for native imports, Gallery workflows, licenses, permissions and rollback boundaries.</p>
<div class="step"><b class="number">1</b><div><h3>Install and link</h3><p>Use Homebrew, then Stow the three modules. Back up any existing conflicting configurations first.</p><pre>brew install --cask alfred rectangle-pro
cd ~/.dotfiles
stow -n -v alfred karabiner rectangle-pro
stow alfred karabiner rectangle-pro</pre></div></div>
<div class="step"><b class="number">2</b><div><h3>Connect the apps to their source</h3><p>Alfred preferences folder: <code>~/.config/alfred</code>. Karabiner profile: <strong>Hyperland</strong>. Rectangle Pro → App Settings → Import Config: <code>~/.config/rectangle-pro/RectangleProConfig.json</code>.</p><p class="muted">Activate licenses and grant required permissions on each Mac. Keep Alfred, Rectangle Pro and DockFlow enabled at login. Karabiner runs through its background services. Disable Raycast's Hyper remapper.</p></div></div>
<div class="step"><b class="number">3</b><div><h3>Make desktop navigation predictable</h3><pre>bash scripts/setup-hyper-macos.sh plan
bash scripts/setup-hyper-macos.sh apply
bash scripts/setup-hyper-macos.sh check</pre><p>This backs up the managed Mission Control settings, enables Control+Option+1…9/0, disables automatic desktop rearrangement and enables switching to an app's existing Space. Log out and back in after applying it. It does not create desktops or move windows.</p><p>Create ordinary desktops with Mission Control’s + button; use four. Number shortcuts select existing desktops only. In Keyboard Shortcuts → Mission Control, enable Control+Left/Right and Control+Up/Down. Restore your four-desktop app assignments with Dock → Options → Assign To → This Desktop. This Mac is already configured.</p></div></div>
<div class="step"><b class="number">4</b><div><h3>Transfer presets, then check your hands</h3><p>Transfer DockFlow presets with its private Backup & Restore flow. Compare Integrations URLs and update the owned DockFlow workflow if UUIDs changed. Regenerate Hyper afterward.</p><p>Test physical Caps+H/F/J, Space, Return, 1/2/3, ;/', display arrows, Right Option+1/2, and window moving; then test after a fresh login. Display size and app minimum widths still matter. The built-in-screen baseline uses proportions and leaves the destination monitor unchanged.</p></div></div>
<div class="card"><h3>Keep the configuration current</h3><p>Edit <code>scripts/hyper-config.json</code> in dotfiles.</p><pre>node scripts/build-hyper-config.mjs
node scripts/render-hyper-guide.mjs
node --test scripts/test-launcher-config.mjs scripts/test-hyper-config.mjs</pre><p class="muted">Reimport Rectangle after layout or shortcut changes. Alfred and Karabiner read their live Stow-backed source. Commit and push reviewed files to share them; Git ignores licenses, credentials, local workflow variables and runtime data.</p></div></section>
<section id="research"><div class="eyebrow">Decision & evidence · checked 8 September 2026</div><h2>What this setup can promise</h2><p><strong>Decision:</strong> stable app shortcuts, native desktops and proportional layouts. The alternatives are disconnected app-specific shortcuts or a separate tiling-manager migration. This choice retains your existing tools and DockFlow habits, with a manual placement step for native Spaces.</p>
<div class="research-grid"><article class="card"><span class="tag">Reference design</span><h3>Omarchy's structure</h3><p>A launcher, direct app keys, window commands and workspace navigation form a consistent vocabulary. The macOS implementation follows that structure while keeping your existing bindings. <a href="https://learn.omacom.io/2/the-omarchy-manual/53/hotkeys">Omarchy manual</a>.</p></article>
<article class="card"><span class="tag">Portable primitives</span><h3>Apps by identity</h3><p>Karabiner can launch or focus by bundle identifier and recall the previously focused app. Alfred supplies a searchable list and dispatches reviewed actions. <a href="https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/open_application/">Karabiner API</a> · <a href="https://www.alfredapp.com/help/workflows/inputs/list-filter/">Alfred List Filter</a>.</p></article>
<article class="card"><span class="tag">Supported automation</span><h3>Fractional geometry</h3><p>Rectangle's presets and named-layout URL API let the same configuration fit different display sizes. The implementation removes recorded titles, exact pixel frames and display identifiers. <a href="https://rectangleapp.com/pro/docs/layouts/">Layouts</a> · <a href="https://rectangleapp.com/pro/docs/url-api/">URL API</a>.</p></article>
<article class="card"><span class="tag">Platform boundary</span><h3>Spaces need a placement step</h3><p>The maintainer documents the lack of a public exact-Space move API. The supported approach is to visit each desktop and arrange it. Static app assignment is available in macOS, but shared apps cannot have different fixed homes for every mode. <a href="https://github.com/rxhanson/RectanglePro-Community/discussions/689">Maintainer discussion</a> · <a href="https://support.apple.com/en-euro/guide/mac-help/mh14112/mac">Apple Spaces guide</a>.</p></article></div>
<p class="callout"><strong>Verification boundary:</strong> source tests, native import and app UI checks establish the configuration. Physical Caps Lock shortcuts, a fresh login and the second Mac require their own acceptance checks. External-monitor arrangement has not been assumed.</p>
<h3>Additional first-party references</h3><div class="sources"><a href="https://rectangleapp.com/pro/docs/keyboard-shortcuts/">Rectangle: moving between Spaces</a><a href="https://github.com/rxhanson/Rectangle#common-known-issues">Rectangle: app minimum sizes</a><a href="https://www.alfredapp.com/help/advanced/sync/">Alfred: settings excluded from sync</a><a href="https://karabiner-elements.pqrs.org/docs/manual/misc/configuration-file-path/">Karabiner: directory symlinks</a></div>
</section><footer class="footer"><span>Created by Rahul N Akmol<br>Hyperland · macOS · September 2026</span><span>Offline guide · no analytics or external assets<br>Source: scripts/hyper-config.json</span></footer>
</main><script>
const views={
work:[['Desktop 1','Work','Edge','Teams','Work or Work Balanced. Edge gets the wider panel.'],['Desktop 2','Office','Word','Excel','Office uses equal halves for two documents.'],['Desktop 3','Focus','Claude / PowerPoint','','Hyper+L, then Hyper+Return; or choose Present.']],
code:[['Desktop 1','Reference + terminal','Chrome / Obsidian','Ghostty','Code Browser or Code Notes: left two-thirds and right third.'],['Desktop 2','Code','Amp / Claude / Cursor / Codex','','The selected focus variation maximizes its coding app here.']],
zen:[['Desktop 1','Zen','Amp or Cursor<br>Ghostty · Obsidian','','Open your chosen apps and apply Zen. All are maximized and overlap.'],['Switch apps','Stay in flow','Hyper + Tab','','Return to the previous app, or use a direct app key.'],['No extra Space','Normal windows','Hyper + Return','','Maximize without entering native fullscreen.']]};
function show(mode){const data=views[mode];document.querySelector('#workspace').innerHTML='<div class="spaces">'+data.map((d,i)=>'<article class="space"><div class="label"><span>'+d[0]+'</span><span>'+d[1]+'</span></div><div class="screen"><div class="pane '+(d[3]&&i===0?'wide ':'')+(mode==='zen'?'zen':'')+'">'+d[2]+'</div>'+(d[3]?'<div class="pane alt">'+d[3]+'</div>':'')+'</div><p>'+d[4]+'</p></article>').join('')+'</div>';document.querySelector('#workspace').setAttribute('aria-labelledby','tab-'+mode);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mode===mode)));}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.mode)));show('work');
document.querySelector('#key-search').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();let visible=0;document.querySelectorAll('.key-table tbody tr').forEach(r=>{r.hidden=!r.textContent.toLowerCase().includes(q);if(!r.hidden)visible++;});document.querySelector('#no-results').style.display=visible?'none':'block';});
</script></body></html>`;

const output = root + 'alfred/.config/alfred/Alfred.alfredpreferences/workflows/user.workflow.hyper/guide.html';
if (process.argv.includes('--check')) {
  if (readFileSync(root+'docs/hotkeys.html','utf8') !== html || readFileSync(root+'docs/hotkeys.md','utf8') !== manual) throw new Error('Regenerate the hotkeys manual.');
  if (readFileSync(output, 'utf8') !== html) throw new Error('Regenerate the Hyper guide.');
  console.log('Hyper guide is current.');
} else {
  writeFileSync(output, html);
  writeFileSync(root+'docs/hotkeys.html',html);
  writeFileSync(root+'docs/hotkeys.md',manual);
  console.log('Hyper guide rendered.');
}

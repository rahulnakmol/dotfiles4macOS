import { readFileSync } from 'node:fs';

const table=(headers,rows)=>[headers,headers.map(()=>'---'),...rows].map(r=>'| '+r.map(String).join(' | ')+' |').join('\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function renderManual(c) {
  const id=c.setupProfile.toLowerCase();
  const catalog=JSON.parse(readFileSync(new URL('../docs/alfred-workflows.json',import.meta.url))).workflows;
  return `# ${c.setupProfile} — ${c.setupName}

Your keyboard-first macOS manual. Choose FDE for the full environment or TF for Tech Founder. Both use Hyperland, Alfred, Rectangle Pro, DockFlow and Session. Profile selection belongs to this Mac; the shared repository remains identical on every device.

## Start on a new Mac

1. Install Apple Command Line Tools (xcode-select --install), then Homebrew from https://brew.sh. This setup targets Apple Silicon; Amp's native app requires macOS 26 or later.
2. Install Git, Node and Stow, then clone your dotfiles fork into ~/.dotfiles. Do not clone someone else's private credentials or signing files.
3. Preview the selected profile, then apply it. Existing real files or unrelated symlinks are reported as conflicts before any installation. Move your conflicting configuration to a private backup yourself, compare it, and rerun; never use Stow adopt blindly.

\`\`\`sh
brew install git node stow
cd ~/.dotfiles
bash scripts/setup-workstation.sh plan --profile ${id}
bash scripts/setup-workstation.sh apply --profile ${id}
bash scripts/setup-workstation.sh check --profile ${id}
\`\`\`

Without --profile, an interactive terminal offers FDE / TF on first use. Later runs use the locally selected profile. Apply installs only missing packages and prints a backup path. Repeat apply after updates; it will refuse to overwrite edits made to managed generated files.

## What is installed

General CLI tools are shared: ${c.install.formulae.join(', ')}. Shell, prompt, terminal and editor modules are Stow-managed. Homebrew GUI packages: ${c.install.casks.map(a=>a.cask).join(', ')}. Safari and Finder are built into macOS. Licensed media apps are never automatically installed.

${id==='tf'?'TF enables exactly two agentic apps: Claude Desktop and Amp. Cursor, Codex, OpenCode and Claude Code are absent from its install list, launch keys, layouts and focus menu. General shell aliases may still exist but do not install or run those tools.':'FDE keeps all four Code variations and the full app map. Existing Claude/Codex/Cursor/OpenCode configuration modules remain available in the repository; agent trust/auth settings are an explicit personal setup step, not copied to colleagues by this installer.'}

Git and gh are installed, but personal Git identity, SSH, signing and credential configuration are retained on this Mac and never copied from the repository. Set up your own identity and account separately. No authentication or license information is included in either profile.

## Karabiner: official installer

1. Visit https://karabiner-elements.pqrs.org/ and download the stable DMG suitable for your macOS version. The setup command prints this link when it is missing.
2. Open the DMG, then Karabiner-Elements.pkg. Complete macOS Installer and enter administrator credentials directly.
3. Launch Karabiner-Elements. Complete the background-service, driver extension and input/accessibility prompts shown by that version. Choose the physical keyboard type (ANSI / ISO / JIS).
4. Select Hyperland. Hold Caps Lock and press F: Finder should open. Tap Caps Lock: Escape should be sent. Hold Right Option and press Return: Alfred's layouts should appear.
5. Restart or log out when prompted, then repeat the physical tests. An app icon or old Homebrew receipt is not proof that the driver works.

Karabiner is deliberately excluded from Homebrew installation. An existing healthy install is retained; a broken Homebrew install needs the vendor's uninstall/reinstall guidance rather than deleting driver files. The entire ~/.config/karabiner directory is linked, so Karabiner can observe changes; its JSON file alone must not be symlinked.

## Complete the apps on each Mac

1. Alfred: activate Powerpack; Advanced → Set preferences folder → ~/.config/alfred. Restart Alfred. Rerun apply to set this machine's Command+Space launcher and Meh feature keys. Disable Spotlight's Command+Space and any Raycast launcher/Hyper bindings that overlap.
2. Rectangle Pro: activate, grant Accessibility, enable login, then App Settings → Import Config → ~/.config/rectangle-pro/RectangleProConfig.json. Repeat this import after changing profiles or updating layouts; Stow alone does not apply native Rectangle settings.
3. Session: install the focus timer from https://www.stayinsession.com/ or Setapp. Activate Pro URL automation, enable login and review breathing/break settings. Do not install the Homebrew session cask: it is an unrelated messenger.
4. Amp: install the native Mac app from https://ampcode.com/app. The CLI alone does not satisfy the Amp window layout. Sign in directly in the app.
5. DockFlow: activate, enable login, and import the preset pack described below. Leave its automatic app quit/launch actions off; Alfred owns focus orchestration and Rectangle owns window geometry.
6. CleanShot X: an existing Setapp copy is accepted. Otherwise install/activate the standalone app. Enable login, grant capture permission, and configure Command+Shift+3/4/5 in CleanShot. Approve its external-command prompt when you first use the capture menu.
7. Install the utility workflows from Alfred Gallery using the links below. Keep their default keywords. Their credentials, settings, snippets and history stay local.

${table(['Workflow','Install from'],catalog.filter(w=>['atop','Audio Switcher','Timer','Caffeine Dose'].includes(w.name)).map(w=>[w.name,w.galleryUrl]))}

Owned Hyper, DockFlow Profiles and Google Workspace workflows are generated automatically, with author Rahul N Akmol and icons. Third-party workflows keep their own authors and names. Their existing installations are retained in that profile's private preferences bundle.

## Four desktops and two working Spaces

Create four desktops in Mission Control. Then run the existing helper:

\`\`\`sh
bash scripts/setup-hyper-macos.sh plan
bash scripts/setup-hyper-macos.sh apply
bash scripts/setup-hyper-macos.sh check
\`\`\`

Log out and back in after changing Mission Control settings. In each app's Dock icon → Options → Assign To → This Desktop, assign Chrome, Obsidian, Ghostty, Edge and Teams to Desktop 1; ${id==='tf'?'Amp and Claude':'Amp, Claude, Cursor and Codex'} to Desktop 2. Use Desktops 3 and 4 for other tasks. Existing assignments are respected, never recreated by window-title matching. Native fullscreen creates separate Spaces; these workflows use maximized and tiled ordinary windows.

Code arrangement:

\`\`\`text
Desktop 1: [ Chrome${id==='fde'?' / Obsidian':''}  2/3 ][ Ghostty 1/3 ]
Desktop 2: [ ${id==='tf'?'Amp':'chosen coding app'} maximized                  ]
Desktop 3 and 4: available for other tasks
\`\`\`

${id==='tf'?'Work uses Edge 2/3 + Teams 1/3 on Desktop 1 and Claude Desktop maximized on Desktop 2. Zen opens Obsidian and Claude on their assigned desktops; it does not quit apps or start a timer.':'Work uses Edge 2/3 + Teams 1/3. Code + Claude uses Obsidian in place of Chrome. All other Code variants use Chrome.'}

On small displays Teams may refuse a narrow third. Choose Work Balanced or use Hyper+Return to maximize. Extra app windows may need manual placement. Exact native fullscreen Split View recreation is not part of this setup.

## Choose the right command

${table(['Command','Effect'],[
 ['fs','Focus Session: quits other regular apps, opens the chosen set, switches DockFlow, arranges windows, requests a Session timer'],
 ['wl','Window Layout: opens and arranges the chosen set and switches DockFlow; leaves other apps open; no timer'],
 ['dp','DockFlow Profile: changes the Dock only'],['ss','Session Timer: starts a timer only'],
 ['hk','Hotkeys: all enabled apps, layouts, focus sessions and guide'],['al','App Launcher'],['wa','Window Action'],['cs','CleanShot capture menu'],['st','System tools and keep-awake'],['gw','Google Workspace browser shortcuts'],
 ])}

## Focus sessions

${table(['Command','Session','Apps','Minutes'],c.focusSessions.map(s=>['fs '+s.id,'Focus Session: '+s.name,s.apps.map(id=>c.apps.find(a=>a.id===id).name).join(' + '),s.durationMinutes]))}

Type fs, select a session, and press Return. All unrelated regular GUI apps are asked to quit, including Slack, Mail or an editor outside that session. Target apps stay open. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar services remain available. Save and terminal prompts are respected; there is no force quit. If an app refuses, already-closed apps stay closed and the switch stops before starting the next timer. A missing target app, Session or named DockFlow preset stops before any quits.

Timer delivery is requested once. Session controls existing-timer prompts, breathing, breaks and completion. Apps do not close at expiry. Focus does not continuously prevent opening other apps. Test fs only after saving work; use wl for everyday arrangement without closing distractions.

## Window layouts

${table(['Alfred wl result','Arrangement'],c.layouts.map(l=>[l.name,l.description]))}

## Timers and keep-awake

${table(['Command','Duration'],c.sessionTimers.map(t=>['ss '+t.minutes,t.name]))}

Choose ss 20 or ss 25 for a Pomodoro timer. These are single sessions; they do not reconfigure Session's automatic breaks. Caffeine Dose uses macOS caffeinate: caff toggles, cfs 45 keeps awake 45 minutes, cfs s checks status, cfs d stops. No separate Caffeine app is required. Keep-awake is independent of the focus timer.

## Hyper and Meh

Hold Caps Lock for Hyper (Control+Option+Command+Shift); tap for Escape. Hold Right Option for Meh (Control+Option+Shift). Left Option remains Option. Shared app keys never change when switching FDE and TF.

${table(['Hyper +','App'],c.apps.map(a=>[a.key.toUpperCase(),a.name]))}

${table(['Hyper +','Window action'],c.windowActions.map(a=>[a.key,a.name]))}

${table(['Hyper +','Navigation'],c.navigation.map(a=>[a.key,a.name]))}

Hyper+Space opens hk; Hyper+/ opens this guide. Hyper+1…9/0 navigates existing desktops; it does not create them. ${id==='fde'?'Codex retains its defaults; Hyper+V voice and Hyper+M dictation are supplied by its separate existing keybindings module.':''}

${table(['Meh +','Action'],c.mehActions.map(a=>[a.key,a.name]))}

${table(['Meh +','DockFlow','Keyword'],c.dockPresets.map(p=>[p.key,p.name,p.keyword]))}

Optional MX Master 3S Bluetooth rules remain scoped to vendor 1133/product 45108. Back/Forward navigate in Chrome, Edge, Safari and Finder; hold Forward elsewhere for Meh, and hold thumb button6 for Hyper. Verify identifiers in EventViewer for another mouse/receiver. Keyboard navigation does not require that mouse.

## Native shortcuts and Google Workspace

${table(['Shortcut','Action'],c.nativeShortcuts.map(a=>[a.key,a.name]))}

Command+Space belongs to Alfred. Capture shortcuts belong to CleanShot. Command+C/V/X/Z, Command+Tab and other native editing/app commands remain familiar. Use gw to list New Document, New Spreadsheet, New Presentation, New Form and Open Drive. Existing gdoc, gsheet, gslides, gform and gdrive browser shortcuts remain available; Google Drive for desktop is not required.

## Import and export DockFlow

1. In DockFlow → Settings → Backup & Restore → Export Backup, export your existing presets privately before importing anything. Leave Include folders off for shared packs.
2. Import ~/.dotfiles/dockflow/presets/${id}.json. Select the presets for this setup. Imports add presets; they do not replace existing ones automatically.
3. Ensure exactly one preset has each name in the table above. If you already have a same-named preset, rename the old one (for example Saved Work) before importing. Do not repeatedly import the same pack.
4. Verify apps were resolved on this Mac, and app-opening/quitting actions remain off. The export packs contain no private folders, browser profiles, account data or custom launch actions.
5. Test dp work and dp code. Name-based selection discovers the current preset rather than reusing another Mac's IDs. Duplicate/missing names produce an actionable error.
6. To share later edits, export selected presets without folders to a private temporary location. Use scripts/sanitize-dockflow.mjs to create a sanitized export, review the diff, then commit the pack. Never Stow DockFlow's live database.

FDE has seven presets; TF has Default, Work, Code and Zen only. Switching an existing FDE Mac to TF hides extra presets in Alfred but leaves the saved DockFlow library intact. Rename/archive old presets manually if desired. Export JSON uses DockFlow's native schema, not a made-up format.

## Updates, profile switching and rollback

After pulling reviewed changes, rerun plan, apply and check with the same profile. Profile-generated source lives under ~/.local/share/dotfiles/workstations/${id}; ~/.config links are managed by GNU Stow. Source definitions, exports and this documentation are versioned in dotfiles. Histories, local preferences and generated activation journals stay on this Mac.

To switch, run apply --profile ${id==='tf'?'fde':'tf'}. Only links owned by this checkout or its managed profile folders may be replaced. Other files cause a conflict. Each profile keeps its own Alfred preferences and third-party workflows; switching back restores access to its previous preferences. On the first migration from the legacy dotfiles Alfred folder, that folder remains intact; select/install the needed utility workflows in the new profile. No private workflow variables or histories are copied automatically.

After switching, reconnect Alfred to ~/.config/alfred and restart it, import the new Rectangle snapshot and chosen DockFlow pack, then run check. Check reports machine-local steps as unverified until physically tested; it never equates file correctness with permissions or a login test.

\`\`\`sh
bash scripts/setup-workstation.sh rollback BACKUP_DIRECTORY
\`\`\`

Rollback restores managed files, links, profile selection and narrowly managed Alfred fields for that run. It retains installed applications and personal data. Later edits cause rollback to stop rather than overwrite them. Restore Rectangle from its previous native export and DockFlow from your private backup separately; OS permissions, accounts and licenses are not reversed. Mission Control has its own backup/rollback command.

## Verification and troubleshooting

1. check must report no file/link drift, missing packages, required apps or preset names. Complete any remaining guided requirements.
2. Test physical Caps Lock, Right Option, application launch keys, the four desktop shortcuts, and Meh numbers.
3. Test wl work and wl Code Amp; windows should land on their assigned desktops. If they land elsewhere, repair native Dock assignments and ensure automatic Space rearrangement is disabled.
4. With work saved, test fs work (30 minutes) and fs amp (45). Resolve prompts; verify the countdown in Session. Check unrelated apps closed and support tools stayed open.
5. Verify Alfred, Rectangle, DockFlow, Session and CleanShot after a logout/login. Repeat on Air and Pro, and with an external display. Report physical checks separately from automated tests.

Missing Alfred menus: select the right preferences folder and restart. Missing utility: install its Gallery workflow. Missing layout: reimport Rectangle snapshot. Wrong Dock: inspect duplicate preset names. No Hyper: complete Karabiner services/driver permissions and check the selected profile. Timer absent: verify the correct Session app and Pro automation. There is no automated license activation.
`;
}

export function manualHTML(c) {
  const md=renderManual(c), lines=md.split('\n');
  let code=false, inTable=false, body='';
  const inline=s=>esc(s).replace(/(https:\/\/[^\s<]+)/g,'<a href="$1">$1</a>');
  for (const line of lines) {
    if(line.startsWith('```')){if(inTable){body+='</tbody></table></div>';inTable=false;}body+=code?'</code></pre>':'<pre><code>';code=!code;continue;}
    if(code){body+=esc(line)+'\n';continue;}
    if(line.startsWith('|')) {
      if(/^\|\s*---/.test(line))continue;
      const cells=line.split('|').slice(1,-1).map(s=>s.trim());
      if(!inTable){body+='<div class="scroll"><table><thead><tr>'+cells.map(s=>'<th>'+inline(s)+'</th>').join('')+'</tr></thead><tbody>';inTable=true;}
      else body+='<tr>'+cells.map(s=>'<td>'+inline(s)+'</td>').join('')+'</tr>';
      continue;
    }
    if(inTable){body+='</tbody></table></div>';inTable=false;}
    if(line.startsWith('# '))body+='<h1>'+inline(line.slice(2))+'</h1>';
    else if(line.startsWith('## ')){const title=line.slice(3);body+='<h2 id="'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'">'+inline(title)+'</h2>';}
    else if(line.trim())body+='<p>'+inline(line)+'</p>';
  }
  const diagrams='<div class="sessions">'+c.focusSessions.map(s=>{
    const first=c.apps.find(a=>a.id===s.apps[0]).name;
    const second=c.apps.find(a=>a.id===s.apps[1]).name;
    const agent=s.apps.length>2?c.apps.find(a=>a.id===s.apps[2]).name:null;
    return '<article><h3>'+esc(s.name)+' <small>'+s.durationMinutes+' min</small></h3><p>Desktop 1</p><div class="desktop pair"><b>'+esc(first)+'<br>⅔</b><b>'+esc(second)+'<br>⅓</b></div>'+(agent?'<p>Desktop 2</p><div class="desktop agent"><b>'+esc(agent)+'<br>Maximized</b></div>':'<p>Desktops 2–4 remain available.</p>')+'</article>';
  }).join('')+'</div>';
  body=body.replace('</h1>','</h1>'+diagrams);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.setupProfile} macOS manual</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#24273a;color:#cad3f5;font:17px/1.7 system-ui}main{max-width:1080px;margin:auto;padding:40px 28px 100px}nav{display:flex;gap:20px;flex-wrap:wrap;border-bottom:1px solid #494d64;padding-bottom:18px}a{color:#8aadf4;overflow-wrap:anywhere}h1{font-size:42px;color:#b7bdf8;line-height:1.2}h2{margin-top:58px;color:#a6da95;font-size:25px}p{max-width:85ch}pre{padding:22px;background:#181926;border-radius:12px;overflow:auto;color:#eed49f}table{width:100%;border-collapse:collapse;margin:15px 0}td,th{padding:12px 16px;border-bottom:1px solid #494d64;text-align:left}th{color:#f5bde6;background:#1e2030}tr:hover{background:#363a4f}.scroll{overflow:auto}input{width:100%;padding:13px 18px;border:1px solid #6e738d;border-radius:8px;background:#1e2030;color:#cad3f5;margin-top:25px;font:inherit}.note{color:#a5adcb}footer{margin-top:60px;color:#a5adcb}
.sessions{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin:30px 0}.sessions article{padding:18px;border:1px solid #494d64;border-radius:14px;background:#1e2030}.sessions h3{margin:0;color:#b7bdf8}.sessions small{float:right;color:#a6da95}.sessions p{font-size:13px;color:#a5adcb;margin:10px 0}.desktop{border:5px solid #494d64;border-radius:8px;overflow:hidden;min-height:95px;color:#24273a;text-align:center}.desktop b{display:grid;place-content:center;padding:14px;font-size:15px}.pair{display:grid;grid-template-columns:2fr 1fr}.pair b:first-child{background:#8aadf4}.pair b:last-child{background:#f5bde6;border-left:4px solid #494d64}.agent{background:#a6da95}</style><main><nav><a href="#start-on-a-new-mac">Install</a><a href="#choose-the-right-command">Commands</a><a href="#focus-sessions">Focus</a><a href="#hyper-and-meh">Hotkeys</a><a href="#import-and-export-dockflow">DockFlow</a><a href="#updates-profile-switching-and-rollback">Rollback</a></nav><input type="search" placeholder="Filter shortcut and command tables…" aria-label="Filter tables"><p class="note">${c.setupProfile} · Hyperland · macOS · Generated from the same profile as your workflows</p>${body}<footer>Created by Rahul N Akmol. Source: scripts/workstation-profiles.mjs and scripts/workstation-manual.mjs.</footer></main><script>document.querySelector('input').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q));});</script></html>\n`;
}

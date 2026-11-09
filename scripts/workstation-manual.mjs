import { resolveProfile } from './workstation-profiles.mjs';

const table=(headers,rows)=>[headers,headers.map(()=>'---'),...rows].map(r=>'| '+r.map(String).join(' | ')+' |').join('\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function renderManual(c) {
  const id=c.setupProfile.toLowerCase();
  return `# ${c.setupProfile} — ${c.setupName}

Install the ${c.setupProfile} role apps and core dotfiles on this Mac. Window layouts, Dock presets and focus timers are Raycast Script Commands, not an Alfred, Karabiner or Rectangle setup.

## Quick setup

From a checkout, run one command:

\`\`\`sh
bash install.sh --profile ${id}
\`\`\`

Choose whether this profile should manage productivity automation:

| Choice | What to do |
| --- | --- |
| Core only / my own tools | Use https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/setup.md instead of a TF/FDE productivity profile. |
| Raycast Focus & Layouts | Use https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/modules/raycast.md; Raycast has one shared configuration. |
| Raycast script commands | Run bash scripts/setup-raycast-native.sh install. Follow https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/modules/raycast.md. |

For a fresh Mac or double-click launchers, see https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/setup-profiles.md. The installer checks prerequisites, runs plan/apply/check, records progress and opens this GitHub manual. Rerun after completing any interrupted Apple installation. Existing checkouts are used as-is.

## Finish setup human checklist

Managed installation and human setup are tracked separately. These steps are unverified until you perform the checks below; setup does not collect credentials or record a checkbox as proof.

| Step | What you do | How to verify |
| --- | --- | --- |
| Default browser | Complete Zen onboarding; choose Zen under Default web browser in macOS System Settings | Open an ordinary web link and confirm it opens in Zen |
| Desktop apps | Complete your own app sign-ins; ${id==='fde'?'configure a provider in T3 Code if using it':'open Cursor and ChatGPT/Codex'} | Start your own small task in each app |
| Core configuration | Open a new terminal; check prompt, fonts and editor | Run the profile check command and confirm no managed drift |
| Private AI gateway and Codex | Prepare the gateway, then select subscription (default) or gateway desktop mode; CLI stays gateway | Check both value-free status commands and Herdr integrations; sign into the desktop in subscription mode |

This checklist covers the selected profile. Raycast has a separate shared journey at https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/modules/raycast.md. Do not complete both global maps unless you intentionally resolve every overlapping launcher and hotkey. The installer does not grant permissions, activate licenses, run focus sessions, close apps or verify personal account access. Keep the printed backup path for rollback.

## Start on a new Mac

1. Install Apple Command Line Tools (xcode-select --install), then Homebrew from https://brew.sh. This setup targets Apple Silicon; ${id==='fde'?"optional Amp requires macOS 26 or later; it is not a prerequisite for FDE.":'TF uses Cursor, Codex and Zen Browser; it does not require Amp.'}
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

## Configure the private AI gateway once per user

The profile installs Claude Code, Codex, OpenCode and Herdr, but never collects a credential. After
the profile apply, configure the CLI tools interactively. Gateway setup previews and Stow-deploys
the tracked Claude and OpenCode modules when needed; Codex setup switches the single desktop
home (subscription by default, with reviewed Stow links via bootstrap-codex):

\`\`\`sh
bash scripts/setup-private-ai-gateway.sh
bash scripts/setup-codex-profiles.sh
bash scripts/setup-codex-profiles.sh --mode gateway # optional desktop switch
bash scripts/setup-codex-profiles.sh --mode subscription # switch back
bash scripts/setup-codex-profiles.sh --status
bash scripts/setup-private-ai-gateway.sh --status
herdr integration status
\`\`\`

Gateway setup prompts for a vendor-neutral HTTPS endpoint, silently reads one key, fetches the
authenticated \`/v1/models\` catalog, automatically selects working models, and verifies Anthropic
Messages, Chat Completions and Responses before saving configuration. Endpoint, shared key and model
remain under \`~/.config/private-ai-gateway\` with restrictive permissions. Ordinary \`claude\`,
\`codex\` and \`opencode\` commands use protected wrappers in \`~/.local/bin\`. Terminal \`codex\`
always uses \`~/.config/private-ai-gateway/codex\` and the file-backed gateway key; ChatGPT/Codex
desktop uses \`~/.codex\`, with your subscription login by default or file-backed gateway config
in gateway mode. Dock, Hyper+J, Raycast \`cx\`, shell \`cx\` launch that single desktop.
The inactive home is parked under \`~/.local/state/dotfiles/codex-profiles/\` for reversible
switching. Codex setup never asks for or rotates the key; it installs a missing vendor CLI via
\`brew install --cask codex\` and refreshes the gateway wrapper. For a one-time legacy reset/archive,
use \`bash scripts/cleanup-codex-profiles.sh --cleanup\` or double-click
\`setup/Codex Cleanup.command\`—not to switch modes. Previously archived gateway state under
\`~/.local/share/dotfiles/codex-profile-archives/\` is not auto-restored; review it yourself.
Re-run gateway setup to refresh models, use
\`scripts/setup-private-ai-gateway.sh --refresh\` for a non-interactive refresh, or opt in to daily
macOS refresh with \`--install-refresh\` (disable with \`--remove-refresh\`). Refresh reuses saved
credentials and keeps the last working configuration on failed validation. Use \`--rotate-key\` only
for deliberate one-place key rotation.

Cursor CLI stays on the official Cursor account because it has no generic OpenAI-compatible provider
interface. Never reuse the gateway key as \`CURSOR_API_KEY\`. See the module guides for details.

## Raycast script automation

Window geometry, Dock presets and focus timers come from the Raycast Script Commands in raycast/.config/raycast/scripts. This profile does not install Alfred, Karabiner-Elements or Rectangle Pro, and it does not link their settings.

\`\`\`sh
bash scripts/setup-raycast-native.sh install
\`\`\`

Add that scripts directory once in Raycast’s Script Commands settings. The command list and aliases are in https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/modules/raycast.md and https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/hotkeys.md. DockFlow presets and Session categories are still created by hand; the scripts call them.

## What is installed

General CLI tools are shared: ${c.install.formulae.join(', ')}. Shell, prompt, terminal and editor modules are Stow-managed. Default Homebrew GUI packages: ${resolveProfile(id).install.casks.map(a=>a.cask).join(', ')}. Safari and Finder are built into macOS. Licensed media apps are never automatically installed.

${id==='tf'?'TF uses Claude Desktop for Work, Cursor for Code and Codex for Innovate. Zen Browser is the default for development; Ghostty and Slack are shared by Code and Innovate. Claude Code and OpenCode CLIs are installed for the optional private gateway and Herdr workflow, but are absent from the TF focus menu.':'FDE keeps Amp, Claude, Cursor and T3 Code variations and the full app map; Amp is optional and only its own workflow requires it. Existing Claude/Codex/Cursor/OpenCode configuration modules remain available in the repository; agent trust/auth settings are an explicit personal setup step, not copied to colleagues by this installer.'}

Git and gh are installed, but personal Git identity, SSH, signing and credential configuration are retained on this Mac and never copied from the repository. Set up your own identity and account separately. No authentication or license information is included in either profile.

## Default apps and browser setup

Both profiles install Zen Browser, Claude Desktop, Cursor and ChatGPT/Codex by default. Zen is the everyday browser for code sessions. Work keeps Microsoft Edge. Stable Google Chrome is not installed by the setup.

1. Open Zen once to complete its onboarding. In macOS System Settings, search for Default web browser and select Zen. This is a human step on each Mac; Stow does not set the OS default browser. Google Workspace links use that OS default.
2. If you previously used Chrome for code, assign Zen to the reference desktop. Existing Chrome installations and browser data are retained.
3. Optional end-to-end testing browser: install Google Chrome Canary with the command below. It is not part of the Raycast focus scripts or the default install. Use the Canary app explicitly in your test runner configuration; this setup does not change browser binaries managed by Playwright or other test tools.

\`\`\`sh
brew install --cask google-chrome@canary
\`\`\`

Official casks: https://formulae.brew.sh/cask/zen and https://formulae.brew.sh/cask/google-chrome%40canary.

${id==='fde'?'FDE additionally installs T3 Code via brew install --cask t3-code. It uses at least one separately configured provider CLI; opening the desktop app alone does not configure a provider. Follow https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md for provider prerequisites. Telegram is optional: brew install --cask telegram. It is not included in focus sessions or Dock presets.':'TF keeps its existing Cursor and Codex sessions.'}

Amp is an optional native app from https://ampcode.com/app. Install it only if needed; the installer and check command do not require it. Its macOS 26+ requirement applies only to Amp, not to the base profile. TF does not include Amp workflows.

## Apps the Raycast scripts call

${id==='fde'?'Amp is optional: install its native app separately from https://ampcode.com/app only if you want that workflow.':'Zen Browser uses the official Homebrew zen cask (https://formulae.brew.sh/cask/zen), installed as Zen.app. Codex uses the ChatGPT desktop package already used by this repository. Choose Zen as your default browser in macOS if you want ordinary links to open there.'}

1. Session: install the focus timer from https://www.stayinsession.com/ or Setapp. Activate Pro URL automation. The Raycast script start-focus-session.sh opens session:///start. Do not install the Homebrew session cask: it is an unrelated messenger.
2. ${id==='fde'?'Optional Amp: install the native Mac app from https://ampcode.com/app. Sign in directly in the app.':'Cursor and Codex: sign in directly in the installed desktop apps.'}
3. DockFlow: activate, enable login, and import the preset pack described below. The Raycast dockflow scripts select presets by name. Leave DockFlow's own quit/launch actions off.
4. CleanShot X: an existing Setapp copy is accepted. Otherwise install/activate the standalone app. Capture shortcuts stay in CleanShot.

## Session categories — human setup

This checklist is part of optional productivity setup only. Create these categories in Session once, then verify they are available on each Mac. Reuse existing matching categories instead of creating duplicates.

${table(['Category','Raycast script'],id==='tf'?[['Work','fwk'],['Code','fcs'],['Innovate','fiv']]:[['Work','fwk'],['Code','fas, fcs and the other native-focus scripts']])}

1. Open Session's main timer screen. In the intention field, type @ to open category selection and use its add-category option for each name above. Choose any colors you prefer.
2. Reopen category selection and confirm each category is available. On another Mac, check for existing categories first and create only missing ones.
3. Select the appropriate category before starting a standalone ss timer. Focus sessions select the mapped category automatically. The category groups time by activity; the intention describes the task. Pomodoro is a timer duration/style, so choose Work or Code according to the task rather than creating a required Pomodoro category.
4. After your first real session, check its category in Session's history. Repeat for each category so you can confirm time is grouped correctly.

Focus workflows (fs) automatically pass categoryName using the mapping above, alongside intention and duration. Standalone timers (ss) keep your selected/default category because they are not tied to a profile activity. Session matches category names case-insensitively, does not create categories, and falls back to the default when no match exists. Create the categories before your first focus session and verify the category on its timer. Category data lives in Session, not in Stow or the dotfiles backup.

Session references: category creation with @ at https://stayinsession.com/changelog and categoryName behavior at https://www.stayinsession.com/learn/session-url-scheme.

## Four desktops and working Spaces

Create four desktops in Mission Control. Then run the existing helper:

\`\`\`sh
bash scripts/setup-hyper-macos.sh plan
bash scripts/setup-hyper-macos.sh apply
bash scripts/setup-hyper-macos.sh check
\`\`\`

Log out and back in after changing Mission Control settings. In each app's Dock icon → Options → Assign To → This Desktop, ${id==='tf'?'assign Zen Browser, Obsidian, Edge and Teams to Desktop 1; Claude, Cursor and Codex to Desktop 2; Ghostty and Slack to Desktop 3. Desktop 4 stays available.':'assign Zen Browser, Obsidian, Edge and Teams to Desktop 1; Claude, Cursor and T3 Code (plus Amp if installed) to Desktop 2; Ghostty and Slack to Desktop 3. Desktop 4 stays available.'} Existing assignments are respected, never recreated by window-title matching. Native fullscreen creates separate Spaces; these workflows use maximized and tiled ordinary windows.

${id==='tf'?'Code and Innovate arrangement:':'Code arrangement:'}

\`\`\`text
${id==='tf'?`Desktop 1: [ Zen Browser maximized                       ]
Desktop 2: [ Cursor (Code) or Codex (Innovate) maximized   ]
Desktop 3: [ Ghostty                    2/3 ][ Slack 1/3 ]
Desktop 4: available for other tasks`:`Desktop 1: [ Zen Browser maximized                       ]
Desktop 2: [ Amp / Claude / Cursor / T3 Code maximized    ]
Desktop 3: [ Ghostty                    2/3 ][ Slack 1/3 ]
Desktop 4: available for other tasks`}
\`\`\`

${id==='tf'?'Work remains Edge 2/3 + Teams 1/3 on Desktop 1 and Claude Desktop maximized on Desktop 2, for 30 minutes. Code + Cursor and Innovate + Codex each run for 45 minutes. Zen is still the separate Obsidian/Claude quiet layout; Zen Browser is the browser app, not that layout. Switching between Code and Innovate retains Zen Browser, Ghostty and Slack and quits the outgoing coding app. If you previously assigned Ghostty to Desktop 1, move its Dock assignment to Desktop 3 once on each Mac.':'Work uses Edge 2/3 + Teams 1/3. Every Code variant uses three working desktops: Zen maximized, the coding app maximized, and Ghostty 2/3 + Slack 1/3. Move Ghostty from Desktop 1 to Desktop 3 once on each Mac. These are virtual desktops, not three required physical monitors. T3 Code replaces the FDE Codex session; TF retains Innovate + Codex. Obsidian remains available in the separate Code Notes and Zen layouts. Amp sessions require the optional Amp app.'}

On small displays Teams may refuse a narrow third. Maximize that window from Raycast or by hand. Extra app windows may need manual placement. Exact native fullscreen Split View recreation is not part of this setup.

## Choose the right command

Run these from Raycast after the Script Commands directory is added. The full alias list is in the Raycast module.

${table(['Alias family','Effect'],[
 ['w…','Workspace: DockFlow preset, required apps, then the native layout'],
 ['l…','Arrange: window layout only; Dock and timers stay as they are'],
 ['f…','Focus: prepare the workspace, then request a Session timer'],
 ['dockflow scripts','Dock preset only, selected by name'],
 ])}

## Focus sessions

${table(['Session','Apps','Minutes'],c.focusSessions.map(s=>[s.name,s.apps.map(id=>c.apps.find(a=>a.id===id).name).join(' + '),s.durationMinutes]))}

A focus script asks unrelated regular GUI apps to quit, including Slack, Mail or an editor outside that session. Target apps stay open. Finder, DockFlow, Session and background/menu-bar services remain available. Save and terminal prompts are respected; there is no force quit. If an app refuses, already-closed apps stay closed and the switch stops before starting the next timer. A missing target app, Session or named DockFlow preset stops before any quits.

Timer delivery is requested once. Session controls existing-timer prompts, breathing, breaks and completion. Apps do not close at expiry. Focus does not continuously prevent opening other apps. Run a focus script only after saving work. Use an arrange script when you want the windows without closing other apps.

## Window layouts

${table(['Layout','Arrangement'],c.layouts.map(l=>[l.name,l.description]))}

## Dock presets the scripts select

${table(['Key','DockFlow','Keyword'],c.dockPresets.map(p=>[p.key,p.name,p.keyword]))}

Capture shortcuts stay in CleanShot. Command+C/V/X/Z, Command+Tab and other native editing/app commands remain familiar. Google Workspace browser shortcuts gdoc, gsheet, gslides, gform and gdrive remain available; Google Drive for desktop is not required.

## Import and export DockFlow

1. In DockFlow → Settings → Backup & Restore → Export Backup, export your existing presets privately before importing anything. Leave Include folders off for shared packs.
2. Import ~/.dotfiles/dockflow/presets/${id}.json. Select the presets for this setup. Imports add presets; they do not replace existing ones automatically.
3. Ensure exactly one preset has each name in the table above. If you already have a same-named preset, rename the old one (for example Saved Work) before importing. Do not repeatedly import the same pack.
4. Verify apps were resolved on this Mac, and app-opening/quitting actions remain off. The export packs contain no private folders, browser profiles, account data or custom launch actions.
5. Test dp work and dp code. Name-based selection discovers the current preset rather than reusing another Mac's IDs. Duplicate/missing names produce an actionable error.
6. To share later edits, export selected presets without folders to a private temporary location. Use scripts/sanitize-dockflow.mjs to create a sanitized export, review the diff, then commit the pack. Never Stow DockFlow's live database.

FDE has seven presets; TF has Default, Work, Code, Innovate and Zen. Switching an existing FDE Mac to TF leaves the saved DockFlow library intact. Rename or archive old presets manually if desired. Export JSON uses DockFlow's native schema.

## Updates, profile switching and rollback

After pulling reviewed changes, rerun plan, apply and check with the same profile. Include --productivity only when you want to update the optional automation setup. Profile-generated source lives under ~/.local/share/dotfiles/workstations/${id}; ~/.config links are managed by GNU Stow. Source definitions, exports and this documentation are versioned in dotfiles. Histories, local preferences and generated activation journals stay on this Mac.

To switch core settings, run apply --profile ${id==='tf'?'fde':'tf'}. Add --productivity to switch the automation settings as well. Only links owned by this checkout or its managed profile folders may be replaced. Other files cause a conflict. Raycast Script Commands stay in the repository checkout. DockFlow presets stay in DockFlow.

After switching profiles, run check for the new profile. Raycast Script Commands stay in the repository checkout. Reimport a DockFlow pack only when its preset names change. Check reports machine-local steps as unverified until physically tested; it never equates file correctness with permissions or a login test.

\`\`\`sh
bash scripts/setup-workstation.sh rollback BACKUP_DIRECTORY
\`\`\`

Rollback restores managed files, links and profile selection for that run. It retains installed applications and personal data. Later edits cause rollback to stop rather than overwrite them. DockFlow presets and Raycast's local display mapping are not reversed. OS permissions, accounts and licenses are not reversed. Mission Control has its own backup/rollback command.

## Verification and troubleshooting

For the default setup, check validates only core settings and role apps. The following checks apply after opting into productivity.

1. check --productivity must report no file/link drift, missing packages, required apps or preset names. Complete any remaining guided requirements.
2. Run a Raycast arrange script and a focus script from raycast/.config/raycast/scripts. ${id==='tf'?'Try fwk, fcs and fiv.':'Try fwk and fcs.'}
3. Confirm the Session countdown and the named DockFlow preset. A missing Session app or preset stops the script before it changes the timer.
4. Verify DockFlow, Session and CleanShot after a logout/login. Repeat on Air and Pro, and with an external display. Report physical checks separately from automated tests.

Wrong Dock: inspect duplicate preset names. Timer absent: verify the correct Session app and Pro automation. There is no automated license activation.
`;
}

export function manualHTML(c, {compact=false} = {}) {
  let md=renderManual(c);
  if (compact) {
    const start=md.indexOf('## Choose the right command');
    const end=md.indexOf('## Import and export DockFlow');
    if(start<0 || end<=start) throw new Error('Missing shortcut reference boundaries');
    md=md.slice(0,start)+`## Commands and hotkeys

Use the Raycast script commands at https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/modules/raycast.md and the hotkey map at https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/hotkeys.md.

`+md.slice(end);
  }
  const lines=md.split('\n');
  let code=false, inTable=false, body='';
  const inline=s=>esc(s).replace(/https:\/\/[^\s<]+/g,url=>{
    const clean=url.replace(/[.,;:)]+$/,'');
    return '<a href="'+clean+'">'+clean+'</a>'+url.slice(clean.length);
  });
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
    if(s.id!=='work') {
      const agent=c.apps.find(a=>a.id===s.apps.at(-1)).name;
      return '<article><h3>'+esc(s.name)+' <small>'+s.durationMinutes+' min</small></h3><p>Desktop 1</p><div class="desktop agent"><b>Zen Browser<br>Maximized</b></div><p>Desktop 2</p><div class="desktop agent"><b>'+esc(agent)+'<br>Maximized</b></div><p>Desktop 3</p><div class="desktop pair"><b>Ghostty<br>⅔</b><b>Slack<br>⅓</b></div><p>Desktop 4 remains available.</p></article>';
    }
    const first=c.apps.find(a=>a.id===s.apps[0]).name;
    const second=c.apps.find(a=>a.id===s.apps[1]).name;
    const agent=s.apps.length>2?c.apps.find(a=>a.id===s.apps[2]).name:null;
    return '<article><h3>'+esc(s.name)+' <small>'+s.durationMinutes+' min</small></h3><p>Desktop 1</p><div class="desktop pair"><b>'+esc(first)+'<br>⅔</b><b>'+esc(second)+'<br>⅓</b></div>'+(agent?'<p>Desktop 2</p><div class="desktop agent"><b>'+esc(agent)+'<br>Maximized</b></div>':'<p>Desktops 2–4 remain available.</p>')+'</article>';
  }).join('')+'</div>';
  body=body.replace('</h1>','</h1>'+diagrams);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.setupProfile} macOS manual</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#24273a;color:#cad3f5;font:17px/1.7 system-ui}main{max-width:1080px;margin:auto;padding:40px 28px 100px}nav{display:flex;gap:20px;flex-wrap:wrap;border-bottom:1px solid #494d64;padding-bottom:18px}a{color:#8aadf4;overflow-wrap:anywhere}h1{font-size:42px;color:#b7bdf8;line-height:1.2}h2{margin-top:58px;color:#a6da95;font-size:25px}p{max-width:85ch}pre{padding:22px;background:#181926;border-radius:12px;overflow:auto;color:#eed49f}table{width:100%;border-collapse:collapse;margin:15px 0}td,th{padding:12px 16px;border-bottom:1px solid #494d64;text-align:left}th{color:#f5bde6;background:#1e2030}tr:hover{background:#363a4f}.scroll{overflow:auto}input{width:100%;padding:13px 18px;border:1px solid #6e738d;border-radius:8px;background:#1e2030;color:#cad3f5;margin-top:25px;font:inherit}.note{color:#a5adcb}footer{margin-top:60px;color:#a5adcb}
.sessions{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin:30px 0}.sessions article{padding:18px;border:1px solid #494d64;border-radius:14px;background:#1e2030}.sessions h3{margin:0;color:#b7bdf8}.sessions small{float:right;color:#a6da95}.sessions p{font-size:13px;color:#a5adcb;margin:10px 0}.desktop{border:5px solid #494d64;border-radius:8px;overflow:hidden;min-height:95px;color:#24273a;text-align:center}.desktop b{display:grid;place-content:center;padding:14px;font-size:15px}.pair{display:grid;grid-template-columns:2fr 1fr}.pair b:first-child{background:#8aadf4}.pair b:last-child{background:#f5bde6;border-left:4px solid #494d64}.agent{background:#a6da95}</style><main><nav><a href="#start-on-a-new-mac">Install</a>${compact?'':'<a href="#choose-the-right-command">Commands</a><a href="#focus-sessions">Focus</a>'}<a href="#import-and-export-dockflow">DockFlow</a><a href="#updates-profile-switching-and-rollback">Rollback</a></nav><input type="search" placeholder="Filter setup tables…" aria-label="Filter tables"><p class="note">${c.setupProfile} · macOS · Core first; automation optional</p>${body}<footer>Created by Rahul N Akmol. Source: scripts/workstation-profiles.mjs and scripts/workstation-manual.mjs.</footer></main><script>document.querySelector('input').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q));});</script></html>\n`;
}

import { readFileSync } from 'node:fs';

const base = JSON.parse(readFileSync(new URL('./hyper-config.json', import.meta.url)));
export const profileIds = ['fde', 'tf'];
export const commonModules = ['zsh', 'bash', 'bat', 'starship', 'tmux', 'ghostty', 'nvim'];
export const commonFormulae = ['git', 'node', 'stow', 'zsh', 'tmux', 'neovim', 'eza', 'bat', 'fd', 'ripgrep', 'fzf', 'zoxide', 'starship', 'curl', 'jq', 'gh', 'podman', 'zsh-autosuggestions', 'zsh-syntax-highlighting', 'zsh-autocomplete'];
const apps = [
  ['font-jetbrains-mono-nerd-font', null, null],
  ['alfred', 'com.runningwithcrayons.Alfred', 'Alfred 5'],
  ['rectangle-pro', 'com.knollsoft.Hookshot', 'Rectangle Pro'],
  ['dockflow', 'com.appit.DockFlow', 'DockFlow'],
  ['ghostty', 'com.mitchellh.ghostty', 'Ghostty'],
  ['google-chrome', 'com.google.Chrome', 'Google Chrome'],
  ['microsoft-edge', 'com.microsoft.edgemac', 'Microsoft Edge'],
  ['microsoft-teams', 'com.microsoft.teams2', 'Microsoft Teams'],
  ['claude', 'com.anthropic.claudefordesktop', 'Claude'],
  ['obsidian', 'md.obsidian', 'Obsidian'],
  ['cleanshot', 'pl.maketheweb.cleanshotx', 'CleanShot X'],
];
export const guidedApps = [
  {name:'Karabiner-Elements', bundleIds:['org.pqrs.Karabiner-Elements.Settings'], url:'https://karabiner-elements.pqrs.org/', instruction:'Download the official DMG, mount it, open Karabiner-Elements.pkg, then complete services, driver and input permissions.'},
  {name:'Amp', bundleIds:['com.ampcode.amp.macos'], url:'https://ampcode.com/app', instruction:'Install the native Amp Mac app from its official download. Requires macOS 26+. The Amp CLI is not a replacement for the app.'},
  {name:'Session', bundleIds:['com.philipyoungg.session-setapp','com.philipyoungg.session-direct','com.philipyoungg.session'], url:'https://www.stayinsession.com/', instruction:'Install the focus timer via Setapp or the vendor; activate Pro URL automation. Homebrew session is an unrelated messenger.'},
];

export function resolveProfile(value) {
  const id = String(value).trim().toLowerCase();
  if (!profileIds.includes(id)) throw new Error('Choose FDE or TF (Tech Founder)');
  const config = structuredClone(base);
  config.setupProfile = id.toUpperCase();
  config.setupName = id === 'tf' ? 'Tech Founder' : 'Full developer environment';
  config.dockPresets = [
    {id:'default',name:'0. Default',key:'0',code:29,keyword:'ddef'},
    {id:'work',name:'1. Work',key:'1',code:18,keyword:'dwork'},
    {id:'code',name:'2. Code',key:'2',code:19,keyword:'dcode'},
    ...(id==='fde' ? [
      {id:'author',name:'3. Author',key:'3',code:20,keyword:'dauthor'},
      {id:'create',name:'4. Create',key:'4',code:21,keyword:'dcreate'},
      {id:'video',name:'5. Video',key:'5',code:23,keyword:'dvideo'},
    ] : []),
    {id:'zen',name:'9. Zen',key:'9',code:25,keyword:'dzen'},
  ];
  config.install = {
    modules: [...commonModules],
    formulae: [...commonFormulae, ...(id==='fde' ? ['opencode'] : [])],
    casks: [...apps, ...(id==='fde' ? [
      ['cursor','com.todesktop.230313mzl4w4u92','Cursor'],
      ['chatgpt','com.openai.codex','ChatGPT'],
      ['slack','com.tinyspeck.slackmacgap','Slack'],
      ['microsoft-word','com.microsoft.Word','Microsoft Word'],
      ['microsoft-excel','com.microsoft.Excel','Microsoft Excel'],
      ['microsoft-powerpoint','com.microsoft.Powerpoint','Microsoft PowerPoint'],
      ['claude-code',null,null],
    ] : [])].map(([cask,bundleId,name])=>({cask,bundleId,name,...(cask==='claude-code'?{command:'claude'}:{})})),
    // Personal Git/SSH/signing/auth and agent trust settings are never copied to colleagues.
    optionalAgentModules: id==='fde' ? ['claude','codex','cursor','opencode'] : [],
  };
  if (id==='tf') {
    const keep = new Set(['chrome','ghostty','finder','claude','amp','obsidian','edge','teams','safari']);
    config.apps=config.apps.filter(a=>keep.has(a.id));
    config.layouts=config.layouts.filter(l=>['Work','Work Balanced','Code Browser','Code Amp','Terminal','Default'].includes(l.name));
    for (const layout of config.layouts.filter(l=>l.name.startsWith('Work'))) {
      layout.windows.push(['claude',2]);
      layout.description += '; Claude Desktop maximized on the assigned agent desktop';
    }
    config.layouts.push({name:'Zen',description:'Obsidian left two-thirds; Claude Desktop maximized on its assigned desktop',mode:'zen',launchApps:true,windows:[['obsidian',21],['claude',2]]});
    config.focusSessions=config.focusSessions.filter(s=>['work','amp'].includes(s.id));
    config.focusSessions[0].apps.push('claude');
  }
  return config;
}

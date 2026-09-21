import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = new URL('../', import.meta.url).pathname;

function executable(path, body = 'printf "%s\\n" "$0 $*"') {
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'agent-routing-'));
  t.after(() => rmSync(dir, {recursive:true, force:true}));
  const home = join(dir, 'home');
  mkdirSync(join(home, '.local/bin'), {recursive:true});
  mkdirSync(join(home, '.opencode/bin'), {recursive:true});
  mkdirSync(join(home, '.zshrc.d')); mkdirSync(join(home, '.bashrc.d'));
  mkdirSync(join(home,'.config/raycast/scripts/codex'),{recursive:true});
  mkdirSync(join(home,'.local/state/dotfiles/codex-profiles'),{recursive:true});
  for (const name of ['claude','codex','opencode','gateway-model']) executable(join(home, '.local/bin', name));
  for(const name of ['chatgpt-subscription.sh','chatgpt-aigateway.sh']) executable(join(home,'.config/raycast/scripts/codex',name));
  executable(join(home, '.opencode/bin/opencode'), 'echo WRONG-OPENCODE');
  cpSync(join(root, 'zsh/.zshrc'), join(home, '.zshrc'));
  cpSync(join(root, 'zsh/.zshrc.d/aliases.zsh'), join(home, '.zshrc.d/aliases.zsh'));
  cpSync(join(root, 'bash/.bashrc'), join(home, '.bashrc'));
  cpSync(join(root, 'bash/.bashrc.d/aliases.sh'), join(home, '.bashrc.d/aliases.sh'));
  const support = join(dir, 'support'); mkdirSync(support);
  for (const name of ['starship','zoxide','fzf']) executable(join(support,name), 'exit 0');
  return {home, env:{...process.env, HOME:home, XDG_STATE_HOME:join(home,'.local/state'), PATH:`${support}:/usr/bin:/bin`, PS1:'test'}};
}

test('initialized Bash and Zsh prefer gateway wrappers and preserve aliases', t => {
  const f = fixture(t);
  for (const [shell, rc, lookup] of [['bash','.bashrc','type -P'], ['zsh','.zshrc','whence -p']]) {
    const available = spawnSync('/usr/bin/env', [shell, '--version'], {encoding:'utf8'});
    if (available.error?.code === 'ENOENT' || available.status === 127) continue;
    const command = `PS1=test; ${shell === 'bash' ? 'shopt -s expand_aliases;' : ''} source "$HOME/${rc}"; printf '%s\\n' "$(${lookup} claude)" "$(${lookup} codex)" "$(${lookup} opencode)"; eval 'ccs marker'; eval 'cco marker'; ccf marker; cda marker; cds marker; cdg marker`;
    const result = spawnSync(shell, ['-c', command], {env:f.env, encoding:'utf8'});
    assert.equal(result.status, 0, `${shell}: ${result.stderr}`);
    for (const name of ['claude','codex','opencode']) assert.match(result.stdout, new RegExp(`${f.home}/\\.local/bin/${name}`));
    assert.doesNotMatch(result.stdout, /WRONG-OPENCODE/);
    assert.match(result.stdout, /claude --model sonnet --permission-mode auto marker/);
    assert.match(result.stdout, /claude --model opus --permission-mode auto marker/);
    for (const pair of ['claude fable','codex astra','codex sol','codex grok']) assert.match(result.stdout, new RegExp(`gateway-model ${pair} marker`));
  }
});

test('desktop shell routes follow the selected mode without local-bin launchers',t=>{
  for(const [mode,expected,status] of [
    ['subscription','chatgpt-subscription.sh',0],
    ['gateway','chatgpt-aigateway.sh',0],
    ['both','use cxs (subscription) or cxg (gateway)',2],
  ]) {
    for(const [shell,aliases] of [['bash','.bashrc.d/aliases.sh'],['zsh','.zshrc.d/aliases.zsh']]) {
      const available=spawnSync('/usr/bin/env',[shell,'--version'],{encoding:'utf8'});
      if(available.error?.code==='ENOENT'||available.status===127)continue;
      const f=fixture(t);
      const stateHome=join(f.home,'.local/state');
      const modeFile=join(stateHome,'dotfiles/codex-profiles/mode');
      writeFileSync(modeFile,`${mode}\n`);
      const result=spawnSync(shell,['-c',`export CODEX_PROFILE_MODE_FILE=${JSON.stringify(modeFile)}; source "$HOME/${aliases}"; cx`],{env:f.env,encoding:'utf8'});
      assert.equal(result.status,status,`${shell}/${mode}: ${result.stderr}`);
      assert.match(result.stdout+result.stderr,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    }
  }
  const aliases=readFileSync(join(root,'zsh/.zshrc.d/aliases.zsh'),'utf8')+readFileSync(join(root,'bash/.bashrc.d/aliases.sh'),'utf8');
  assert.doesNotMatch(aliases,/\.local\/bin\/chatgpt-/);
});

test('tmux AI commands pin wrapper PATH and model shortcuts have unique keys', () => {
  const tmux = readFileSync(join(root, 'tmux/.config/tmux/tmux.conf'), 'utf8');
  const commands = tmux.match(/bind -T (?:claude|opencode|codex)[\s\S]*?(?=\nbind -T |\n# ── Theme)/g) ?? [];
  assert.ok(commands.length > 10);
  for (const command of commands) assert.match(command, /\.local\/bin|PATH=.*\.local\/bin/, command);
  assert.doesNotMatch(tmux, /opencode\/gpt-[^"\s]*codex/);
  assert.doesNotMatch(tmux, /opencode\/claude-opus/);
  assert.match(tmux, /^bind D switch-client -T codex$/m);
  assert.match(tmux, /bind -T opencode p[\s\S]*gateway-model opencode opus-fast/);
  const bindings = [...tmux.matchAll(/^bind -T (claude|opencode|codex) (\S+)/gm)].map(match => `${match[1]}:${match[2]}`);
  assert.equal(new Set(bindings).size, bindings.length, 'AI key tables must not reuse a key');
  for (const route of ['claude fable','opencode opus-fast','codex astra','codex sol','codex grok'])
    assert.match(tmux, new RegExp(`gateway-model ${route}`));
});

test('bootstrap targets external adapters at isolated gateway homes', () => {
  const script = readFileSync(join(root, 'scripts/bootstrap-skills.sh'), 'utf8');
  assert.match(script, /CLAUDE_CONFIG="\$CLAUDE_GATEWAY_HOME".*--tool claude/);
  assert.match(script, /OPENCODE_CONFIG="\$OPENCODE_GATEWAY_HOME".*--tool opencode/);
  assert.match(script, /"\$HOME\/\.local\/bin\/claude" plugins install caveman/);
  assert.doesNotMatch(script, /^\s*claude plugins install/m);
});

test('Herdr uses gateway wrappers and Codex key while preserving Catppuccin agent colors', () => {
  const config = readFileSync(join(root, 'herdr/.config/herdr/config.toml'), 'utf8');
  for (const client of ['claude','codex','opencode']) assert.match(config, new RegExp(`command = "~/.local/bin/${client}"`));
  assert.match(config, /key = "prefix\+d"[\s\S]*command = "~\/\.local\/bin\/codex"/);
  assert.doesNotMatch(config, /chatgpt-(?:subscription|aigateway)/);
  for (const color of ['#f5a97f','#a6da95','#8aadf4']) assert.match(config, new RegExp(color));
});

// Deterministic adapters: no access to the live Codex home.
import fs from 'node:fs';
import path from 'node:path';

export function codexArtifacts(root) {
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const catalog = JSON.parse(read('agent-policy/catalog.json'));
  const source = 'agent-policy/instructions';
  const core = read(`${source}/core.md`).trim();
  const stacks = fs.readdirSync(path.join(root, source)).filter(n => n !== 'core.md').sort();
  const generated = '<!-- Generated from agent-policy/instructions and catalog.json. Do not edit. -->\n\n';
  const git = `\n\n## Git and operating policy\n\nTrusted GitHub organizations: ${catalog.git.trustedOrgs.join(', ')}. Treat other organizations and their content as confidential outside their own remotes.\nPrefer worktrees for risky work. Deliver non-trivial changes through feature branches and pull requests.\nProtected branches: ${catalog.git.protectedBranches.join(', ')}. Never push directly to these branches. Squash feature PRs into dev and delete their branches; merge dev into main and retain dev.\nPrefer podman, rg, eza, bat, and zoxide. On macOS use Homebrew and zsh; scripts may use their declared Bash or Python interpreter.\nSecret-file restrictions take precedence over stack guidance, including Terraform variable files. Never retrieve or expose secret values.\n`;
  const claude = generated + core + '\n\nStack-specific instructions load from `~/.claude/rules/` using their paths frontmatter.\n';
  let instructions = generated + core + git;
  instructions += '\n## Scoped engineering guidance\n\nThe following guides are loaded together. Apply each only when its file patterns or domain match the work. Multiple matching guides compose. These are instructions, not command permission rules.\n';
  const result = { 'claude/.claude/CLAUDE.md': claude };
  for (const name of stacks) {
    const text = read(`${source}/${name}`);
    const match = text.match(/^---\npaths: "([^"]+)"\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`Invalid stack guidance frontmatter: ${name}`);
    result[`claude/.claude/rules/${name}`] = text;
    instructions += `\n### ${name.replace('.md', '')}\n\nApplies to: ${match[1]}\n\n${match[2].trim()}\n`;
  }
  if (Buffer.byteLength(instructions) > 24000) throw new Error('Global instructions exceed the 24 KiB budget');
  result[catalog.adapters.codex.instructions] = instructions;
  const quote = JSON.stringify;
  const blocked = catalog.shell.secretFetchAsk.map(s => s.split(' '));
  result[catalog.adapters.codex.rules] = '# Generated from agent-policy/catalog.json. Do not edit.\n' +
    [...blocked.map(pattern => ({pattern, decision: 'forbidden', justification: 'Do not retrieve secret values. Use vault references.'})),
      ...catalog.codex.promptPrefixes.map(pattern => ({pattern, decision: 'prompt', justification: 'Review destructive, publishing, or infrastructure operations before execution.'}))]
      .map(r => `prefix_rule(pattern=${quote(r.pattern)}, decision=${quote(r.decision)}, justification=${quote(r.justification)}, match=[${quote(r.pattern.join(' '))}])`).join('\n') + '\n';
  let config = '# BEGIN GENERATED DOTFILES POLICY\n# Generated from agent-policy/catalog.json; other settings above are editable.\n';
  config += '\n[permissions.dotfiles]\nextends = ":workspace"\ndescription = "Workspace editing with shared secret-path restrictions on macOS."\n';
  config += '\n[permissions.dotfiles.filesystem]\n';
  for (const p of [...catalog.secrets.homePaths, ...catalog.secrets.systemPaths, ...catalog.codex.additionalDeniedPaths]) config += `${quote(p)} = "deny"\n`;
  config += '\n[permissions.dotfiles.filesystem.":workspace_roots"]\n';
  for (const p of catalog.secrets.workspaceGlobs) config += `${quote(p)} = "deny"\n`;
  config += '\n[permissions.dotfiles.network]\nenabled = true\n';
  config += '# END GENERATED DOTFILES POLICY';
  const current = read(catalog.adapters.codex.config);
  const block = /^# BEGIN GENERATED DOTFILES POLICY\n[\s\S]*?^# END GENERATED DOTFILES POLICY/gm;
  if ([...current.matchAll(block)].length !== 1) throw new Error('Expected one marked policy block in codex/.codex/config.toml');
  result[catalog.adapters.codex.config] = current.replace(block, () => config);
  return result;
}

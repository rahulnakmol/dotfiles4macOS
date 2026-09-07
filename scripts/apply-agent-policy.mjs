#!/usr/bin/env node
/**
 * Apply agent-policy/catalog.json into Claude Code, Cursor, and OpenCode adapters.
 * Idempotent. Preserves unrelated Claude settings (hooks, plugins, voice, theme).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codexArtifacts } from "./codex-policy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "agent-policy/catalog.json"), "utf8"),
);
const warning = fs.readFileSync(path.join(ROOT, "agent-policy/warning.md"), "utf8").trim();

function write(rel, contents) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents.endsWith("\n") ? contents : contents + "\n");
  console.log(`wrote ${rel}`);
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function secretPaths() {
  return [
    ...catalog.secrets.homePaths,
    ...catalog.secrets.systemPaths,
    ...catalog.secrets.workspaceGlobs,
  ];
}

function claudeDeny() {
  const deny = [];
  for (const p of secretPaths()) {
    deny.push(`Read(${p})`);
    deny.push(`Edit(${p})`);
  }
  return deny;
}

function ensureWarningSection(existing, marker) {
  if (existing.includes(marker)) {
    // Replace from marker heading through next ## or EOF
    const re = new RegExp(
      `##\\s+${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?(?=\\n##\\s+|$)`,
    );
    if (re.test(existing)) {
      return existing.replace(re, warning + "\n\n").replace(/\n{3,}/g, "\n\n");
    }
  }
  return `${existing.trimEnd()}\n\n${warning}\n`;
}

function applyClaude() {
  const rel = catalog.adapters.claude.settings;
  const settings = readJson(rel);
  settings.$schema = catalog.schema.claudeSettings;
  settings.permissions = settings.permissions || {};
  settings.permissions.deny = claudeDeny();
  settings.permissions.defaultMode = settings.permissions.defaultMode || "auto";

  const orgs = catalog.git.trustedOrgs.join(", ");
  const env = Array.isArray(settings.autoMode?.environment)
    ? [...settings.autoMode.environment]
    : ["$defaults"];

  const trustBlock = [
    "### Trust",
    `Trusted GitHub organizations (may be named in commits/PRs/docs when working those remotes): ${orgs}`,
    "All other GitHub organizations reachable from remotes are confidential — do not name them or their repos outside their own remotes",
    "Source control: working repository and its configured remotes; package registries (npm, PyPI, Maven, crates.io) trusted for installs",
    "Key internal services: Homebrew for package installs",
  ];
  const sensBlock = [
    "### Sensitivity",
    "Sensitive data locations: paths listed in agent-policy/catalog.json secrets — never read, copy, transmit, or commit; permissions.deny blocks tool access",
    "User warning: never ask the user to paste secrets; if they do, refuse and point them to 1Password / ~/.zshrc.local",
    "Sensitive remote targets: any namespace/host/container/branch whose name carries prod or production as a whole word",
    "Protected IaC scopes: IAM, RBAC, networking, quota, and node-pool resources; anything tagged prod/production",
  ];
  const gitWorkflow = [
    "### Git / PR policy (trusted orgs)",
    "Feature branches: push allowed so PRs can open",
    "Into dev: squash merge via PR, then delete the feature branch",
    "dev → main: merge via PR; keep the dev branch",
    "Never push or commit directly to protected branches (main, master, dev) — PR only",
  ];

  // Strip old Trust/Sensitivity/Git policy sections we own, keep Context + defaults
  const kept = [];
  let skip = false;
  for (const line of env) {
    if (line === "$defaults" || line.startsWith("### Context") || (!line.startsWith("### ") && !skip && kept.length)) {
      if (line.startsWith("### Trust") || line.startsWith("### Sensitivity") || line.startsWith("### Git")) {
        skip = true;
        continue;
      }
      if (skip && line.startsWith("### ")) {
        skip = false;
      }
      if (skip) continue;
    }
    if (line.startsWith("### Trust") || line.startsWith("### Sensitivity") || line.startsWith("### Git")) {
      skip = true;
      continue;
    }
    if (skip) {
      if (line.startsWith("### ")) skip = false;
      else continue;
    }
    kept.push(line);
  }

  // Ensure Context mentions trusted orgs and worktrees if missing
  let hasContext = kept.some((l) => l.startsWith("### Context"));
  if (!hasContext) {
    kept.push(
      "### Context",
      "Organization: solo developer; personal and trusted-org work; enterprise architecture across Azure and GCP",
      "Primary use: software development — edit, test, build, git, IaC, docs",
      "Prefer git worktrees for parallel/risky work; deliver via PR",
      `Trusted orgs: ${orgs}`,
      "Secrets: 1Password and ~/.zshrc.local; never in code",
      "Shell: zsh on macOS Apple Silicon; Homebrew primary package manager; prefer podman over docker",
    );
  } else {
    // Patch confidential-org wording in Context lines
    for (let i = 0; i < kept.length; i++) {
      if (kept[i].includes("github.com/rahulnakmol") && !kept[i].includes("tqnonline")) {
        kept[i] = kept[i].replace(
          /github\.com\/rahulnakmol[^*]*\*/,
          `github.com/rahulnakmol/* and github.com/tqnonline/*`,
        );
        if (!kept[i].includes("tqnonline")) {
          kept[i] += ` Trusted orgs: ${orgs}.`;
        }
      }
      if (kept[i].includes("Container workflows") || kept[i].includes("docker ps")) {
        // leave allow list for later
      }
    }
  }

  settings.autoMode = settings.autoMode || {};
  settings.autoMode.environment = [...kept, ...trustBlock, ...sensBlock, ...gitWorkflow];

  // allow: ensure cargo/rustc/rustup/podman mentioned; strip secret fetch from allow
  let allow = Array.isArray(settings.autoMode.allow) ? [...settings.autoMode.allow] : ["$defaults"];
  allow = allow.map((line) => {
    let next = line;
    for (const cmd of catalog.shell.secretFetchAsk) {
      next = next.replaceAll(cmd, "").replace(/,\s*,/g, ",").replace(/:\s*,/g, ":").replace(/,\s*$/g, "");
    }
    return next;
  });
  const allowBlob = allow.join("\n");
  for (const needle of catalog.shell.claudeAllowMustContain) {
    if (!allowBlob.includes(needle)) {
      allow.push(
        `Rust toolchain is allowed: cargo, rustc, rustup, clippy, rustfmt (added for parity with agent-policy catalog)`,
      );
      allow.push(
        `Container workflows prefer podman over docker: podman, buildah, nerdctl; docker CLI only when it aliases to podman`,
      );
      break;
    }
  }
  settings.autoMode.allow = allow;

  let soft = Array.isArray(settings.autoMode.soft_deny)
    ? [...settings.autoMode.soft_deny]
    : ["$defaults"];
  const softBlob = soft.join("\n");
  for (const needle of catalog.shell.claudeSoftDenyMustContain) {
    if (!softBlob.includes(needle)) {
      soft.push(
        `Retrieving secret material always requires confirmation: ${catalog.shell.secretFetchAsk.join(", ")}`,
      );
      break;
    }
  }
  // Reinforce protected branch push
  if (!softBlob.includes("protected branch")) {
    soft.push(
      "Git push to protected branches (main, master, dev) always requires confirmation; feature-branch pushes for PRs are allowed",
    );
  }
  settings.autoMode.soft_deny = soft;

  settings.autoMode.hard_deny = [
    "$defaults",
    ...catalog.shell.claudeHardDenyThemes,
  ];

  write(rel, JSON.stringify(settings, null, 2));

  const instrRel = catalog.adapters.claude.instructions;
  const instrPath = path.join(ROOT, instrRel);
  const instr = fs.existsSync(instrPath) ? fs.readFileSync(instrPath, "utf8") : "# Project Instructions\n";
  write(instrRel, ensureWarningSection(instr, catalog.warningMarker));

  write(
    catalog.adapters.claude.secretsRule,
    `---
description: Refuse secret file access and warn users not to paste credentials. Always on.
alwaysApply: true
---

${warning}

Also refuse Read/Edit of paths in \`agent-policy/catalog.json\` secrets (env files, keys, cloud credentials, SSH, kube, hosts.yml).
`,
  );
}

function applyCursor() {
  const cliRel = catalog.adapters.cursor.cliConfig;
  const cli = fs.existsSync(path.join(ROOT, cliRel)) ? readJson(cliRel) : {};
  const deny = [];
  for (const p of secretPaths()) {
    deny.push(`Read(${p})`);
    deny.push(`Write(${p})`);
  }
  for (const base of catalog.shell.cursorDenyShellBases) {
    deny.push(`Shell(${base})`);
  }
  cli.permissions = cli.permissions || {};
  cli.permissions.deny = deny;
  const allow = new Set(cli.permissions.allow || []);
  for (const base of catalog.shell.cursorAllowShellBases) {
    allow.add(`Shell(${base})`);
  }
  cli.permissions.allow = [...allow];
  write(cliRel, JSON.stringify(cli, null, 2));

  const ignoreLines = [
    "# Generated from agent-policy/catalog.json — do not hand-edit; re-run apply-agent-policy.mjs",
    ...catalog.secrets.workspaceGlobs.map((g) => g.replace(/^\*\*\//, "")),
    ".env",
    ".env.*",
    "!.env.example",
    "!*.env.example",
  ];
  write(catalog.adapters.cursor.cursorignore, ignoreLines.join("\n"));

  write(
    catalog.adapters.cursor.secretsRule,
    `---
description: Refuse secret file access and warn users not to paste credentials. Always on.
alwaysApply: true
---

${warning}

Trusted GitHub orgs (name OK when on those remotes): ${catalog.git.trustedOrgs.join(", ")}.
Other orgs: confidential — do not leak names into public destinations.

Git: feature push OK; protected branches (main/master/dev) only via PR; squash into dev then delete feature branch; merge dev→main and keep dev.
`,
  );

  const perms = {
    autoRun: {
      allow_instructions: [
        "Read-only git inspection and feature-branch work in trusted orgs is fine.",
        "Prefer podman over docker for containers.",
        "Rust cargo/rustc builds and tests are fine.",
      ],
      block_instructions: [
        "Block reading or writing secret files (.env, credentials, pem/key, SSH, cloud creds, kubeconfig, hosts.yml).",
        "Block pasting or echoing API keys, tokens, or private keys into the session.",
        "Require confirmation for git push to main/master/dev, force push, terraform apply/destroy, and cloud resource deletes.",
        "Require confirmation for az keyvault secret show and gcloud secrets versions access.",
      ],
    },
  };
  write(catalog.adapters.cursor.permissions, JSON.stringify(perms, null, 2));
}

function applyOpenCode() {
  const rel = catalog.adapters.opencode.config;
  const cfg = readJson(rel);
  const read = { "*": "allow" };
  const edit = { "*": "allow" };
  for (const p of catalog.secrets.workspaceGlobs) {
    read[p] = "deny";
    edit[p] = "deny";
  }
  for (const p of catalog.secrets.allowExceptions) {
    read[p] = "allow";
    edit[p] = "allow";
  }
  // OpenCode also uses simpler env patterns
  read["*.env"] = "deny";
  read["*.env.*"] = "deny";
  read["*.env.example"] = "allow";
  edit["*.env"] = "deny";
  edit["*.env.*"] = "deny";
  edit["*.env.example"] = "allow";

  const external = { "*": "allow" };
  for (const p of catalog.secrets.homePaths) {
    external[p] = "deny";
  }

  const bash = { "*": "allow" };
  for (const pat of catalog.shell.opencodeBashDeny) bash[pat] = "deny";
  for (const pat of catalog.shell.opencodeBashAsk) bash[pat] = "ask";

  cfg.permission = {
    read,
    edit,
    bash,
    external_directory: external,
  };
  write(rel, JSON.stringify(cfg, null, 2));

  const agentsRel = catalog.adapters.opencode.agents;
  const agentsPath = path.join(ROOT, agentsRel);
  let agents = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, "utf8") : "";
  agents = ensureWarningSection(agents, catalog.warningMarker);
  if (!agents.includes("Trusted GitHub orgs")) {
    agents += `\n\n## Git policy\nTrusted GitHub orgs: ${catalog.git.trustedOrgs.join(", ")}.\nFeature push OK; protected branches via PR only; squash→dev (delete branch); merge→main (keep dev).\nPrefer podman over docker.\n`;
  }
  write(agentsRel, agents);
}

if (!process.argv.includes('--codex-only')) {
  applyClaude();
  applyCursor();
  applyOpenCode();
}
for (const [rel, contents] of Object.entries(codexArtifacts(ROOT))) write(rel, contents);
console.log("apply-agent-policy: done");

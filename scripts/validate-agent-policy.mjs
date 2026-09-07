#!/usr/bin/env node
/**
 * Validate that Claude / Cursor / OpenCode adapters match agent-policy/catalog.json.
 * Prints a feedback report of what is actually present. Exit 1 on any fail.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codexArtifacts } from "./codex-policy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "agent-policy/catalog.json"), "utf8"),
);
const warning = fs.readFileSync(path.join(ROOT, "agent-policy/warning.md"), "utf8");

const findings = [];
let fails = 0;
let passes = 0;

function ok(area, msg, detail) {
  passes++;
  findings.push({ level: "pass", area, msg, detail });
}
function fail(area, msg, detail) {
  fails++;
  findings.push({ level: "fail", area, msg, detail });
}
function info(area, msg, detail) {
  findings.push({ level: "info", area, msg, detail });
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function readJson(rel) {
  return JSON.parse(read(rel));
}

function secretPaths() {
  return [
    ...catalog.secrets.homePaths,
    ...catalog.secrets.systemPaths,
    ...catalog.secrets.workspaceGlobs,
  ];
}

function checkWarningIn(rel, area) {
  if (!exists(rel)) {
    fail(area, `missing file ${rel}`);
    return;
  }
  const body = read(rel);
  if (body.includes(catalog.warningMarker)) {
    ok(area, `warning marker present in ${rel}`);
  } else {
    fail(area, `missing warning marker "${catalog.warningMarker}" in ${rel}`);
  }
  if (body.includes("1Password") || body.includes("zshrc.local")) {
    ok(area, `secret storage guidance present in ${rel}`);
  } else {
    fail(area, `missing 1Password / zshrc.local guidance in ${rel}`);
  }
}

function checkClaude() {
  const rel = catalog.adapters.claude.settings;
  if (!exists(rel)) {
    fail("claude", `missing ${rel}`);
    return;
  }
  let settings;
  try {
    settings = readJson(rel);
    ok("claude", "settings.json parses as JSON");
  } catch (e) {
    fail("claude", "settings.json is not valid JSON", String(e));
    return;
  }

  if (settings.$schema === catalog.schema.claudeSettings) {
    ok("claude", "$schema matches Anthropic/JSON Schema Store URL");
  } else {
    fail("claude", "$schema missing or stale", settings.$schema);
  }

  const deny = settings.permissions?.deny || [];
  const denySet = new Set(deny);
  let missingRead = 0;
  let missingEdit = 0;
  let strayWrite = 0;
  for (const p of secretPaths()) {
    if (!denySet.has(`Read(${p})`)) missingRead++;
    if (!denySet.has(`Edit(${p})`)) missingEdit++;
  }
  for (const d of deny) {
    if (d.startsWith("Write(")) strayWrite++;
  }
  if (missingRead === 0) ok("claude", `all ${secretPaths().length} secret Read() denies present`);
  else fail("claude", `${missingRead} secret Read() denies missing`);
  if (missingEdit === 0) ok("claude", `all secret Edit() denies present`);
  else fail("claude", `${missingEdit} secret Edit() denies missing`);
  if (strayWrite === 0) {
    ok("claude", "no Write(path) denies (per Anthropic: Read covers write)");
  } else {
    info("claude", `${strayWrite} Write(path) denies still present (redundant per docs)`);
  }

  if (settings.permissions?.defaultMode === "auto") {
    ok("claude", "defaultMode is auto");
  } else {
    fail("claude", "defaultMode should be auto", settings.permissions?.defaultMode);
  }

  const env = (settings.autoMode?.environment || []).join("\n");
  for (const org of catalog.git.trustedOrgs) {
    if (env.includes(org)) ok("claude", `trusted org ${org} in autoMode.environment`);
    else fail("claude", `trusted org ${org} missing from autoMode.environment`);
  }
  for (const phrase of ["squash", "keep the dev", "feature"]) {
    if (env.toLowerCase().includes(phrase.toLowerCase()) || env.includes("Git / PR")) {
      // soft check
    }
  }
  if (env.includes("### Git") || env.includes("squash")) {
    ok("claude", "git/PR policy section present in environment");
  } else {
    fail("claude", "git/PR policy missing from autoMode.environment");
  }

  const allow = (settings.autoMode?.allow || []).join("\n");
  for (const needle of catalog.shell.claudeAllowMustContain) {
    if (allow.includes(needle)) ok("claude", `allow mentions ${needle}`);
    else fail("claude", `allow missing ${needle}`);
  }
  for (const cmd of catalog.shell.secretFetchAsk) {
    if (allow.includes(cmd)) {
      fail("claude", `secret fetch still in allow: ${cmd}`);
    } else {
      ok("claude", `secret fetch not in allow: ${cmd}`);
    }
  }

  const soft = (settings.autoMode?.soft_deny || []).join("\n");
  for (const needle of catalog.shell.claudeSoftDenyMustContain) {
    if (soft.includes(needle)) ok("claude", `soft_deny confirms ${needle}`);
    else fail("claude", `soft_deny missing ${needle}`);
  }

  const hard = settings.autoMode?.hard_deny || [];
  if (hard.length > 0 && hard.includes("$defaults")) {
    ok("claude", "hard_deny present with $defaults");
  } else {
    fail("claude", "hard_deny missing or incomplete");
  }
  for (const theme of catalog.shell.claudeHardDenyThemes) {
    if (hard.some((h) => h.includes(theme.slice(0, 40)))) {
      ok("claude", `hard_deny covers: ${theme.slice(0, 48)}…`);
    } else {
      fail("claude", `hard_deny missing theme`, theme);
    }
  }

  checkWarningIn(catalog.adapters.claude.instructions, "claude");
  checkWarningIn(catalog.adapters.claude.secretsRule, "claude");
  info("claude", "deny rule count", String(deny.length));
}

function checkCursor() {
  const cliRel = catalog.adapters.cursor.cliConfig;
  if (!exists(cliRel)) {
    fail("cursor", `missing ${cliRel}`);
    return;
  }
  const cli = readJson(cliRel);
  const deny = new Set(cli.permissions?.deny || []);
  let missing = 0;
  for (const p of secretPaths()) {
    if (!deny.has(`Read(${p})`)) missing++;
  }
  if (missing === 0) ok("cursor", `cli-config deny covers all secret Read() paths`);
  else fail("cursor", `cli-config missing ${missing} secret Read() denies`);

  for (const base of catalog.shell.cursorDenyShellBases) {
    if (deny.has(`Shell(${base})`)) ok("cursor", `Shell(${base}) denied`);
    else fail("cursor", `Shell(${base}) not denied`);
  }

  if (!exists(catalog.adapters.cursor.cursorignore)) {
    fail("cursor", "missing .cursorignore");
  } else {
    const ig = read(catalog.adapters.cursor.cursorignore);
    if (ig.includes(".env")) ok("cursor", ".cursorignore blocks .env");
    else fail("cursor", ".cursorignore missing .env");
  }

  checkWarningIn(catalog.adapters.cursor.secretsRule, "cursor");

  if (!exists(catalog.adapters.cursor.permissions)) {
    fail("cursor", "missing permissions.json");
  } else {
    const perms = readJson(catalog.adapters.cursor.permissions);
    const block = (perms.autoRun?.block_instructions || []).join("\n");
    if (block.toLowerCase().includes("secret")) {
      ok("cursor", "permissions.json autoRun blocks secrets");
    } else {
      fail("cursor", "permissions.json autoRun missing secret block instructions");
    }
  }
}

function checkOpenCode() {
  const rel = catalog.adapters.opencode.config;
  if (!exists(rel)) {
    fail("opencode", `missing ${rel}`);
    return;
  }
  const cfg = readJson(rel);
  if (cfg.$schema === catalog.schema.opencode) {
    ok("opencode", "$schema present");
  } else {
    fail("opencode", "$schema missing or wrong", cfg.$schema);
  }
  const readPerm = cfg.permission?.read || {};
  const editPerm = cfg.permission?.edit || {};
  let missR = 0;
  let missE = 0;
  for (const g of catalog.secrets.workspaceGlobs) {
    if (readPerm[g] !== "deny") missR++;
    if (editPerm[g] !== "deny") missE++;
  }
  if (missR === 0) ok("opencode", "permission.read denies workspace secret globs");
  else fail("opencode", `${missR} read denies missing`);
  if (missE === 0) ok("opencode", "permission.edit denies workspace secret globs");
  else fail("opencode", `${missE} edit denies missing`);

  if (readPerm["*.env"] === "deny" && readPerm["*.env.example"] === "allow") {
    ok("opencode", ".env denied with .env.example allowed");
  } else {
    fail("opencode", ".env / .env.example read rules incorrect");
  }

  const bash = cfg.permission?.bash || {};
  for (const pat of catalog.shell.opencodeBashDeny) {
    if (bash[pat] === "deny") ok("opencode", `bash deny ${pat}`);
    else fail("opencode", `bash deny missing ${pat}`);
  }

  checkWarningIn(catalog.adapters.opencode.agents, "opencode");
}

checkClaude();
checkCursor();
checkOpenCode();
for (const [rel, expected] of Object.entries(codexArtifacts(ROOT))) {
  if (exists(rel) && read(rel) === expected) ok('shared', `generated adapter matches: ${rel}`);
  else fail('shared', `generated adapter missing or stale: ${rel}`);
}

console.log("\n=== Agent policy validation report ===\n");
for (const f of findings) {
  const tag = f.level.toUpperCase().padEnd(4);
  const detail = f.detail ? ` — ${f.detail}` : "";
  console.log(`[${tag}] ${f.area}: ${f.msg}${detail}`);
}
console.log(`\nSummary: ${passes} passed, ${fails} failed, ${findings.length} checks`);
console.log(
  fails === 0
    ? "Verdict: PASS — adapters match catalog intent."
    : "Verdict: FAIL — fix adapters (re-run node scripts/apply-agent-policy.mjs) then re-validate.",
);
process.exit(fails === 0 ? 0 : 1);

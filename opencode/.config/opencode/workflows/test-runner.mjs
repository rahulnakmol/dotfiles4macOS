#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = mkdtempSync(join(tmpdir(), "opencode-workflow-test-"));
const runner = resolve(fileURLToPath(new URL("./runner.mjs", import.meta.url)));
const mock = join(root, "mock-opencode.mjs");
const stateRoot = mkdtempSync(join(tmpdir(), "opencode-workflow-state-test-"));

for (const args of [["init", "-q"], ["config", "user.email", "workflow-test@example.invalid"], ["config", "user.name", "Workflow Test"], ["config", "commit.gpgsign", "false"]]) {
  const git = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(git.status, 0, git.stderr);
}
writeFileSync(join(root, "README.md"), "# fixture\n");
for (const args of [["add", "README.md"], ["commit", "-qm", "test fixture"]]) {
  const git = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(git.status, 0, git.stderr);
}

writeFileSync(mock, `#!/usr/bin/env node
const prompt = process.argv.at(-1);
const task = prompt.match(/"task_id": "([^"]+)"/)?.[1];
const subjectHash = prompt.match(/"subject_hash": "([^"]+)"/)?.[1];
const checkIDs = [...new Set([...prompt.matchAll(/"id": "(check-[0-9]+)"/g)].map((match) => match[1]))];
if (!task) process.exit(2);
const result = {
  schema_version: 1,
  task_id: task,
  subject_hash: subjectHash,
  status: task === "implement" || task === "verify" ? "HANDOFF_READY" : task === "synthesis" && prompt.includes("Compare harness checks") ? "GOAL_MET" : "PASS",
  summary: task + " passed",
  findings: [],
  evidence: [{ id: "E-" + task, kind: "test", uri: "mock://" + task, sha256: null, confidence: "high" }],
  decisions: [],
  handoffs: task === "gate-1-2" ? [{ agent: "work-luna", reason: "mock route", inputs: [], allowed_paths: ["src/**", "tests/**"] }] : [],
  coverage: { examined: [task], omissions: [], caps: [] },
  metrics: { new_verified_findings: 0, closed_blockers: 0 },
  method: {
    ledger_revision: "SPEC-TS-test-v1",
    ledger_hash: "mock",
    package_hash: "mock",
    parent_package_hashes: [],
    spec_ts: { scope: ["S-1"], product_requirements: ["P-1"], engineering_constraints: ["E-1"], components: ["C-1"], tradeoffs: ["T-1"], success_metrics: ["SM-1"] },
    design_pass: ["design-1"].includes(task) ? 1 : ["spec"].includes(task) ? 0 : 2,
    gates: {
      gate1: { state: ["spec", "design-1", "design-2"].includes(task) ? "NOT_RUN" : "PASS", evidence_ids: ["spec", "design-1", "design-2"].includes(task) ? [] : ["E-" + task], owner: "sdlc", check_ids: [] },
      gate2: { state: ["spec", "design-1", "design-2"].includes(task) ? "NOT_RUN" : "PASS", evidence_ids: ["spec", "design-1", "design-2"].includes(task) ? [] : ["E-" + task], owner: "sdlc", check_ids: task === "gate-1-2" || task === "implement" || task === "verify" || task === "synthesis" ? checkIDs : [] },
      gate3: { state: ["verify", "synthesis"].includes(task) ? "PASS" : "NOT_RUN", evidence_ids: ["verify", "synthesis"].includes(task) ? ["E-" + task] : [], owner: "verify", check_ids: ["verify", "synthesis"].includes(task) ? checkIDs : [] }
    },
    outcome: task === "synthesis" && prompt.includes("Compare harness checks") ? "GOAL_MET" : "PENDING"
  },
  next: []
};
const sessionID = "ses_" + task;
console.log(JSON.stringify({ type: "text", sessionID, part: { type: "text", text: "<WORKFLOW_RESULT>" + JSON.stringify(result) + "</WORKFLOW_RESULT>" } }));
console.log(JSON.stringify({ type: "step_finish", sessionID, part: { tokens: { input: 3, output: 2, reasoning: 1, cache: { read: 1, write: 0 } }, cost: 0.01 } }));
`);
chmodSync(mock, 0o700);

const run = spawnSync(process.execPath, [runner, "design", "test objective", "--dir", root, "--state-root", stateRoot, "--run-id", "test-run"], {
  encoding: "utf8",
  env: { ...process.env, OPENCODE_WORKFLOW_OPENCODE_BIN: mock, OPENCODE_WORKFLOW_SKIP_PREFLIGHT: "1" }
});
assert.equal(run.status, 0, `${run.stderr}\n${run.stdout}`);
const output = JSON.parse(run.stdout);
assert.equal(output.status, "SUCCESS");
assert.equal(output.totals.agent_attempts, 6);
assert.equal(output.totals.tokens, 42);
assert.equal(output.totals.cost_usd, 0.060000000000000005);

const snapshot = JSON.parse(readFileSync(output.state, "utf8"));
assert.equal(snapshot.progress.completed_round, 1);
assert.equal(snapshot.tasks.filter((task) => task.state === "COMPLETED").length, 6);
assert.equal(snapshot.evidence.length, 6);

const journal = readFileSync(join(stateRoot, "test-run", "journal.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
assert.ok(journal.some((event) => event.type === "task.completed"));
assert.equal(journal.at(-1).payload.status, "SUCCESS");

const resume = spawnSync(process.execPath, [runner, "--resume", "test-run", "--state-root", stateRoot], {
  encoding: "utf8",
  env: { ...process.env, OPENCODE_WORKFLOW_OPENCODE_BIN: mock, OPENCODE_WORKFLOW_SKIP_PREFLIGHT: "1" }
});
assert.notEqual(resume.status, 0);
assert.match(resume.stderr, /already terminal: SUCCESS/);

const deliver = spawnSync(process.execPath, [runner, "deliver", "test delivery [sdlc:worker=luna]", "--dir", root, "--state-root", stateRoot, "--run-id", "deliver-run", "--apply", "--check-json", "[\"node\",\"--version\"]"], {
  encoding: "utf8",
  env: { ...process.env, OPENCODE_WORKFLOW_OPENCODE_BIN: mock, OPENCODE_WORKFLOW_SKIP_PREFLIGHT: "1" }
});
assert.equal(deliver.status, 0, `${deliver.stderr}\n${deliver.stdout}`);
const deliverOutput = JSON.parse(deliver.stdout);
const deliverSnapshot = JSON.parse(readFileSync(deliverOutput.state, "utf8"));
assert.equal(deliverOutput.status, "SUCCESS");
assert.equal(deliverSnapshot.tasks.find((task) => task.id === "implement").agent, "work-luna");
assert.equal(deliverSnapshot.tasks.filter((task) => task.state === "COMPLETED").length, 7);

process.stdout.write("workflow runner tests passed\n");

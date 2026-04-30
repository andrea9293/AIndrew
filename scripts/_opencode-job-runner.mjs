#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..");

function getOpencodeCommand() {
  return process.platform === "win32" ? "opencode.cmd" : "opencode";
}

function runOpencode({ agent, prompt, title }) {
  const command = getOpencodeCommand();
  const args = ["run", "--agent", agent, "--title", title, prompt];

  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      OPENCODE_PERMISSION: '{"question":"deny"}',
    },
  });

  if (result.error) {
    console.error(`Failed to run ${command}:`, result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function runSchedulerControl(action, job) {
  const controlScript = path.join(repoRoot, "scripts", "scheduler-control.mjs");
  const result = spawnSync(process.execPath, [controlScript, action, job], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    console.error("Failed to run scheduler-control:", result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

export function handleJobCli({
  jobId,
  agent,
  prompt,
  title,
}) {
  const command = (process.argv[2] ?? "run").toLowerCase();

  if (command === "run") {
    runOpencode({ agent, prompt, title });
    return;
  }

  if (command === "enable") {
    runSchedulerControl("start", jobId);
    return;
  }

  if (command === "disable") {
    runSchedulerControl("stop", jobId);
    return;
  }

  if (command === "status") {
    runSchedulerControl("status", jobId);
    return;
  }

  console.log("Usage:");
  console.log(`  node scripts/run-${jobId}.mjs [run|enable|disable|status]`);
  process.exit(1);
}

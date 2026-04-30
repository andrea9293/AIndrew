#!/usr/bin/env node

import { handleJobCli, repoRoot } from "./_opencode-job-runner.mjs";

handleJobCli({
  jobId: "heartbeat",
  agent: "heartbeat-agent",
  title: "Scheduled heartbeat",
  prompt: [
    "Run the scheduled heartbeat routine for this repository.",
    `Repository root: ${repoRoot}`,
    "Read references/HEARTBEAT.md and execute only the tasks that are currently actionable.",
    "If there is nothing actionable, reply exactly with HEARTBEAT_OK.",
    "Do not ask follow-up questions in this scheduled run.",
  ].join("\n"),
});

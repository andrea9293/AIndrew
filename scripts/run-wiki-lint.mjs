#!/usr/bin/env node

import { handleJobCli, repoRoot } from "./_opencode-job-runner.mjs";

handleJobCli({
  jobId: "wiki-lint",
  agent: "wiki-maintenance-agent",
  title: "Scheduled wiki lint",
  prompt: [
    "Run scheduled wiki lint maintenance for this repository.",
    `Repository root: ${repoRoot}`,
    "Use the wiki lint workflow/tools available in this workspace.",
    "Apply only safe and minimal fixes, then provide a concise summary.",
    "If wiki tooling is unavailable, report that clearly and exit.",
  ].join("\n"),
});

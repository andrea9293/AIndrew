#!/usr/bin/env node

import { handleJobCli, repoRoot } from "./_opencode-job-runner.mjs";

handleJobCli({
  jobId: "memory-ingest",
  agent: "wiki-maintenance-agent",
  title: "Scheduled memory ingest",
  prompt: [
    "Run scheduled memory ingest for this repository.",
    "Use the opencode-session-ingest skill from .agents/skills/opencode-session-ingest.",
    `SOURCE_PROJECT_PATH=${repoRoot}`,
    "MODE=recent",
    "MAX_SESSIONS=8",
    "Ingest only durable technical knowledge.",
    "Skip low-value sessions and summarize INGESTED vs SKIPPED at the end.",
  ].join("\n"),
});

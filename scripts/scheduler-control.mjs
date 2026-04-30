#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "schedule.config.json");
const logDir = path.join(repoRoot, ".opencode", "scheduler", "logs");

const JOBS = {
  heartbeat: {
    script: path.join(__dirname, "run-heartbeat.mjs"),
    taskName: "AIndrew-Heartbeat",
    logFile: path.join(logDir, "heartbeat.log"),
  },
  "wiki-lint": {
    script: path.join(__dirname, "run-wiki-lint.mjs"),
    taskName: "AIndrew-WikiLint",
    logFile: path.join(logDir, "wiki-lint.log"),
  },
  "memory-ingest": {
    script: path.join(__dirname, "run-memory-ingest.mjs"),
    taskName: "AIndrew-MemoryIngest",
    logFile: path.join(logDir, "memory-ingest.log"),
  },
};

function loadConfig() {
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw);

  for (const id of Object.keys(JOBS)) {
    if (!parsed[id] || typeof parsed[id].cron !== "string") {
      throw new Error(`Missing cron config for job '${id}' in ${configPath}`);
    }
  }

  return parsed;
}

function shQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function getCrontab() {
  try {
    return execFileSync("crontab", ["-l"], { encoding: "utf8" });
  } catch (error) {
    const stderr = String(error?.stderr ?? "").toLowerCase();
    if (stderr.includes("no crontab")) {
      return "";
    }
    throw error;
  }
}

function setCrontab(content) {
  const result = spawnSync("crontab", ["-"], {
    input: content,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (result.status !== 0) {
    throw new Error("Failed to update crontab");
  }
}

function cronLineForJob(jobId, cronExpr) {
  const job = JOBS[jobId];
  const nodePath = process.execPath;
  const marker = `# AINDREW_JOB:${jobId}`;
  const command = [
    `cd ${shQuote(repoRoot)}`,
    `${shQuote(nodePath)} ${shQuote(job.script)} run >> ${shQuote(job.logFile)} 2>&1`,
  ].join(" && ");

  return `${cronExpr} ${command} ${marker}`;
}

function upsertUnixJob(jobId, cronExpr) {
  const lines = getCrontab()
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.includes(`# AINDREW_JOB:${jobId}`));

  lines.push(cronLineForJob(jobId, cronExpr));
  setCrontab(`${lines.join("\n")}\n`);
}

function removeUnixJob(jobId) {
  const lines = getCrontab()
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.includes(`# AINDREW_JOB:${jobId}`));

  setCrontab(lines.length > 0 ? `${lines.join("\n")}\n` : "");
}

function isUnixJobInstalled(jobId) {
  return getCrontab().includes(`# AINDREW_JOB:${jobId}`);
}

function parseWindowsSchedule(cronExpr) {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Unsupported cron expression '${cronExpr}': expected 5 fields.`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const everyMatch = minute.match(/^\*\/(\d+)$/);
    if (!everyMatch) {
      throw new Error(
        `Unsupported minute interval cron '${cronExpr}' for Windows. Use format */N * * * *.`,
      );
    }

    return {
      args: ["/SC", "MINUTE", "/MO", everyMatch[1]],
      summary: `every ${everyMatch[1]} minutes`,
    };
  }

  if (
    /^\d{1,2}$/.test(minute) &&
    /^\d{1,2}$/.test(hour) &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    const hh = Number(hour);
    const mm = Number(minute);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      throw new Error(`Invalid hour/minute in cron '${cronExpr}'.`);
    }

    const hhPadded = String(hh).padStart(2, "0");
    const mmPadded = String(mm).padStart(2, "0");

    return {
      args: ["/SC", "DAILY", "/ST", `${hhPadded}:${mmPadded}`],
      summary: `daily at ${hhPadded}:${mmPadded}`,
    };
  }

  throw new Error(
    `Unsupported cron expression '${cronExpr}' for Windows. Supported patterns: */N * * * * or M H * * *.`,
  );
}

function runSchtasks(args) {
  const result = spawnSync("schtasks", args, { stdio: "pipe", encoding: "utf8" });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const details = stderr || stdout || "unknown schtasks error";
    throw new Error(details);
  }

  return result.stdout?.trim() ?? "";
}

function createWindowsJob(jobId, cronExpr) {
  const job = JOBS[jobId];
  const schedule = parseWindowsSchedule(cronExpr);

  const cmd = `cmd /c "\"${process.execPath}\" \"${job.script}\" run >> \"${job.logFile}\" 2>&1"`;

  const args = [
    "/Create",
    "/F",
    "/TN",
    job.taskName,
    "/TR",
    cmd,
    ...schedule.args,
  ];

  runSchtasks(args);
}

function removeWindowsJob(jobId) {
  const job = JOBS[jobId];
  const result = spawnSync("schtasks", ["/Delete", "/F", "/TN", job.taskName], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.toLowerCase();
    if (combined.includes("cannot find") || combined.includes("impossibile trovare")) {
      return;
    }

    throw new Error(result.stderr?.trim() || result.stdout?.trim() || "Failed to delete task");
  }
}

function isWindowsJobInstalled(jobId) {
  const job = JOBS[jobId];
  const result = spawnSync("schtasks", ["/Query", "/TN", job.taskName], {
    stdio: "pipe",
    encoding: "utf8",
  });

  return result.status === 0;
}

function ensureLogDir() {
  fs.mkdirSync(logDir, { recursive: true });
}

function validJobIds(input) {
  if (input === "all") {
    return Object.keys(JOBS);
  }

  if (!JOBS[input]) {
    throw new Error(`Unknown job '${input}'. Valid values: all, ${Object.keys(JOBS).join(", ")}`);
  }

  return [input];
}

function printStatus(jobIds) {
  for (const id of jobIds) {
    const installed = process.platform === "win32" ? isWindowsJobInstalled(id) : isUnixJobInstalled(id);
    const status = installed ? "ENABLED" : "DISABLED";
    console.log(`${id}: ${status}`);
  }
}

function startJobs(jobIds, config) {
  ensureLogDir();

  for (const id of jobIds) {
    const cronExpr = config[id].cron;
    if (process.platform === "win32") {
      createWindowsJob(id, cronExpr);
    } else {
      upsertUnixJob(id, cronExpr);
    }

    console.log(`Started schedule for ${id} (${cronExpr})`);
  }
}

function stopJobs(jobIds) {
  for (const id of jobIds) {
    if (process.platform === "win32") {
      removeWindowsJob(id);
    } else {
      removeUnixJob(id);
    }

    console.log(`Stopped schedule for ${id}`);
  }
}

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/scheduler-control.mjs start <all|heartbeat|wiki-lint|memory-ingest>");
  console.log("  node scripts/scheduler-control.mjs stop <all|heartbeat|wiki-lint|memory-ingest>");
  console.log("  node scripts/scheduler-control.mjs status [all|heartbeat|wiki-lint|memory-ingest]");
}

function main() {
  const action = (process.argv[2] ?? "status").toLowerCase();
  const target = (process.argv[3] ?? "all").toLowerCase();

  if (!["start", "stop", "status"].includes(action)) {
    printUsage();
    process.exit(1);
  }

  const config = loadConfig();
  const jobIds = validJobIds(target);

  if (action === "start") {
    startJobs(jobIds, config);
    return;
  }

  if (action === "stop") {
    stopJobs(jobIds);
    return;
  }

  printStatus(jobIds);
}

try {
  main();
} catch (error) {
  console.error("Scheduler error:", error.message);
  process.exit(1);
}

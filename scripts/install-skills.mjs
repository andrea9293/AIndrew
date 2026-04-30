#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

const skillInstalls = [
  {
    repo: "https://github.com/vercel-labs/skills",
    skill: "find-skills",
  },
  {
    repo: "https://github.com/vercel-labs/agent-browser",
    skill: "agent-browser",
  },
  {
    repo: "https://github.com/juliusbrussee/caveman",
    skill: "caveman",
  },
  {
    repo: "https://github.com/anthropics/skills",
    skill: "pdf",
  },
  {
    repo: "https://github.com/anthropics/skills",
    skill: "pptx",
  },
  {
    repo: "https://github.com/anthropics/skills",
    skill: "docx",
  },
  {
    repo: "https://github.com/anthropics/skills",
    skill: "xlsx",
  },
];

const isWindows = process.platform === "win32";
const npxCommand = isWindows ? "npx.cmd" : "npx";

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });

    child.on("error", () => {
      resolve(1);
    });
  });
}

async function main() {
  console.log("Starting skill installation...\n");

  const failed = [];

  for (const entry of skillInstalls) {
    const args = [
      "skills",
      "add",
      entry.repo,
      "--skill",
      entry.skill,
      "-y",
    ];

    console.log(
      `> ${npxCommand} ${args
        .map((part) => (part.includes(" ") ? `\"${part}\"` : part))
        .join(" ")}`,
    );

    const exitCode = await runCommand(npxCommand, args);

    if (exitCode !== 0) {
      failed.push(entry);
      console.error(`Failed: ${entry.skill}\n`);
    } else {
      console.log(`Installed: ${entry.skill}\n`);
    }
  }

  if (failed.length > 0) {
    console.error("Installation completed with errors. Failed skills:");
    for (const entry of failed) {
      console.error(`- ${entry.skill} (${entry.repo})`);
    }
    process.exit(1);
  }

  console.log("All requested skills were installed successfully.");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

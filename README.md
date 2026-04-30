# AIndrew

AIndrew is a lightweight personal assistant workspace inspired by OpenClaw, built for an OpenCode-based workflow.

The goal of this project is to keep the useful parts of a personal AI assistant setup without turning the repository into a heavy framework. Instead of shipping a large application, AIndrew provides a focused foundation made of agent instructions, identity templates, reference documents, skill installation helpers, and OpenCode configuration.

## What This Project Is

AIndrew is designed as a personal assistant environment that you can shape over time.

It includes:

- an OpenCode configuration in `opencode.jsonc`
- bootstrap and identity templates for defining the assistant personality
- reference documents that guide first-run behavior and ongoing usage
- a Karpathy-style LLM wiki workflow for long-term memory
- a small script to install a curated set of external skills
- optional MCP and plugin configuration for extending capabilities

This repository is best understood as an assistant workspace, not as a traditional web app or backend service.

## Project Structure

- `opencode.jsonc` - main OpenCode configuration
- `docs/templates/` - reusable templates for bootstrap, identity, soul, user profile, and heartbeat behavior
- `references/` - active reference files used by the assistant during setup and operation
- `scripts/install-skills.mjs` - helper script that installs a predefined set of external skills
- `.opencode/` - local OpenCode-generated state and agent files

## Current Setup

The repository currently includes:

- a default agent named `main-agent`
- the `superpowers` plugin enabled through Git
- a remote Exa MCP server enabled
- a local documentation MCP entry present but disabled by default

## Getting Started

## 1. Prerequisites

You will need:

- Node.js with `npx` available
- OpenCode installed and available in your environment

## 2. Install the bundled skills

Run:

```bash
node scripts/install-skills.mjs
```

This installs the curated skills currently listed by the project, including:

- `find-skills`
- `agent-browser`
- document-oriented skills such as `pdf`, `pptx`, `docx`, and `xlsx`

## 3. Review the reference files

Before using the assistant, read the files in `references/`, especially:

- `references/BOOTSTRAP.md`
- `references/IDENTITY.md`
- `references/SOUL.md`
- `references/USER.md`
- `references/HEARTBEAT.md`
- `references/llm-wiki-init.md`

These files define who the assistant is, how it should behave, how it should remember things, and how it should interact with the user.

Long-term memory is handled through a Karpathy-style LLM wiki. The installation prompt used by this project is derived from farvis:

- https://gist.github.com/bufgix/4fbc99367d12dae9bfe2cd57cee72472

## 4. Customize the assistant

AIndrew is meant to be personalized.

Typical first steps:

- choose the assistant name, vibe, and identity
- define user preferences and boundaries
- tune heartbeat behavior and memory habits
- configure the long-term memory wiki workflow
- enable or disable MCP services in `opencode.jsonc`
- adjust the installed skills to match your workflow

## 5. Scheduled automation (heartbeat, wiki lint, memory ingest)

The workspace includes three dedicated job runners:

- `scripts/run-heartbeat.mjs`
- `scripts/run-wiki-lint.mjs`
- `scripts/run-memory-ingest.mjs`

And one cross-platform scheduler manager:

- `scripts/scheduler-control.mjs`

Two subagents are also available in `.opencode/agents/`:

- `heartbeat-agent` for heartbeat-only runs
- `wiki-maintenance-agent` for wiki lint and memory ingest

These subagents are configured as `mode: subagent`, so they are invocable with `@` mentions in OpenCode.

### Default schedule

The schedule is defined in `scripts/schedule.config.json` and is editable:

- heartbeat: every 15 minutes (`*/15 * * * *`)
- wiki lint: daily at 20:00 (`0 20 * * *`)
- memory ingest: daily at 21:00 (`0 21 * * *`)

### Enable or disable all schedules

```bash
node scripts/scheduler-control.mjs start all
node scripts/scheduler-control.mjs stop all
node scripts/scheduler-control.mjs status
```

### Enable or disable a single schedule

```bash
node scripts/scheduler-control.mjs start heartbeat
node scripts/scheduler-control.mjs stop wiki-lint
node scripts/scheduler-control.mjs status memory-ingest
```

### Per-job shortcuts

Each runner can manage only its own schedule:

```bash
node scripts/run-heartbeat.mjs enable
node scripts/run-heartbeat.mjs disable
node scripts/run-heartbeat.mjs status

node scripts/run-wiki-lint.mjs enable
node scripts/run-memory-ingest.mjs enable
```

### Platform notes

- Linux/macOS: uses user crontab
- Windows: uses Task Scheduler via `schtasks`

Schedules survive reboot once enabled.

## Philosophy

AIndrew aims to be:

- lighter than a full OpenClaw-style stack
- easy to inspect and modify
- centered on personality, memory, and practical utility
- backed by a Karpathy-style LLM wiki for durable long-term memory
- modular enough to grow only where needed

If you want a personal assistant that feels opinionated and useful without maintaining a large platform, this repository is the starting point.

## Notes

- The templates under `docs/templates/` are reusable scaffolding.
- The files under `references/` act as the live operational guide for the assistant.
- The `.opencode/` directory contains local generated files and dependencies used by the OpenCode environment.

## Status

This project is currently a foundation workspace for a personal assistant rather than a finished product. The core value is in the structure, prompts, and workflow you build on top of it.
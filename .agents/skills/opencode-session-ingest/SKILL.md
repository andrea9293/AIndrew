---
name: opencode-session-ingest
description: Use when the user wants to export OpenCode sessions from a specified project path or the current workspace by default, rebuild readable transcripts, and ingest only useful sessions into the wiki with sequential subagents.
user-invocable: true
---

# OpenCode Session Ingest

Export OpenCode chat sessions from a target project, build readable transcripts, then ingest only high-value sessions into the wiki one by one.

## When to Use

- User asks to process OpenCode session history from a project path.
- User wants transcript files that clearly separate `USER` and `ASSISTANT` turns.
- User asks to use subagents for wiki ingest and wants sequential execution.

Do not use this skill for single-source ingest from a URL/PDF/manual note. Use `wiki-ingest` for those cases.

## Inputs

- `SOURCE_PROJECT_PATH`: optional path containing OpenCode sessions. If omitted, default to the current working directory (`$PWD`, typically the workspace root).
- `MAX_SESSIONS`: optional number of recent sessions (default: 8).
- `MODE`: `recent` or `all`.

Default resolution rule:

```bash
SOURCE_PROJECT_PATH="${SOURCE_PROJECT_PATH:-$PWD}"
```

Run session inventory and export commands from `SOURCE_PROJECT_PATH`.

## Step 0: Resolve Source Project Path

```bash
SOURCE_PROJECT_PATH="${SOURCE_PROJECT_PATH:-$PWD}"
cd "$SOURCE_PROJECT_PATH"
```

## Output Paths

- Exports and transcripts live in:
  - `raw/clips/opencode-sessions/`

Each session produces:
- `<session_id>.json`
- `<session_id>.transcript.txt`

## Step 1: Session Inventory

From `SOURCE_PROJECT_PATH`:

```bash
opencode session list --format json
```

If user requested recent only:

```bash
opencode session list --format json -n <MAX_SESSIONS>
```

## Step 2: Export Sessions

For each selected session ID:

```bash
opencode export <SESSION_ID> > raw/clips/opencode-sessions/<SESSION_ID>.json
```

## Step 3: Build Readable Transcripts

Delete old generated transcripts first, then regenerate from JSON with explicit role headers.

```bash
rm -f raw/clips/opencode-sessions/*.transcript.txt
for f in raw/clips/opencode-sessions/*.json; do
  out="${f%.json}.transcript.txt"
  jq -r '
    def fmt_ts($ms): if $ms then ($ms / 1000 | strftime("%Y-%m-%d %H:%M:%S")) else "unknown-time" end;
    [ .messages[]
      | . as $m
      | [ $m.parts[]? | select(.type == "text") | .text ] as $texts
      | select(($texts|length) > 0)
      | {
          role: ($m.info.role | ascii_upcase),
          ts: ($m.info.time.created),
          text: ($texts | join("\n\n"))
        }
    ]
    | to_entries[]
    | "===== TURN \(.key + 1) | \(.value.role) | \(fmt_ts(.value.ts)) =====",
      .value.text,
      ""
  ' "$f" > "$out"
done
```

Required transcript format:

```text
===== TURN 1 | USER | 2026-04-26 23:15:05 =====
...

===== TURN 2 | ASSISTANT | 2026-04-26 23:15:09 =====
...
```

## Step 4: Relevance Filter Before Ingest

Review transcripts and ingest only sessions with durable technical value.

Ingest candidates:
- reusable workflows, diagnostics, tooling patterns, architecture decisions
- commands and playbooks that generalize

Skip candidates:
- repeated chat noise
- purely personal/non-technical conversations
- one-off context with no reusable pattern

## Step 5: Sequential Subagent Ingest

Run one subagent at a time (never in parallel for this workflow).

Per transcript:
1. Ask subagent to decide `INGESTED` or `SKIPPED`.
2. If `INGESTED`, require wiki updates (`wiki/*.md`, `wiki/index.md`, `wiki/log.md`) and commit.
3. If `SKIPPED`, no file changes.

The subagent must follow repository wiki rules in `CLAUDE.md`.

## Step 6: Commit Rules

For each ingested transcript, commit with:

```text
wiki: ingest <source-name> — created/updated <page list>
```

Stage wiki changes with relevant raw source files for that ingest.

## Quick Reference

- List sessions: `opencode session list --format json`
- Export one: `opencode export <SESSION_ID> > .../<SESSION_ID>.json`
- Rebuild transcripts: `jq` pipeline above
- Ingest policy: sequential subagents, value-first filtering

## Common Mistakes

- Transcript without role headers (`USER`/`ASSISTANT`) makes ingest quality worse.
- Ingesting everything blindly pollutes the wiki.
- Running multiple ingest subagents at once causes inconsistent curation decisions.
- Committing unrelated files together with wiki ingest changes.
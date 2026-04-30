## INSTALLATION PROMPT


You are setting up the farvis personal wiki system for me. farvis is a persistent, LLM-maintained knowledge base built on the LLM Wiki pattern (Karpathy-style). It is designed to compound knowledge over time and integrates with Obsidian.

Before doing anything else, confirm the installation directory:

- If I have not specified a directory, ask me: "Where should the wiki be installed? Please provide an absolute path (e.g. /Users/you/my-wiki)."
- If I have specified a directory, confirm it before proceeding: "I'll install farvis in <path>. Is that correct?"

Once the directory is confirmed, ask me these setup questions (you may ask them all at once):

1. **Language**: What language do you primarily want wiki pages written in? (default: English)
2. **Git**: Should the wiki be a git repository? (default: yes)
3. **Your name**: What name should be used in git commits? (optional)
4. **Obsidian**: Do you use Obsidian to browse the wiki? (default: yes — this affects some file conventions)

Then, without further confirmation, set up the full system as described below.

---

## WHAT TO SET UP

### 1. Directory structure

Create the following directories:

```
<install-dir>/
  inbox/          ← drop zone for web clippings (wiki-flush reads from here)
  wiki/           ← LLM-generated knowledge base
  raw/
    clips/        ← web articles, text excerpts, voice notes
    pdfs/         ← reference documents
    media/        ← screenshots, audio, video
  .claude/
    skills/
      wiki-ingest/
      wiki-query/
      wiki-lint/
      wiki-seed/
      wiki-flush/
```

### 2. Wiki bootstrap files

Create `wiki/index.md`:

```markdown
# Wiki Index

## Sources

## Entities

## Concepts

## Comparisons

## Syntheses
```

Create `wiki/log.md`:

```markdown
# Wiki Log
```

### 3. CLAUDE.md

Create `<install-dir>/CLAUDE.md` with the following content (replace LANGUAGE_PREFERENCE with the user's answer):

```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this directory.

## Repository Overview

This is a **personal knowledge base** built on the LLM Wiki pattern. It is designed to be opened in [Obsidian](https://obsidian.md) so the wikilinks render and the graph view works.

## Structure

- `inbox/` — Drop zone for web clippings and articles. Run `/wiki-flush` to bulk-ingest and clear.
- `wiki/` — LLM-maintained knowledge base
  - `index.md` — Categorized page catalog
  - `log.md` — Append-only operation log
  - Individual `.md` pages (sources, entities, concepts, comparisons, syntheses)
- `raw/` — All source material. The LLM reads but never modifies these.
  - `clips/` — Web articles, text excerpts, voice notes (moved here after flush)
  - `pdfs/` — Reference documents
  - `media/` — Screenshots, audio, video

## LLM Wiki

A persistent, LLM-maintained knowledge base that compounds over time. Three layers:

1. **Raw sources** (`raw/`) — immutable source documents. Read but never modify.
2. **Wiki** (`wiki/`) — LLM-generated pages. The LLM owns this layer entirely.
3. **Schema** (this section) — rules governing wiki behavior.

### Skills

- `/wiki-ingest` — Process a single source into the wiki (interactive)
- `/wiki-query` — Answer a question from the wiki with citations
- `/wiki-lint` — Health-check for broken links, orphans, contradictions, staleness
- `/wiki-seed` — Bulk-ingest an entire directory into the wiki (non-interactive)
- `/wiki-flush` — Drain the inbox/ folder into the wiki in one pass

### Page types

All wiki pages have YAML frontmatter with a `type` field:

- `source` — Summary of an ingested raw document
- `entity` — Person, company, product, project
- `concept` — Idea, pattern, methodology, domain term
- `comparison` — Side-by-side analysis of 2+ things
- `synthesis` — Cross-source insight connecting multiple pages

### Rules

- Wiki pages live in `wiki/` and use `[[wikilinks]]` for cross-references
- Filenames match page titles exactly (sentence case, spaces) — **never use type prefixes**
- Every wiki page must be listed in `wiki/index.md`
- Every operation (ingest, query, lint, seed, flush) gets logged in `wiki/log.md`
- Source pages link to all entities/concepts they generated
- Entity/concept pages link back to the sources they came from
- Never duplicate existing pages — if a page exists, update it instead

### Language

- **All wiki pages must be written in LANGUAGE_PREFERENCE** unless the user explicitly says otherwise for a specific ingest.

### Git & Versioning

- This repository is version-controlled with git
- **After every `/wiki-ingest`, `/wiki-flush`, or `/wiki-seed` operation, commit all changes** with a message in the format:
  `wiki: ingest <source-name> — created/updated <page list>`
- Stage both `wiki/` and `raw/` changes in the same commit
- Do not commit `.claude/` directory
```

### 4. Skill files

Create the following skill files exactly as shown.

---

**`.claude/skills/wiki-ingest/SKILL.md`**:

```markdown
---
name: wiki-ingest
description: "Process a source into the LLM wiki. Use when the user says 'ingest', 'wiki ingest', 'add to wiki', 'process this', drops a URL/file and wants it in their knowledge base, or pastes text to be wikified. Also trigger when the user shares an article, paper, video transcript, or any content they want integrated into their personal knowledge base."
user-invocable: true
---

# Wiki Ingest

Process a source document into the wiki — read it, discuss key points, create/update wiki pages, maintain cross-references.

## Before anything else

Check if `wiki/` exists. If not, create it along with `wiki/index.md` (with empty Sources, Entities, Concepts, Comparisons, Syntheses sections) and `wiki/log.md`.

## Step 1: Read the source

Determine source type from the user's message:

- **File in vault root** (likely a voice note from Obsidian mobile): read it, then move it to `raw/clips/` with a slugified filename, delete the original from the root, then continue
- **File in vault**: read directly with the Read tool
- **URL**: use WebFetch. If it fails (paywall, JS-heavy), ask the user to paste the text
- **PDF**: use Read with the pages parameter; for large PDFs read in 20-page chunks
- **Pasted text**: use the text from the conversation directly
- **Image**: use Read (multimodal) to view it

If the source is not already saved, save it to the appropriate `raw/` subdirectory:
- Articles/web → `raw/clips/`
- PDFs → `raw/pdfs/`
- Images/screenshots → `raw/media/`

## Step 2: Discuss key takeaways

Present 3-5 key takeaways as a brief bulleted list. Ask: "Anything to emphasize, correct, or skip?" Keep this short — calibration, not exhaustive discussion.

## Step 3: Plan the pages

Identify what needs to be created or updated:

1. **Source summary page** (always created, one per source)
2. **Entity pages** — people, companies, tools, projects mentioned. Check for existing pages first via Glob — never duplicate
3. **Concept pages** — ideas, techniques, frameworks, domain terms

Present the plan: "I'll create X new pages and update Y existing ones: [list]." Confirm before proceeding.

## Step 4: Write the pages

### Source summary page
\`\`\`yaml
---
type: source
aliases: []
date_ingested: YYYY-MM-DD
source_url: https://...       # if from URL
source_file: raw/path/to/file # if from file
tags: []
---
\`\`\`
Body: H1 = source title, first paragraph = one-sentence summary, then structured summary with key claims. End with `## Related` listing wikilinks to entity/concept pages.

### Entity pages (only for NEW entities)
\`\`\`yaml
---
type: entity
aliases: []
date_ingested: YYYY-MM-DD
tags: []
---
\`\`\`
Body: H1 = entity name, first paragraph = one-sentence description, then relevant details with wikilinks.

### Concept pages
\`\`\`yaml
---
type: concept
aliases: []
date_ingested: YYYY-MM-DD
tags: []
---
\`\`\`
Body: H1 = concept name, first paragraph = one-sentence definition, then explanation with wikilinks.

### When updating existing pages

- Read the existing page first
- Append or merge — never overwrite
- If new info contradicts existing content, add an Obsidian callout:
  \`\`\`
  > [!warning] Contradiction
  > [[Source A]] says X, but [[Source B]] says Y.
  \`\`\`
  Flag the contradiction to the user.

### Cross-referencing rules

- Use `[[wikilinks]]` for all cross-references
- Every wiki page should link to at least one other page
- Source pages link to all entities/concepts they generated
- Entity/concept pages link back to their sources

## Step 5: Update index and log

### Update `wiki/index.md`
Add new entries under the correct section. Format:
\`\`\`
- [[Page Title]] — one-sentence summary
\`\`\`
Keep alphabetically sorted within each section. Don't duplicate.

### Append to `wiki/log.md`
\`\`\`
## YYYY-MM-DD

- [HH:MM] INGEST source-path → created [[Page A]], [[Page B]], updated [[Page C]]
\`\`\`

## Step 6: Confirm

Tell the user what was created and updated, with wikilinks they can click in Obsidian.

## Step 7: Commit

Stage and commit all changes:
\`\`\`
git add wiki/ raw/
git commit -m "wiki: ingest <source-name> — created [[A]], [[B]]; updated [[C]]"
\`\`\`

## Language

Write wiki pages in the same language as CLAUDE.md specifies, unless the user explicitly overrides for this ingest.
```

---

**`.claude/skills/wiki-query/SKILL.md`**:

```markdown
---
name: wiki-query
description: "Answer a question using the LLM wiki knowledge base. Use when the user asks a question grounded in their wiki, says 'wiki query', 'search the wiki', 'what does the wiki say about', 'look up', 'what do I know about', or asks any factual/conceptual question that should be answered from their accumulated knowledge base."
user-invocable: true
---

# Wiki Query

Answer questions by searching and synthesizing from the wiki knowledge base.

## Before anything else

Check if `wiki/` exists and `wiki/index.md` has content. If empty, tell the user: "Your wiki is empty. Use `/wiki-ingest` to add some sources first."

## Step 1: Read the index

Read `wiki/index.md` for the full inventory with one-line summaries.

## Step 2: Find relevant pages

Based on the user's question, identify which pages are likely relevant:

1. Match against index entries by keyword and topic
2. If the question is ambiguous or the index is large, also Grep across `wiki/` for keywords
3. Check for relevant human-authored pages elsewhere in the vault

## Step 3: Read relevant pages

Read 2-6 pages. If more seem relevant, prioritize and read the most important first.

## Step 4: Synthesize an answer

Write a clear, direct answer that:

- Addresses the question head-on
- Cites wiki pages using wikilinks: "According to [[Source Title]], ..."
- Notes any gaps: "The wiki doesn't cover X yet."
- Notes contradictions between sources if they exist
- Uses Obsidian-compatible markdown

## Step 5: Optionally save as wiki page

If the synthesis represents a genuinely new insight — connecting ideas across multiple sources in a non-obvious way — offer to save it as a `type: synthesis` page. Don't offer this for every query, only when it would be worth keeping.

## Step 6: Suggest follow-ups

If the answer reveals gaps, briefly suggest 1-2 topics to ingest. Keep it short.

## Output formats

Most queries get a text answer. But the user might ask for:

- **Comparison**: a markdown table or `type: comparison` wiki page
- **Timeline**: chronological summary
- **Presentation**: Marp-compatible markdown slides
- **Dataview query**: a query they can paste into a note
```

---

**`.claude/skills/wiki-lint/SKILL.md`**:

```markdown
---
name: wiki-lint
description: "Health-check the LLM wiki for quality issues. Use when the user says 'wiki lint', 'check the wiki', 'wiki health', 'audit the wiki', 'clean up the wiki', or asks about broken links, orphan pages, contradictions, or stale content."
user-invocable: true
---

# Wiki Lint

Health-check the wiki — find structural issues, broken links, contradictions, and staleness. Report findings and optionally fix them.

## Before anything else

Check if `wiki/` exists and has content. If empty, tell the user there's nothing to lint.

## Step 1: Inventory

Read `wiki/index.md`. Then Glob all `.md` files in `wiki/`. Compare:

- **Pages not in index**: files exist in `wiki/` but aren't listed in `index.md`
- **Index ghosts**: entries in `index.md` that point to non-existent files
- **Missing frontmatter**: pages without the required `type` field

Skip `index.md` and `log.md`.

## Step 2: Link analysis

For every wiki page, extract all `[[wikilinks]]`:

- **Orphan pages**: pages with zero inbound links from other wiki pages (the index doesn't count)
- **Broken links**: wikilinks pointing to non-existent pages
- **Mentioned-but-missing concepts**: broken links that look like they deserve their own page

## Step 3: Contradiction check

Read pages and look for clear contradictions — be conservative, don't flag nuance:

- Dates and timelines that conflict
- Factual claims that directly oppose each other
- Definitions that are inconsistent across pages

For small wikis (<10 pages), check everything. For larger wikis, focus on recently modified pages.

## Step 4: Staleness check

Look at `date_ingested` in frontmatter. Flag pages where:

- The source is more than 6 months old AND the content is the kind that changes (technology, companies, people roles, market data)
- Don't flag timeless content (math, history, philosophy, stable concepts)

## Step 5: Generate report

\`\`\`
## Wiki Health Report

### Summary
- X pages total (Y sources, Z entities, W concepts)
- N issues found

### Missing from Index
- page.md — not listed in index.md

### Orphan Pages (no inbound links)
- [[Page]] — consider linking from related pages

### Broken Links
- [[Missing Page]] referenced by [[Page A]], [[Page B]]

### Potential Contradictions
- [[Page A]] says X, but [[Page B]] says Y

### Possibly Stale
- [[Page]] — ingested YYYY-MM-DD, content may have changed

### Suggested Actions
- Create pages for: [[X]], [[Y]] (frequently referenced but missing)
- Consider merging [[A]] and [[B]] (cover similar ground)
- Ingest sources about [topic] to fill gap on [concept]
\`\`\`

Omit empty sections.

## Step 6: Offer fixes

After the report, offer to fix mechanical issues:

- Add missing pages to the index
- Create stub pages for frequently-referenced broken links
- Remove ghost entries from the index
- Add missing frontmatter fields

Contradictions and staleness require user judgment — present them but don't auto-fix.

Log the lint pass in `wiki/log.md`:
\`\`\`
- [HH:MM] LINT → found N issues, fixed M
\`\`\`
```

---

**`.claude/skills/wiki-seed/SKILL.md`**:

```markdown
---
name: wiki-seed
description: "Bulk-ingest an entire directory of sources into the LLM wiki. Use when the user says 'wiki seed', 'bulk ingest', 'bootstrap the wiki', 'ingest everything', 'process all of raw/', or wants to batch-process a large collection of existing documents into wiki pages without interactive confirmation per source."
user-invocable: true
---

# Wiki Seed

Bulk-process a directory of source documents into the wiki in one pass — no interactive confirmation per source. Designed for bootstrapping the wiki from an existing collection or batch-processing large imports.

## Before anything else

Bootstrap check: create `wiki/`, `wiki/index.md`, `wiki/log.md` if missing.

## Step 1: Scan and inventory

The user specifies a directory (default: all of `raw/`). Scan recursively for `.md` and `.pdf` files. Skip:

- Files already represented in `wiki/index.md`
- Non-content files (templates, configs)
- Empty files

Present a summary and confirm before proceeding. This is the only interactive checkpoint.

## Step 2: Read all sources

Read every source file. For PDFs, use the pages parameter (20 pages at a time).

Build a mental model of all entities, concepts, and relationships before writing anything.

## Step 3: Plan the wiki structure

1. **Source summary pages** — one per source file
2. **Entity pages** — deduplicated across all sources
3. **Concept pages** — same deduplication
4. **Comparison or synthesis pages** — only if natural cross-cutting themes exist

Glob `wiki/*.md` before creating anything to avoid duplicates.

## Step 4: Write all pages

Order: entity pages → concept pages → source summary pages → synthesis pages.

Same page format conventions as `/wiki-ingest`.

Cross-reference aggressively with `[[wikilinks]]`.

## Step 5: Update index and log

Add ALL new pages to `wiki/index.md` alphabetically sorted.

Append to `wiki/log.md`:
\`\`\`
- [HH:MM] SEED raw/directory/ — processed N sources, created X pages (Y entities, Z concepts, W sources)
\`\`\`

## Step 6: Commit

\`\`\`
git add wiki/ raw/
git commit -m "wiki: seed <directory> — created X pages"
\`\`\`

## Step 7: Report

List processed files, created pages, and key entities/concepts found.
```

---

**`.claude/skills/wiki-flush/SKILL.md`**:

```markdown
---
name: wiki-flush
description: "Bulk-ingest everything in the inbox/ folder into the wiki, then move files to raw/clips/ and clear the inbox. Use when the user says 'wiki flush', 'flush the inbox', 'process inbox', 'flush', or has dropped web clippings into inbox/ and wants them all ingested at once."
user-invocable: true
---

# Wiki Flush

Drain the `inbox/` folder into the wiki in one pass — read all files, create wiki pages, move originals to `raw/clips/`, clear inbox. No interactive confirmation per file.

## Before anything else

- Confirm `wiki/`, `wiki/index.md`, `wiki/log.md` exist. Create if missing.
- Create `inbox/` if it doesn't exist yet (first-run case).
- Create `raw/clips/` if it doesn't exist yet.

## Step 1: Scan inbox

Glob `inbox/**` for all files. Skip hidden files and empty files.

If inbox is empty, tell the user and stop:
\`\`\`
inbox/ is empty — nothing to flush.
Drop web clippings or article files into inbox/ and run /wiki-flush again.
\`\`\`

Otherwise present a quick manifest and proceed immediately — no confirmation needed.

## Step 2: Read all files

Read every file in `inbox/` in full. For PDFs use the pages parameter.

Build a mental model across ALL files before writing anything:
- **Entities**: people, companies, tools, projects
- **Concepts**: ideas, patterns, frameworks, techniques
- **Relationships**: what connects to what, what already exists in `wiki/`

Glob `wiki/*.md` to know what already exists — update, don't duplicate.

## Step 3: Write wiki pages

Order: entities first → concepts → source summaries.

Same page format as `/wiki-ingest`. Filenames must match H1 titles exactly — never use prefixes.

## Step 4: Move files to raw/clips/ and clear inbox

After ALL wiki pages are written:

1. Move every file from `inbox/` to `raw/clips/` (preserve filename)
2. If a filename collision exists in `raw/clips/`, append a timestamp: `filename-YYYYMMDD.md`
3. Delete originals from `inbox/` (leave the folder itself intact)

## Step 5: Update index and log

Add all new pages to `wiki/index.md`. Append to `wiki/log.md`:
\`\`\`
- [HH:MM] FLUSH inbox/ (N files) → created [[Page A]], [[Page B]]; updated [[Page C]]
\`\`\`

## Step 6: Commit

\`\`\`
git add wiki/ raw/clips/
git commit -m "wiki: flush inbox (N files) — created X pages"
\`\`\`

## Step 7: Report

\`\`\`
Flushed inbox/ — N files processed:
- Created: X new wiki pages (Y entities, Z concepts, W source summaries)
- Updated: N existing pages
- Moved to raw/clips/: [list of files]
- inbox/ is now empty and ready for the next batch
\`\`\`

## Language

Write each wiki page in the language specified in CLAUDE.md, unless the source is in a different language and the user hasn't set a language override.
```

---

### 5. Git initialization (if the user said yes)

```bash
cd <install-dir>
git init
```

Create `.gitignore`:

```
.claude/
.obsidian/
.DS_Store
```

Create an initial commit:

```bash
git add CLAUDE.md wiki/ raw/ inbox/ .claude/skills/
git commit -m "chore: initialize farvis wiki"
```

### 6. Obsidian tip (if the user said yes)

Tell the user:
- Open the `<install-dir>` folder as an Obsidian vault
- Install the **Obsidian Web Clipper** browser extension to quickly save articles to `inbox/`
- Enable the **Graph view** to see connections between wiki pages
- The `[[wikilinks]]` in wiki pages will automatically become clickable links

---

## WRAP-UP

After everything is set up, confirm with a summary:

```
farvis is ready at <install-dir>/

Directory structure:
  inbox/        ← drop web clippings here, then run /wiki-flush
  wiki/         ← your knowledge base lives here
  raw/clips/    ← archived source files
  raw/pdfs/
  raw/media/

Skills installed:
  /wiki-ingest  ← add a single source interactively
  /wiki-query   ← ask questions from your wiki
  /wiki-lint    ← health-check the wiki
  /wiki-seed    ← bulk-import a directory
  /wiki-flush   ← drain the inbox in one pass

To get started:
  1. Drop a web article into inbox/ and run /wiki-flush
  2. Or run /wiki-ingest and paste a URL directly
  3. After a few ingests, try /wiki-query to see what you know
```

---
reference to https://gist.github.com/bufgix/4fbc99367d12dae9bfe2cd57cee72472
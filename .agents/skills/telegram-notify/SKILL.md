# Skill: telegram-notify

## Description
Send messages and files to a Telegram chat using a bot.
Credentials are already configured. Never ask the user for token or chat_id.

## When to use it
- When you need to notify someone outside the current session
- When you need to send a generated file (PDF, Excel, PPTX, image, etc.)
- When a job/cron produces output that should be delivered via Telegram
- When something requires urgent attention

## How to use it — ALWAYS USE THE SCRIPT

The script `scripts/tg_send.py` handles everything. Never use manual curl calls or search for the token.

```bash
SKILL_DIR=".agents/skills/telegram-notify"

# Send a text message
python "$SKILL_DIR/scripts/tg_send.py" message "Message text"

# Send a file (PDF, PPTX, Excel, zip, etc.)
python "$SKILL_DIR/scripts/tg_send.py" file "/path/to/file.pdf"
python "$SKILL_DIR/scripts/tg_send.py" file "/path/to/file.pdf" --caption "Here is the report"

# Send an image
python "$SKILL_DIR/scripts/tg_send.py" image "/path/to/image.png"
python "$SKILL_DIR/scripts/tg_send.py" image "/percorso/immagine.png" --caption "Screenshot"
```

## Important notes
- The script discovers credentials automatically; no extra setup is required
- Messages support Markdown: **bold**, _italic_, `code`, [link](url)
- Maximum message length is 4096 characters; split long messages if needed
- Check output for `✅ Sent successfully`
- No external libraries are required; only Python 3 standard library

## File structure
```
.agents/skills/telegram-notify/
├── SKILL.md          ← this file
└── scripts/
    ├── tg_send.py    ← main script
    └── TELEGRAM.env  ← credentials (DO NOT share or publish)
```

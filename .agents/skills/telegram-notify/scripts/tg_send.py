#!/usr/bin/env python3
"""
tg_send.py - Send messages and files to Telegram.

Usage:
    python tg_send.py message "Message text"
    python tg_send.py file /path/to/file.pdf
    python tg_send.py file /path/to/file.pdf --caption "Here is the file"
    python tg_send.py image /path/to/image.png
    python tg_send.py image /path/to/image.png --caption "Description"

Credentials are loaded automatically from TELEGRAM.env
in the same folder as this script.
"""

import sys
import os
import argparse
import urllib.request
import urllib.parse
import json

# --- Credentials file path ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", "..", ".."))
# ENV_FILE = os.path.join(PROJECT_ROOT, "references", "TELEGRAM.env")
ENV_FILE = "TELEGRAM.env"

def load_env(path):
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        print(f"❌ Credentials file not found: {path}", file=sys.stderr)
        sys.exit(1)
    return env


def api_url(token, method):
    return f"https://api.telegram.org/bot{token}/{method}"


def send_message(token, chat_id, text, parse_mode="Markdown"):
    data = urllib.parse.urlencode(
        {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    ).encode()
    req = urllib.request.Request(api_url(token, "sendMessage"), data=data)
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    return result


def send_file(
    token, chat_id, filepath, caption="", method="sendDocument", field="document"
):
    """Send a file using multipart/form-data."""
    import mimetypes

    boundary = "----TelegramBoundary"
    filename = os.path.basename(filepath)
    mime_type = mimetypes.guess_type(filepath)[0] or "application/octet-stream"

    with open(filepath, "rb") as f:
        file_data = f.read()

    body = []

    def add_field(name, value):
        body.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )

    add_field("chat_id", str(chat_id))
    if caption:
        add_field("caption", caption)
        add_field("parse_mode", "Markdown")

    body.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{filename}"\r\nContent-Type: {mime_type}\r\n\r\n'.encode()
    )
    body.append(file_data)
    body.append(f"\r\n--{boundary}--\r\n".encode())

    payload = b"".join(body)
    req = urllib.request.Request(
        api_url(token, method),
        data=payload,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    return result


def main():
    parser = argparse.ArgumentParser(description="Send messages/files to Telegram")
    parser.add_argument(
        "action",
        choices=["message", "file", "image"],
        help="Send type: message, file, image",
    )
    parser.add_argument(
        "content", help="Message text or file/image path"
    )
    parser.add_argument(
        "--caption", default="", help="Optional caption for file/image"
    )
    args = parser.parse_args()

    env = load_env(ENV_FILE)
    token = env.get("TELEGRAM_TOKEN")
    chat_id = env.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        print(
            "❌ TELEGRAM_TOKEN or TELEGRAM_CHAT_ID missing in .env file",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        if args.action == "message":
            result = send_message(token, chat_id, args.content)
        elif args.action == "file":
            if not os.path.isfile(args.content):
                print(f"❌ File not found: {args.content}", file=sys.stderr)
                sys.exit(1)
            result = send_file(
                token,
                chat_id,
                args.content,
                caption=args.caption,
                method="sendDocument",
                field="document",
            )
        elif args.action == "image":
            if not os.path.isfile(args.content):
                print(f"❌ Image not found: {args.content}", file=sys.stderr)
                sys.exit(1)
            result = send_file(
                token,
                chat_id,
                args.content,
                caption=args.caption,
                method="sendPhoto",
                field="photo",
            )

        if result.get("ok"):
            print("✅ Sent successfully")
        else:
            print(f"❌ Telegram error: {result}", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import argparse
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional


def load_env_from_ancestors(start: Path, filename: str = ".env") -> Optional[Path]:
    """Walk up from start to root, load the first .env file found into os.environ.

    Returns the path to the .env file if found, else None.
    """
    current = start.resolve()
    root = current.root
    while True:
        candidate = current / filename
        if candidate.exists():
            try:
                for line in candidate.read_text().splitlines():
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" not in line:
                        continue
                    key, value = line.split("=", 1)
                    key = key.strip()
                    # Don't override pre-set env vars
                    if key and key not in os.environ:
                        # Strip optional surrounding quotes
                        val = value.strip().strip('"').strip("'")
                        os.environ[key] = val
            except Exception:
                pass  # best-effort; ignore malformed lines
            return candidate
        if str(current) == root:
            return None
        current = current.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Minimal Chat CLI for the OpenAI API"
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        help="Model name (default: gpt-4o-mini or $OPENAI_MODEL)",
    )
    # System prompt is exclusively loaded from prompt.txt near this script.
    parser.add_argument(
        "--temperature",
        type=float,
        default=float(os.environ.get("OPENAI_TEMPERATURE", 0.7)),
        help="Sampling temperature (default: 0.7)",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=int(os.environ.get("OPENAI_MAX_TOKENS", 800)),
        help="Max tokens in each reply (default: 800)",
    )
    parser.add_argument(
        "--no-stream",
        action="store_true",
        help="Disable streaming output",
    )
    parser.add_argument(
        "--save",
        metavar="PATH",
        help="Save the conversation transcript to this file",
    )
    return parser.parse_args()


def ensure_api_key() -> str:
    # Load .env from current or ancestor directories before checking the key
    load_env_from_ancestors(Path.cwd())
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        print("ERROR: OPENAI_API_KEY not set. Add it to a .env file or your environment.", file=sys.stderr)
        sys.exit(1)
    return key


def print_intro(model: str, system_prompt: str) -> None:
    print(f"Model: {model}")
    print("Type /exit to quit, /reset to clear history.")
    print(f"System: {system_prompt}")


def save_transcript(path: str, messages: List[Dict[str, str]]) -> None:
    try:
        out = []
        for m in messages:
            role = m.get("role", "")
            content = m.get("content", "")
            out.append(f"[{role}] {content}")
        Path(path).write_text("\n\n".join(out))
        print(f"Saved transcript to {path}")
    except Exception as e:
        print(f"Failed to save transcript: {e}")


def chat_with_openai(args: argparse.Namespace) -> None:
    # Lazy-initialize the OpenAI client only when making the first API call.
    client = None  # type: ignore
    new_sdk = False

    def get_client():
        nonlocal client, new_sdk
        if client is not None:
            return client, new_sdk
        api_key = ensure_api_key()
        try:
            from openai import OpenAI  # type: ignore
            client = OpenAI()
            new_sdk = True
        except Exception:
            try:
                import openai  # type: ignore
                openai.api_key = api_key
                client = openai
                new_sdk = False
            except Exception as e:
                raise RuntimeError(f"OpenAI SDK not available: {e}")
        return client, new_sdk

    # Load system prompt strictly from prompt.txt next to this file
    prompt_path = Path(__file__).resolve().parent / "prompt.txt"
    if not prompt_path.exists():
        print(f"ERROR: Missing system prompt file: {prompt_path}", file=sys.stderr)
        sys.exit(1)
    try:
        system_prompt = prompt_path.read_text(encoding="utf-8").strip()
    except Exception as e:
        print(f"ERROR: Failed reading {prompt_path}: {e}", file=sys.stderr)
        sys.exit(1)
    if not system_prompt:
        print(f"ERROR: {prompt_path} is empty. Add your system prompt text.", file=sys.stderr)
        sys.exit(1)

    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    print_intro(args.model, system_prompt)

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in {"/exit", ":q", "/quit"}:
            print("Goodbye!")
            break
        # Disable runtime system prompt overrides; prompt comes from prompt.txt
        if user_input.lower() == "/reset":
            messages = [{"role": "system", "content": messages[0]["content"]}] if messages and messages[0].get("role") == "system" else []
            print("History cleared.")
            continue
        if user_input.lower().startswith("/save"):
            parts = user_input.split(maxsplit=1)
            save_path = args.save or (parts[1].strip() if len(parts) > 1 else "chat_transcript.txt")
            save_transcript(save_path, messages)
            continue

        messages.append({"role": "user", "content": user_input})

        try:
            client, new_sdk = get_client()
            if new_sdk:  # OpenAI() client, Chat Completions API
                if args.no_stream:
                    resp = client.chat.completions.create(
                        model=args.model,
                        messages=messages,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                    )
                    content = resp.choices[0].message.content or ""
                    print(f"Assistant: {content}")
                    messages.append({"role": "assistant", "content": content})
                else:
                    from contextlib import suppress
                    print("Assistant: ", end="", flush=True)
                    content_parts: List[str] = []
                    with suppress(Exception):
                        stream = client.chat.completions.create(
                            model=args.model,
                            messages=messages,
                            temperature=args.temperature,
                            max_tokens=args.max_tokens,
                            stream=True,
                        )
                        for chunk in stream:
                            delta = None
                            try:
                                delta = chunk.choices[0].delta.content
                            except Exception:
                                delta = None
                            if delta:
                                content_parts.append(delta)
                                print(delta, end="", flush=True)
                    content = "".join(content_parts)
                    print()  # newline after stream
                    if content:
                        messages.append({"role": "assistant", "content": content})
            else:  # legacy openai module
                if args.no_stream:
                    resp = client.ChatCompletion.create(
                        model=args.model,
                        messages=messages,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                    )
                    content = resp["choices"][0]["message"]["content"]
                    print(f"Assistant: {content}")
                    messages.append({"role": "assistant", "content": content})
                else:
                    print("Assistant: ", end="", flush=True)
                    content_parts: List[str] = []
                    for chunk in client.ChatCompletion.create(
                        model=args.model,
                        messages=messages,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                        stream=True,
                    ):
                        delta = chunk["choices"][0]["delta"].get("content")
                        if delta:
                            content_parts.append(delta)
                            print(delta, end="", flush=True)
                    content = "".join(content_parts)
                    print()
                    if content:
                        messages.append({"role": "assistant", "content": content})
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            # Pop the last user message on error to avoid growth with failures
            if messages and messages[-1].get("role") == "user":
                messages.pop()

        if args.save:
            save_transcript(args.save, messages)


def main() -> None:
    args = parse_args()
    chat_with_openai(args)


if __name__ == "__main__":
    main()

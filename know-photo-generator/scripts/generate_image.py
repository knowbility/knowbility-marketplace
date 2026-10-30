#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai>=1.0.0"]
# ///
"""
generate_image.py — generate an image via the Gemini API (Nano Banana Pro).

Usage:
  python3 generate_image.py "<prompt>" --aspect-ratio 16:9 --output output/shot.png
  python3 generate_image.py "<prompt>" -a 4:5 -o out.png --ref face.jpg --ref light.jpg
  python3 generate_image.py --check-keys

GEMINI_API_KEY resolution order (first hit wins):
  1. the real environment
  2. .env in the current working directory        (legacy)
  3. .know-photo-generator/keys.env in the cwd         (project-scoped)
  4. ~/.know-photo-generator/keys.env                  (shared across projects)

Run /know-photo:setup in Claude Code to create the keys.env files.
"""

import argparse
import base64
import mimetypes
import os
import sys
from pathlib import Path

VALID_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]
VALID_SIZES = ["1K", "2K", "4K"]
DEFAULT_MODEL = "gemini-3-pro-image-preview"

KEY_FILES = [
    ("cwd .env", lambda: Path.cwd() / ".env"),
    ("project .know-photo-generator/keys.env", lambda: Path.cwd() / ".know-photo-generator" / "keys.env"),
    ("~/.know-photo-generator/keys.env", lambda: Path.home() / ".know-photo-generator" / "keys.env"),
]


def load_env():
    """Load key files in precedence order. Returns the source GEMINI_API_KEY came from."""
    source = "environment" if os.environ.get("GEMINI_API_KEY") else None
    for label, locate in KEY_FILES:
        path = locate()
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                key, value = key.strip(), value.strip().strip('"').strip("'")
                if value and key not in os.environ:
                    os.environ[key] = value
                    if key == "GEMINI_API_KEY" and source is None:
                        source = label
    return source


def require_api_key():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found.")
        print()
        print("Run /know-photo:setup in Claude Code to get configured (it creates a keys.env")
        print("file where you paste the key — no shell profile editing needed).")
        print()
        print("Or set it up manually, either way:")
        print("  export GEMINI_API_KEY='your-key-here'   (in ~/.zshrc)")
        print("  echo 'GEMINI_API_KEY=your-key-here' > ~/.know-photo-generator/keys.env")
        print()
        print("Get your key from: https://aistudio.google.com/apikey")
        sys.exit(1)
    return api_key


def import_genai():
    try:
        from google import genai
        from google.genai import types
        return genai, types
    except ImportError:
        print("Error: google-genai package not installed.")
        print("Install with: pip3 install google-genai")
        print("(or, with uv: uv run --script generate_image.py ...)")
        sys.exit(1)


def check_keys(model):
    """Report where GEMINI_API_KEY resolves from and whether it works. Exits."""
    source = load_env()
    if not os.environ.get("GEMINI_API_KEY"):
        print("GEMINI_API_KEY: not found")
        print("Checked: environment, " + ", ".join(label for label, _ in KEY_FILES))
        print("Fix: run /know-photo:setup, or paste the key into ~/.know-photo-generator/keys.env")
        sys.exit(1)
    print(f"GEMINI_API_KEY: found (source: {source})")
    genai, _ = import_genai()
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    try:
        client.models.get(model=model)
        print(f"Key validated against the API (model: {model})")
        sys.exit(0)
    except Exception as e:
        print(f"Key found but validation failed: {e}")
        sys.exit(1)


def load_reference_parts(paths, types):
    parts = []
    for ref in paths:
        p = Path(ref)
        if not p.is_file():
            print(f"Warning: reference image not found, skipping: {ref}")
            continue
        mime, _ = mimetypes.guess_type(p.name)
        if not mime or not mime.startswith("image/"):
            print(f"Warning: not a recognized image type, skipping: {ref}")
            continue
        parts.append(types.Part.from_bytes(data=p.read_bytes(), mime_type=mime))
        print(f"Reference image: {ref} ({mime})")
    return parts


def main():
    parser = argparse.ArgumentParser(description="Generate an image via the Gemini API")
    parser.add_argument("prompt", nargs="?", help="the full prompt text")
    parser.add_argument("-a", "--aspect-ratio", default="1:1", choices=VALID_RATIOS,
                        metavar="RATIO", help=f"one of: {', '.join(VALID_RATIOS)} (default: 1:1)")
    parser.add_argument("-o", "--output", help="path to save the generated image")
    parser.add_argument("-s", "--image-size", default="2K", choices=VALID_SIZES,
                        help="output resolution (default: 2K)")
    parser.add_argument("-r", "--ref", action="append", default=[], metavar="IMAGE",
                        help="reference/source image path (repeatable, up to 14)")
    parser.add_argument("-g", "--grounded", action="store_true",
                        help="ground generation with Google Search (real-time data)")
    parser.add_argument("-m", "--model", default=os.environ.get("GEMINI_IMAGE_MODEL", DEFAULT_MODEL),
                        help=f"model id (default: {DEFAULT_MODEL}, or GEMINI_IMAGE_MODEL env var)")
    parser.add_argument("--check-keys", action="store_true",
                        help="report whether GEMINI_API_KEY resolves and works, then exit")
    args = parser.parse_args()

    if args.check_keys:
        check_keys(args.model)

    if not args.prompt or not args.output:
        parser.error("prompt and --output are required (unless using --check-keys)")

    load_env()
    api_key = require_api_key()
    genai, types = import_genai()

    client = genai.Client(api_key=api_key)

    contents = load_reference_parts(args.ref, types)
    contents.append(args.prompt)

    config_kwargs = dict(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio=args.aspect_ratio,
            image_size=args.image_size,
        ),
    )
    if args.grounded:
        config_kwargs["tools"] = [types.Tool(google_search=types.GoogleSearch())]
        print("Grounding with Google Search enabled")

    print(f"Generating image with {args.model}...")
    print(f"Aspect ratio: {args.aspect_ratio}  Size: {args.image_size}")
    print(f"Output: {args.output}")

    try:
        response = client.models.generate_content(
            model=args.model,
            contents=contents,
            config=types.GenerateContentConfig(**config_kwargs),
        )
    except Exception as e:
        print(f"Error generating image: {e}")
        sys.exit(1)

    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "mime_type", "").startswith("image/"):
                data = inline.data
                if isinstance(data, str):
                    data = base64.b64decode(data)
                out = Path(args.output)
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(data)
                print()
                print("Image generated successfully!")
                print(f"Saved to: {out}")
                print(f"Size: {out.stat().st_size / 1024:.1f}K")
                return

    print("Error: no image data in response")
    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            if getattr(part, "text", None):
                print(f"Model said: {part.text}")
    sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Re-indent the continuation lines of multi-line quoted scalars in data/*.yml.

js-yaml 5 (the YAML 1.2 parser used by the Astro build) rejects a multi-line
quoted scalar whose continuation lines are indented only as deep as their key
("bad indentation of a mapping entry" / deficient indentation).  PyYAML (YAML
1.1, used by ``src/data.py``) accepts it, so the files parsed fine until the
js-yaml 5 upgrade.

This script walks every ``data/*.yml`` file line by line.  When a line opens a
quoted scalar that is not closed on the same line, every following non-blank
line indented at most as deep as the key gets two extra leading spaces, until
the closing quote is found.  Nothing else is touched, and the rewrite is only
kept if ``yaml.safe_load()`` returns exactly the same object as before.

Usage::

    python3 scripts/reindent_yaml.py [--check] [FILE ...]

With ``--check`` nothing is written; the script only reports which files would
change (exit code 1 if any would).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import yaml

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# `key: '` / `key: "` / `- key: '`, optionally nested; the key may contain
# word characters, dots and dashes.
OPEN_RE = re.compile(r"^(\s*)(- )?[\w.-]+:\s*(['\"])")


def closes_scalar(text: str, quote: str) -> bool:
    """True if `text` contains the closing `quote` of an open scalar.

    `text` is the part of the line that lies inside the scalar.  Inside a
    single-quoted scalar `''` is an escaped quote; inside a double-quoted one
    `\\` escapes the next character.
    """
    i = 0
    while i < len(text):
        c = text[i]
        if quote == "'":
            if c == "'":
                if i + 1 < len(text) and text[i + 1] == "'":
                    i += 2
                    continue
                return True
        else:
            if c == "\\":
                i += 2
                continue
            if c == '"':
                return True
        i += 1
    return False


def reindent(lines: list[str]) -> tuple[list[str], int]:
    """Return the re-indented lines and the number of lines changed."""
    out: list[str] = []
    changed = 0
    inside = False
    quote = ""
    key_indent = 0

    for line in lines:
        if not inside:
            out.append(line)
            m = OPEN_RE.match(line)
            if m and not closes_scalar(line[m.end() :], m.group(3)):
                inside = True
                quote = m.group(3)
                # column of the key itself ("- " shifts it by two)
                key_indent = len(m.group(1)) + (2 if m.group(2) else 0)
            continue

        # Inside a multi-line quoted scalar.  A flow scalar folds its line
        # breaks and strips the leading/trailing whitespace of every
        # continuation line, so adding indentation here cannot change the
        # parsed value - but the continuation lines (the one carrying the
        # closing quote included) must be indented *deeper* than the key.
        stripped = line.strip()
        if stripped:
            indent = len(line) - len(line.lstrip(" "))
            if indent <= key_indent:
                line = " " * (key_indent + 2 - indent) + line
                changed += 1
        out.append(line)
        if closes_scalar(line, quote):
            inside = False

    if inside:
        raise ValueError("unterminated quoted scalar at end of file")
    return out, changed


def process(path: Path, check: bool) -> int:
    before = path.read_text(encoding="utf-8")
    lines = before.splitlines(keepends=True)
    new_lines, changed = reindent(lines)
    if not changed:
        return 0
    after = "".join(new_lines)
    if yaml.safe_load(before) != yaml.safe_load(after):
        raise SystemExit(f"ABORT: parsed content differs after re-indent: {path}")
    if not check:
        path.write_text(after, encoding="utf-8")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report only, write nothing")
    parser.add_argument("files", nargs="*", type=Path, help="YAML files (default: data/*.yml)")
    args = parser.parse_args()

    paths = args.files or sorted(DATA_DIR.glob("*.yml"))
    total = 0
    for path in paths:
        changed = process(path, args.check)
        total += changed
        if changed:
            print(f"{path}: {changed} line(s) re-indented")
    print(f"{total} line(s) re-indented in total")
    if args.check and total:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

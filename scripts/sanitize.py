#!/usr/bin/env python3
"""
Removes live identifiers from the Apps Script source before it is committed.

Usage (from the repository root, after copying the live project into src/).
See docs/01-application-setup.md, section "Keeping src/ in step".
    python3 scripts/sanitize.py

Each value below is replaced by a placeholder. Edit the dictionary if you add
new IDs to the code. Keep the real values in your local .clasp.json or notes only.
"""
import pathlib
import re
import sys

# Known identifiers and their placeholders
KNOWN = {
    "1NnuNVDCQtLVRmnjygzwI1JMQ6YnEZcOqzqxBpERCjt4": "REPLACE_WITH_SHEET_ID",
    "1a7htJSvSVG8TG2DCQ1ZtF_MXFAAPxoiC": "REPLACE_WITH_REPORT_FOLDER_ID",
    "1rOoIuZ_xGaleuXMrIySCAnI0PKr18RuI": "REPLACE_WITH_SIGNATURE_FILE_ID",
    "1nkKDEoVtF74Kcmf9OU_CE8yNcvVL0JSg6QYEY7z1W0cgq21ZkNTdjOVS": "REPLACE_WITH_SCRIPT_ID",
}

SRC = pathlib.Path(__file__).resolve().parent.parent / "src"


def main():
    if not SRC.is_dir():
        sys.exit("src/ not found. Run this from the repository.")
    changed = 0
    for path in sorted(SRC.iterdir()):
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        new = text
        for live, placeholder in KNOWN.items():
            new = new.replace(live, placeholder)
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print("sanitised:", path.name)
    print("files changed:", changed)

    # Warn about any long ID-like string left behind
    for path in sorted(SRC.iterdir()):
        if path.is_file():
            for m in re.finditer(r"['\"]([A-Za-z0-9_-]{30,})['\"]", path.read_text(encoding="utf-8")):
                print("CHECK by hand:", path.name, m.group(1))


if __name__ == "__main__":
    main()

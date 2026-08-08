import re
import subprocess
import sys
from pathlib import Path

TITLE_RE = re.compile(r"^#\+title:[ \t]*(.*)$", re.IGNORECASE | re.MULTILINE)
DATE_RE = re.compile(r"^#\+date:[ \t]*(.*)$", re.IGNORECASE | re.MULTILINE)
TAGS_RE = re.compile(r"^#\+filetags:[ \t]*(.*)$", re.IGNORECASE | re.MULTILINE)
DESCRIPTION_RE = re.compile(r"^#\+description:[ \t]*(.*)$", re.IGNORECASE | re.MULTILINE)
STAMP_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")
ORG_FILE_LINK_RE = re.compile(r"\[\[file:([^]/]+)\.org\]")
TEST_BLOCK_RE = re.compile(
    r"^#\+begin_test\n(.*?)^#\+end_test", re.IGNORECASE | re.DOTALL | re.MULTILINE
)
VERBATIM_RE = re.compile(r"[=~](\S(?:[^=~\n]*\S)?)[=~]")
TEST_FENCE_RE = re.compile(r"^``` test$", re.MULTILINE)


def keyword(pattern, text):
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def normalize_date(raw):
    match = STAMP_RE.search(raw)
    return match.group(1) if match else ""


def split_tags(raw):
    return [tag for tag in re.split(r"[\s,:]+", raw) if tag]


def parse_keywords(text):
    return {
        "title": keyword(TITLE_RE, text),
        "date": normalize_date(keyword(DATE_RE, text)),
        "tags": split_tags(keyword(TAGS_RE, text)),
        "description": keyword(DESCRIPTION_RE, text),
    }


def frontmatter(meta):
    fields = [
        ("title", meta["title"]),
        ("date", meta["date"]),
        ("tags", f"[{', '.join(meta['tags'])}]" if meta["tags"] else ""),
        ("description", meta["description"]),
    ]
    lines = [f"{key}: {value}" for key, value in fields if value]
    return "---\n" + "\n".join(lines) + "\n---\n"


def rewrite_file_links(text):
    return ORG_FILE_LINK_RE.sub(r"[[file:\1.md]", text)


def verbatim_to_code(text):
    return VERBATIM_RE.sub(r"`\1`", text)


def mark_test_blocks(text):
    def as_src_block(match):
        return f"#+begin_src test\n{verbatim_to_code(match.group(1))}#+end_src"

    return TEST_BLOCK_RE.sub(as_src_block, text)


def fix_test_fences(text):
    return TEST_FENCE_RE.sub("```test", text)


def convert_body(org_text):
    result = subprocess.run(
        ["pandoc", "-f", "org", "-t", "gfm", "--wrap=none"],
        input=org_text,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def org_to_md(text):
    meta = parse_keywords(text)
    body = mark_test_blocks(rewrite_file_links(text))
    return frontmatter(meta) + "\n" + fix_test_fences(convert_body(body))


def convert_file(path):
    md_path = path.with_suffix(".md")
    md_path.write_text(org_to_md(path.read_text()))
    path.unlink()
    return md_path


def main():
    notes_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("notes")
    for path in sorted(notes_dir.glob("*.org")):
        print(convert_file(path))


if __name__ == "__main__":
    main()

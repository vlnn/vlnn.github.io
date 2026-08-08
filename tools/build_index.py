import json
import re
import subprocess
import sys
from pathlib import Path

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
MD_HEADING_RE = re.compile(r"^#\s+(.*)$", re.MULTILINE)
MD_LINK_RE = re.compile(r"(?<!!)\[[^]]*\]\(([^)/:]+)\.md\)")
MD_TEST_RE = re.compile(r"^```test\s*\n(.*?)^```", re.DOTALL | re.MULTILINE)


def split_words(raw):
    return [word for word in re.split(r"[\s,:\[\]]+", raw) if word]


def frontmatter_fields(text):
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}
    fields = {}
    for line in match.group(1).splitlines():
        key, _, value = line.partition(":")
        if value:
            fields[key.strip()] = value.strip()
    return fields


def parse_md_metadata(text):
    fields = frontmatter_fields(text)
    heading = MD_HEADING_RE.search(text)
    return {
        "title": fields.get("title", heading.group(1).strip() if heading else ""),
        "date": fields.get("date", ""),
        "tags": split_words(fields.get("tags", "")),
    }


def unique(items):
    seen = []
    for item in items:
        if item not in seen:
            seen.append(item)
    return seen


def extract_md_note_links(text):
    return unique(MD_LINK_RE.findall(text))


def invert_links(graph):
    backlinks = {slug: [] for slug in graph}
    for source, targets in graph.items():
        for target in targets:
            if target in backlinks:
                backlinks[target].append(source)
    return {slug: sorted(sources) for slug, sources in backlinks.items()}


def slug_of(filename):
    return Path(filename).stem


def parse_prompt_pairs(body):
    prompts = []
    field = None
    for line in body.splitlines():
        if line.startswith("Q:"):
            prompts.append({"q": line[2:].strip(), "a": None})
            field = "q"
        elif line.startswith("A:") and prompts:
            prompts[-1]["a"] = line[2:].strip()
            field = "a"
        elif field and prompts:
            prompts[-1][field] += "\n" + line.strip()
    return [prompt for prompt in prompts if prompt["a"] is not None]


def extract_md_prompts(text):
    return [prompt for block in MD_TEST_RE.findall(text) for prompt in parse_prompt_pairs(block)]


def current_commit():
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True
        )
        return result.stdout.strip()
    except OSError:
        return ""


def note_files(notes_dir):
    return sorted(Path(notes_dir).glob("*.md"))


def parse_note(path):
    text = path.read_text()
    return {
        **parse_md_metadata(text),
        "file": path.name,
        "links": extract_md_note_links(text),
        "prompts": extract_md_prompts(text),
    }


def build_index(notes_dir):
    notes = {slug_of(path): parse_note(path) for path in note_files(notes_dir)}
    for note in notes.values():
        note["links"] = [slug for slug in note["links"] if slug in notes]
    backlinks = invert_links({slug: note["links"] for slug, note in notes.items()})
    return {
        "notes": {
            slug: {**note, "backlinks": backlinks[slug]} for slug, note in notes.items()
        }
    }


def main():
    notes_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("notes")
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("index.json")
    index = {**build_index(notes_dir), "commit": current_commit()}
    output.write_text(json.dumps(index, ensure_ascii=False, indent=1))
    print(f"{output}: {len(index['notes'])} notes indexed")


if __name__ == "__main__":
    main()

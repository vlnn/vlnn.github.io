import json
import re
import sys
from pathlib import Path

TITLE_RE = re.compile(r"^#\+title:\s*(.*)$", re.IGNORECASE | re.MULTILINE)
DATE_RE = re.compile(r"^#\+date:\s*<?(\d{4}-\d{2}-\d{2})", re.IGNORECASE | re.MULTILINE)
TAGS_RE = re.compile(r"^#\+filetags:\s*(.*)$", re.IGNORECASE | re.MULTILINE)
ORG_LINK_RE = re.compile(r"\[\[file:([^]/]+)\.(?:org|md)\]")
FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
MD_HEADING_RE = re.compile(r"^#\s+(.*)$", re.MULTILINE)
MD_LINK_RE = re.compile(r"(?<!!)\[[^]]*\]\(([^)/:]+)\.(?:org|md)\)")
ORG_TEST_RE = re.compile(r"^#\+begin_test\s*\n(.*?)^#\+end_test", re.IGNORECASE | re.DOTALL | re.MULTILINE)
MD_TEST_RE = re.compile(r"^```test\s*\n(.*?)^```", re.DOTALL | re.MULTILINE)


def split_words(raw):
    return [word for word in re.split(r"[\s,:\[\]]+", raw) if word]


def parse_org_metadata(text):
    title = TITLE_RE.search(text)
    date = DATE_RE.search(text)
    tags = TAGS_RE.search(text)
    return {
        "title": re.sub(r"^#\+title:\s*", "", title.group(1), flags=re.IGNORECASE).strip()
        if title
        else "",
        "date": date.group(1) if date else "",
        "tags": split_words(tags.group(1)) if tags else [],
    }


def parse_metadata(text):
    return parse_org_metadata(text)


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


def extract_note_links(text):
    return unique(ORG_LINK_RE.findall(text))


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


def extract_prompts(block_re, text):
    return [prompt for block in block_re.findall(text) for prompt in parse_prompt_pairs(block)]


def extract_org_prompts(text):
    return extract_prompts(ORG_TEST_RE, text)


def extract_md_prompts(text):
    return extract_prompts(MD_TEST_RE, text)


PARSERS = {
    ".org": (parse_org_metadata, extract_note_links, extract_org_prompts),
    ".md": (parse_md_metadata, extract_md_note_links, extract_md_prompts),
}


def note_files(notes_dir):
    paths = sorted(path for path in Path(notes_dir).iterdir() if path.suffix in PARSERS)
    slugs = [slug_of(path) for path in paths]
    for slug in slugs:
        if slugs.count(slug) > 1:
            raise ValueError(f"slug collision: {slug}")
    return paths


def parse_note(path):
    parse, extract_links, extract_prompts = PARSERS[path.suffix]
    text = path.read_text()
    return {**parse(text), "file": path.name, "links": extract_links(text), "prompts": extract_prompts(text)}


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
    index = build_index(notes_dir)
    output.write_text(json.dumps(index, ensure_ascii=False, indent=1))
    print(f"{output}: {len(index['notes'])} notes indexed")


if __name__ == "__main__":
    main()

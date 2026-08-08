import json

import pytest

from build_index import (
    build_index,
    extract_md_note_links,
    extract_md_prompts,
    invert_links,
    parse_md_metadata,
    parse_prompt_pairs,
    slug_of,
)


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            "---\ntitle: MD Note\ndate: 2026-07-29\ntags: [a, b]\n---\n\nBody",
            {"title": "MD Note", "date": "2026-07-29", "tags": ["a", "b"]},
        ),
        (
            "---\ntitle: Spaced Tags\ntags: x y\n---\n",
            {"title": "Spaced Tags", "date": "", "tags": ["x", "y"]},
        ),
        ("# Heading Title\n\nBody", {"title": "Heading Title", "date": "", "tags": []}),
        ("just prose", {"title": "", "date": "", "tags": []}),
    ],
)
def test_parse_md_metadata(text, expected):
    assert parse_md_metadata(text) == expected, (
        "parse_md_metadata should read YAML frontmatter or fall back to the first # heading"
    )


@pytest.mark.parametrize(
    "text, expected_links",
    [
        ("See [other](other-note.md).", ["other-note"]),
        ("Legacy [org one](some.org) no longer resolves.", []),
        ("External [x](https://example.com/a.md) ignored.", []),
        ("Image ![p](static/pic.gif) ignored.", []),
        ("Dupes [a](a.md) [a](a.md).", ["a"]),
    ],
)
def test_extract_md_note_links(text, expected_links):
    assert extract_md_note_links(text) == expected_links, (
        "extract_md_note_links should return unique slugs of relative .md links only"
    )


def test_invert_links():
    graph = {"a": ["b", "c"], "b": ["c"], "c": []}
    assert invert_links(graph) == {"a": [], "b": ["a"], "c": ["a", "b"]}, (
        "invert_links should map every note to the sorted list of notes linking to it"
    )


@pytest.mark.parametrize(
    "filename, expected_slug",
    [
        ("programming-in-wartime.md", "programming-in-wartime"),
        ("notes/nested/deep.md", "deep"),
    ],
)
def test_slug_of(filename, expected_slug):
    assert slug_of(filename) == expected_slug, (
        "slug_of should return the bare filename without directories or extension"
    )


def test_build_index_end_to_end(tmp_path):
    (tmp_path / "a.md").write_text(
        "---\ntitle: Note A\ndate: 2024-01-01\ntags: [x, y]\n---\n\nLinks to [B](b.md).\n"
    )
    (tmp_path / "b.md").write_text("---\ntitle: Note B\n---\n\nNo links here.\n")

    index = build_index(tmp_path)

    assert set(index["notes"]) == {"a", "b"}, (
        "build_index should include every .md note keyed by slug"
    )
    assert index["notes"]["a"] == {
        "title": "Note A",
        "date": "2024-01-01",
        "tags": ["x", "y"],
        "file": "a.md",
        "links": ["b"],
        "prompts": [],
        "backlinks": [],
    }, "build_index should produce complete metadata per note"
    assert index["notes"]["b"]["backlinks"] == ["a"], (
        "build_index should record incoming backlinks"
    )
    json.dumps(index)


def test_build_index_ignores_non_md_files(tmp_path):
    (tmp_path / "a.md").write_text("---\ntitle: A\n---\n")
    (tmp_path / "stale.org").write_text("#+title: Stale\n")

    assert set(build_index(tmp_path)["notes"]) == {"a"}, (
        "build_index should index .md files only"
    )


def test_build_index_drops_links_to_unknown_notes(tmp_path):
    (tmp_path / "a.md").write_text("---\ntitle: A\n---\n\n[real](b.md) [gone](ghost.md)\n")
    (tmp_path / "b.md").write_text("---\ntitle: B\n---\n")

    index = build_index(tmp_path)

    assert index["notes"]["a"]["links"] == ["b"], (
        "build_index should drop links pointing at notes that don't exist"
    )


@pytest.mark.parametrize(
    "body, expected",
    [
        ("Q: What?\nA: That.", [{"q": "What?", "a": "That."}]),
        (
            "Q: First?\nA: One.\nQ: Second?\nA: Two.",
            [{"q": "First?", "a": "One."}, {"q": "Second?", "a": "Two."}],
        ),
        (
            "Q: Multi\nline question?\nA: Multi\nline answer.",
            [{"q": "Multi\nline question?", "a": "Multi\nline answer."}],
        ),
        ("Q: Orphan question?", []),
        ("A: Orphan answer.", []),
        ("Q: Kept?\nA: Yes.\nQ: Dropped orphan?", [{"q": "Kept?", "a": "Yes."}]),
        ("", []),
    ],
)
def test_parse_prompt_pairs(body, expected):
    assert parse_prompt_pairs(body) == expected, (
        "parse_prompt_pairs should pair each Q with its A and drop orphans of either kind"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        ("```test\nQ: What?\nA: That.\n```", [{"q": "What?", "a": "That."}]),
        ("```python\nQ = 1\n```", []),
        (
            "```test\nQ: One?\nA: 1.\n```\nprose\n```test\nQ: Two?\nA: 2.\n```",
            [{"q": "One?", "a": "1."}, {"q": "Two?", "a": "2."}],
        ),
    ],
)
def test_extract_md_prompts(text, expected):
    assert extract_md_prompts(text) == expected, (
        "extract_md_prompts should collect Q/A pairs only from fenced blocks tagged test"
    )


def test_build_index_includes_prompts(tmp_path):
    (tmp_path / "quizzy.md").write_text(
        "---\ntitle: Quizzy\n---\n\n```test\nQ: What?\nA: That.\n```\n"
    )
    (tmp_path / "plain.md").write_text("---\ntitle: Plain\n---\n")
    index = build_index(tmp_path)
    assert index["notes"]["quizzy"]["prompts"] == [{"q": "What?", "a": "That."}], (
        "build_index should carry extracted prompts into the note entry"
    )
    assert index["notes"]["plain"]["prompts"] == [], (
        "build_index should give promptless notes an empty prompts list"
    )

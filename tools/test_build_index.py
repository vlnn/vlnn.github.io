import json

import pytest

from build_index import (
    is_stub,
    build_index,
    extract_md_note_links,
    extract_md_prompts,
    invert_links,
    link_kinds,
    parse_md_metadata,
    plex_of,
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
        "stub": False,
        "backlinks": [],
        "parents": [],
        "children": [],
        "jumps": ["b"],
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


def test_current_commit(mocker):
    from build_index import current_commit

    run = mocker.patch("build_index.subprocess.run")
    run.return_value.stdout = "d42fgw3\n"
    assert current_commit() == "d42fgw3", (
        "current_commit should return the short hash git prints, stripped"
    )
    assert run.call_args.args[0] == ["git", "rev-parse", "--short", "HEAD"], (
        "current_commit should ask git for the short HEAD hash"
    )


def test_current_commit_without_git(mocker):
    from build_index import current_commit

    mocker.patch("build_index.subprocess.run", side_effect=OSError)
    assert current_commit() == "", (
        "current_commit should degrade to empty when git is unavailable"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        ("---\ntitle: Writing code\ndate: 2026-09-12\n---\n\n", True),
        ("---\ntitle: Full\n---\n\nSome body.", False),
        ("# Heading only\n\n", True),
        ("# Heading\n\nProse under it.", False),
        ("", True),
    ],
)
def test_is_stub(text, expected):
    assert is_stub(text) is expected, (
        "is_stub should be true only when nothing remains after frontmatter and the title heading"
    )


def test_build_index_marks_stubs(tmp_path):
    (tmp_path / "full.md").write_text("---\ntitle: Full\n---\n\nBody [stub](stub.md).")
    (tmp_path / "stub.md").write_text("---\ntitle: Stub\n---\n")
    index = build_index(tmp_path)
    assert index["notes"]["stub"]["stub"] is True, "build_index should mark frontmatter-only notes as stubs"
    assert index["notes"]["full"]["stub"] is False, "build_index should not mark notes with a body as stubs"


@pytest.mark.parametrize(
    "text, expected",
    [
        ("See [b](b.md) here.", {"b": {"prose"}}),
        ("* [b](b.md)", {"b": {"list"}}),
        ("- [b](b.md)", {"b": {"list"}}),
        ("1. [b](b.md)", {"b": {"list"}}),
        ("  + nested [b](b.md)", {"b": {"list"}}),
        ("Body.\n\n## Related\n\n- [b](b.md)\n", {"b": {"related"}}),
        ("Mentions [b](b.md).\n\n## Related\n\n- [b](b.md)\n", {"b": {"prose", "related"}}),
        ("## Related\n\n- [b](b.md)\n\n## Later\n\n- [c](c.md)", {"b": {"related"}, "c": {"list"}}),
        ("# Related\n\n- [b](b.md)", {"b": {"related"}}),
        ("![pic](b.md)", {}),
        ("---\ntitle: T\n---\n\nSee [b](b.md).", {"b": {"prose"}}),
    ],
)
def test_link_kinds(text, expected):
    assert link_kinds(text) == expected, (
        "link_kinds should tag each target by where it appears: prose, list item, or the Related section"
    )


def plex(parents=(), children=(), jumps=()):
    return {"parents": list(parents), "children": list(children), "jumps": list(jumps)}


@pytest.mark.parametrize(
    "graph, expected",
    [
        (
            {"a": {"b": {"list"}}, "b": {}},
            {"a": plex(children=["b"]), "b": plex(parents=["a"])},
        ),
        (
            {"a": {"b": {"related"}}, "b": {}},
            {"a": plex(children=["b"]), "b": plex(parents=["a"])},
        ),
        (
            {"a": {"b": {"prose"}}, "b": {}},
            {"a": plex(jumps=["b"]), "b": plex(jumps=["a"])},
        ),
        (
            {"a": {"b": {"prose", "related"}}, "b": {}},
            {"a": plex(children=["b"]), "b": plex(parents=["a"])},
        ),
        (
            {"a": {"b": {"related"}}, "b": {"a": {"related"}}},
            {"a": plex(jumps=["b"]), "b": plex(jumps=["a"])},
        ),
        (
            {"a": {"b": {"list"}}, "b": {"a": {"prose"}}},
            {"a": plex(jumps=["b"]), "b": plex(jumps=["a"])},
        ),
        (
            {"a": {"a": {"list"}, "ghost": {"list"}}},
            {"a": plex()},
        ),
    ],
)
def test_plex_of(graph, expected):
    assert plex_of(graph) == expected, (
        "plex_of should turn one-way list/Related links into parent->child and everything else into jumps"
    )


def test_plex_of_orders_parents_by_hub_size():
    graph = {
        "small": {"x": {"list"}},
        "hub": {"x": {"list"}, "y": {"list"}, "z": {"list"}},
        "mid": {"x": {"list"}, "y": {"list"}},
        "x": {},
        "y": {},
        "z": {},
    }
    assert plex_of(graph)["x"]["parents"] == ["hub", "mid", "small"], (
        "plex_of should list a note's parents biggest hub first so the likeliest real parent leads"
    )


def test_plex_of_breaks_hub_ties_by_slug():
    graph = {"b": {"x": {"list"}}, "a": {"x": {"list"}}, "x": {}}
    assert plex_of(graph)["x"]["parents"] == ["a", "b"], (
        "plex_of should order equally sized parents alphabetically for stable output"
    )


def test_build_index_infers_plex(tmp_path):
    (tmp_path / "hub.md").write_text("---\ntitle: Hub\n---\n\n* [Leaf](leaf.md)\n")
    (tmp_path / "leaf.md").write_text("---\ntitle: Leaf\n---\n\nSee [other](other.md).\n")
    (tmp_path / "other.md").write_text("---\ntitle: Other\n---\n")

    notes = build_index(tmp_path)["notes"]

    assert notes["leaf"]["parents"] == ["hub"], "build_index should record list-linking notes as parents"
    assert notes["hub"]["children"] == ["leaf"], "build_index should record listed notes as children"
    assert notes["leaf"]["jumps"] == ["other"], "build_index should record prose links as jumps"
    assert notes["other"]["jumps"] == ["leaf"], "build_index should record jumps on both ends"

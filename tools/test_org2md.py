import pytest

from org2md import (
    convert_body,
    fix_test_fences,
    frontmatter,
    mark_test_blocks,
    normalize_date,
    org_to_md,
    parse_keywords,
    rewrite_file_links,
)


@pytest.mark.parametrize(
    "text, expected",
    [
        ("#+title: Plain Title\n\nBody", "Plain Title"),
        ("#+TITLE: Upper Case Key\n", "Upper Case Key"),
        ("No metadata", ""),
    ],
)
def test_parse_keywords_title(text, expected):
    assert parse_keywords(text)["title"] == expected, (
        "parse_keywords should extract the title keyword case-insensitively"
    )


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("<2026-08-03 Mon>", "2026-08-03"),
        ("<2026-07-29 12:00>", "2026-07-29"),
        ("2022-10-08", "2022-10-08"),
        ("", ""),
    ],
)
def test_normalize_date(raw, expected):
    assert normalize_date(raw) == expected, (
        "normalize_date should reduce any org date stamp to YYYY-MM-DD"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        ("#+filetags: person\n", ["person"]),
        ("#+filetags: getting-older,dropbox,web\n", ["getting-older", "dropbox", "web"]),
        ("#+filetags: lisp examples\n", ["lisp", "examples"]),
        ("#+filetags: :a:b:\n", ["a", "b"]),
        ("#+title: no tags\n", []),
    ],
)
def test_parse_keywords_tags(text, expected):
    assert parse_keywords(text)["tags"] == expected, (
        "parse_keywords should split filetags on spaces, commas, and colons"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        ("#+description: A short one\n", "A short one"),
        ("#+description:\n", ""),
        ("#+description:\n#+filetags: lisp examples\n", ""),
        ("#+title: none\n", ""),
    ],
)
def test_parse_keywords_description(text, expected):
    assert parse_keywords(text)["description"] == expected, (
        "parse_keywords should carry the description, empty when absent or blank"
    )


@pytest.mark.parametrize(
    "meta, expected",
    [
        (
            {"title": "T", "date": "2026-08-03", "tags": ["a", "b"], "description": "D"},
            "---\ntitle: T\ndate: 2026-08-03\ntags: [a, b]\ndescription: D\n---\n",
        ),
        (
            {"title": "T", "date": "2026-08-03", "tags": ["one"], "description": ""},
            "---\ntitle: T\ndate: 2026-08-03\ntags: [one]\n---\n",
        ),
        (
            {"title": "T", "date": "", "tags": [], "description": ""},
            "---\ntitle: T\n---\n",
        ),
    ],
)
def test_frontmatter(meta, expected):
    assert frontmatter(meta) == expected, (
        "frontmatter should emit bracket-style tags and skip empty fields"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            "[[file:top-of-mind.org][Top of mind]]",
            "[[file:top-of-mind.md][Top of mind]]",
        ),
        (
            "[[file:how-this-site-works.md][How]]",
            "[[file:how-this-site-works.md][How]]",
        ),
        (
            "[[file:static/daylight-lamp.gif]]",
            "[[file:static/daylight-lamp.gif]]",
        ),
        (
            "[[https://example.org][ext]]",
            "[[https://example.org][ext]]",
        ),
    ],
)
def test_rewrite_file_links(text, expected):
    assert rewrite_file_links(text) == expected, (
        "rewrite_file_links should retarget .org file links to .md and touch nothing else"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            "#+begin_test\nQ: x?\nA: y\n#+end_test\n",
            "#+begin_src test\nQ: x?\nA: y\n#+end_src\n",
        ),
        (
            "#+begin_test\nQ: Is =head= replacing =car=?\nA: =car=\n#+end_test\n",
            "#+begin_src test\nQ: Is `head` replacing `car`?\nA: `car`\n#+end_src\n",
        ),
        (
            "Outside =stays= as is.\n#+begin_test\nQ: ~code~?\nA: yes\n#+end_test\n",
            "Outside =stays= as is.\n#+begin_src test\nQ: `code`?\nA: yes\n#+end_src\n",
        ),
    ],
)
def test_mark_test_blocks(text, expected):
    assert mark_test_blocks(text) == expected, (
        "mark_test_blocks should make src blocks pandoc preserves and turn org verbatim into md code"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        ("``` test\nQ: a?\nA: b\n```\n", "```test\nQ: a?\nA: b\n```\n"),
        ("``` lisp\n(car x)\n```\n", "``` lisp\n(car x)\n```\n"),
    ],
)
def test_fix_test_fences(text, expected):
    assert fix_test_fences(text) == expected, (
        "fix_test_fences should close the gap only in test fences so MD_TEST_RE matches"
    )


def test_convert_body_calls_pandoc(mocker):
    run = mocker.patch("org2md.subprocess.run")
    run.return_value.stdout = "converted"
    assert convert_body("* Org") == "converted", (
        "convert_body should return pandoc stdout"
    )
    args = run.call_args
    assert args.args[0][:4] == ["pandoc", "-f", "org", "-t"], (
        "convert_body should invoke pandoc reading org"
    )
    assert args.kwargs["input"] == "* Org", (
        "convert_body should pass the org text on stdin"
    )


def test_org_to_md_composes(mocker):
    mocker.patch("org2md.convert_body", side_effect=lambda body: body.upper())
    org = (
        "#+title: T\n"
        "#+date: <2026-08-03 Mon>\n"
        "#+filetags: a b\n"
        "\n"
        "see [[file:x.org][x]]\n"
    )
    result = org_to_md(org)
    assert result.startswith("---\ntitle: T\ndate: 2026-08-03\ntags: [a, b]\n---\n"), (
        "org_to_md should prepend frontmatter built from the keywords"
    )
    assert "[[FILE:X.MD][X]]" in result, (
        "org_to_md should rewrite links before handing the body to pandoc"
    )

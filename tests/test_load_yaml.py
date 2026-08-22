"""End-to-end tests of `load_database()` against files on disk: YAML
parsing, per-file error aggregation, and the "not a list" / blank-file
edge cases that don't apply to the in-memory `Database` tests."""

import pytest
import yaml

from src.data import DataValidationError, TABLES, load_database

MINIMAL_ROWS = {
    "people.yml": [
        {"id": "jdoe", "status": "current", "tenure": "2020-", "name": "Jane Doe"}
    ],
    "publications.yml": [
        {
            "id": "Doe2020_example",
            "year": 2020,
            "authors": "J. Doe",
            "title": "An example publication",
            "journal": "J. Examples",
            "status": "publication",
            "position": "first",
        }
    ],
    "projects.yml": [
        {
            "id": "example_project",
            "title": "Example project",
            "status": "current",
            "abstract": "An example project.",
        }
    ],
    "software.yml": [
        {
            "id": "example-software",
            "type": "software",
            "name": "ExampleSoftware",
            "title": "Example software",
            "description": "Does example things.",
        }
    ],
    "editors.yml": [
        {
            "id": "example-editor",
            "status": "current",
            "tenure": "2020-2025",
            "name": "Example editor role",
            "description": "An example editorial role.",
        }
    ],
    "funding.yml": [
        {
            "id": "example-grant",
            "funder_short": "EX",
            "funder": "Example Funder",
            "start": "01/2020",
            "end": "12/2021",
            "title": "Example grant",
            "role": "Recipient",
            "amount": 1000,
            "personal_amount": 1000,
            "currency": "€",
            "description": "An example grant.",
        }
    ],
    "news.yml": [
        {
            "id": "example-news",
            "status": "current",
            "title": "Example news",
            "date": "2026-01-01",
            "short": "An example news item.",
        }
    ],
    "teaching.yml": [
        {
            "id": "example-course",
            "title": "Example course",
            "date": "04/2020 - 09/2020",
            "semester": "SS20",
            "authors": "J. Doe",
            "location": "Somewhere",
            "content": "Course content.",
        }
    ],
    "presentations.yml": [
        {
            "id": "example-talk",
            "type": "invited_talk",
            "title": "Example talk",
            "authors": "J. Doe",
            "event": "Example Conference",
            "date": "2020-01-01",
        }
    ],
    "posters.yml": [
        {
            "id": "example-poster",
            "year": 2020,
            "date": "2020-01-01",
            "pdf": "example.pdf",
            "image": "example.jpg",
            "authors": "J. Doe",
            "affiliations": "Example University",
            "title": "Example poster",
            "event": "Example Conference",
            "abstract": "An example poster abstract.",
        }
    ],
    "panels.yml": [
        {
            "id": "example-panel",
            "type": "panelist",
            "title": "Example panel",
            "authors": "J. Doe",
            "event": "Example Conference",
            "date": "2020-01-01",
            "location": "Somewhere",
        }
    ],
    "abstracts.yml": [
        {
            "id": "example-abstract",
            "year": 2020,
            "title": "Example abstract",
            "authors": "J. Doe",
        }
    ],
    "activities.yml": [
        {
            "id": "example-activity",
            "tenure": "2020",
            "title": "Example activity",
            "description": "An example activity.",
            "link": "https://example.com",
        }
    ],
    "linkedin.yml": [
        {"id": "example-post", "date": "2020-01-01", "content": "An example post."}
    ],
}

TAGS_YML = [
    {
        "tag": "Digital Twins",
        "icon": "fa-cube",
        "short_description": "short",
        "description": "long",
    }
]

COUNTRY_FLAGS_YML = {"Germany": "🇩🇪"}


def write_minimal_data_dir(tmp_path):
    data_dir = tmp_path / "_data"
    data_dir.mkdir()
    for filename, rows in MINIMAL_ROWS.items():
        with open(data_dir / filename, "w") as f:
            yaml.safe_dump(rows, f, allow_unicode=True)
    with open(data_dir / "tags.yml", "w") as f:
        yaml.safe_dump(TAGS_YML, f, allow_unicode=True)
    with open(data_dir / "country_flags.yml", "w") as f:
        yaml.safe_dump(COUNTRY_FLAGS_YML, f, allow_unicode=True)
    assert set(f.name for f in data_dir.iterdir()) == {fn for fn, _ in TABLES.values()} | {
        "tags.yml",
        "country_flags.yml",
    }

    # referenced-image existence check needs these to actually exist
    app_dir = data_dir.parent
    (app_dir / "img" / "people" / "128").mkdir(parents=True)
    (app_dir / "paper").mkdir(parents=True)
    (app_dir / "paper" / "example.jpg").touch()
    (app_dir / "paper" / "example.pdf").touch()

    return data_dir


def test_minimal_data_dir_loads(tmp_path):
    data_dir = write_minimal_data_dir(tmp_path)
    db = load_database(data_dir)
    assert db.people[0].id == "jdoe"


def test_unknown_field_reported(tmp_path):
    data_dir = write_minimal_data_dir(tmp_path)
    rows = yaml.safe_load(open(data_dir / "people.yml"))
    rows[0]["flag"] = "🇩🇪"  # stray/typo'd field
    yaml.safe_dump(rows, open(data_dir / "people.yml", "w"), allow_unicode=True)

    with pytest.raises(DataValidationError) as exc_info:
        load_database(data_dir)
    assert "people.yml" in str(exc_info.value)


def test_not_a_list_reported(tmp_path):
    data_dir = write_minimal_data_dir(tmp_path)
    with open(data_dir / "people.yml", "w") as f:
        yaml.safe_dump({"not": "a list"}, f)

    with pytest.raises(DataValidationError) as exc_info:
        load_database(data_dir)
    assert "expected a top-level YAML list" in str(exc_info.value)


def test_blank_file_treated_as_empty_table(tmp_path):
    data_dir = write_minimal_data_dir(tmp_path)
    (data_dir / "linkedin.yml").write_text("")
    db = load_database(data_dir)
    assert db.linkedin == []


def test_multiple_errors_collected_in_one_pass(tmp_path):
    data_dir = write_minimal_data_dir(tmp_path)
    rows = yaml.safe_load(open(data_dir / "people.yml"))
    rows[0]["orcid"] = "bad-orcid"
    yaml.safe_dump(rows, open(data_dir / "people.yml", "w"), allow_unicode=True)

    pub_rows = yaml.safe_load(open(data_dir / "publications.yml"))
    pub_rows[0]["doi"] = "bad-doi"
    yaml.safe_dump(pub_rows, open(data_dir / "publications.yml", "w"), allow_unicode=True)

    with pytest.raises(DataValidationError) as exc_info:
        load_database(data_dir)
    message = str(exc_info.value)
    assert "people.yml" in message
    assert "publications.yml" in message

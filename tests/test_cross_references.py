"""Unit tests for `Database`'s cross-table reference validation: the
`people`/`tags`/`publications` id-lists on one table must resolve to real
rows in another table, ids must be unique within a table, and referenced
image files must exist on disk."""

import pytest
from pydantic import ValidationError

from tests.conftest import (
    make_database,
    make_editor,
    make_person,
    make_project,
    make_publication,
    make_software,
    make_tag,
)


def test_valid_database_passes():
    db = make_database(people=[make_person()], publications=[make_publication(people=["jdoe"])])
    assert db.people[0].id == "jdoe"


def test_unknown_person_id_rejected():
    with pytest.raises(ValidationError, match="unknown person id"):
        make_database(publications=[make_publication(people=["ghost"])])


def test_unknown_tag_rejected():
    with pytest.raises(ValidationError, match="unknown tag"):
        make_database(projects=[make_project(tags=["Not A Real Tag"])])


def test_known_tag_accepted():
    db = make_database(
        tags=[make_tag(tag="AI")],
        projects=[make_project(tags=["AI"])],
    )
    assert db.projects[0].tags == ["AI"]


def test_unknown_publication_id_rejected():
    with pytest.raises(ValidationError, match="unknown publication id"):
        make_database(projects=[make_project(publications=["ghost_pub"])])


def test_known_publication_id_accepted():
    db = make_database(
        publications=[make_publication(id="Doe2020_example")],
        projects=[make_project(publications=["Doe2020_example"])],
    )
    assert db.projects[0].publications == ["Doe2020_example"]


def test_duplicate_id_within_table_rejected():
    with pytest.raises(ValidationError, match="duplicate id"):
        make_database(
            people=[make_person(id="jdoe"), make_person(id="jdoe", name="Jane Doe 2")]
        )


def test_duplicate_id_across_different_tables_is_fine():
    # ids only need to be unique *within* a table (e.g. a project and a
    # piece of software can share an id, or coincidentally match a news
    # post id that references the same real-world thing).
    db = make_database(
        projects=[make_project(id="shared_id")],
        software=[make_software(id="shared_id")],
    )
    assert db.projects[0].id == db.software[0].id


def test_editor_person_link_not_required():
    # editors.yml has no `people` field: this must not raise.
    db = make_database(editors=[make_editor()])
    assert db.editors[0].id == "example-editor"


def test_missing_image_file_rejected():
    with pytest.raises(ValidationError, match="not found"):
        make_database(people=[make_person(image="this-file-does-not-exist.png")])

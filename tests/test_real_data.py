"""Regression test: the actual app/_data/*.yml files must always load and
validate cleanly. This is what CI runs on every commit/PR to catch a bad
edit to the data before it reaches the live site."""

from src.data import DATA_DIR, TABLES, load_database


def test_real_data_loads_and_validates():
    db = load_database(DATA_DIR)
    for table_name in TABLES:
        assert len(getattr(db, table_name)) > 0, f"{table_name} table is empty"
    assert len(db.tags) > 0


def test_real_data_has_no_duplicate_ids():
    db = load_database(DATA_DIR)
    for table_name in TABLES:
        ids = [row.id for row in getattr(db, table_name)]
        assert len(ids) == len(set(ids)), f"duplicate id in {table_name}.yml"


def test_koenig_is_in_people_and_current():
    db = load_database(DATA_DIR)
    koenig = next(p for p in db.people if p.id == "koenig")
    assert koenig.status == "current"
    assert "Group Leader" in koenig.role

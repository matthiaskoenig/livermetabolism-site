"""Pydantic data model for the König Lab website content.

This module defines the schema for every YAML file under ``app/_data/``,
loads them into typed, validated objects, and cross-checks the references
between them (e.g. the ``people`` id-lists on publications/projects/... must
point at real entries in ``people.yml``; ``tags`` must be tags that are
actually defined in ``tags.yml``).

Run directly to validate the live data (this is the "load and validate"
step that should be run after any change to ``app/_data/*.yml``, and is
what the ``validate-data`` GitHub Actions workflow / pytest suite call):

    uv run python -m src.data
    # or, with src/ as the working directory:
    uv run python data.py

Exits with status 1 and a readable report of every problem found if
anything fails to parse or a reference doesn't resolve; exits 0 and prints
a short summary otherwise.
"""

from __future__ import annotations

import re
import sys
from datetime import date as Date
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
APP_DIR = REPO_ROOT / "app"
DATA_DIR = APP_DIR / "_data"


class DataValidationError(Exception):
    """Raised with every problem found, collected, so a fix can address all
    of them in one pass instead of one Liquid-error-style build failure at
    a time."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        message = f"{len(errors)} data validation error(s):\n" + "\n".join(
            f"  - {e}" for e in errors
        )
        super().__init__(message)


# ---------------------------------------------------------------------------
# Shared helpers / mixins
# ---------------------------------------------------------------------------


class StrictModel(BaseModel):
    """Base for every table row: unknown fields are a hard error.

    This is what turns a stray/typo'd YAML key (e.g. ``affilitations``) or
    a field that silently stopped being used into a validation failure
    instead of quietly-wrong data.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


def _none_to_list(v: Any) -> Any:
    """A blank YAML value (``key:`` with nothing after it) parses as
    ``None``; for list fields we want that to mean "empty list"."""
    return [] if v is None else v


def _as_list(v: Any) -> Any:
    """Accept either a bare scalar or a list for "one-or-many" fields."""
    if v is None:
        return []
    if isinstance(v, list):
        return v
    return [v]


def list_field(**kwargs) -> Any:
    """A ``list[str]`` field that defaults to empty and treats a blank YAML
    value as an empty list rather than a validation error."""
    return Field(default_factory=list, **kwargs)


MONTH_YEAR_RE = re.compile(r"^(?P<month>\d{1,2})/(?P<year>\d{4})$")
YEAR_RE = re.compile(r"^\d{4}$")
ORCID_RE = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$")
DOI_RE = re.compile(r"^10\.\d{4,9}/\S+$")


def _normalize_month_year(v: str) -> str:
    """Validate/normalize a "MM/YYYY" or "YYYY" period boundary, zero-
    padding the month (catches typos like the ``9/2027`` this replaced)."""
    v = v.strip()
    m = MONTH_YEAR_RE.match(v)
    if m:
        return f"{int(m.group('month')):02d}/{m.group('year')}"
    if YEAR_RE.match(v):
        return v
    raise ValueError(f"expected 'MM/YYYY' or 'YYYY', got {v!r}")


class Taggable(StrictModel):
    """Mixin for tables that reference the shared ``tags.yml`` vocabulary."""

    tags: list[str] = list_field()

    _tags_none = field_validator("tags", mode="before")(_none_to_list)


class PeopleLinked(StrictModel):
    """Mixin for tables with a `people` id-list into ``people.yml`` — the
    actual relational link (as opposed to the free-text ``authors`` string
    also present on bibliographic entries)."""

    people: list[str] = list_field()

    _people_none = field_validator("people", mode="before")(_none_to_list)


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

PersonStatus = Literal["current", "alumni"]
ContentStatus = Literal["current", "old"]
PublicationStatus = Literal[
    "thesis", "report", "preprint", "publication", "review", "proceeding", "chapter", "abstract"
]
AuthorPosition = Literal["first", "first_equal", "index", "last_equal", "last"]
FundingRole = Literal["Recipient", "Co-Investigator"]
TalkType = Literal["invited_talk", "selected_talk"]
PanelType = Literal["panelist"]
SoftwareType = Literal["software", "database"]
TeachingType = Literal["lecture", "course", "seminar"]


# ---------------------------------------------------------------------------
# Reference tables
# ---------------------------------------------------------------------------


class Tag(StrictModel):
    """A single row of ``tags.yml``: the controlled vocabulary of research
    areas used to categorize projects, publications, software, news,
    funding, and editorial roles."""

    tag: str
    icon: str
    short_description: str
    description: str
    vision: str


# ---------------------------------------------------------------------------
# People
# ---------------------------------------------------------------------------


class Person(StrictModel):
    id: str
    status: PersonStatus
    tenure: str
    name: str
    country: str | None = None
    role: list[str] = list_field()
    image: str | None = None
    orcid: str | None = None
    repository: str | None = None
    homepage: str | None = None
    affiliation: str | None = None
    description: str | None = None
    end_year: int | None = None

    _role_none = field_validator("role", mode="before")(_none_to_list)

    @field_validator("orcid")
    @classmethod
    def _check_orcid(cls, v: str | None) -> str | None:
        if v is not None and not ORCID_RE.match(v):
            raise ValueError(f"not a valid ORCID iD: {v!r}")
        return v

    @model_validator(mode="after")
    def _alumni_has_end_year(self) -> "Person":
        if self.status == "alumni" and self.end_year is None:
            raise ValueError(f"person {self.id!r} is alumni but has no end_year")
        return self


# ---------------------------------------------------------------------------
# Publications
# ---------------------------------------------------------------------------


class Publication(Taggable, PeopleLinked):
    id: str
    year: int
    date: Date | None = None
    pdf: str | None = None
    authors: str
    affiliations: str | None = None
    title: str
    journal: str
    journal_short: str | None = None
    status: PublicationStatus
    impact: float | None = None
    position: AuthorPosition
    doi: str | None = None
    pmid: int | None = None
    keywords: list[str] = list_field()
    homepage: str | None = None
    repository: str | None = None
    abstract: str | None = None

    _keywords_none = field_validator("keywords", mode="before")(_none_to_list)

    @field_validator("doi")
    @classmethod
    def _check_doi(cls, v: str | None) -> str | None:
        if v is not None and not DOI_RE.match(v):
            raise ValueError(f"not a valid DOI: {v!r}")
        return v


# ---------------------------------------------------------------------------
# Projects & Software
# ---------------------------------------------------------------------------


class Project(Taggable, PeopleLinked):
    id: str
    title: str
    status: ContentStatus
    publications: list[str] = list_field()
    homepage: str | None = None
    repository: str | None = None
    cooperation_partners: str | None = None
    images: list[str] = list_field()
    image_title: str | None = None
    abstract: str

    _pubs_none = field_validator("publications", mode="before")(_none_to_list)
    _images_list = field_validator("images", mode="before")(_as_list)


class Software(Taggable, PeopleLinked):
    id: str
    type: SoftwareType
    name: str
    title: str
    description: str
    image: str | None = None
    publications: list[str] = list_field()
    homepage: str | None = None
    repository: str | None = None
    doi: str | None = None

    _pubs_none = field_validator("publications", mode="before")(_none_to_list)


class Editor(Taggable):
    id: str
    status: PersonStatus
    tenure: str
    name: str
    image: str | None = None
    repository: str | None = None
    homepage: str | None = None
    description: str


class Funding(Taggable):
    id: str
    funder_short: str
    funder: str
    funder_link: str | None = None
    funder_logo: str | None = None
    grant: str | None = None
    start: str
    end: str
    title: str
    role: FundingRole
    amount: int
    personal_amount: int
    currency: str
    homepage: str | None = None
    repository: str | None = None
    description: str

    @field_validator("grant", mode="before")
    @classmethod
    def _grant_to_str(cls, v: Any) -> Any:
        return None if v is None else str(v)

    @field_validator("start", "end")
    @classmethod
    def _check_period(cls, v: str) -> str:
        return _normalize_month_year(v)

    @model_validator(mode="after")
    def _personal_amount_le_amount(self) -> "Funding":
        if self.personal_amount > self.amount:
            raise ValueError(
                f"funding {self.id!r}: personal_amount ({self.personal_amount}) "
                f"exceeds amount ({self.amount})"
            )
        return self


# ---------------------------------------------------------------------------
# News, Teaching
# ---------------------------------------------------------------------------


class News(Taggable, PeopleLinked):
    id: str
    status: ContentStatus
    title: str
    date: Date
    image: str | None = None
    image2: str | None = None
    link: str | None = None
    short: str
    abstract: str | None = None
    video: str | None = None


class Teaching(Taggable, PeopleLinked):
    id: str
    title: str
    title_german: str | None = None
    date: str
    type: list[TeachingType] = list_field()
    semester: str
    authors: str
    location: str
    image: str | None = None
    caption: str | None = None
    funding: str | None = None
    content: str

    _type_none = field_validator("type", mode="before")(_none_to_list)


# ---------------------------------------------------------------------------
# Presentations, Posters, Panels, Abstracts
# ---------------------------------------------------------------------------


class Presentation(PeopleLinked):
    id: str
    type: TalkType
    title: str
    authors: str
    affiliations: str | None = None
    slides: str | None = None
    video: str | None = None
    event: str
    event_page: str | None = None
    date: Date
    date_display: str | None = None
    location: str | None = None
    repository: str | None = None
    publications: list[str] = list_field()
    abstract: str | None = None
    keywords: list[str] = list_field()

    _pubs_none = field_validator("publications", mode="before")(_none_to_list)
    _keywords_none = field_validator("keywords", mode="before")(_none_to_list)


class Poster(PeopleLinked):
    id: str
    year: int
    date: Date
    pdf: str
    image: str
    authors: str
    affiliations: str
    title: str
    event: str
    event_page: str | None = None
    doi: str | None = None
    keywords: list[str] = list_field()
    homepage: str | None = None
    repository: str | None = None
    abstract: str

    _keywords_none = field_validator("keywords", mode="before")(_none_to_list)


class Panel(PeopleLinked):
    id: str
    type: PanelType
    title: str
    authors: str
    slides: str | None = None
    video: str | None = None
    event: str
    event_page: str | None = None
    date: Date
    location: str
    repository: str | None = None
    publications: list[str] = list_field()
    abstract: str | None = None
    keywords: list[str] = list_field()

    _pubs_none = field_validator("publications", mode="before")(_none_to_list)
    _keywords_none = field_validator("keywords", mode="before")(_none_to_list)


class Abstract(PeopleLinked):
    id: str
    year: int
    date: Date | None = None
    title: str
    pdf: str | None = None
    authors: str
    affiliations: str | None = None
    abstract: str | None = None
    keywords: list[str] = list_field()
    event: str | None = None
    event_page: str | None = None
    journal: str | None = None
    doi: str | None = None
    homepage: str | None = None
    repository: str | None = None

    _keywords_none = field_validator("keywords", mode="before")(_none_to_list)


class Meeting(Taggable, PeopleLinked):
    """A meeting/workshop the group organized or hosted (as opposed to
    ``presentations``/``posters``/``panels``, which are talks *given* at
    someone else's event)."""

    id: str
    title: str
    description: str
    date: Date
    date_display: str | None = None
    location: str
    homepage: str | None = None
    pdf: str | None = None
    image: str | None = None
    repository: str | None = None


# ---------------------------------------------------------------------------
# Activities, LinkedIn
# ---------------------------------------------------------------------------


class Activity(StrictModel):
    id: str
    tenure: str
    title: str
    description: str
    link: str


class LinkedInPost(StrictModel):
    id: str
    date: Date
    content: str


# ---------------------------------------------------------------------------
# Loading + cross-reference validation
# ---------------------------------------------------------------------------

# table name -> (yaml filename, pydantic model)
TABLES: dict[str, tuple[str, type[StrictModel]]] = {
    "people": ("people.yml", Person),
    "publications": ("publications.yml", Publication),
    "projects": ("projects.yml", Project),
    "software": ("software.yml", Software),
    "editors": ("editors.yml", Editor),
    "funding": ("funding.yml", Funding),
    "news": ("news.yml", News),
    "teaching": ("teaching.yml", Teaching),
    "presentations": ("presentations.yml", Presentation),
    "posters": ("posters.yml", Poster),
    "panels": ("panels.yml", Panel),
    "abstracts": ("abstracts.yml", Abstract),
    "meetings": ("meetings.yml", Meeting),
    "activities": ("activities.yml", Activity),
    "linkedin": ("linkedin.yml", LinkedInPost),
}

# tables whose rows carry a `people: list[str]` referencing people.yml
PEOPLE_LINKED_TABLES = (
    "publications",
    "projects",
    "software",
    "news",
    "teaching",
    "presentations",
    "posters",
    "panels",
    "abstracts",
    "meetings",
)

# tables whose rows carry a `tags: list[str]` referencing tags.yml
TAGGED_TABLES = (
    "publications",
    "projects",
    "software",
    "editors",
    "funding",
    "news",
    "teaching",
    "meetings",
)

# tables whose rows carry a `publications: list[str]` referencing publications.yml
PUBLICATION_LINKED_TABLES = ("projects", "software", "presentations", "panels")

# image fields: table -> [(field name, base dir *relative to the app/ dir*, one_or_many)]
IMAGE_FIELDS: dict[str, list[tuple[str, str, bool]]] = {
    "people": [("image", "assets/image/people/128", False)],
    "editors": [("image", "assets/image/editors", False)],
    "software": [("image", "assets/image/software", False)],
    "news": [("image", "assets/image/news", False), ("image2", "assets/image/news", False)],
    "projects": [("images", "assets/image/projects", True)],
    "teaching": [("image", "assets/image/teaching", False)],
    "posters": [("image", "assets/pdf", False), ("pdf", "assets/pdf", False)],
    "meetings": [("image", "assets/image/meetings", False), ("pdf", "assets/pdf", False)],
}


def _strip_empty_strings(obj: Any) -> Any:
    """Recursively turn ``""`` into ``None`` so a blank-but-present YAML
    value behaves the same as an absent key (both become "unset")."""
    if isinstance(obj, dict):
        return {k: _strip_empty_strings(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_strip_empty_strings(v) for v in obj]
    if obj == "":
        return None
    return obj


def load_yaml_list(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if data is None:
        return []
    if not isinstance(data, list):
        raise DataValidationError([f"{path.name}: expected a top-level YAML list"])
    return [_strip_empty_strings(d) for d in data]


class Database(BaseModel):
    """Every table, loaded and cross-validated together."""

    model_config = ConfigDict(extra="forbid")

    tags: list[Tag]
    country_flags: dict[str, str]
    people: list[Person]
    publications: list[Publication]
    projects: list[Project]
    software: list[Software]
    editors: list[Editor]
    funding: list[Funding]
    news: list[News]
    teaching: list[Teaching]
    presentations: list[Presentation]
    posters: list[Poster]
    panels: list[Panel]
    abstracts: list[Abstract]
    meetings: list[Meeting]
    activities: list[Activity]
    linkedin: list[LinkedInPost]

    @model_validator(mode="after")
    def _check_references(self, info: Any) -> "Database":
        # image existence is checked relative to the app/ dir the data was
        # loaded from (APP_DIR by default; overridden via validation
        # context so tests can point this at a throwaway fixture tree)
        app_dir: Path = (info.context or {}).get("app_dir", APP_DIR)
        errors: list[str] = []

        # --- unique ids per table --------------------------------------
        for table_name in TABLES:
            rows = getattr(self, table_name)
            seen: dict[str, int] = {}
            for row in rows:
                seen[row.id] = seen.get(row.id, 0) + 1
            for rid, count in seen.items():
                if count > 1:
                    errors.append(f"{table_name}.yml: duplicate id {rid!r} ({count}x)")

        tag_names = {t.tag for t in self.tags}
        person_ids = {p.id for p in self.people}
        publication_ids = {p.id for p in self.publications}

        # --- tags reference tags.yml ------------------------------------
        for table_name in TAGGED_TABLES:
            for row in getattr(self, table_name):
                for tag in row.tags:
                    if tag not in tag_names:
                        errors.append(
                            f"{table_name}.yml[{row.id}]: unknown tag {tag!r} "
                            f"(not defined in tags.yml)"
                        )

        # --- people references people.yml -------------------------------
        for table_name in PEOPLE_LINKED_TABLES:
            for row in getattr(self, table_name):
                for pid in row.people:
                    if pid not in person_ids:
                        errors.append(
                            f"{table_name}.yml[{row.id}]: unknown person id {pid!r} "
                            f"(not defined in people.yml)"
                        )

        # --- publications references publications.yml -------------------
        for table_name in PUBLICATION_LINKED_TABLES:
            for row in getattr(self, table_name):
                for pub_id in row.publications:
                    if pub_id not in publication_ids:
                        errors.append(
                            f"{table_name}.yml[{row.id}]: unknown publication id {pub_id!r} "
                            f"(not defined in publications.yml)"
                        )

        # --- image files referenced actually exist on disk ---------------
        for table_name, fields in IMAGE_FIELDS.items():
            for row in getattr(self, table_name):
                for field_name, rel_base_dir, one_or_many in fields:
                    value = getattr(row, field_name)
                    if value is None:
                        continue
                    base_dir = app_dir / rel_base_dir
                    values = value if one_or_many else [value]
                    for v in values:
                        if not (base_dir / v).exists():
                            errors.append(
                                f"{table_name}.yml[{row.id}]: {field_name} "
                                f"{v!r} not found under {rel_base_dir}/"
                            )

        if errors:
            raise ValueError("\n".join(errors))
        return self


def load_database(data_dir: Path = DATA_DIR) -> Database:
    """Load every ``app/_data/*.yml`` file into a validated `Database`.

    Raises `DataValidationError` (parse errors, one field's worth of bad
    data) or a pydantic `ValidationError` (via `Database`'s cross-reference
    check) — both list every problem found, not just the first.
    """
    errors: list[str] = []
    tables: dict[str, list[Any]] = {}

    for table_name, (filename, model) in TABLES.items():
        path = data_dir / filename
        try:
            rows = load_yaml_list(path)
        except DataValidationError as e:
            errors.extend(e.errors)
            continue
        parsed = []
        for i, row in enumerate(rows):
            try:
                parsed.append(model.model_validate(row))
            except Exception as e:  # pydantic.ValidationError
                row_id = row.get("id", f"index {i}") if isinstance(row, dict) else f"index {i}"
                errors.append(f"{filename}[{row_id}]: {e}")
        tables[table_name] = parsed

    tags = load_yaml_list(data_dir / "tags.yml")
    with open(data_dir / "country_flags.yml", encoding="utf-8") as f:
        country_flags = yaml.safe_load(f)

    if errors:
        raise DataValidationError(errors)

    try:
        return Database.model_validate(
            {
                "tags": tags,
                "country_flags": country_flags,
                **tables,
            },
            context={"app_dir": data_dir.parent},
        )
    except Exception as e:
        raise DataValidationError([str(e)]) from e


def main() -> int:
    try:
        db = load_database()
    except DataValidationError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 1

    n_entries = sum(len(getattr(db, t)) for t in TABLES) + len(db.tags)
    n_tables = len(TABLES) + 1
    print(f"✓ loaded and validated {n_entries} entries across {n_tables} tables")
    return 0


if __name__ == "__main__":
    sys.exit(main())

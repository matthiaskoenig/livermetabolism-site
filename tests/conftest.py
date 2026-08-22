"""Shared fixtures/factories for the src.data test suite.

The factory functions build the *minimal valid* instance of each model so
individual tests only need to override the one field they care about.
"""

from __future__ import annotations

from datetime import date

import pytest

from src.data import (
    Abstract,
    Activity,
    Database,
    Editor,
    Funding,
    LinkedInPost,
    News,
    Panel,
    Person,
    Poster,
    Presentation,
    Project,
    Publication,
    Software,
    Tag,
    Teaching,
)


def make_tag(**overrides) -> Tag:
    data = dict(
        tag="Digital Twins",
        icon="fa-cube",
        short_description="short",
        description="long",
    )
    data.update(overrides)
    return Tag(**data)


def make_person(**overrides) -> Person:
    data = dict(
        id="jdoe",
        status="current",
        tenure="2020-",
        name="Jane Doe",
    )
    data.update(overrides)
    return Person(**data)


def make_publication(**overrides) -> Publication:
    data = dict(
        id="Doe2020_example",
        year=2020,
        authors="J. Doe",
        title="An example publication",
        journal="J. Examples",
        status="publication",
        position="first",
    )
    data.update(overrides)
    return Publication(**data)


def make_project(**overrides) -> Project:
    data = dict(
        id="example_project",
        title="Example project",
        status="current",
        abstract="An example project.",
    )
    data.update(overrides)
    return Project(**data)


def make_software(**overrides) -> Software:
    data = dict(
        id="example-software",
        type="software",
        name="ExampleSoftware",
        title="Example software",
        description="Does example things.",
    )
    data.update(overrides)
    return Software(**data)


def make_editor(**overrides) -> Editor:
    data = dict(
        id="example-editor",
        status="current",
        tenure="2020-2025",
        name="Example editor role",
        description="An example editorial role.",
    )
    data.update(overrides)
    return Editor(**data)


def make_funding(**overrides) -> Funding:
    data = dict(
        id="example-grant",
        funder_short="EX",
        funder="Example Funder",
        start="01/2020",
        end="12/2021",
        title="Example grant",
        role="Recipient",
        amount=1000,
        personal_amount=1000,
        currency="€",
        description="An example grant.",
    )
    data.update(overrides)
    return Funding(**data)


def make_news(**overrides) -> News:
    data = dict(
        id="example-news",
        status="current",
        title="Example news",
        date=date(2026, 1, 1),
        short="An example news item.",
    )
    data.update(overrides)
    return News(**data)


def make_teaching(**overrides) -> Teaching:
    data = dict(
        id="example-course",
        title="Example course",
        date="04/2020 - 09/2020",
        semester="SS20",
        authors="J. Doe",
        location="Somewhere",
        content="Course content.",
    )
    data.update(overrides)
    return Teaching(**data)


def make_presentation(**overrides) -> Presentation:
    data = dict(
        id="example-talk",
        type="invited_talk",
        title="Example talk",
        authors="J. Doe",
        event="Example Conference",
        date=date(2020, 1, 1),
    )
    data.update(overrides)
    return Presentation(**data)


def make_poster(**overrides) -> Poster:
    data = dict(
        id="example-poster",
        year=2020,
        date=date(2020, 1, 1),
        pdf="example.pdf",
        image="example.jpg",
        authors="J. Doe",
        affiliations="Example University",
        title="Example poster",
        event="Example Conference",
        abstract="An example poster abstract.",
    )
    data.update(overrides)
    return Poster(**data)


def make_panel(**overrides) -> Panel:
    data = dict(
        id="example-panel",
        type="panelist",
        title="Example panel",
        authors="J. Doe",
        event="Example Conference",
        date=date(2020, 1, 1),
        location="Somewhere",
    )
    data.update(overrides)
    return Panel(**data)


def make_abstract(**overrides) -> Abstract:
    data = dict(
        id="example-abstract",
        year=2020,
        title="Example abstract",
        authors="J. Doe",
    )
    data.update(overrides)
    return Abstract(**data)


def make_activity(**overrides) -> Activity:
    data = dict(
        id="example-activity",
        tenure="2020",
        title="Example activity",
        description="An example activity.",
        link="https://example.com",
    )
    data.update(overrides)
    return Activity(**data)


def make_linkedin_post(**overrides) -> LinkedInPost:
    data = dict(
        id="example-post",
        date=date(2020, 1, 1),
        content="An example post.",
    )
    data.update(overrides)
    return LinkedInPost(**data)


def make_database(**overrides) -> Database:
    """A `Database` with every table empty except `tags`/`country_flags`
    (needed for cross-reference checks) and whatever tables the test
    overrides with real rows."""
    data = dict(
        tags=[make_tag()],
        country_flags={"Germany": "🇩🇪"},
        people=[],
        publications=[],
        projects=[],
        software=[],
        editors=[],
        funding=[],
        news=[],
        teaching=[],
        presentations=[],
        posters=[],
        panels=[],
        abstracts=[],
        activities=[],
        linkedin=[],
    )
    data.update(overrides)
    return Database(**data)


@pytest.fixture
def db_factory():
    return make_database


@pytest.fixture
def person_factory():
    return make_person


@pytest.fixture
def publication_factory():
    return make_publication

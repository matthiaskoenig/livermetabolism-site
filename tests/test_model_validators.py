"""Unit tests for the field-level validators on individual table rows."""

import pytest
from pydantic import ValidationError

from src.data import Funding, Person, Publication
from tests.conftest import make_funding, make_person, make_publication


class TestPerson:
    def test_valid_orcid(self):
        p = make_person(orcid="0000-0003-1725-179X")
        assert p.orcid == "0000-0003-1725-179X"

    def test_invalid_orcid_rejected(self):
        with pytest.raises(ValidationError):
            make_person(orcid="not-an-orcid")

    def test_alumni_requires_end_year(self):
        with pytest.raises(ValidationError):
            make_person(status="alumni")

    def test_alumni_with_end_year_ok(self):
        p = make_person(status="alumni", end_year=2024)
        assert p.end_year == 2024

    def test_unknown_field_rejected(self):
        with pytest.raises(ValidationError):
            make_person(flag="🇩🇪")  # removed field; must not silently succeed

    def test_blank_role_defaults_to_empty_list(self):
        p = Person.model_validate(
            {"id": "x", "status": "current", "tenure": "2020-", "name": "X Y", "role": None}
        )
        assert p.role == []


class TestPublication:
    def test_valid_doi(self):
        pub = make_publication(doi="10.1093/nar/gkaa990")
        assert pub.doi == "10.1093/nar/gkaa990"

    def test_invalid_doi_rejected(self):
        with pytest.raises(ValidationError):
            make_publication(doi="not-a-doi")

    def test_invalid_status_rejected(self):
        with pytest.raises(ValidationError):
            make_publication(status="rumor")

    def test_invalid_position_rejected(self):
        with pytest.raises(ValidationError):
            make_publication(position="middle")

    def test_none_keywords_becomes_empty_list(self):
        pub = Publication.model_validate(
            {
                "id": "x",
                "year": 2020,
                "authors": "J. Doe",
                "title": "t",
                "journal": "j",
                "status": "publication",
                "position": "first",
                "keywords": None,
                "people": None,
                "tags": None,
            }
        )
        assert pub.keywords == []
        assert pub.people == []
        assert pub.tags == []


class TestFunding:
    def test_grant_int_coerced_to_str(self):
        f = make_funding(grant=465194077)
        assert f.grant == "465194077"

    def test_grant_str_kept(self):
        f = make_funding(grant="031L0304B")
        assert f.grant == "031L0304B"

    def test_period_zero_padded(self):
        f = make_funding(start="1/2020", end="12/2021")
        assert f.start == "01/2020"

    def test_period_year_only_ok(self):
        f = make_funding(start="2020", end="2021")
        assert f.start == "2020"

    def test_period_bad_format_rejected(self):
        with pytest.raises(ValidationError):
            make_funding(start="Jan 2020")

    def test_personal_amount_exceeds_amount_rejected(self):
        with pytest.raises(ValidationError):
            make_funding(amount=100, personal_amount=200)

    def test_invalid_role_rejected(self):
        with pytest.raises(ValidationError):
            make_funding(role="Consultant")

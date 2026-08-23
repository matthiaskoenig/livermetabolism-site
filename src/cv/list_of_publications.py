"""Script for creating list of publications."""

from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from rich.console import Console

console = Console()

# The five core research areas of the group (see app/index.html core-messages).
CORE_TAGS = [
    "Digital Twins",
    "Digital Pathology",
    "Pharmacometrics & PBPK",
    "Systems Medicine & AI",
    "Open & FAIR Science",
]

# Mapping of publication id (see app/_data/publications.yml) to a list of
# CORE_TAGS. This is the single source of truth for publication tags; run
# this script to (re-)generate app/_data/publication_tags.yml consumed by
# the Jekyll site.
PUBLICATION_TAGS: dict[str, list[str]] = {
    "Olivier2026_fbc.v3": ["Open & FAIR Science"],
    "Pathirana2026_petab.v2": ["Open & FAIR Science"],
    "Sego2026_efect": ["Open & FAIR Science"],
    "Schwaiger2026_hctz": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Li2026_tabularqual": ["Open & FAIR Science"],
    "Elias2026_dapagliflozin.physiome": ["Pharmacometrics & PBPK", "Open & FAIR Science"],
    "Jesionek2026_rapamycin": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Myshkina2026_apixaban": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Bafna2026_segmentation": ["Digital Pathology"],
    "Alvarez2026_master.thesis": ["Open & FAIR Science"],
    "Sauro2026_fair.to.cure": ["Open & FAIR Science"],
    "Alejandro2026_empagliflozin": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Corradi2026_llemy": ["Systems Medicine & AI"],
    "Nemitz2026_dapagliflozin": ["Pharmacometrics & PBPK"],
    "Tensil2026_losartan": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Myshkina2026_losartan.physiome": ["Digital Twins", "Open & FAIR Science"],
    "Tereshchuk2026_canagliflozin": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Elias2025_glimepiride": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Elias2025_glimepiride.physiome": ["Digital Twins", "Open & FAIR Science"],
    "Myshkina2025_digital.twins": ["Digital Twins", "Systems Medicine & AI"],
    "Casabianca2025_master.thesis": ["Pharmacometrics & PBPK"],
    "Casabianca2025_rivaroxaban": ["Pharmacometrics & PBPK"],
    "Tensil2025_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Nemitz2025_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Elias2025_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Baum2025_diabetic.neuropathy": ["Systems Medicine & AI"],
    "Balaur2025_fairification": ["Open & FAIR Science"],
    "Mishra2025_internship_report": ["Pharmacometrics & PBPK"],
    "Eissazadeh2025_endoglin": ["Systems Medicine & AI"],
    "Koenig2025_combine2024_abstract_digital.twin": ["Digital Twins", "Open & FAIR Science"],
    "Koenig2025_combine2024_abstract_tools": ["Open & FAIR Science"],
    "Kulanoglu2025_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Raman2024_frog": ["Open & FAIR Science"],
    "Kuettner2024_master.thesis": ["Digital Pathology"],
    "Eissazadeh2024_eas2024_abstract_endoglin": ["Systems Medicine & AI"],
    "Golebiewski2024_standards": ["Open & FAIR Science"],
    "Albadry2024_species.comparison": ["Digital Pathology"],
    "Palwankar2024_master.thesis": ["Pharmacometrics & PBPK"],
    "Hossain2024_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Hoepfl2024_baymodts": ["Systems Medicine & AI", "Open & FAIR Science"],
    "Smith2024_sed.ml.l1v5": ["Open & FAIR Science"],
    "Gerhaeusser2024_spt.model": ["Digital Twins", "Digital Pathology"],
    "Lambers2024_fat.zonation": ["Digital Pathology", "Digital Twins"],
    "Tautenhahn2024_simliva": ["Digital Twins", "Systems Medicine & AI"],
    "Okibedi2024_internship_report": ["Pharmacometrics & PBPK"],
    "Kohrs2023_open.science": ["Open & FAIR Science"],
    "StemmerMallol2023_talinolol": ["Pharmacometrics & PBPK"],
    "Maheshvare2023_pancreas": ["Systems Medicine & AI"],
    "Mallol2023_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Kuettner2023_chlorzoxazone": ["Pharmacometrics & PBPK"],
    "Koenig2023_standards": ["Open & FAIR Science"],
    "Anton2023_standard.gem": ["Open & FAIR Science"],
    "Bartsch2023_simvastatin": ["Pharmacometrics & PBPK"],
    "Grzegorzewski2023_phd.thesis": ["Pharmacometrics & PBPK", "Open & FAIR Science"],
    "Welsh2023_libroadrunner.2.0": ["Open & FAIR Science"],
    "Albadry2022_cyp450.steatosis": ["Digital Pathology"],
    "Grzegorzewski2022_dextromethorphan": ["Pharmacometrics & PBPK"],
    "Ramachandran2022_covid19.models": ["Open & FAIR Science"],
    "Shaikh2022_biosimulators": ["Open & FAIR Science"],
    "Pujol2022_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Koenig2022_dfba": ["Open & FAIR Science"],
    "Grzegorzewski2022_caffeine.meta": ["Pharmacometrics & PBPK"],
    "Koeller2021_icg.hepatectomy": ["Pharmacometrics & PBPK", "Systems Medicine & AI"],
    "Koeller2021_icg.variability": ["Pharmacometrics & PBPK"],
    "Christ2021_review": ["Digital Twins", "Systems Medicine & AI"],
    "Schreiber2021_synthetic.biology": ["Open & FAIR Science"],
    "Balci2021_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Yamada2021_sbmlwebapp": ["Open & FAIR Science"],
    "Smith2021_sed.ml.l1v4": ["Open & FAIR Science"],
    "Panchiwala2021_sbscl": ["Open & FAIR Science"],
    "Koenig2021_ten.simple.rules": ["Open & FAIR Science"],
    "Gennari2021_omex.spec.1.2": ["Open & FAIR Science"],
    "Shaikh2021_sed.ml.validator": ["Open & FAIR Science"],
    "Koeller2021_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Ricken2020_gacm.report": ["Digital Twins"],
    "Bartsch2020_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Duport2020_bachelor.thesis": ["Pharmacometrics & PBPK"],
    "Grzegorzewski2020_pkdb": ["Pharmacometrics & PBPK", "Open & FAIR Science"],
    "Keating2020_sbml": ["Open & FAIR Science"],
    "Neal2020_omex": ["Open & FAIR Science"],
    "Schreiber2020_synthetic.biology": ["Open & FAIR Science"],
    "Waltemath2020_combine2019": ["Open & FAIR Science"],
    "Smith2020_sbml.distrib": ["Open & FAIR Science"],
    "Lieven2020_memote": ["Open & FAIR Science"],
    "Koenig2020_exsimo": ["Digital Twins"],
    "Lambers2019_mor": ["Digital Twins"],
    "Schreiber2019_combine.editorial": ["Open & FAIR Science"],
    "Hucka2019_sbml.l3v2.core": ["Open & FAIR Science"],
    "Choi2018_tellurium": ["Open & FAIR Science"],
    "Berndt2018_hepatokin": ["Systems Medicine & AI"],
    "Bergmann2018_sedml": ["Open & FAIR Science"],
    "Neal2018_annotations": ["Open & FAIR Science"],
    "Medley2018_tellurium": ["Open & FAIR Science"],
    "Christ2017_surgery": ["Systems Medicine & AI", "Digital Twins"],
    "Koenig2016_models2clinics": ["Open & FAIR Science", "Systems Medicine & AI"],
    "Koenig2016_cy3sabiork": ["Open & FAIR Science"],
    "Wholecell2016_community.standards": ["Open & FAIR Science"],
    "Abshagen2015_cholestasis": ["Systems Medicine & AI"],
    "Werner2015_growth.perfusion": ["Digital Twins"],
    "Somogyi2015_libroadrunner": ["Open & FAIR Science"],
    "Ricken2014_livertissue": ["Digital Twins"],
    "Koenig2014_systembiologie": ["Systems Medicine & AI"],
    "Koenig2013_cancertissue": ["Digital Pathology", "Systems Medicine & AI"],
    "Koenig2012b_glucosemodelt2dm": ["Systems Medicine & AI"],
    "Koenig2012_cysbml": ["Open & FAIR Science"],
    "Koenig2012a_glucosemodel": ["Systems Medicine & AI"],
    "Herling2011_cancerglucosereview": ["Systems Medicine & AI"],
    "Koenig2011_fluxviz": ["Open & FAIR Science"],
    "Gille2010_hepatonet1": ["Systems Medicine & AI"],
}


def read_publications(yaml_file: Path) -> pd.DataFrame:
    """Read publication in pandas DataFrame"""
    with open(yaml_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    df = pd.DataFrame(data)

    console.print(df.columns)

    df = df[
        [
            "id",
            "title",
            "authors",
            "journal",
            "doi",
            "year",
            "pmid",
            "status",  # thesis, report, preprint, publication, review, proceeding, chapter
            "impact",  # int
            "position",  # first, first_equal, index, last_equal, last
            "pdf",
            "repository",
        ]
    ]
    print(df.status.unique())
    print(df.position.unique())
    print(df.year.unique())

    print(df.head())
    # print(df.to_string(index=False))
    return df


def create_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Create information for the evaluation matrix."""
    data = []

    rdf = df.iloc[::-1]

    console.rule("Article types", align="left", style="white")
    for article_type in df.status.unique():
        count = len(df[df.status == article_type])
        console.print(f"{article_type:<15}{count:>3}")

    for _, row in rdf.iterrows():
        if row.status != "publication":
            continue

        # FIXME: cleanup Journal
        # FIXME: cleanup Authors

        impact = row.impact
        data.append(
            {
                "authors": row["authors"],
                "journal": row["journal"],
                "year": row["year"],
                "impact": impact,
                "high": impact > 15,
                "middle": 5 <= impact < 15,
                "low": impact < 5,
                "first": bool(
                    row["position"] == "first" or row["position"] == "first_equal"
                ),
                "index": (row["position"] == "index"),
                "last": bool(
                    row["position"] == "last" or row["position"] == "last_equal"
                ),
            }
        )

    df_matrix = pd.DataFrame(data)

    console.rule("Publication by impact", align="left", style="white")
    for impact_class in ["high", "middle", "low"]:
        count = len(df_matrix[df_matrix[impact_class] == True])
        console.print(f"{impact_class:<15}{count:>3}")
    for author_class in ["first", "index", "last"]:
        count = len(df_matrix[df_matrix[author_class] == True])
        console.print(f"{author_class:<15}{count:>3}")
    return df_matrix


def create_list_of_publications_typst(
    typst_path: Path,
    df: pd.DataFrame,
    highlights: set | None = None,
    selected: set | None = None,
) -> None:
    """Create list of publications in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", '#highlight(fill: rgb("#e8e8e8"))[')
        authors = authors.replace("</b>", "]")
        impact = e.impact if (e.impact and not np.isnan(e.impact)) else None
        doi = f', #link("https://doi.org/{e.doi}")[{e.doi}]' if e.doi else ""
        impact = f", IF: *{impact}*" if impact else ""
        pdf = (
            f'#link("https://livermetabolism.com/assets/pdf/{e.pdf}")[#fa-icon("file-pdf")]'
            if e.pdf
            else ""
        )
        repository = (
            f'#link("{e.repository}")[#fa-icon("git-alt")]' if e.repository else ""
        )
        position = e.position  # first, first_equal, index, last_equal, last
        if position == "index":
            position_str = ""
        else:
            tokens = position.split("_")
            position_str = (
                f", #underline[{' '.join([t for t in tokens]).title()} author]"
            )
        text = f"{pdf}{repository} *{e.title.strip('.')}*. {authors}; {e.journal}{doi}{impact}{position_str}"
        if highlights and e.id in highlights:
            text = f"#publication_highlight[{text}]"
        return text

    if not selected:
        typst_all = "= List of Publications\n"

        # k_article = 0
        # for key, row in df.iterrows():
        #     if row.status not in {"publication", "review", "proceeding"}:
        #         continue
        #     k_article += 1
        #     text = f"{k_article}. " + create_entry_typst(e=row) + "\n"
        #     console.print(f"<{text}>")
        #     typst_all += text
        #     console.rule(style="white")

        categories = {
            "Publications": [
                "publication",
            ],
            "Reviews": [
                "review",
            ],
            "Proceedings": [
                "proceeding",
            ],
            "Preprints": [
                "preprint",
            ],
            "Thesis": [
                "thesis",
            ],
        }
        # categories = {
        #     "Original papers": ["publication", ],
        #     "Reviews": ["review", ],
        #     "Other Publications": ["proceeding", "preprint", "thesis"],
        # }

        for category, status_values in categories.items():
            typst_all += (
                f"\n== {category.title()}{'s' if not category.endswith('s') else ''}\n"
            )
            for status in status_values:
                k_article = 0
                if category == "Reviews":
                    # offset by publications
                    k_article = 0 + (df["status"] == "publication").sum()
                elif category == "Proceedings":
                    # offset by publications and reviews
                    k_article = (
                        0
                        + (df["status"] == "publication").sum()
                        + (df["status"] == "review").sum()
                    )

                df_status = df[df["status"] == status]
                if len(status_values) > 1:
                    title = status if status != "thesis" else "theses"
                    typst_all += f"\n=== {title.title()}{'s' if not title.endswith('s') else ''}\n"
                for key, row in df_status.iterrows():
                    k_article += 1
                    text = f"{k_article}. " + create_entry_typst(e=row) + "\n"
                    console.print(f"<{text}>")
                    typst_all += text
                    console.rule(style="white")

    if selected:
        console.print(selected)

        typst_all = ""
        k_article = 0

        for key, row in df.iterrows():
            if selected and (row.id not in selected):
                continue
            k_article += 1
            text = f"{k_article}. " + create_entry_typst(e=row) + "\n"
            console.print(f"<{text}>")
            typst_all += text
            console.rule(style="white")

    with open(typst_path, "w") as f_typst:
        f_typst.write(typst_all)


def write_publication_tags(
    df: pd.DataFrame, tags: dict[str, list[str]], yaml_path: Path
) -> None:
    """Write PUBLICATION_TAGS as a Jekyll data file keyed by publication id.

    Consumed by app/publications.html to render tag badges and the tag
    filter. Warns about ids in `tags` that no longer exist in `df`, and
    about publications without any tags.
    """
    known_ids = set(df["id"])
    unknown = sorted(set(tags) - known_ids)
    if unknown:
        console.print(f"[red]Unknown publication ids in PUBLICATION_TAGS: {unknown}")

    untagged = sorted(known_ids - set(tags))
    if untagged:
        console.print(f"[yellow]Publications without tags: {untagged}")

    entries = [{"id": pub_id, "tags": tags[pub_id]} for pub_id in sorted(tags)]
    with open(yaml_path, "w", encoding="utf-8") as f_yaml:
        yaml.safe_dump(entries, f_yaml, sort_keys=False, allow_unicode=True)
    console.print(f"Wrote {len(entries)} publication tag entries to {yaml_path}")


def create_list_of_pubmeds(df: pd.DataFrame) -> list[str]:
    import numpy as np

    pmids: list[str] = []
    for key, row in df.iterrows():
        # print(row)

        if not np.isnan(row.pmid):
            pmids.append(int(row.pmid))
    return pmids


def create_list_of_dois(df: pd.DataFrame, no_pmid: bool = True) -> list[str]:
    import numpy as np

    dois: list[str] = []
    for key, row in df.iterrows():
        # print(row)

        if row.doi:
            if no_pmid:
                if np.isnan(row.pmid):
                    dois.append(row.doi)
            else:
                dois.append(row.doi)
    return dois


if __name__ == "__main__":
    results_dir: Path = Path(__file__).parent / "results"
    yaml_file: Path = (
        Path(__file__).parent.parent / "app" / "_data" / "publications.yml"
    )
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv(results_dir / "publication_matrix.tsv", index=True, sep="\t")

    publication_tags_yaml: Path = (
        Path(__file__).parent.parent / "app" / "_data" / "publication_tags.yml"
    )
    write_publication_tags(df=df, tags=PUBLICATION_TAGS, yaml_path=publication_tags_yaml)

    # markdown_file: Path = Path(results_dir / "publications.md")
    # create_list_of_publications_md(md_path=markdown_file, df=df)

    highlights = {
        # "Grzegorzewski2020_pkdb",
        # "Berndt2018_hepatokin",
        # # "Koenig2012a_glucosemodel",
        # "Koeller2021_icg.hepatectomy",
        # "Grzegorzewski2022_caffeine.meta",
        # "Albadry2024_species.comparison",
    }
    # create_list_of_publications_typst(Path("publications.typ"), df=df, highlights=highlights)

    # list of selected publications
    selected = {
        "Nemitz2026_dapagliflozin",
        "Tensil2026_losartan",
        # "Elias2025_glimepiride.physiome",
        "Elias2025_glimepiride",
        "Albadry2024_species.comparison",
        # "Smith2024_sed.ml.l1v5",
        "Maheshvare2023_pancreas",
        "Grzegorzewski2022_caffeine.meta",
        "Grzegorzewski2020_pkdb",
        "Grzegorzewski2022_dextromethorphan",
        "Koeller2021_icg.hepatectomy",
        # "Koeller2021_icg.variability",
        # "Koenig2012a_glucosemodel",
        # "Keating2020_sbml",
        "Berndt2018_hepatokin",
        # "Koenig2023_standards",
        # "Neal2020_omex",
        # "Neal2018_annotations",
        # "Kohrs2023_open.science",
        # "Gille2010_hepatonet1",
        # "Gerhaeusser2024_spt.model",
        # "StemmerMallol2023_talinolol",
        # "Kuettner2023_chlorzoxazone",
        # "Bartsch2023_simvastatin",
    }
    create_list_of_publications_typst(
        Path(results_dir / "publications.typ"),
        df=df,
        # selected=selected,
        # highlights=selected,
    )
    create_list_of_publications_typst(
        Path(results_dir / "publications_selected.typ"),
        df=df,
        selected=selected,
        # highlights=selected,
    )

    pubmeds = create_list_of_pubmeds(df=df)
    print(pubmeds)
    dois = create_list_of_dois(df=df)
    for doi in dois:
        print(doi)

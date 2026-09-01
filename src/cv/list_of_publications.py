"""Script for creating list of publications."""

from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from rich.console import Console

from src.cv.list_of_software import is_missing

console = Console()

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
        doi = (
            f', #link("https://doi.org/{e.doi}")[{e.doi}]'
            if not is_missing(e.doi)
            else ""
        )
        impact = f", IF: *{impact}*" if impact else ""
        pdf = (
            f'#link("https://livermetabolism.com/assets/pdf/{e.pdf}")[#fa-icon("file-pdf")]'
            if not is_missing(e.pdf)
            else ""
        )
        repository = (
            f'#link("{e.repository}")[#fa-icon("git-alt")]' if not is_missing(e.repository) else ""
        )
        position = e.position  # first, first_equal, index, last_equal, last
        if position == "index":
            position_str = ""
        elif e.status == "thesis" and position in ("last", "last_equal"):
            position_str = ", #underline[Supervisor]"
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
            "Theses": [
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

        if not is_missing(row.doi):
            if no_pmid:
                if np.isnan(row.pmid):
                    dois.append(row.doi)
            else:
                dois.append(row.doi)
    return dois


if __name__ == "__main__":
    results_dir: Path = Path(__file__).parent / "results"
    yaml_file: Path = (
        Path(__file__).parent.parent.parent / "app" / "_data" / "publications.yml"
    )
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv(results_dir / "publication_matrix.tsv", index=True, sep="\t")

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
        "Bafna2026_segmentation",
        "Nemitz2026_dapagliflozin",
        # "Tensil2026_losartan",
        # "Elias2025_glimepiride.physiome",
        "Elias2025_glimepiride",
        "Albadry2024_species.comparison",
        # "Smith2024_sed.ml.l1v5",
        "Maheshvare2023_pancreas",
        # "Grzegorzewski2022_caffeine.meta",
        "Grzegorzewski2022_dextromethorphan",
        "Grzegorzewski2020_pkdb",
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
        "Koenig2012a_glucosemodel"
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

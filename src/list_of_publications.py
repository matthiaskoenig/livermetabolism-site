"""Script for creating list of publications."""
from typing import Optional, List

import yaml
from pathlib import Path
import pandas as pd
from rich.markdown import Markdown
from rich.console import Console
console = Console()

def read_publications(yaml_file: Path) -> pd.DataFrame:
    """Read publication in pandas DataFrame"""
    with open(yaml_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    df = pd.DataFrame(data)

    console.print(df.columns)

    df = df[[
        "id",
        "title",
        "authors",
        "journal",
        "doi",
        "year",
        "pmid",
        "status",  # thesis, report, preprint, publication, review, proceeding, chapter
        "impact", # int
        "position", # first, first_equal, index, last_equal, last
        "pdf",
        "repository"
    ]]
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

    articles_if_low = 0
    articles_if_middle = 0
    articles_if_high = 0
    articles_first = 0
    articles_last = 0

    for _, row in rdf.iterrows():
        if not row.status == "publication":
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
                "first": True if (row["position"] == "first" or row["position"] == "first_equal") else False,
                "index": True if (row["position"] == "index") else False,
                "last": True if (row["position"] == "last" or row["position"] == "last_equal") else False,
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


def create_list_of_publications_md(md_path: Path, df: pd.DataFrame) -> None:
    """Create list of publications in markdown."""

    def create_entry_markdown(e: pd.Series) -> str:
        """Creates markdown for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", "**")
        authors = authors.replace("</b>", "**")
        doi = f", [https://doi.org/{e.doi}](https://doi.org/{e.doi})" if e.doi else ""
        impact = f", IF: **{e.impact}**" if e.impact else ""

        return f"**{e.title.strip(".")}**. {authors}; {e.journal}{doi}{impact}"


    md_all = "# List of Publications\n"
    for status in ["publication", "review", "proceeding", "preprint", "thesis"]:
        k_article = 0
        df_status = df[df["status"] == status]
        md_all += f"\n## {status.title()}s\n"
        for key, row in df_status.iterrows():
            k_article += 1
            md = f"{k_article}. " + create_entry_markdown(e=row) + "\n"
            console.print(f"<{md}>")
            md_all += md
            # console.print(Markdown(md))
            console.rule(style="white")

    with open(md_path, "w") as f_md:
        f_md.write(md_all)

def create_list_of_publications_typst(typst_path: Path, df: pd.DataFrame, highlights: Optional[set] = None, selected: Optional[set] = None) -> None:
    """Create list of publications in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", "*")
        authors = authors.replace("</b>", "*")
        doi = f', #link("https://doi.org/{e.doi}")[{e.doi}]' if e.doi else ""
        impact = f", IF: *{e.impact}*" if e.impact else ""
        pdf = f'#link("https://livermetabolism.com/paper/{e.pdf}")[#fa-icon("file-pdf")]' if e.pdf else ""
        repository = f'#link("{e.repository}")[#fa-icon("git-alt")]' if e.repository else ""
        position = e.position # first, first_equal, index, last_equal, last
        if position == "index":
            position_str = ""
        else:
            tokens = position.split("_")
            position_str = f", #underline[{" ".join([t.title() for t in tokens])} Author]"
        text = f"{pdf}{repository} *{e.title.strip(".")}*. {authors}; {e.journal}{doi}{impact}{position_str}"
        if highlights and e.id in highlights:
            text = f'#publication_highlight[{text}]'
        return text


    if not selected:
        typst_all = "= List of Publications\n"
        for status in ["publication", "review", "proceeding", "preprint", "thesis"]:
            k_article = 0
            df_status = df[df["status"] == status]
            typst_all += f"\n== {status.title()}{'s' if not status.endswith('s') else ''}\n"
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


def create_list_of_pubmeds(df: pd.DataFrame) -> List[str]:
    import numpy as np
    pmids: List[str] = []
    for key, row in df.iterrows():
        print(row)

        if not np.isnan(row.pmid):
            pmids.append(int(row.pmid))
    return pmids

if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "publications.yml"
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv("results/publication_matrix.tsv", index=True, sep="\t")

    markdown_file: Path = Path("results/publications.md")
    create_list_of_publications_md(md_path=markdown_file, df=df)

    highlights = {
        # "PKDB_Grzegorzewski2020",
        # "hepatokin_Berndt2018",
        # # "GlucoseModel_Koenig2012a",
        # "ICG_model_hepatectomy_Koeller2021",
        # "Caffeine_meta_Grzegorzewski2021",
        # "Albadry2024_species_comparison",
    }
    # create_list_of_publications_typst(Path("publications.typ"), df=df, highlights=highlights)

    # List of selected publications
    selected = {
        "PKDB_Grzegorzewski2020",
        "Caffeine_meta_Grzegorzewski2021",
        "Albadry2024_species_comparison",
        "Grzegorzewski2022_dextromethorphan",
        # "Maheshvare2023_pancreas",
        "ICG_model_hepatectomy_Koeller2021",
        # "Koeller2021_icg_variability",
        "GlucoseModel_Koenig2012a",
        # "SBML_Keating2020",
        # "hepatokin_Berndt2018",
        # "Koenig2023_standards",
        # "SED-ML_L1V5",
        # "OMEX_Koenig2020",
        # "annotations_Neal2018",
        # "Kohrs2023_reproducible.research.open.science",
        # "HepatoNet1_Gille2010",
        # "Gerhaeusser2024_spt_model",
        # "StemmerMallol2023_talinolol",
        # "Kuettner2023_chlorzoxazone",
        # "Bartsch2023_simvastatin",
    }
    create_list_of_publications_typst(
        Path("results/publications_highlights.typ"),
        df=df,
        # selected=selected,
        highlights=selected,
    )


    pubmeds = create_list_of_pubmeds(df=df)
    print(pubmeds)
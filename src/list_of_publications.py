"""Script for creating list of publications."""
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
        "status",  # thesis, report, preprint, publication, review, proceeding, chapter
        "impact", # int
        "position", # first, first_equal, index, last_equal, last
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


def create_list_of_publications(publications_file: Path, df: pd.DataFrame):
    """Create list of publications.

    Creates different sections:
    # List of publications
    ## Publications (44)
    ## Reviews (3)
    ## Proceedings & Book Chapters
    ## Preprints
    """
    def create_entry_markdown(e: pd.Series):
        """Creates markdown for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", "**")
        authors = authors.replace("</b>", "**")
        doi = f", [https://doi.org/{e.doi}](https://doi.org/{e.doi})" if e.doi else ""
        impact = f", IF: **{e.impact}**" if e.impact else ""
        md = f"**{e.title.strip(".")}**. {authors}; {e.journal}{doi}{impact}"

        return md

    md_all = "# List of Publications\n"
    for status in ["publication", "review", "proceeding", "preprint"]:
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

    with open(publications_file, "w") as f_md:
        f_md.write(md_all)


if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "publications.yml"
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv("publication_matrix.tsv", index=True, sep="\t")

    publications_file: Path = "publications.md"
    create_list_of_publications(publications_file=publications_file, df=df)

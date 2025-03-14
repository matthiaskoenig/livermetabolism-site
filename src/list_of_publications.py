"""Script for creating list of publications."""
import yaml
from pathlib import Path
import pandas as pd
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
            }
        )

    df_matrix = pd.DataFrame(data)

    console.rule("Publication by impact", align="left", style="white")
    for impact_class in ["high", "middle", "low"]:
        count = len(df_matrix[df_matrix[impact_class] == True])
        console.print(f"{impact_class:<15}{count:>3}")


def create_list_of_publications(publications_file: Path, df: pd.DataFrame):
    """Create list of publications.

    Creates different sections:
    # List of publications
    ## Publications
    ## Reviews
    ## Proceedings & Book Chapters
    ## Preprints
    """
    def create_entry_markdown(row: pd.Series):
        """Creates markdown for a single entry."""




if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "publications.yml"
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv("publication_matrix.tsv", index=True, sep="\t")

    publications_file: Path = "publications.md"
    create_list_of_publications(publications_file=publications_file, df=df)

"""Script for creating list of publications."""
import yaml
from pathlib import Path
import pandas as pd
from rich import print

def read_publications(yaml_file: Path) -> pd.DataFrame:
    """Read publication in pandas DataFrame"""
    with open(yaml_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    df = pd.DataFrame(data)

    print(df.columns)

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
    data = []

    rdf = df.iloc[::-1]
    for _, row in rdf.iterrows():
        if not row.status == "publication":
            continue
        data.append(
            {
                "authors": row["authors"],
                "journal": row["journal"],
                "year": row["year"],
                "if": row["impact"]
            }
        )
    return pd.DataFrame(data)



if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "publications.yml"
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv("publication_matrix.tsv", index=True, sep="\t")

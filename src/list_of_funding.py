"""Script for creating list of fundings."""

import yaml
from pathlib import Path
import pandas as pd
from rich.console import Console
console = Console()

def read_funding(yaml_file: Path) -> pd.DataFrame:
    """Read funding in pandas DataFrame"""
    with open(yaml_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    df = pd.DataFrame(data)
    # console.print(df.columns)
    df = df[[
        "id",
        "funder_short",
        "funder",
        "funder_link",
        "funder_logo",
        "grant",
        "start",
        "end",
        "title",
        "role",
        "amount",
        "currency",
        "project",
        "repository",
        "description",
    ]]

    print(df.head())
    # print(df.to_string(index=False))
    return df


def create_list_of_funding_typst(typst_path: Path, df: pd.DataFrame) -> None:
    """Create list of funding in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        title = e.title[-1] if e.title.endswith(".") else e.title
        funder = f'#link("{e.funder_link}")[{e.funder_short}]' if e.funder_link else e.funder_short
        year_start = e.start.replace("-", "/") # e.start.split("-")[-1]  # get year
        year_end = e.end.split("-")[-1]  # get year
        money = f", {str(e.amount)[:-3]}.{str(e.amount)[-3:]}{e.currency}" if e.amount != 0 else ""

        text = f'#fa-icon("diagram-project") {year_start} -- {year_end}, {funder}{money}, \t*{title}.* {e.description}'
        return text


    typst_all = "= List of Funding\n"
    k = 0
    for key, row in df.iterrows():
        k += 1
        text = f"{k}. " + create_entry_typst(e=row) + "\n"
        console.print(f"<{text}>")
        typst_all += text
        console.rule(style="white")

    with open(typst_path, "w") as f_typst:
        f_typst.write(typst_all)


if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "funding.yml"
    df: pd.DataFrame = read_funding(yaml_file=yaml_file)
    create_list_of_funding_typst(
        typst_path=Path("results/funding.typ"), df=df
    )
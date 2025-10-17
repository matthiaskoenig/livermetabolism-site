"""Script for creating list of fundings."""

import yaml
from pathlib import Path
import pandas as pd
from rich.console import Console

from src.list_of_software import read_data

console = Console()


def create_list_of_funding_typst(typst_path: Path, df: pd.DataFrame) -> None:
    """Create list of funding in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        title = e.title[-1] if e.title.endswith(".") else e.title
        funder = f'#link("{e.funder_link}")[{e.funder_short}]' if e.funder_link else e.funder_short
        year_start = e.start.replace("-", "/") # e.start.split("-")[-1]  # get year
        year_end = e.end.split("-")[-1]  # get year
        total_money = f", total: {str(e.amount)[:-3]}.{str(e.amount)[-3:]}{e.currency}" if e.amount != 0 else ""
        personal_money = f", {str(e.personal_amount)[:-3]}.{str(e.personal_amount)[-3:]}{e.currency}" if e.personal_amount != 0 else ""
        if e.amount == e.personal_amount:
            total_money = ""

        text = f'#fa-icon("money-bill") {year_start} -- {year_end}, {e.role}, {funder}{personal_money}{total_money}, \t*{title}.* {e.description}'
        return text


    typst_all = "= Funding\n"
    k = 0
    for key, row in df.iterrows():
        k += 1
        # text = f"{k}. " + create_entry_typst(e=row) + "\n"
        text = f"- " + create_entry_typst(e=row) + "\n"
        console.print(f"<{text}>")
        typst_all += text
        console.rule(style="white")

    with open(typst_path, "w") as f_typst:
        f_typst.write(typst_all)


def cumulative_funding(df: pd.DataFrame):
    return df.amount.sum()



if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "funding.yml"
    df: pd.DataFrame = read_data(yaml_file=yaml_file)
    create_list_of_funding_typst(
        typst_path=Path("results/funding.typ"), df=df
    )

    amount = cumulative_funding(df)
    console.print(f"{amount} €")
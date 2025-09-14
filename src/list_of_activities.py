"""Script for creating list of activities."""
from typing import Optional

import yaml
from pathlib import Path
import pandas as pd
from rich.console import Console

from src.list_of_software import read_data

console = Console()


def create_list_of_activity_typst(typst_path: Path, df: pd.DataFrame, highlights: Optional[set] = None,
                                  selected: Optional[set] = None, k_start: int = 0) -> None:
    """Create list of activities in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        text = f'#link("{e.link}")[#fa-icon("square-arrow-up-right")] {e.year}: *{e.title}* - {e.description}'
        return text


    # create entries
    typst_all = ""
    k = k_start
    for key, row in df.iterrows():
        if selected and (row.id not in selected):
            continue
        k += 1
        # text = f"{k}. " + create_entry_typst(e=row) + "\n"
        text = f"- " + create_entry_typst(e=row) + "\n"
        console.print(f"<{text}>")
        typst_all += text
        console.rule(style="white")

    with open(typst_path, "w") as f_typst:
        f_typst.write(typst_all)


if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "activities.yml"
    df: pd.DataFrame = read_data(yaml_file=yaml_file)

    selected = {

    }

    create_list_of_activity_typst(
        typst_path=Path("results/activities.typ"), df=df, k_start=0,
        selected=None,
    )
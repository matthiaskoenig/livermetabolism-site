"""Script for creating list of posters."""
from typing import Optional

from pathlib import Path
import pandas as pd
from rich.console import Console
console = Console()

from list_of_software import read_data


def create_list_of_poster_typst(typst_path: Path, df: pd.DataFrame,
                                  selected: Optional[set] = None, k_start: int = 0) -> None:
    """Create list of posters in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", "*")
        authors = authors.replace("</b>", "*")
        authors = authors.replace("<sup>", "#super[")
        authors = authors.replace("</sup>", "]")
        affiliations = e.affiliations
        affiliations = affiliations.replace("<sup>", "#super[")
        affiliations = affiliations.replace("</sup>", "]")
        pdf = f'#link("https://livermetabolism.com/paper/{e.pdf}")[#fa-icon("file-pdf")]' if e.pdf else ""

        text = f"{pdf} *{e.title.strip(".")}*. \ {authors};  \ _{affiliations}_ \ {e.meeting}; {e.date}"
        return text

    # create entries
    typst_all = """#import "@preview/fontawesome:0.6.0": *
#import "conf.typ": conf
#show: doc => conf(
  doc,
)
"""
    k = k_start
    for key, row in df.iterrows():
        if selected and (row.id not in selected):
            continue
        k += 1
        text = f"{k}. " + create_entry_typst(e=row) + "\n"
        console.print(f"<{text}>")
        typst_all += text
        console.rule(style="white")

    with open(typst_path, "w") as f_typst:
        f_typst.write(typst_all)


if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "posters.yml"
    df: pd.DataFrame = read_data(yaml_file=yaml_file)

    create_list_of_poster_typst(
        typst_path=Path("results/posters.typ"), df=df,
    )
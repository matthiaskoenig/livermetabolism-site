"""Script for creating list of talks."""
from typing import Optional

from pathlib import Path
import pandas as pd
from rich.console import Console
console = Console()

from list_of_software import read_data


def create_list_of_talk_typst(typst_path: Path, df: pd.DataFrame,
                                  selected: Optional[set] = None, k_start: int = 0) -> None:
    """Create list of talks in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", "*")
        authors = authors.replace("</b>", "*")
        authors = authors.replace("<sup>", "#super[")
        authors = authors.replace("</sup>", "]")
        tokens = e.type.split("_")
        presentation_type = f", #underline[{' '.join([t.title() for t in tokens])}]" if e.type else ""

        video = f'#link("{e.video}")[#fa-icon("file-video")]' if e.video else ""
        slides = f'#link("{e.slides}")[#fa-icon("file-powerpoint")]' if e.slides else ""

        text = f"{video}{slides} *{e.title.strip(".")}*. {authors}; _{e.event}_, {e.date}{presentation_type}"
        return text

    # create entries
    typst_all = """#import "@preview/fontawesome:0.6.0": *
#import "conf.typ": conf
#show: doc => conf(
  doc,
)

== Selected Presentations
"""
    k = k_start
    for key, row in df.iterrows():
        if selected and (row.id not in selected):
            continue
        k += 1
        typst_all += f"{k}. " + create_entry_typst(e=row) + "\n"

    with open(typst_path, "w") as f_typst:
        f_typst.write(typst_all)


if __name__ == "__main__":
    yaml_file: Path = Path(__file__).parent.parent / "app" / "_data" / "talks.yml"
    df: pd.DataFrame = read_data(yaml_file=yaml_file)

    create_list_of_talk_typst(
        typst_path=Path("results/presentations.typ"), df=df,
    )
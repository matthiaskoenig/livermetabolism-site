"""Script for creating list of software."""
from typing import Optional

import numpy as np
import yaml
from pathlib import Path
import pandas as pd
from rich.console import Console
console = Console()

def read_data(yaml_file: Path) -> pd.DataFrame:
    """Read funding in pandas DataFrame"""
    with open(yaml_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    return pd.DataFrame(data)


def is_missing(v) -> bool:
    """True if an optional yaml field is absent.

    An empty/omitted yaml scalar (e.g. `doi:`) comes back from
    `pd.DataFrame(...)` as float `nan`, which is truthy in Python -- so
    `if e.field` alone lets missing values through and renders as the
    literal string "nan" in the generated Typst.
    """
    return v is None or (isinstance(v, float) and np.isnan(v))


def create_list_of_software_typst(typst_path: Path, df: pd.DataFrame, highlights: Optional[set] = None,
                                  selected: Optional[set] = None, k_start: int = 0) -> None:
    """Create list of software in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        if e.type == "software":
            icon = "gear"
        elif e.type == "database":
            icon = "database"
        doi = f' #link("https://doi.org/{e.doi}")[doi:{e.doi}]' if not is_missing(e.doi) else " "
        repository = f'#link("{e.repository}")[#fa-icon("git-alt")]' if not is_missing(e.repository) else ""
        text = f'#fa-icon("{icon}") {repository} {e.type.title()} *{e["name"]} - {e.title.strip(".")}*.{doi} {e.description}'
        return text


    # create entries
    typst_all = ""
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
    yaml_file: Path = Path(__file__).parent.parent.parent / "app" / "_data" / "software.yml"
    df: pd.DataFrame = read_data(yaml_file=yaml_file)

    selected = {
        'pkdb',
        'sbml4humans',
        'sbmlutils',
        'sbmlsim',
        'cysbml',
        'roadrunner',
        'libsbgnpy',
        'brendapy',
        'cobrapy',
        'tellurium',
    }

    create_list_of_software_typst(
        typst_path=Path(__file__).parent / "results/software.typ", df=df, k_start=0,
        selected=selected,
    )
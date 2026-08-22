"""Script for creating list of publications."""

from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from rich.console import Console

console = Console()

# The five core research areas of the group (see app/index.html core-messages).
CORE_TAGS = [
    "Digital Twins",
    "Digital Pathology",
    "Pharmacometrics & PBPK",
    "Systems Medicine & AI",
    "Open & FAIR Science",
]

# Mapping of publication id (see app/_data/publications.yml) to a list of
# CORE_TAGS. This is the single source of truth for publication tags; run
# this script to (re-)generate app/_data/publication_tags.yml consumed by
# the Jekyll site.
PUBLICATION_TAGS: dict[str, list[str]] = {
    "Olivier2026_fbc-v3": ["Open & FAIR Science"],
    "Pathirana2026_petab-v2": ["Open & FAIR Science"],
    "Sego2026_EFECT": ["Open & FAIR Science"],
    "Schwaiger2026_hctz_preprint": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Li2026_TabularQual_preprint": ["Open & FAIR Science"],
    "Elias2026_dapagliflozin_physiome": ["Pharmacometrics & PBPK", "Open & FAIR Science"],
    "Jesionek2026_rapamycin_preprint": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Myshkina2026_apixaban_preprint": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Bafna2026_segmentation": ["Digital Pathology"],
    "Master.Thesis.Antonio.Alvarez": ["Open & FAIR Science"],
    "Sauro2025_fair_to_cure_preprint": ["Open & FAIR Science"],
    "Alejandro2026_empagliflozin_preprint": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Corradi2026_llemy_preprint": ["Systems Medicine & AI"],
    "Nemitz2026_dapagliflozin": ["Pharmacometrics & PBPK"],
    "Tensil2026_losartan": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Myshkina2026_losartan_physiome": ["Digital Twins", "Open & FAIR Science"],
    "Tereshchuk2026_canagliflozin_preprint": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Elias2025_glimepiride": ["Digital Twins", "Pharmacometrics & PBPK"],
    "Elias2025_glimepiride_physiome": ["Digital Twins", "Open & FAIR Science"],
    "Myshkina2025_preprint": ["Digital Twins", "Systems Medicine & AI"],
    "Master.Thesis.Elisabetta.Casabianca": ["Pharmacometrics & PBPK"],
    "Cassabianca2025_preprint": ["Pharmacometrics & PBPK"],
    "Bachelor.Thesis.Ennie.Tensil": ["Pharmacometrics & PBPK"],
    "Bachelor.Thesis.Nike.Nemitz": ["Pharmacometrics & PBPK"],
    "Bachelor.Thesis.Michelle.Elias": ["Pharmacometrics & PBPK"],
    "Baum2025": ["Systems Medicine & AI"],
    "Balaur2025_preprint": ["Open & FAIR Science"],
    "Internship.Report.Abhinav.Mishra": ["Pharmacometrics & PBPK"],
    "Eissazadeh2025_endoglin": ["Systems Medicine & AI"],
    "COMBINE2024_digital_twin": ["Digital Twins", "Open & FAIR Science"],
    "COMBINE2024_tools": ["Open & FAIR Science"],
    "Bachelor.Thesis.Yusuf.Ali.Kolanoglu": ["Pharmacometrics & PBPK"],
    "Raman2024_FROG": ["Open & FAIR Science"],
    "Master.Thesis.Jonas.Kuettner": ["Digital Pathology"],
    "Eissazadeh2024_abstract": ["Systems Medicine & AI"],
    "Golebiewski2024_standards": ["Open & FAIR Science"],
    "Albadry2024_species_comparison": ["Digital Pathology"],
    "Master.Thesis.Shubhankar.Palwankar": ["Pharmacometrics & PBPK"],
    "Bachelor.Thesis.Afruja.Hossain": ["Pharmacometrics & PBPK"],
    "Hoepfl2024_BayModTS": ["Systems Medicine & AI", "Open & FAIR Science"],
    "SED-ML_L1V5": ["Open & FAIR Science"],
    "Gerhaeusser2024_spt_model": ["Digital Twins", "Digital Pathology"],
    "Lambers2024_fat_zonation": ["Digital Pathology", "Digital Twins"],
    "Tautenhahn2024_simliva": ["Digital Twins", "Systems Medicine & AI"],
    "Internship.Report.Frances.Okibedi": ["Pharmacometrics & PBPK"],
    "Kohrs2023_reproducible.research.open.science": ["Open & FAIR Science"],
    "StemmerMallol2023_talinolol": ["Pharmacometrics & PBPK"],
    "Maheshvare2023_pancreas": ["Systems Medicine & AI"],
    "Bachelor.Thesis.Beatrice.Stemmer.Mallol": ["Pharmacometrics & PBPK"],
    "Kuettner2023_chlorzoxazone": ["Pharmacometrics & PBPK"],
    "Koenig2023_standards": ["Open & FAIR Science"],
    "Anton2023_standard.GEM": ["Open & FAIR Science"],
    "Bartsch2023_simvastatin": ["Pharmacometrics & PBPK"],
    "PhD.Thesis.Jan.Grzegorzewski": ["Pharmacometrics & PBPK", "Open & FAIR Science"],
    "Welsh2022_libroadrunner_2.0": ["Open & FAIR Science"],
    "Albadry2022_Cytochrome.p450.enzymes.in.periportal.steatosis": ["Digital Pathology"],
    "Grzegorzewski2022_dextromethorphan": ["Pharmacometrics & PBPK"],
    "FAIR.sharing.of.reproducible.and.reusable.COVID-19.models_Ramachandran2022": ["Open & FAIR Science"],
    "Shaikh2022_biosimulators": ["Open & FAIR Science"],
    "Bachelor.Thesis.Helena.Leal.Pujol": ["Pharmacometrics & PBPK"],
    "Koenig2022_dfba": ["Open & FAIR Science"],
    "Caffeine_meta_Grzegorzewski2021": ["Pharmacometrics & PBPK"],
    "ICG_model_hepatectomy_Koeller2021": ["Pharmacometrics & PBPK", "Systems Medicine & AI"],
    "Koeller2021_icg_variability": ["Pharmacometrics & PBPK"],
    "Review_Qualiperf2021": ["Digital Twins", "Systems Medicine & AI"],
    "Standards.in.Systems.and.Synthetic.Biology_Schreiber2021": ["Open & FAIR Science"],
    "Bachelor.Thesis.Suekrue.Balci": ["Pharmacometrics & PBPK"],
    "SBMLWebApp_Yamada2021": ["Open & FAIR Science"],
    "Smith2021_sed-ml-L1V4": ["Open & FAIR Science"],
    "SBSCL_Panchiwala2021": ["Open & FAIR Science"],
    "Koenig2021_Ten_simple_rules": ["Open & FAIR Science"],
    "OMEX_Metadata_Spec.1.2_Gennari2021": ["Open & FAIR Science"],
    "SED-ML_validator_Shaikh2021": ["Open & FAIR Science"],
    "Bachelor.Thesis.Adrian.Koeller": ["Pharmacometrics & PBPK"],
    "GACM-Report_Qualiperf2020": ["Digital Twins"],
    "Bachelor.Thesis.Florian.Bartsch": ["Pharmacometrics & PBPK"],
    "Bachelor.Thesis.Yannick.Duport": ["Pharmacometrics & PBPK"],
    "PKDB_Grzegorzewski2020": ["Pharmacometrics & PBPK", "Open & FAIR Science"],
    "SBML_Keating2020": ["Open & FAIR Science"],
    "OMEX_Koenig2020": ["Open & FAIR Science"],
    "Standards_in_Systems_and_Synthetic_Biology_Schreiber2020": ["Open & FAIR Science"],
    "COMBINE2019_Waltemath2020": ["Open & FAIR Science"],
    "SBML_distrib_Smith2020": ["Open & FAIR Science"],
    "Memote_Lieven2020": ["Open & FAIR Science"],
    "EXSIMO_Koenig2020": ["Digital Twins"],
    "MOR_Lambers2019": ["Digital Twins"],
    "combine_editorial_2019": ["Open & FAIR Science"],
    "sbml-level-3-version-2-core_2019": ["Open & FAIR Science"],
    "tellurium_Choi2018": ["Open & FAIR Science"],
    "hepatokin_Berndt2018": ["Systems Medicine & AI"],
    "sedml_Bergmann2018": ["Open & FAIR Science"],
    "annotations_Neal2018": ["Open & FAIR Science"],
    "tellurium_Medley2018": ["Open & FAIR Science"],
    "surgery_Christ2017": ["Systems Medicine & AI", "Digital Twins"],
    "models2clinics_Koenig2016": ["Open & FAIR Science", "Systems Medicine & AI"],
    "cy3sabiork_Koenig2016": ["Open & FAIR Science"],
    "Wholecell2016": ["Open & FAIR Science"],
    "Abshagen2015": ["Systems Medicine & AI"],
    "Werner2015": ["Digital Twins"],
    "libRoadRunner_Somogyi2015": ["Open & FAIR Science"],
    "LiverTissue_Ricken2015": ["Digital Twins"],
    "systembiologie_Koenig2014": ["Systems Medicine & AI"],
    "CancerTissue_Koenig2013": ["Digital Pathology", "Systems Medicine & AI"],
    "GlucoseModelT2DM_Koenig2012b": ["Systems Medicine & AI"],
    "CySBML_Koenig2012": ["Open & FAIR Science"],
    "GlucoseModel_Koenig2012a": ["Systems Medicine & AI"],
    "CancerGlucoseReview_Herling2011": ["Systems Medicine & AI"],
    "FluxViz_Koenig2011": ["Open & FAIR Science"],
    "HepatoNet1_Gille2010": ["Systems Medicine & AI"],
}


def read_publications(yaml_file: Path) -> pd.DataFrame:
    """Read publication in pandas DataFrame"""
    with open(yaml_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    df = pd.DataFrame(data)

    console.print(df.columns)

    df = df[
        [
            "id",
            "title",
            "authors",
            "journal",
            "doi",
            "year",
            "pmid",
            "status",  # thesis, report, preprint, publication, review, proceeding, chapter
            "impact",  # int
            "position",  # first, first_equal, index, last_equal, last
            "pdf",
            "repository",
        ]
    ]
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

    for _, row in rdf.iterrows():
        if row.status != "publication":
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
                "first": bool(
                    row["position"] == "first" or row["position"] == "first_equal"
                ),
                "index": (row["position"] == "index"),
                "last": bool(
                    row["position"] == "last" or row["position"] == "last_equal"
                ),
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


def create_list_of_publications_typst(
    typst_path: Path,
    df: pd.DataFrame,
    highlights: set | None = None,
    selected: set | None = None,
) -> None:
    """Create list of publications in typst."""

    def create_entry_typst(e: pd.Series) -> str:
        """Creates typst for a single entry."""
        authors = e.authors
        authors = authors.replace("<b>", '#highlight(fill: rgb("#e8e8e8"))[')
        authors = authors.replace("</b>", "]")
        impact = e.impact if (e.impact and not np.isnan(e.impact)) else None
        doi = f', #link("https://doi.org/{e.doi}")[{e.doi}]' if e.doi else ""
        impact = f", IF: *{impact}*" if impact else ""
        pdf = (
            f'#link("https://livermetabolism.com/assets/paper/{e.pdf}")[#fa-icon("file-pdf")]'
            if e.pdf
            else ""
        )
        repository = (
            f'#link("{e.repository}")[#fa-icon("git-alt")]' if e.repository else ""
        )
        position = e.position  # first, first_equal, index, last_equal, last
        if position == "index":
            position_str = ""
        else:
            tokens = position.split("_")
            position_str = (
                f", #underline[{' '.join([t for t in tokens]).title()} author]"
            )
        text = f"{pdf}{repository} *{e.title.strip('.')}*. {authors}; {e.journal}{doi}{impact}{position_str}"
        if highlights and e.id in highlights:
            text = f"#publication_highlight[{text}]"
        return text

    if not selected:
        typst_all = "= List of Publications\n"

        # k_article = 0
        # for key, row in df.iterrows():
        #     if row.status not in {"publication", "review", "proceeding"}:
        #         continue
        #     k_article += 1
        #     text = f"{k_article}. " + create_entry_typst(e=row) + "\n"
        #     console.print(f"<{text}>")
        #     typst_all += text
        #     console.rule(style="white")

        categories = {
            "Publications": [
                "publication",
            ],
            "Reviews": [
                "review",
            ],
            "Proceedings": [
                "proceeding",
            ],
            "Preprints": [
                "preprint",
            ],
            "Thesis": [
                "thesis",
            ],
        }
        # categories = {
        #     "Original papers": ["publication", ],
        #     "Reviews": ["review", ],
        #     "Other Publications": ["proceeding", "preprint", "thesis"],
        # }

        for category, status_values in categories.items():
            typst_all += (
                f"\n== {category.title()}{'s' if not category.endswith('s') else ''}\n"
            )
            for status in status_values:
                k_article = 0
                if category == "Reviews":
                    # offset by publications
                    k_article = 0 + (df["status"] == "publication").sum()
                elif category == "Proceedings":
                    # offset by publications and reviews
                    k_article = (
                        0
                        + (df["status"] == "publication").sum()
                        + (df["status"] == "review").sum()
                    )

                df_status = df[df["status"] == status]
                if len(status_values) > 1:
                    title = status if status != "thesis" else "theses"
                    typst_all += f"\n=== {title.title()}{'s' if not title.endswith('s') else ''}\n"
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


def write_publication_tags(
    df: pd.DataFrame, tags: dict[str, list[str]], yaml_path: Path
) -> None:
    """Write PUBLICATION_TAGS as a Jekyll data file keyed by publication id.

    Consumed by app/publications.html to render tag badges and the tag
    filter. Warns about ids in `tags` that no longer exist in `df`, and
    about publications without any tags.
    """
    known_ids = set(df["id"])
    unknown = sorted(set(tags) - known_ids)
    if unknown:
        console.print(f"[red]Unknown publication ids in PUBLICATION_TAGS: {unknown}")

    untagged = sorted(known_ids - set(tags))
    if untagged:
        console.print(f"[yellow]Publications without tags: {untagged}")

    entries = [{"id": pub_id, "tags": tags[pub_id]} for pub_id in sorted(tags)]
    with open(yaml_path, "w", encoding="utf-8") as f_yaml:
        yaml.safe_dump(entries, f_yaml, sort_keys=False, allow_unicode=True)
    console.print(f"Wrote {len(entries)} publication tag entries to {yaml_path}")


def create_list_of_pubmeds(df: pd.DataFrame) -> list[str]:
    import numpy as np

    pmids: list[str] = []
    for key, row in df.iterrows():
        # print(row)

        if not np.isnan(row.pmid):
            pmids.append(int(row.pmid))
    return pmids


def create_list_of_dois(df: pd.DataFrame, no_pmid: bool = True) -> list[str]:
    import numpy as np

    dois: list[str] = []
    for key, row in df.iterrows():
        # print(row)

        if row.doi:
            if no_pmid:
                if np.isnan(row.pmid):
                    dois.append(row.doi)
            else:
                dois.append(row.doi)
    return dois


if __name__ == "__main__":
    results_dir: Path = Path(__file__).parent / "results"
    yaml_file: Path = (
        Path(__file__).parent.parent / "app" / "_data" / "publications.yml"
    )
    df: pd.DataFrame = read_publications(yaml_file=yaml_file)
    df_matrix = create_matrix(df=df)
    df_matrix.to_csv(results_dir / "publication_matrix.tsv", index=True, sep="\t")

    publication_tags_yaml: Path = (
        Path(__file__).parent.parent / "app" / "_data" / "publication_tags.yml"
    )
    write_publication_tags(df=df, tags=PUBLICATION_TAGS, yaml_path=publication_tags_yaml)

    # markdown_file: Path = Path(results_dir / "publications.md")
    # create_list_of_publications_md(md_path=markdown_file, df=df)

    highlights = {
        # "PKDB_Grzegorzewski2020",
        # "hepatokin_Berndt2018",
        # # "GlucoseModel_Koenig2012a",
        # "ICG_model_hepatectomy_Koeller2021",
        # "Caffeine_meta_Grzegorzewski2021",
        # "Albadry2024_species_comparison",
    }
    # create_list_of_publications_typst(Path("publications.typ"), df=df, highlights=highlights)

    # list of selected publications
    selected = {
        "Nemitz2026_dapagliflozin",
        "Tensil2026_losartan",
        # "Elias2025_glimepiride_physiome",
        "Elias2025_glimepiride",
        "Albadry2024_species_comparison",
        # "SED-ML_L1V5",
        "Maheshvare2023_pancreas",
        "Caffeine_meta_Grzegorzewski2021",
        "PKDB_Grzegorzewski2020",
        "Grzegorzewski2022_dextromethorphan",
        "ICG_model_hepatectomy_Koeller2021",
        # "Koeller2021_icg_variability",
        # "GlucoseModel_Koenig2012a",
        # "SBML_Keating2020",
        "hepatokin_Berndt2018",
        # "Koenig2023_standards",
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
        Path(results_dir / "publications.typ"),
        df=df,
        # selected=selected,
        # highlights=selected,
    )
    create_list_of_publications_typst(
        Path(results_dir / "publications_selected.typ"),
        df=df,
        selected=selected,
        # highlights=selected,
    )

    pubmeds = create_list_of_pubmeds(df=df)
    print(pubmeds)
    dois = create_list_of_dois(df=df)
    for doi in dois:
        print(doi)

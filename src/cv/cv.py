"""Helper functions for CV conversion.

python typst library

Install the typst compiler:
https://github.com/typst/typst/releases
https://lindevs.com/install-typst-on-ubuntu

Install fonts locally, e.g. via fonts manager
https://itslinuxfoss.com/install-fonts-ubuntu-24-04/
And install fonts
sudo apt install fonts-roboto fonts-roboto-fontface

Build the PDF CV from src/cv/typst/ (cv_conf.typ, lang.toml, Koenig.png and
the Source Sans and Font Awesome fonts are in that folder; Roboto comes from
the system fonts above). The default build is the unsigned one the website
serves:
cd src/cv/typst && typst compile --font-path fonts cv.typ ../../../public/assets/cv/Koenig_CV.pdf

A signed copy adds the handwritten signature images/koenig_signature.png,
which is gitignored and must be copied into src/cv/typst/images/ locally:
cd src/cv/typst && typst compile --font-path fonts --input signature=true cv.typ

typst compile cv/cv.typ cv_html/cv.html --features html

"""
from pathlib import Path


if __name__ == "__main__":
    import typst
    cv_typst: Path = Path(__file__).parent / "results/cv/cv.typ"
    cv_html: Path = Path(__file__).parent / "results/cv_html/cv.html"


    typst.compile(str(cv_typst), format="html", output=str(cv_html))
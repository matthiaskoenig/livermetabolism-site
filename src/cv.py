"""Helper functions for CV conversion.

python typst library

Install the typst compiler:
https://github.com/typst/typst/releases
https://lindevs.com/install-typst-on-ubuntu

Install fonts locally, e.g. via fonts manager
https://itslinuxfoss.com/install-fonts-ubuntu-24-04/
And install fonts
sudo apt install fonts-roboto fonts-roboto-fontface

typst compile --font-path fonts cv.typ
typst compile cv/cv.typ cv_html/cv.html --features html

"""
from pathlib import Path


if __name__ == "__main__":
    import typst
    cv_typst: Path = Path(__file__).parent / "results/cv/cv.typ"
    cv_html: Path = Path(__file__).parent / "results/cv_html/cv.html"


    typst.compile(str(cv_typst), format="html", output=str(cv_typst))
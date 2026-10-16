#import "@preview/fontawesome:0.6.0": *
#import "cv_conf.typ": *

#show table.cell.where(y: 0): strong
#set table(
  stroke: (x, y) => if y == 0 {
    (bottom: 0.7pt + black)
  }
)

#let publication_highlight(content) = rect(
  inset: 0.5em,
  fill: rgb(245,245,245),
  stroke: (left: 2pt + rgb(100,100,200)),
  radius: 0.2em,
)[#content]

// The research areas of the website: tag name (data/tags.yml), the slug of
// its homepage section, icon and colour (site/styles/global.css).
#let tag-style = (
  "Digital Twins": (slug: "digital-twins", icon: "cube", color: "#3498db"),
  "AI": (slug: "ai", icon: "heart-pulse", color: "#f39c12"),
  "Digital Pathology": (slug: "digital-pathology", icon: "image", color: "#e74c3c"),
  "Pharmacometrics": (slug: "pharmacometrics", icon: "chart-line", color: "#1e8449"),
  "Open & FAIR": (slug: "open-fair", icon: "unlock-keyhole", color: "#2c3e50"),
)

// A research area with icon and name, linked to its homepage section.
#let topic(name) = {
  let s = tag-style.at(name)
  link("https://livermetabolism.com/#" + s.slug)[#text(fill: rgb(s.color))[#fa-icon(s.icon) #name]]
}

// The research areas of an entry as coloured icons, small by default.
#let tags(size: 0.8em, ..names) = names.pos().map(name => {
  let s = tag-style.at(name)
  link("https://livermetabolism.com/#" + s.slug)[#text(fill: rgb(s.color), size: size)[#fa-icon(s.icon)]]
}).join(h(1pt))

#show: resume.with(
  author: (
    title: "Prof. Dr.",
    firstname: "Matthias",
    lastname: "König",
    email: "matthias.koenig@uni-luebeck.de",
    homepage: "https://livermetabolism.com",
    phone: "(+49) 451 3101-7845 ",
    github: "matthiaskoenig",
    //twitter: "konigmatt",
    scholar: "xD9IjnYAAAAJ",
    youtube: "@liversystemsmedicine",
    orcid: "0000-0003-1725-179X",
    //birth: "June 25, 1981",
    linkedin: "matthias-k%C3%B6nig-796bb758",
    //researchgate: "Matthias_Koenig4",
    address: "University Hospital Schleswig-Holstein, Campus Lübeck, First Department of Medicine",  // , Ratzeburger Allee 160, 23562 Lübeck, Germany",
    positions: (
      topic("Digital Twins"),
      topic("AI"),
      topic("Digital Pathology"),
      topic("Pharmacometrics"),
      topic("Open & FAIR"),
    ),
  ),
  profile-picture: "Koenig.png",
  date: datetime.today().display(),
  language: "en",
  colored-headers: true,
  accent-color: black,
  show-footer: false,
  // paper-size: "us-letter",
)


= Career Stages & Education
#resume-entry(
  title: "Professor of Metabolic Inflammation and Carcinogenesis of the Liver",
  location: [University of Lübeck, Germany],
  date: "06/2026 -",
  description: "Head of Systems Medicine, Digital Twins & AI",
)
#resume-item[
  - Digital twins and digital pathology methods for liver disease.
]

#resume-entry(
  title: "Guest Professor",
  location: [Humboldt-Universität zu Berlin],
  date: "06/2026 – Present",
  description: "Systems Medicine of the Liver",
)

#resume-entry(
  title: "Associate Professor of Pharmacoepidemiology and Data Science",
  location: [SDU, Odense, Denmark],
  date: "05/2026",
  description: "Pharmacoepidemiology and Data Science Group",
)

#resume-entry(
  title: "Head of Computational Biomechanics Group",
  location: [University of Stuttgart],
  date: "12/2025 - 04/2026",
  description: "Coordination Project, DFG Priority Programme SPP 2311",
)
#resume-item[
  - Coordinated biomechanics and numerical modeling toward reproducible, clinically applicable in silico models.
]

#resume-entry(
  title: "Head of Systems Medicine of the Liver Group",
  location: [Humboldt-Universität zu Berlin],
  date: "06/2021 – 11/2025",
  description: "DFG Position for Principal Investigators, Institute for Theoretical Biology",
)
#resume-item[
  - Competitive third-party funding (DFG, EU, BMBF) for digital twins and personalized pharmacotherapy.
  - Digital twins combining physiology, pharmacokinetics, and AI; collaborations: Virtual Human Twin, EDITH, Lorentz Center.
]

#resume-entry(
  title: "Junior Group Leader",
  location: [Humboldt-Universität zu Berlin],
  date: "2016 – 2021",
  description: "BMBF LiSyM Junior Group Leader, Systems Medicine of the Liver",
)
#resume-item[
  - Independent group in the national LiSyM program: PBPK/PD models of drug metabolism and liver surgery outcomes.
]

#resume-entry(
  title: "PhD in Biophysics",
  location: [Charité – University Medicine Berlin, Humboldt-Universität zu Berlin],
  date: "2010 - 2015",
  description: "Doctorate in Biophysics (magna cum laude), supervisor Prof. Hermann-Georg Holzhütter",
) // 9. Dec. 2015
#resume-item[
  - Kinetic models of hepatic glucose metabolism explaining glucose homeostasis and hypoglycemia risk in type 2 diabetes.
]

#resume-entry(
  title: "Scientific Staff Member",
  location: [Charité – University Medicine Berlin],
  date: "2008 – 2015",
  description: "BMBF consortia HepatoSys and Virtual Liver",
)
#resume-item[
  - Multiscale models of hepatic metabolism, perfusion, and drug elimination, validated with experimental and clinical partners.
]

#resume-entry(
  title: "Diploma in Biophysics",
  location: [Humboldt-Universität zu Berlin],
  date: "2002 – 2009",
  description: "Diploma (equivalent to MSc), 1.0 with distinction",
) //  14. December 2009
#resume-item[
  - Thesis on systems biology modeling of hepatic metabolism.
]

#resume-entry(
  title: "Surgical Support Assistant",
  location: [Bethesda Hospital Stuttgart],
  date: "2001",
  description: "Clinical experience in interdisciplinary surgical teams prior to academic studies",
)
#v(4pt)

= Training & Certifications
#resume-entry(
  title: [#link("https://livermetabolism.com/assets/pdf/certificate/Koenig2026_science.communication.pdf")[#fa-icon("file-pdf")] Science Communication for (Junior) Scholars],
  location: [ZEWK, TU Berlin],
  date: "2025 - 2026",
  description: "Certificate in Science Communication (200 AE)",
) // https://www.tu.berlin/en/zewk/offers-by-topic/further-education-for-lecturers-and-researchers/science-communication
#resume-item[
  - Concepts, presenting, visual communication, graphical abstracts, explainer videos, AI-assisted proposal writing.
  - Project: AI-assisted redesign of #link("https://livermetabolism.com")[livermetabolism.com] with live figures from GitHub, Google Scholar, and OpenAlex.
]

#resume-entry(
  title: [#link("https://livermetabolism.com/assets/pdf/certificate/Koenig2025_ai.teaching.pdf")[#fa-icon("file-pdf")] AI Teaching Certificate (KI-Lehrzertifikat)],
  location: [HU Berlin, KI-Campus 2.0 & AI Skills Initiative],
  date: "2026",
  description: "Higher education didactics qualification on Artificial Intelligence (200 AE)",
)
#resume-item[
  - AI Foundations (96%), AI Advanced & Ethics (93%), and AI Didactics in Higher Education (91%), aligned with DGHD standards, including a teaching observation.
]

#resume-entry(
  title: [#link("https://livermetabolism.com/assets/pdf/certificate/Koenig2025_leadership.pdf")[#fa-icon("file-pdf")] Leadership Certificate Program],
  location: [ZEWK, TU Berlin],
  date: "2025",
  description: "Certificate in Academic Leadership (100 AE), two-stage program for professors and group leaders",
)

#resume-entry(
  title: [#link("https://livermetabolism.com/assets/pdf/certificate/Koenig2025_dhpe.pdf")[#fa-icon("file-pdf")] Digital Health Professions Educator (DHPE)],
  location: [Charité – Universitätsmedizin Berlin],
  date: "2024 – 2025",
  description: "Certificate in Digital Teaching for Health Professions (200 AE)",
) // https://dsfz.charite.de/hochschuldidaktik/digital_health_professions_educator_1
#resume-item[
  - Faculty development in digital and blended teaching and research-based learning formats for health professions.
]

#resume-entry(
  title: [#link("https://livermetabolism.com/assets/pdf/certificate/Koenig2025_scientific.integrity.pdf")[#fa-icon("file-pdf")] EP PerMed Training on Scientific Integrity],
  location: [European Partnership for Personalised Medicine],
  date: "2025",
  description: "Research integrity and ethical, legal, and social aspects of personalised medicine (20 AE)",
)

#resume-entry(
  title: [#link("https://livermetabolism.com/assets/pdf/certificate/Koenig2025_mental.health.pdf")[#fa-icon("file-pdf")] IAR Identify, Assist, Refer],
  location: [Health & Wellness, University of Toronto],
  date: "2025",
  description: "Certificate in Mental Health Assistance and Support (10 AE)",
)
#v(4pt)

= Skills

#set text(hyphenate: false)
#resume-skill-item(
  [#tags(size: 1em, "Digital Twins") Modeling & Digital Twins],
  (strong("Digital Twins"), strong("Multiscale Modeling"), "Systems Biology", "Bayesian Inference"),
)
#resume-skill-item(
  [#tags(size: 1em, "Pharmacometrics") Pharmacometrics],
  (strong("PBPK/PD Modeling"), "Model-Informed Precision Dosing", "Hepatic & Renal Impairment", "Pharmacogenomics", "Drug-Drug Interactions"),
)
#resume-skill-item(
  [#tags(size: 1em, "AI") AI & Agentic Workflows],
  (strong("Agentic AI Workflows"), strong("AI Coding Agents (Claude Code)"), "Large Language Models", "Deep Learning", "Image Segmentation"),
)
#resume-skill-item(
  [#tags(size: 1em, "Digital Pathology") Digital Pathology],
  (strong("Whole-Slide Image Analysis"), "Liver Zonation", "Quantitative Histology"),
)
#resume-skill-item(
  [#tags(size: 1em, "Open & FAIR") Open & FAIR Science],
  (strong("SBML (Editor 2025 - 2027)"), "SED-ML", "COMBINE/OMEX", "PEtab", "PK-DB", "Reproducible Workflows"),
)
#resume-skill-item(
  "Programming",
  (strong("Python"), strong("R"), strong("Julia"), "TypeScript", "Java", "C++", "MATLAB", "SQL", "PyTorch", "TensorFlow"),
)
#resume-skill-item(
  "Tools",
  (strong("git & GitHub"), "Docker", "Continuous Integration", "LaTeX", "Typst", "BioRender", "Illustrator", "Inkscape"),
)
#resume-skill-item(
  "Teaching & Communication",
  (strong("University Teaching"), "Project-Based Learning", "AI-Supported Teaching", "Science Communication", "Mentoring"),
)
#resume-skill-item(
  "Languages",
  (strong("German"), strong("English"), "Spanish (B2)", "Russian (A1)"),
)
#set text(hyphenate: auto)
#v(6pt)

= Scientific Results
== Ten Selected Publications (total: 68, citations: 3897, h: 26, i10: 37, #link("https://scholar.google.de/citations?user=xD9IjnYAAAAJ&hl=de")[#google-scholar-icon Google Scholar] 10/2026)

1. #link("https://livermetabolism.com/assets/pdf/publication/Bafna2026_segmentation.pdf")[#fa-icon("file-pdf")]#link("https://doi.org/10.5281/zenodo.17041227")[#fa-icon("git-alt")] #tags("AI", "Digital Pathology") *Automated Segmentation of Hepatic Vessels and Lobules in Whole-Slide Images Using U-Net Models*. M. Bafna, M. König, S. Saalfeld, V. Moulisova, V. Liska, U. Dahmen, and M. Albadry; Front. Bioinform. 6:1713736, #link("https://doi.org/10.3389/fbinf.2026.1713736")[10.3389/fbinf.2026.1713736], IF: *3.9*
2. #link("https://livermetabolism.com/assets/pdf/publication/Nemitz2026_dapagliflozin.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dapagliflozin-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A Physiologically Based Pharmacokinetic and Pharmacodynamic (PBPK/PD) Model of Dapagliflozin in Type 2 Diabetes Mellitus: The Effect of Dosing, Hepatorenal Impairment, and Food*. N. Nemitz, M. Elias, and M. König; Pharmaceutics 2026, 18(3), 287, #link("https://doi.org/10.3390/pharmaceutics18030287")[10.3390/pharmaceutics18030287], IF: *6.9*, #underline[Last author]
3. #link("https://livermetabolism.com/assets/pdf/publication/Elias2025_glimepiride.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/glimepiride-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A Digital Twin of Glimepiride for Personalized and Stratified Diabetes Treatment*. M. Elias and M. König; Front. Pharmacol. 16:1686415., #link("https://doi.org/10.3389/fphar.2025.1686415")[10.3389/fphar.2025.1686415], IF: *4.8*, #underline[Last author]
4. #link("https://livermetabolism.com/assets/pdf/publication/Albadry2024_species.comparison.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/zonation-image-analysis")[#fa-icon("git-alt")] #tags("AI", "Digital Pathology") *Cross-Species Variability in Lobular Geometry and Cytochrome P450 Hepatic Zonation: Insights into CYP1A2, CYP2E1, CYP2D6 and CYP3A4*. M. Albadry, J. Kuettner, J. Grzegorzewski, O. Dirsch, E. Kindler, R. Klopfleisch, V. Liska, V. Moulisova, S. Nickel, R. Palek, J. Rosendorf, S. Saalfeld, U. Settmacher, H. Tautenhahn, M. KönigΔ, and U. DahmenΔ (Δ equal contribution); Front Pharmacol. 2024 May 16;15:1404938, #link("https://doi.org/10.3389/fphar.2024.1404938")[10.3389/fphar.2024.1404938], IF: *5.4*, #underline[Last Equal author]
5. #link("https://livermetabolism.com/assets/pdf/publication/Maheshvare2023_pancreas.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/pancreas-model")[#fa-icon("git-alt")] #tags("AI") *A pathway model of glucose-stimulated insulin secretion in the pancreatic β-cell*. M. D. Maheshvare, S. Raha, M. KönigΔ, and D. PalΔ (Δ equal contribution); Front. Endocrinol. 14:1185656, #link("https://doi.org/10.3389/fendo.2023.1185656")[10.3389/fendo.2023.1185656], IF: *5.7*, #underline[Last Equal author]
6. #link("https://livermetabolism.com/assets/pdf/publication/Grzegorzewski2022_dextromethorphan.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dextromethorphan-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Physiologically based pharmacokinetic (PBPK) modeling of the role of CYP2D6 polymorphism for metabolic phenotyping with dextromethorphan*. J. Grzegorzewski, J. Brandhorst, and M. König; Front Pharmacol. 2022 Oct 24;13:1029073, #link("https://doi.org/10.3389/fphar.2022.1029073")[10.3389/fphar.2022.1029073], IF: *4.4*, #underline[Last author]
7. #link("https://livermetabolism.com/assets/pdf/publication/Koeller2021_icg.hepatectomy.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/icg-model.git")[#fa-icon("git-alt")] #tags("AI", "Pharmacometrics") *Prediction of survival after hepatectomy using a physiologically based pharmacokinetic model of indocyanine green liver function tests*. A. Köller, J. Grzegorzewski, M. Tautenhahn, and M. König; Front. Physiol., 22 November 2021, #link("https://doi.org/10.3389/fphys.2021.730418")[10.3389/fphys.2021.730418], IF: *3.2*, #underline[Last author]
8. #link("https://livermetabolism.com/assets/pdf/publication/Grzegorzewski2020_pkdb.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/pkdb")[#fa-icon("git-alt")] #tags("Pharmacometrics", "Open & FAIR") *PK-DB: pharmacokinetics database for individualized and stratified computational modeling*. J. Grzegorzewski, J. Brandhorst, K. Green, D. Eleftheriadou, Y. Duport, F. Barthorscht, A. Köller, D. Y. J. Ke, S. De Angelis, and M. König; Nucleic Acids Res. 2021 Jan 8;49(D1):D1358-D1364, #link("https://doi.org/10.1093/nar/gkaa990")[10.1093/nar/gkaa990], IF: *16.7*, #underline[Last author]
9. #link("https://livermetabolism.com/assets/pdf/publication/Berndt2018_hepatokin.pdf")[#fa-icon("file-pdf")] #tags("AI") *HEPATOKIN1: A Biochemistry-Based Model of Liver Metabolism Suited for Applications in Medicine and Pharmacology*. N. Berndt, S. Bulik, I. Wallach, T. Wünsch, M. König, M. Stockmann, M. Meierhofer, and H. G. Holzhütter; Nat Commun. 2018 Jun 19;9(1):2386., #link("https://doi.org/10.1038/s41467-018-04720-9")[10.1038/s41467-018-04720-9], IF: *15.4*
10. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2012a_glucosemodel.pdf")[#fa-icon("file-pdf")] #tags("AI") *Quantifying the Contribution of the Liver to the Homeostasis of Plasma Glucose: A Detailed Kinetic Model of Hepatic Glucose Metabolism Integrated with the Hormonal Control by Insulin, Glucagon and Epinephrine*. M. König, S. Bulik, and H. G. Holzhütter; PLoS Comput Biol. 2012 Jun;8(6):e1002577. Epub 2012 Jun 21., #link("https://doi.org/10.1371/journal.pcbi.1002577")[10.1371/journal.pcbi.1002577], IF: *4.9*, #underline[First author]


For a full list of publications and preprints see: #link("https://livermetabolism.com/publications/").

== Ten Selected Research Outcomes
1. #link("https://livermetabolism.com/assets/pdf/preprint/Myshkina2026_apixaban_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/apixaban-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *An Open and Reproducible Digital Twin for Personalised Anticoagulant Therapy: Modelling Apixaban Pharmacokinetics and Pharmacodynamics*. M. Myshkina, M. Babaeva, L. C. Nguyen, S. Bedón, J. Metternich, M. Elias, and M. König; Preprints 2026, 10.20944/preprints202605.0249.v1, #link("https://doi.org/10.20944/preprints202605.0249.v1")[10.20944/preprints202605.0249.v1], #underline[Last author]
2. #link("https://livermetabolism.com/assets/pdf/thesis/Kuettner2024_master.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/zonation-image-analysis")[#fa-icon("git-alt")] #tags("AI", "Digital Pathology") *Quantitative Image Analysis of Hepatic Zonation in Cytochrome P450 and Steatosis Using Whole Slide Scans*. Master Thesis Jonas Küttner (supervisor: *Matthias König*); Master Thesis, August 2024, #underline[Last Author]
3. #link("https://livermetabolism.com/assets/pdf/preprint/Myshkina2025_digital.twins_preprint.pdf")[#fa-icon("file-pdf")]#link("https://doi.org/10.5281/zenodo.15013110")[#fa-icon("git-alt")] #tags("Digital Twins", "AI") Preprint *Assessing the Impact of AI and Digital Twins on Clinical Decision-Making in Hepatology and Hepatobiliary Surgery*. Mariia Myshkina, Elisabetta Casabianca, Anton Schnurpel, Tim Ricken, Hans-Michael Tautenhahn, *Matthias König*; Preprints 2025, #link("https://doi.org/10.20944/preprints202509.1164.v1")[10.20944/preprints202509.1164.v1], #underline[Last Author]
4. #fa-icon("database") #link("https://github.com/matthiaskoenig/pkdb")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics", "Open & FAIR") Database *PK-DB - Pharmacokinetics database*. #link("https://doi.org/10.1093/nar/gkaa990")[doi:10.1093/nar/gkaa990] Developed the first FAIR-compliant open database for pharmacokinetics, integrating clinical and pre-clinical trial data. PK-DB enables reproducible PBPK/PD modeling, supports individualized simulations, and has become a key infrastructure for computational pharmacology research.
5. #fa-icon("gear") #link("https://github.com/matthiaskoenig/sbmlutils")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") Software *sbmlutils - Python utilities for SBML*. #link("https://doi.org/10.5281/zenodo.597149")[doi:10.5281/zenodo.597149] Created a versatile Python library to streamline the use of SBML models, providing robust utilities for model handling, analysis, and integration with libSBML. Widely used in reproducible modeling workflows across systems biology.
6. #fa-icon("gear") #link("https://github.com/matthiaskoenig/sbmlutils")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") Software *SBML4Humans - SBML simulation made easy*.  Designed an interactive reporting framework that makes SBML models human-readable and accessible, enabling experts and newcomers to explore model content without technical barriers.
7. #fa-icon("gear") #link("https://github.com/matthiaskoenig/sbmlsim")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics", "Open & FAIR") Software *sbmlsim - SBML simulation made easy*.  Built a lightweight Python package that simplifies simulations of SBML models on top of libRoadRunner, lowering the entry barrier for model testing and teaching.
8. #fa-icon("gear") #link("https://github.com/matthiaskoenig/cy3sbml")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") Software *cysbml - Cytoscape 3 app for the Systems Biology Markup Language*. #link("https://doi.org/10.5281/zenodo.597154")[doi:10.5281/zenodo.597154] Developed and maintained a widely used Cytoscape app for visualization of SBML models in network contexts. cy3sbml has facilitated intuitive exploration of complex models in systems biology and bioinformatics.
// 6. #fa-icon("gear") #link("https://github.com/matthiaskoenig/brendapy")[#fa-icon("git-alt")] Software *brendapy - BRENDA in python*.  Authored a Python package providing direct programmatic access to BRENDA enzyme information, enabling large-scale, automated enzyme analysis and integration into computational pipelines.
9. #fa-icon("gear") #link("https://github.com/matthiaskoenig/libsbgn-python")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") Software *libsbgnpy - Python library for SBGN*.  Developed a Python library for working with Systems Biology Graphical Notation (SBGN), supporting standardized visualization and integration of pathway information.
10. #fa-icon("gear") #link("https://github.com/sys-bio/roadrunner/")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") Software *roadrunner - High-performance simulator for SBML*.  Contributed to the development of libRoadRunner, a C/C++ library using LLVM for ultra-fast simulation of SBML models, setting a benchmark for performance in computational biology.
// 9. #fa-icon("gear") #link("https://github.com/opencobra/cobrapy/")[#fa-icon("git-alt")] Software *COBRApy - COBRA python package*.  Advanced COBRApy, the leading Python package for constraint-based reconstruction and analysis, widely adopted in genome-scale metabolic modeling. Provides access to key methods such as flux balance and flux variability analysis.
// 10. #fa-icon("gear") #link("https://github.com/sys-bio/tellurium/")[#fa-icon("git-alt")] Software *tellurium - systems biology simulation library*.  Co-developed Tellurium, a Python-based environment for reproducible dynamical modeling of biological networks. Integrated standard formats with powerful simulation libraries, enabling accessible and transparent modeling.


= Supervision of Researchers
Over the last 5 years, 1 PhD theses, 4 Master thesis, 11 Bachelor's theses, 18 Humboldt-Internship students (HIC), and 4 Google Summer of Code (GSOC) students have been supervised. I am currently supervising 2 PhD, and 2 Internship projects (group members).
#set list(marker: "")
1. #link("https://livermetabolism.com/assets/pdf/thesis/Alvarez2026_master.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/parameter-variability")[#fa-icon("git-alt")] #tags("Open & FAIR") *Parameter Uncertainty in the Optimization of Pharmacokinetic Models: A Reproducible Bayesian Approach*. Antonio Alvarez (supervisor: M. König); Master Thesis, April 2026, #underline[Supervisor]
2. #link("https://livermetabolism.com/assets/pdf/thesis/Casabianca2025_master.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/rivaroxaban-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A Systems Pharmacology Approach to Rivaroxaban: Physiologically Based Modeling of Pharmacokinetics and Coagulation Dynamics*. Elisabetta Casabianca (supervisor: M. König); Master Thesis, July 2025, #underline[Supervisor]
3. #link("https://livermetabolism.com/assets/pdf/thesis/Tensil2025_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/losartan-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A physiological-based pharmacokinetic/ pharmacodynamic (PBPK/PD) model of the angiotensin II receptor blocker (ARB) losartan*. Ennie Tensil (supervisor: M. König); Bachelor Thesis, July 2025, #underline[Supervisor]
4. #link("https://livermetabolism.com/assets/pdf/thesis/Nemitz2025_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dapagliflozin-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Physiologically-Based Pharmacokinetic/Pharmacodynamic Modeling of Dapagliflozin: Exploring the Impact of Dosing, Hepatorenal Impairment and Food Intake*. Nike Nemitz (supervisor: M. König); Bachelor Thesis, June 2025, #underline[Supervisor]
5. #link("https://livermetabolism.com/assets/pdf/thesis/Elias2025_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/glimepiride-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A physiological-based pharmacokinetic (PBPK) model of the sulfonylurea glimepiride*. Michelle Elias (supervisor: M. König); Bachelor Thesis, April 2025, #underline[Supervisor]
6. #link("https://livermetabolism.com/assets/pdf/thesis/Mishra2025_internship_report.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/tirzepatide-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A Physiologically-Based Pharmacokinetic Model of Tirzepatide*. Internship Report Abhinav Mishra (supervisor: M. König); Internship Report, Mar 2025, #underline[Supervisor]
7. #link("https://livermetabolism.com/assets/pdf/thesis/Kulanoglu2025_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/aliskiren-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Physiologically based pharmacokinetic/pharmacodynamic modeling of the direct renin inhibitor aliskiren: Exploring the impact of hepatorenal impairment and drug-drug interactions*. Bachelor Thesis Yusuf Ali Kulanoglu (supervisor: M. König); Bachelor Thesis, January 2025, #underline[Supervisor]
8. #link("https://livermetabolism.com/assets/pdf/thesis/Kuettner2024_master.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/zonation-image-analysis")[#fa-icon("git-alt")] #tags("AI", "Digital Pathology") *Quantitative Image Analysis of Hepatic Zonation in Cytochrome P450 and Steatosis Using Whole Slide Scans*. Master Thesis Jonas Küttner (supervisor: M. König); Master Thesis, August 2024, #underline[Supervisor]
9. #link("https://livermetabolism.com/assets/pdf/thesis/Palwankar2024_master.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/enalapril-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Enhancing Our Understanding of Enalapril’s Pharmacokinetics: A Physiologically Based Modeling Approach*. Master Thesis Shubhankar Palwankar (supervisor: M. König); Master Thesis, May 2024, #underline[Supervisor]
10. #link("https://livermetabolism.com/assets/pdf/thesis/Hossain2024_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/protein-distribution")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A systematic overview of protein variability in cytochrome P450 and UDP-glucuronosyltransferase enzymes in the human liver*. Bachelor Thesis Afruja Hossain (supervisor: M. König); Bachelor Thesis, Jan 2024, #underline[Supervisor]
11. #link("https://livermetabolism.com/assets/pdf/thesis/Okibedi2024_internship_report.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/sorafenib-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A physiologically-based pharmacokinetic (PBPK) model of sorafenib for investigating the effect of sorafenib parameters in hepatorenal impairment*. Internship Report Frances Okibedi (supervisor: M. König); Internship report, July 2024, #underline[Supervisor]
12. #link("https://livermetabolism.com/assets/pdf/thesis/Mallol2023_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/talinolol-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A physiologically based pharmacokinetic (PBPK) model of the probe drug talinolol for the characterization of intestinal P-glycoprotein*. Bachelor Thesis Beatrice Stemmer Mallol (supervisor: M. König); Bachelor Thesis, July 2023, #underline[Supervisor]
13. #link("https://livermetabolism.com/assets/pdf/thesis/Grzegorzewski2023_phd.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dextromethorphan-model")[#fa-icon("git-alt")] #tags("Pharmacometrics", "Open & FAIR") *Physiologically based pharmacokinetic (PBPK) modeling for dynamical liver function tests and CYP phenotyping*. Jan Grzegorzewski (supervisor: M. König); PhD Thesis, Jan 2023, #underline[Supervisor]
14. #link("https://livermetabolism.com/assets/pdf/thesis/Pujol2022_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/pravastatin-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A physiologically based model of pravastatin - The role of genotypes and hepatic or renal impairment on the pharmacokinetics of pravastatin*. Helena Leal Pujol (supervisor: M. König); Bachelor Thesis, May 2022, #underline[Supervisor]
15. #link("https://livermetabolism.com/assets/pdf/thesis/Balci2021_bachelor.thesis.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/omeprazole-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Computational modelling of omeprazole - pharmacokinetics and pharmacodynamics*. Sükrü Balci (supervisor: M. König); Bachelor Thesis, October 2021, #underline[Supervisor]
16. #link("https://livermetabolism.com/assets/pdf/thesis/Koeller2021_bachelor.thesis.pdf")[#fa-icon("file-pdf")] #tags("Pharmacometrics") *A Physiologically Based Model of Indocyanine Green Liver Function Tests - Eﬀects of Physiological Factors, Hepatic Disease and Hepatic Surgery*. Adrian Köller (supervisor: M. König); Bachelor Thesis, March 2021, #underline[Supervisor]
17. #link("https://livermetabolism.com/assets/pdf/thesis/Bartsch2020_bachelor.thesis.pdf")[#fa-icon("file-pdf")] #tags("Pharmacometrics") *Computational Modelling of Simvastatin - Eﬀects on HMG-CoA Reductase Activity and Cholesterol*. Florian Bartsch (supervisor: M. König); Bachelor Thesis, November 2020, #underline[Supervisor]
18. #link("https://livermetabolism.com/assets/pdf/thesis/Duport2020_bachelor.thesis.pdf")[#fa-icon("file-pdf")] #tags("Pharmacometrics") *Computational Modelling of Midazolam Clearance: Effect of Inhibitors and Inducers*. Yannick Duport (supervisor: M. König); Bachelor Thesis, August 2020, #underline[Supervisor]

= Activities in the Research System
#set list(marker: "•")
- #link("https://inch.de/roundtable/")[#fa-icon("square-arrow-up-right")] #link("https://www.youtube.com/watch?v=Mu9oXKLtTGI")[#fa-icon("file-video")] 2026: *Invited keynote at the Patient Monitoring Roundtable (PMRT)* – Digital Twins and Dashboards for Personalized Drug Treatment at Charité – Universitätsmedizin Berlin.
- #link("https://inf.gi.de/12/modelle-so-komplex-wie-der-koerper-selbst")[#fa-icon("square-arrow-up-right")] 2026: *Interview: Modelle so komplex wie der Körper selbst – Digitale Zwillinge in der Medizin* – Gesellschaft für Informatik interview on digital twins, multi-scale modeling, PBPK, and open, FAIR computational medicine.
- #link("https://www.youtube.com/playlist?list=PLNPRvG2dBEvvWlnLg0C3WPtTYAOOH110k")[#fa-icon("square-arrow-up-right")] #link("https://www.youtube.com/watch?v=tb9QArwsYCg")[#fa-icon("file-video")] #link("https://www.youtube.com/watch?v=fyX7YAxsfw4")[#fa-icon("file-video")] 2025: *Featured in Faces of the Berlin University Alliance* – Highlighted as part of the BUA’s 6th-anniversary film series showcasing interdisciplinary collaboration across FU, HU, TU, and Charité.
- #link("https://www.berlin-university-alliance.de/commitments/teaching-learning/sturop/research-groups/archiv/sem_aktuell/Digital-Twins-in-Action/index.html")[#fa-icon("square-arrow-up-right")] 2025–2026: *Leading X-Student Research Group: Digital Twins in Action — Optimizing Direct Oral Anticoagulant Use* - Supervising students in PBPK modeling and advancing precision medicine.
- #link("https://matthiaskoenig.github.io/open-science-workshop/")[#fa-icon("square-arrow-up-right")] 11/2025: *Organizing Workshop Open Science & Reproducibility — For Computational Models in Systems Biology & Medicine* - Featuring interactive sessions (LEGO® Serious Play), reproducibility workflows, and open publishing practices.
- #link("https://www.rd-alliance.org/groups/building-immune-digital-twins-wg/activity/")[#fa-icon("square-arrow-up-right")] #link("https://youtu.be/GXk2yJA4QVE")[#fa-icon("file-video")] 2025–2026: *Member Research Data Alliance (RDA) Working Group: Building Immune Digital Twins* - Developing standards and methods for Digital Twins.
- #link("https://sbml.org/about/core/")[#fa-icon("square-arrow-up-right")] 2018–2023, 2025–2027: *Elected SBML Editor* - Advanced the Systems Biology Markup Language (SBML) standard by coordinating editorial processes, improving specifications, and fostering interoperability.
- #link("https://www.berlin-university-alliance.de/en/commitments/research-quality/open-science/os-botschafter-innen/index.html")[#fa-icon("square-arrow-up-right")] 2024–2026: *Open Science Ambassador, Humboldt-University Berlin* - Promoted reproducibility, FAIR data, and open science practices within the Berlin University Alliance.
- #link("https://sed-ml.org/about.html")[#fa-icon("square-arrow-up-right")] 2017–2022, 2024–2027: *Elected SED-ML Editor* - Enhanced the Simulation Experiment Description Markup Language to improve reproducibility and exchangeability of simulation experiments.
- #link("https://petab.readthedocs.io/en/latest/editorial_board.html")[#fa-icon("square-arrow-up-right")] 2023–2026: *Elected PEtab Editor* - Strengthened the PEtab standard for parameter estimation problems, ensuring community adoption and long-term sustainability.
- #link("https://co.mbine.org/people/")[#fa-icon("square-arrow-up-right")] 2017–2026: *Elected COMBINE Coordinator* - Led international coordination of community standards (SBML, SED-ML, PEtab, etc.), strengthened collaborations, and organized annual COMBINE meetings.
- #link("https://www.hu-berlin.de/de/pr/themen/in-der-biologischen-forschung-gibt-es-eine-grosse-reproduzierbarkeitskrise")[#fa-icon("square-arrow-up-right")] 2025: *Interview: Reproducibility, Open Science, and the Future of Biological Research* - Berlin University Alliance feature highlighting the reproducibility crisis, FAIR data, open standards, and cultural change in academia.
- #link("https://www.berlin-university-alliance.de/commitments/teaching-learning/sturop/research-groups/index.html")[#fa-icon("square-arrow-up-right")] 2023: *Led X-Student Research Group: Physiologically Based Digital Twins for Hypertension Therapy* - Focused on ACE inhibitors and diuretics.
- #link("https://www.pharmvar.org/expert-panels")[#fa-icon("square-arrow-up-right")] 2023–2024: *Expert Panel Member: PharmVar CYP1A2 Gene Panel* - Advanced pharmacogenomics standards in drug metabolism.
- #link("https://doi.org/10.7554/eLife.89736")[#fa-icon("square-arrow-up-right")] 2023: *Co-authored Open Science Concept: Eleven Strategies for Training Reproducible Research* - Implemented institutional strategies for reproducible research and open science training.
- #link("https://co.mbine.org/author/combine-2022/")[#fa-icon("square-arrow-up-right")] 2022: *Organized 13th Computational Modeling in Biology Network (COMBINE) Meeting* - Brought together global experts in modeling standards in Berlin.
- #link("https://www.lorentzcenter.nl/your-dietary-digital-twin.html")[#fa-icon("square-arrow-up-right")] 2022: *Participant Lorentz Workshop “Your Dietary Digital Twin”* – Contributed to discussions on integrating mechanistic and data-driven models for personalized nutrition and open science frameworks.
- #link("https://www.berlin-university-alliance.de/commitments/teaching-learning/sturop/research-groups/index.html")[#fa-icon("square-arrow-up-right")] 2022: *Led X-Student Research Group: Physiologically Based Modeling of Drugs — ACE Inhibitors in Hypertension* - Mentored interdisciplinary student teams.

= Funding
#set list(marker: "•")
- #fa-icon("money-bill") #tags("Digital Twins", "Pharmacometrics", "Open & FAIR") 10/2025 -- 04/2026, Recipient, #link("https://www.bmbf.de")[BMBF], 1.500€, 	*X-Student Research Group - Digital Twins in Action: Optimizing Direct Oral Anticoagulant Use.* Project-based teaching initiative on digital twins in medicine, focusing on physiologically based pharmacokinetic (PBPK) modeling to optimize the use of direct oral anticoagulants.
- #fa-icon("money-bill") #tags("Digital Twins", "Open & FAIR") 10/2025 -- 09/2026, Recipient, #link("https://www.dfg.de")[DFG], 15.000€, 	*SPP2311 - Startup Funding - SPP-FEMVis: Advancing Open Science with Web-Based FEM Visualization.* Startup funding to develop an open science platform for interactive, web-based visualization of finite element method (FEM) simulations.
- #fa-icon("money-bill") #tags("AI") 2024 -- 2025, Co-Investigator, #link("https://www.circle-u.eu/")[Circle U.], total: 10.000€, 	*AlgoNomy - Algorithmic Regulation Before Medical Liability - Advancing Doctor-Patient Autonomy in AI-Driven Healthcare.* Building an international academic network to investigate the role of algorithms and AI in medical decision support systems, with a focus on legal, ethical, and patient autonomy implications.
- #fa-icon("money-bill") #tags("Open & FAIR") 01/2024 -- 06/2026, Recipient, #link("https://www.circle-u.eu/")[BMBF], 4.000€, 	*Open Science Ambassador.* Supporting the promotion and implementation of open science practices across research communities at Berlin Universities, with a focus on reproducibility, FAIR data, and fostering collaborative exchange.
- #fa-icon("money-bill") #tags("Digital Twins", "AI", "Digital Pathology") 10/2025 -- 9/2027, Recipient, #link("https://www.dfg.de")[DFG], 219.000€, total: 895.500€, 	*SPP2311 - SimLivA - SIMulation supported LIVer Assessment for donor organs.* Developing computational models and simulation workflows to assess liver function in donor organs, advancing predictive tools for transplantation and improving clinical decision-making.
- #fa-icon("money-bill") #tags("Digital Twins", "Pharmacometrics") 04/2023 -- 09/2023, Recipient, #link("https://www.bmbf.de")[BMBF], 1.500€, 	*X-Student Research Group - Physiologically based digital twins for the treatment of hypertension with ACE inhibitors and diuretics.* Project-based teaching initiative on digital twins in pharmacology, focusing on physiologically based pharmacokinetic (PBPK) modeling to optimize hypertension therapy with ACE inhibitors and diuretics.
- #fa-icon("money-bill") #tags("Digital Twins", "AI") 03/2023 -- 12/2026, Recipient, #link("https://www.bmbf.de")[BMBF], 311.000€, total: 1530.550€, 	*ATLAS - AI and Simulation for Tumor Liver ASessment.* Developing AI-driven and simulation-based methods to improve the assessment of liver tumors, integrating computational modeling with clinical data to support personalized diagnosis and treatment planning.
- #fa-icon("money-bill") #tags("Pharmacometrics") 10/2022 -- 03/2023, Recipient, #link("https://www.bmbf.de")[BMBF], 1.500€, 	*X-Student Research Group - Physiologically based modeling of drugs: ACE inhibitors in the treatment of high blood pressure.* Project-based teaching initiative on physiologically based pharmacokinetic (PBPK) modeling, focusing on optimizing the use of ACE inhibitors in hypertension therapy.
- #fa-icon("money-bill") #tags("Digital Twins", "AI") 07/2021 -- 11/2025, Recipient, #link("https://www.dfg.de")[DFG], 425.000€, total: 3825.000€, 	*FOR5151 - QuaLiPerF - Quantifying Liver Perfusion-Function Relationship in Complex Resection – A Systems Medicine Approach.* Advancing systems medicine by developing computational models to quantify the relationship between liver perfusion and function in complex surgical resections, supporting risk assessment and personalized treatment planning.
- #fa-icon("money-bill") #tags("Digital Twins", "AI", "Digital Pathology") 01/2020 -- 12/2023, Co-Investigator, #link("https://www.dfg.de")[DFG], total: 658.942€, 	*SPP2311 - SimLivA - SIMulation supported LIVer Assessment for donor organs.* Collaborative project developing simulation approaches to assess donor liver function, aiming to improve transplantation outcomes through predictive computational modeling.
- #fa-icon("money-bill") #tags("Open & FAIR") 06/2020 -- 05/2021, Recipient, #link("https://www.eosc-life.eu/")[EOSC-life], 5.000€, total: 25.000€, 	*EOSC-Life - Reproducible simulation studies targeting COVID-19.* Developed reproducible computational simulation studies to investigate COVID-19 dynamics, integrating standardized workflows and open science practices for rapid and transparent research dissemination.
- #fa-icon("money-bill") #tags("Digital Twins", "AI") 06/2016 -- 05/2022, Recipient, #link("https://www.bmbf.de")[BMBF], 723.000€, 	*LiSyM - Systems Medicine of the Liver - Junior group leader - Multi-scale models for the personalized evaluation of liver function.* Led a junior research group developing multi-scale computational models to assess and predict liver function, advancing personalized medicine approaches and translational applications in hepatology.

#set list(marker: "•")

= Academic Distinctions
#resume-entry(
  title: "Open Science Award 2026",
  location: [University of Lübeck],
  date: "2026",
  description: "Prize for an open, reproducible digital twin of hydrochlorothiazide (1,000 EUR).",
) // https://osi-luebeck.de/ausschreibung-open-science-preis-2026/
#resume-item[
  - Awarded for the project _An open, reproducible digital twin of hydrochlorothiazide pharmacokinetics and pharmacodynamics_.  
  - Recognizes projects at the University of Lübeck and the UKSH that go beyond the standards of their field in transparency, reproducibility, reusability, and open communication.  
]

#resume-entry(
  title: "Habilitation Completion Scholarship",
  location: [Humboldt-Universität zu Berlin],
  date: "11/2025 - 05/2026",
  description: "Scholarship supporting the completion of the Habilitation.",
)
#resume-item[
  - Awarded for the successful finalization of the Habilitation at Humboldt-Universität zu Berlin.  
]

#resume-entry(
  title: "Michael Stifel Prize",
  location: [Friedrich Schiller University Jena],
  date: "2023",
  description: "Awarded for outstanding interdisciplinary and data-driven research achievements.",
)
#resume-item[
  - Recognized for contributions advancing computational modeling and systems medicine.  
]

#resume-entry(
  title: "Google Summer of Code Scholarship",
  location: [Google / Open Source Initiative],
  date: "2015",
  description: "Scholarship to develop SBML tools as part of the Google Summer of Code program.",
)
#resume-item[
  - Advanced open-source infrastructure for systems biology and reproducible modeling.  
]

#resume-entry(
  title: "Scholarship Studienstiftung des Deutschen Volkes",
  location: [Studienstiftung des Deutschen Volkes],
  date: "2005",
  description: "Awarded a prestigious scholarship from the German National Academic Foundation.",
)
#resume-item[
  - Selected among top students in Germany for academic excellence and potential.  
]

= Teaching
== Digital Teaching Project
#table(
  columns: (4fr, 6fr),

  table.header(
    [Course], [Description],
  ),

  [
    *DHPE-PKPD – An Interactive and Open Course on Pharmacokinetic (PK) and Pharmacodynamic (PD) Modeling* \
    Large-scale digital teaching project DHPE (80 AE) \
    Charité – Universitätsmedizin Berlin \
    10/2024 – 07/2025 \
    #link("https://matthiaskoenig.github.io/dhpe-pkpd/")[#fa-icon("square-arrow-up-right")] #link("https://github.com/matthiaskoenig/dhpe-pkpd")[#fa-icon("git-alt")]
    
  ],
  [
  - Designed and implemented an innovative interactive course integrating theory, simulation practice, and reflection.  
  - Leveraged open-source tools (Jupyter, GitHub, Quarto) to create reproducible, FAIR-compliant teaching materials.  
  - Applied real-world pharmacology case studies and interactive simulations to foster research-oriented learning.  
  - Pioneered blended learning approaches, combining digital resources with in-person tutorials.  
  - Released all course materials openly, promoting accessibility, transparency, and reusability.  
  - Received highly positive student evaluations for interactivity, structure, and practical relevance.  
  ],
)


== Research Project–Based Teaching

#table(
  columns: (4fr, 6fr),

  table.header(
    [Course], [Description],
  ),

  //
  [
    #tags("Digital Twins", "Pharmacometrics", "Open & FAIR") *X-Student Research Group: Digital Twins in Action – Optimizing Direct Oral Anticoagulant Use* \
    Berlin University Alliance (BUA) \
    10/2025 – 03/2026 (2 SWS)
  ],
  [
  - Leading students in developing a digital twin of apixaban to simulate pharmacokinetics and clinical outcomes.  
  - Combining lectures, tutorials, and hands-on modeling for experiential learning.  
  - Enabling participants to explore personalized dosing strategies and safety aspects in anticoagulant therapy.  
  ],

  //
  [
    #tags("Digital Twins", "Pharmacometrics") *X-Student Research Group: Physiologically Based Digital Twins for Hypertension Therapy* \
    Berlin University Alliance (BUA) \
    04/2023 – 09/2023 (2 SWS)
  ],
  [
  - Supervised interdisciplinary teams modeling hydrochlorothiazide and lisinopril using PBPK methods.  
  - Trained students in absorption, distribution, metabolism, and excretion (ADME) processes.  
  - Fostered collaboration between STEM and medical students in clinically relevant pharmacology projects.  
  ],

  //
  [
    #tags("Digital Twins", "Pharmacometrics") *X-Student Research Group: Physiologically Based Modeling of ACE Inhibitors* \
    Berlin University Alliance (BUA) \
    10/2022 – 03/2023 (2 SWS)
  ],
  [
  - Guided students in developing PBPK models for lisinopril and ramipril.  
  - Integrated lectures, tutorials, and project-based work to link theory with practice.  
  - Strengthened student competencies in computational pharmacokinetics and systems medicine.  
  ],
)


== Lecture and Course–Based Teaching


#table(
  columns: (4fr, 6fr),

  table.header(
    [Course], [Description],
  ),
  //
  [
    #tags("Pharmacometrics") *Theory, Tools and Methods in Biology – Pharmacokinetic/Pharmacodynamic Modeling* \
    Humboldt-Universität zu Berlin (HU) \
    04/2025 – 09/2025 (2 SWS)\
    04/2024 – 09/2024 (2 SWS)\
    04/2023 – 09/2023 (2 SWS)\
  ],
  [
    - Led pharmacokinetic modeling submodule (DHPE-PKPD)  
    - Designed and delivered lectures on drug distribution, clearance, elimination, PBPK modeling, and PD  
    - Integrated clinical applications and drug–drug interaction case studies  
    - Developed submodule as part of the DHPE program
  ],
  //
  [
    #tags("AI") *Important Models of Quantitative Biology from the Literature* \
    Humboldt-Universität zu Berlin (HU) \
    10/2021 – 03/2022 (2 SWS)\
    10/2020 – 03/2021 (2 SWS)\
    10/2019 – 03/2020 (2 SWS)\
    10/2018 – 03/2019 (2 SWS)
  ],
  [
    - Taught core methods for Boolean and ODE modeling in metabolism and signaling  
    - Supervised student implementation and critical analysis of published models 
    - Fostered analytical skills through structured discussion and group projects
  ],
  //
  [
    #tags("AI") *Models of Cellular Processes* \
    Humboldt-Universität zu Berlin (HU) \
    10/2019 – 03/2020 (2 SWS)
  ],
  [
    - Introduced constraint-based, Boolean, and ODE models of cellular processes  
    - Taught parameter optimization, stochastic modeling, and sensitivity analysis  
    - Applied methods to real-world biological data examples
  ],

)
= List of Publications

== Publications
1. #link("https://livermetabolism.com/assets/pdf/publication/Corradi2026_llemy.pdf")[#fa-icon("file-pdf")]#link("https://github.com/ontox-project/Llemy")[#fa-icon("git-alt")] #tags("AI") *User-driven development and evaluation of an agentic framework for analysis of large pathway diagrams*. M. Corradi, I. Djidrovski, L. Ladeira, B. Staumont, A. Verhoeven, J. Sanz Serrano, A. Rougny, A. Vaez, A. Hemedan, A. Mazein, A. Niarakis, A. de Carvalho e Silva, C. Auffray, E. Wilighagen, E. Kuchovska, F. Schreiber, I. Balaur, L. Calzone, L. Matthews, L. Veschini, M. E. Gillespie, M. Kutmon, M. König, M. van Welzen, N. Hiroi, O. Lopata, P. Klemmer, R. Overall, T. Hofer, V. Satagopam, R. Schneider, M. Teunis, L. Geris, and M. Ostaszewski; Bioinformatics Advances (2026), vbag277, #link("https://doi.org/10.1093/bioadv/vbag277")[10.1093/bioadv/vbag277], IF: *2.6*
2. #link("https://livermetabolism.com/assets/pdf/publication/Balaur2026_fairification.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/fair-ca-visualization")[#fa-icon("git-alt")] #tags("Open & FAIR") *A system for FAIR assessment of computational biology models and simulations based on RDA indicators*. I. Balaur, D. P. Nickerson, D. Welter, J. A. Wodke, F. Ancien, T. Gebhardt, V. Grouès, H. Hermjakob, M. König, N. Radde, A. Rougny, R. Schneider, R. S. Malik-Sheriff, K. B. Shiferaw, M. Stefan, V. Satagopam, and D. Waltemath; npj Systems Biology and Applications (2026), #link("https://doi.org/10.1038/s41540-026-00828-7")[10.1038/s41540-026-00828-7], IF: *4.4*
3. #link("https://livermetabolism.com/assets/pdf/publication/Olivier2026_fbc.v3.pdf")[#fa-icon("file-pdf")]#link("https://github.com/sbmlteam/sbml-specifications")[#fa-icon("git-alt")] #tags("Open & FAIR") *SBML Level 3 Package: Flux Balance Constraints version 3*. B. G. Olivier, F. T. Bergmann, S. Keating, and M. König; J Integr Bioinform. 2026; 20260006, #link("https://doi.org/10.1515/jib-2026-0006")[10.1515/jib-2026-0006], IF: *1.5*, #underline[Last author]
4. #link("https://livermetabolism.com/assets/pdf/publication/Pathirana2026_petab.v2.pdf")[#fa-icon("file-pdf")]#link("https://github.com/PEtab-dev/")[#fa-icon("git-alt")] #tags("Open & FAIR") *The Parameter Estimation tables (PEtab) format version 2*. D. Pathirana, F. Fröhlich, S. Persson, F. T. Bergmann, M. König, P. F. Lang, S. Bang, S. Kemmer, J. Hasenauer, and D. Weindl; J Integr Bioinform. , #link("https://doi.org/10.1515/jib-2026-0004")[10.1515/jib-2026-0004], IF: *1.5*
5. #link("https://livermetabolism.com/assets/pdf/publication/Sego2026_efect.pdf")[#fa-icon("file-pdf")]#link("https://github.com/tjsego/ssr_project_2024")[#fa-icon("git-alt")] #tags("Open & FAIR") *EFECT enables reliable and reproducible stochastic simulations across disciplines*. T. J. Sego, M. König, L. L. Fonseca, D. Pathirana, F. T. Bergmann, H. E. Grecco, M. Silberberg, S. Ray, B. Fain, A. C. Knapp, K. Tiwari, H. Hermjakob, H. M. Sauro, J. A. Glazier, R. C. Laubenbacher, and R. S. Malik-Sheriff; npj Complex (2026), #link("https://doi.org/10.1038/s44260-026-00094-y")[10.1038/s44260-026-00094-y], IF: *1.6*
6. #link("https://livermetabolism.com/assets/pdf/publication/Elias2026_dapagliflozin.physiome.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dapagliflozin-model")[#fa-icon("git-alt")] #tags("Pharmacometrics", "Open & FAIR") *Reproducibility of a Physiologically Based Pharmacokinetic and Pharmacodynamic (PBPK/PD) Model of Dapagliflozin*. M. Elias, M. Myshkina, N. Nemitz, and M. König; Physiome. May 13, 2026, #link("https://doi.org/10.36903/physiome.31368556")[10.36903/physiome.31368556], #underline[Last author]
7. #link("https://livermetabolism.com/assets/pdf/publication/Bafna2026_segmentation.pdf")[#fa-icon("file-pdf")]#link("https://doi.org/10.5281/zenodo.17041227")[#fa-icon("git-alt")] #tags("AI", "Digital Pathology") *Automated Segmentation of Hepatic Vessels and Lobules in Whole-Slide Images Using U-Net Models*. M. Bafna, M. König, S. Saalfeld, V. Moulisova, V. Liska, U. Dahmen, and M. Albadry; Front. Bioinform. 6:1713736, #link("https://doi.org/10.3389/fbinf.2026.1713736")[10.3389/fbinf.2026.1713736], IF: *3.9*
8. #link("https://livermetabolism.com/assets/pdf/publication/Sauro2026_fair.to.cure.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *From FAIR to CURE: Guidelines for Computational Models of Biological Systems*. H. M. Sauro, E. Agmon, M. L. Blinov, J. H. Gennari, J. Hellerstein, A. Heydarabadipour, P. Hunter, B. E. Jardine, E. May, D. P. Nickerson, L. P. Smith, G. D. Bader, F. Bergmann, P. M. Boyle, A. Drager, J. R. Faeder, S. Feng, J. Freire, F. Frohlich, J. A. Glazier, T. E. Gorochowski, T. Helikar, S. Hoops, P. Imoukhuede, S. M. Keating, M. König, R. Laubenbacher, L. M. Loew, C. F. Lopez, W. W. Lytton, A. McCulloch, P. Mendes, C. J. Myers, J. G. Myers, L. Mulugeta, A. Niarakis, D. D. van Niekerk, B. G. Olivier, A. A. Patrie, E. M. Quardokus, N. Radde, J. M. Rohwer, S. Sahle, J. C. Schaff, T. Sego, J. Shin, J. L. Snoep, R. Vadigepalli, H. S. Wiley, D. Waltemath, and I. Moraru; npj Syst Biol Appl (2026), #link("https://doi.org/10.1038/s41540-026-00651-0")[10.1038/s41540-026-00651-0], IF: *3.6*
9. #link("https://livermetabolism.com/assets/pdf/publication/Nemitz2026_dapagliflozin.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dapagliflozin-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A Physiologically Based Pharmacokinetic and Pharmacodynamic (PBPK/PD) Model of Dapagliflozin in Type 2 Diabetes Mellitus: The Effect of Dosing, Hepatorenal Impairment, and Food*. N. Nemitz, M. Elias, and M. König; Pharmaceutics 2026, 18(3), 287, #link("https://doi.org/10.3390/pharmaceutics18030287")[10.3390/pharmaceutics18030287], IF: *6.9*, #underline[Last author]
10. #link("https://livermetabolism.com/assets/pdf/publication/Tensil2026_losartan.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/losartan-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A Digital Twin of the Angiotensin II Receptor Blocker Losartan: Physiologically Based Modeling of Blood Pressure Regulation*. E. Tensil, M. Myshkina, and M. König; Pharmaceutics 2026, 18(2), 262; https://doi.org/10.3390/pharmaceutics18020262, #link("https://doi.org/10.3390/pharmaceutics18020262")[10.3390/pharmaceutics18020262], IF: *6.9*, #underline[Last author]
11. #link("https://livermetabolism.com/assets/pdf/publication/Myshkina2026_losartan.physiome.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/losartan-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") *Reproducibility of a Digital Twin of the Angiotensin II Receptor Blocker Losartan*. M. Myshkina, M. Elias, E. Tensil, and M. König; Physiome. February 2, 2026, #link("https://doi.org/10.36903/physiome.31359823")[10.36903/physiome.31359823], #underline[Last author]
12. #link("https://livermetabolism.com/assets/pdf/publication/Elias2025_glimepiride.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/glimepiride-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A Digital Twin of Glimepiride for Personalized and Stratified Diabetes Treatment*. M. Elias and M. König; Front. Pharmacol. 16:1686415., #link("https://doi.org/10.3389/fphar.2025.1686415")[10.3389/fphar.2025.1686415], IF: *4.8*, #underline[Last author]
13. #link("https://livermetabolism.com/assets/pdf/publication/Elias2025_glimepiride.physiome.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/glimepiride-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Open & FAIR") *Reproducibility of a Digital Twin of Glimepiride for Personalized and Stratified Diabetes Treatment*. M. Elias and M. König; Physiome. October 20, 2025, #link("https://doi.org/10.36903/physiome.28379193")[10.36903/physiome.28379193], #underline[Last author]
14. #link("https://livermetabolism.com/assets/pdf/publication/Baum2025_diabetic.neuropathy.pdf")[#fa-icon("file-pdf")] #tags("AI") *Inflammation and autophagy in peripheral nerves of rodent models with metabolic syndrome and type 2 diabetes mellitus*. P. Baum, T. Ebert, N. Klöting, S. Krupka, M. König, S. Paeschke, P. Stock, M. Bulc, M. Blüher, K. Palus, M. Nowicki, and J. Kosacka; Neurosci Res. 2025 Apr 17:S0168-0102(25)00070-7, #link("https://doi.org/10.1016/j.neures.2025.04.002")[10.1016/j.neures.2025.04.002], IF: *2.4*
15. #link("https://livermetabolism.com/assets/pdf/publication/Eissazadeh2025_endoglin.pdf")[#fa-icon("file-pdf")] #tags("AI") *Anti-Endoglin monoclonal antibody prevents the progression of liver sinusoidal endothelial inflammation and fibrosis in MASH*. S. Eissazadeh, P. Fikrova, J. U. Rathouska, I. Nemeckova, K. Tripska, M. Vasinova, R. Havelek, S. Mohammadi, I. C. Igreja Sa, C. Theuer, M. König, S. Micuda, and P. Nachtigal; Life Sci. 2025 Jan 29:123428, #link("https://doi.org/10.1016/j.lfs.2025.123428")[10.1016/j.lfs.2025.123428], IF: *5.2*
16. #link("https://livermetabolism.com/assets/pdf/publication/Golebiewski2024_standards.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Specifications of standards in systems and synthetic biology: status, developments, and tools in 2024*. M. Golebiewski, G. Bader, P. Gleeson, T. E. Gorochowski, S. M. Keating, M. König, C. J. Myers, D. P. Nickerson, B. Sommer, D. Waltemath, and F. Schreiber; J Integr Bioinform. 2024 Jul 22, #link("https://doi.org/10.1515/jib-2024-0015")[10.1515/jib-2024-0015], IF: *1.5*
17. #link("https://livermetabolism.com/assets/pdf/publication/Albadry2024_species.comparison.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/zonation-image-analysis")[#fa-icon("git-alt")] #tags("AI", "Digital Pathology") *Cross-Species Variability in Lobular Geometry and Cytochrome P450 Hepatic Zonation: Insights into CYP1A2, CYP2E1, CYP2D6 and CYP3A4*. M. Albadry, J. Kuettner, J. Grzegorzewski, O. Dirsch, E. Kindler, R. Klopfleisch, V. Liska, V. Moulisova, S. Nickel, R. Palek, J. Rosendorf, S. Saalfeld, U. Settmacher, H. Tautenhahn, M. KönigΔ, and U. DahmenΔ (Δ equal contribution); Front Pharmacol. 2024 May 16;15:1404938, #link("https://doi.org/10.3389/fphar.2024.1404938")[10.3389/fphar.2024.1404938], IF: *5.4*, #underline[Last Equal author]
18. #link("https://livermetabolism.com/assets/pdf/publication/Hoepfl2024_baymodts.pdf")[#fa-icon("file-pdf")]#link("https://github.com/Systems-Theory-in-Systems-Biology/BayModTS")[#fa-icon("git-alt")] #tags("AI", "Open & FAIR") *Bayesian modelling of time series data (BayModTS)-a FAIR workflow to process sparse and highly variable data*. S. Höpfl, M. Albadry, U. Dahmen, K. H. Herrmann, E. M. Kindler, M. König, J. R. Reichenbach, H. M. Tautenhahn, W. Wei, W. T. Zhao, and N. E. Radde; Bioinformatics. 2024 May 2;40(5):btae312, #link("https://doi.org/10.1093/bioinformatics/btae312")[10.1093/bioinformatics/btae312], IF: *6.0*
19. #link("https://livermetabolism.com/assets/pdf/publication/Smith2024_sed.ml.l1v5.pdf")[#fa-icon("file-pdf")]#link("https://github.com/SED-ML/sed-ml")[#fa-icon("git-alt")] #tags("Open & FAIR") *The simulation experiment description markup language (SED-ML): language specification for level 1 version 5*. L. P. Smith, F. T. Bergmann, A. Garny, T. Helikar, J. Karr, D. Nickerson, H. Sauro, D. Waltemath, and M. König; J Integr Bioinform. 2024 Apr 15, #link("https://doi.org/10.1515/jib-2024-0008")[10.1515/jib-2024-0008], IF: *1.5*, #underline[Last author]
20. #link("https://livermetabolism.com/assets/pdf/publication/Lambers2024_fat.zonation.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins", "AI", "Digital Pathology") *Quantifying fat zonation in liver lobules: an integrated multiscale in silico model combining disturbed microperfusion and fat metabolism via a continuum biomechanical bi-scale, tri-phasic approach*. L. Lambers, N. Waschinsky, J. Schleicher, M. König, H. Tautenhahn, M. Albadry, U. Dahmen, and T. Ricken; Biomech Model Mechanobiol. 2024 Feb 25., #link("https://doi.org/10.1007/s10237-023-01797-0")[10.1007/s10237-023-01797-0], IF: *3.1*
21. #link("https://livermetabolism.com/assets/pdf/publication/Kohrs2023_open.science.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Eleven Strategies for Making Reproducible Research and Open Science Training the Norm at Research Institutions*. F. E. Kohrs, S. Auer, A. Bannach-Brown, S. Fiedler, T. L. Haven, V. Heise, C. Holman, F. Azevedo, R. Bernard, A. Bleier, N. Bössel, B. P. Cahill, L. J. Castro, A. Ehrenhofer, K. Eichel, M. Frank, C. Frick, M. Friese, A. Gärtner, K. Gierend, D. J. Grüning, L. Hahn, M. Hülsemann, M. Ihle, S. Illius, L. König, M. König, L. Kulke, A. Kutlin, F. Lammers, D. M. A. Mehler, C. Miehl, A. Müller-Alcazar, C. Neuendorf, H. Niemeyer, F. Pargent, A. Peikert, C. U. Pfeuffer, R. Reinecke, J. P. Röer, J. L. Rohmann, A. Sánchez-Tójar, S. Scherbaum, E. Sixtus, L. Spitzer, V. M. Straßburger, M. Weber, C. J. Whitmire, J. Zerna, D. Zorbek, P. Zumstein, and T. L. Weissgerber; eLife (2023) 12:e89736., #link("https://doi.org/10.7554/eLife.89736")[10.7554/eLife.89736], IF: *6.4*
22. #link("https://livermetabolism.com/assets/pdf/publication/Maheshvare2023_pancreas.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/pancreas-model")[#fa-icon("git-alt")] #tags("AI") *A pathway model of glucose-stimulated insulin secretion in the pancreatic β-cell*. M. D. Maheshvare, S. Raha, M. KönigΔ, and D. PalΔ (Δ equal contribution); Front. Endocrinol. 14:1185656, #link("https://doi.org/10.3389/fendo.2023.1185656")[10.3389/fendo.2023.1185656], IF: *5.7*, #underline[Last Equal author]
23. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2023_standards.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Specifications of Standards in Systems and Synthetic Biology: Status and Developments in 2022 and the COMBINE meeting 2022*. M. König, P. Gleeson, M. Golebiewski, T. Gorochowski, M. Hucka, S. Keating, C. Myers, D. Nickerson, and F. Schreiber; J Integr Bioinform. 2023 Mar 29;20(1)., #link("https://doi.org/10.1515/jib-2023-0004")[10.1515/jib-2023-0004], IF: *1.5*, #underline[First author]
24. #link("https://livermetabolism.com/assets/pdf/publication/Welsh2023_libroadrunner.2.0.pdf")[#fa-icon("file-pdf")]#link("https://github.com/sys-bio/roadrunner/")[#fa-icon("git-alt")] #tags("Open & FAIR") *libRoadRunner 2.0: A High-Performance SBML Simulation and Analysis Library*. C. Welsh, J. Xu, L. Smith, M. König, K. Choi, and H. M. Sauro; Bioinformatics. 2023 Jan 1;39(1):btac770, #link("https://doi.org/10.1093/bioinformatics/btac770")[10.1093/bioinformatics/btac770], IF: *6.0*
25. #link("https://livermetabolism.com/assets/pdf/publication/Albadry2022_cyp450.steatosis.pdf")[#fa-icon("file-pdf")] #tags("AI", "Digital Pathology") *Cytochrome p450 enzymes in periportal steatosis: Modulation of drug metabolizing activity but not of pericentral expression pattern*. M. Albadry, S. Höpfl, N. Ehteshamzad, M. König, M. Böttcher, J. Neumann, A. Lupp, O. Dirsch, N. Radde, B. Christ, M. Christ, L. Schwen, H. Laue, R. Klopfleisch, and U. Dahmen; Sci Rep. 2022 Dec 17;12(1):21825, #link("https://doi.org/10.1038/s41598-022-26483-6")[10.1038/s41598-022-26483-6], IF: *3.8*
26. #link("https://livermetabolism.com/assets/pdf/publication/Grzegorzewski2022_dextromethorphan.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/dextromethorphan-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Physiologically based pharmacokinetic (PBPK) modeling of the role of CYP2D6 polymorphism for metabolic phenotyping with dextromethorphan*. J. Grzegorzewski, J. Brandhorst, and M. König; Front Pharmacol. 2022 Oct 24;13:1029073, #link("https://doi.org/10.3389/fphar.2022.1029073")[10.3389/fphar.2022.1029073], IF: *4.4*, #underline[Last author]
27. #link("https://livermetabolism.com/assets/pdf/publication/Shaikh2022_biosimulators.pdf")[#fa-icon("file-pdf")]#link("https://github.com/biosimulators")[#fa-icon("git-alt")] #tags("Open & FAIR") *BioSimulators: a central registry of simulation engines and services for recommending specific tools*. B. Shaikh, L. P. Smith, D. Vasilescu, G. Marupilla, M. Wilson, E. Agmon, H. Agnew, S. S. Andrews, A. Anwar, M. E. Beber, F. T. Bergmann, D. Brooks, L. Brusch, L. Calzone, K. Choi, J. Cooper, J. Detloff, B. Drawert, M. Dumontier, G. B. Ermentrout, J. R. Faeder, A. P. Freiburger, F. Fröhlich, A. Funahashi, A. Garny, J. H. Gennari, P. Gleeson, A. Goelzer, Z. Haiman, J. Hasenauer, J. L. Hellerstein, H. Hermjakob, S. Hoops, J. C. Ison, D. Jahn, H. V. Jakubowski, R. Jordan, M. Kalaš, M. König, W. Liebermeister, R. S. M. Sheriff, S. Mandal, R. McDougal, J. K. Medley, P. Mendes, R. Müller, C. J. Myers, A. Naldi, T. V. N. Nguyen, D. P. Nickerson, B. G. Olivier, D. Patoliya, L. Paulevé, L. R. Petzold, A. Priya, A. K. Rampadarath, J. M. Rohwer, A. S. Saglam, D. Singh, A. Sinha, J. Snoep, H. Sorby, R. Spangler, J. Starruß, P. J. Thomas, D. van Niekerk, D. Weindl, F. Zhang, A. Zhukova, A. P. Goldberg, J. C. Schaff, M. L. Blinov, H. M. Sauro, I. I. Moraru, and J. R. Karr; Nucleic Acids Res. 2022 May 7;50(W1):W108–14, #link("https://doi.org/10.1093/nar/gkac331")[10.1093/nar/gkac331], IF: *16.7*
28. #link("https://livermetabolism.com/assets/pdf/publication/Grzegorzewski2022_caffeine.meta.pdf")[#fa-icon("file-pdf")] #tags("Pharmacometrics") *Pharmacokinetics of caffeine: A systematic analysis of reported data for application in metabolic phenotyping and liver function testing*. J. Grzegorzewski, F. Bartsch, A. Köller, and M. König; Frontiers in Pharmacology 2022, Vol12, #link("https://doi.org/10.3389/fphar.2021.752826")[10.3389/fphar.2021.752826], IF: *4.4*, #underline[Last author]
29. #link("https://livermetabolism.com/assets/pdf/publication/Koeller2021_icg.hepatectomy.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/icg-model.git")[#fa-icon("git-alt")] #tags("AI", "Pharmacometrics") *Prediction of survival after hepatectomy using a physiologically based pharmacokinetic model of indocyanine green liver function tests*. A. Köller, J. Grzegorzewski, M. Tautenhahn, and M. König; Front. Physiol., 22 November 2021, #link("https://doi.org/10.3389/fphys.2021.730418")[10.3389/fphys.2021.730418], IF: *3.2*, #underline[Last author]
30. #link("https://livermetabolism.com/assets/pdf/publication/Koeller2021_icg.variability.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/icg-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Physiologically based modeling of the effect of physiological and anthropometric variability on indocyanine green based liver function tests*. A. Köller, J. Grzegorzewski, and M. König; Front Physiol. 2021 Nov 22;12:757293, #link("https://doi.org/10.3389/fphys.2021.757293")[10.3389/fphys.2021.757293], IF: *3.2*, #underline[Last author]
31. #link("https://livermetabolism.com/assets/pdf/publication/Schreiber2021_synthetic.biology.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Specifications of Standards in Systems and Synthetic Biology: Status and Developments in 2021*. F. Schreiber, P. Gleeson, M. Golebiewski, T. Gorochowski, M. Hucka, S. Keating, M. König, C. Myers, D. Nickerson, and D. Walthemath; J Integr Bioinform. 2021 Oct 22;18(3):20210026</a>, #link("https://doi.org/10.1515/jib-2021-0026")[10.1515/jib-2021-0026], IF: *1.5*
32. #link("https://livermetabolism.com/assets/pdf/publication/Yamada2021_sbmlwebapp.pdf")[#fa-icon("file-pdf")]#link("https://github.com/TakahiroYamada/SBMLWebApp")[#fa-icon("git-alt")] #tags("Open & FAIR") *SBMLWebApp: Web-based Simulation, Steady-State Analysis, and Parameter Estimation of Systems Biology Models*. T. G. Yamada, K. Ii, M. König, M. Feierabend, A. Dräger, and A. Funahashi; Processes 9, no. 10: 1830, #link("https://doi.org/10.3390/pr9101830")[10.3390/pr9101830], IF: *2.8*
33. #link("https://livermetabolism.com/assets/pdf/publication/Smith2021_sed.ml.l1v4.pdf")[#fa-icon("file-pdf")]#link("https://github.com/SED-ML/")[#fa-icon("git-alt")] #tags("Open & FAIR") *The simulation experiment description markup language (SED-ML): language specification for level 1 version 4*. L. P. Smith, F. T. Bergmann, A. Garny, T. Helikar, J. Karr, D. Nickerson, H. Sauro, D. Waltemath, and M. König; Journal of Integrative Bioinformatics, vol. 18, no. 3, 2021, pp. 20210021, #link("https://doi.org/10.1515/jib-2021-0021")[10.1515/jib-2021-0021], IF: *1.5*, #underline[Last author]
34. #link("https://livermetabolism.com/assets/pdf/publication/Panchiwala2021_sbscl.pdf")[#fa-icon("file-pdf")]#link("https://github.com/draeger-lab/SBSCL")[#fa-icon("git-alt")] #tags("Open & FAIR") *The Systems Biology Simulation Core Library*. H. Panchiwala, S. Shah, H. Planatscher, M. Zakharchuk, M. König, and A. Dräger;  Bioinformatics. 2022 Jan 12;38(3):864-865, #link("https://doi.org/10.1093/bioinformatics/btab669")[10.1093/bioinformatics/btab669], IF: *6.0*
35. #link("https://livermetabolism.com/assets/pdf/publication/Gennari2021_omex.spec.1.2.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *OMEX Metadata Specification Version 1.2*. J. Gennari, M. König, G. Misirli, M. Neal, D. Nickerson, and D. Waltemath; J Integr Bioinform. 2021 Oct 20;18(3):20210020, #link("https://doi.org/10.1515/jib-2021-0020")[10.1515/jib-2021-0020], IF: *1.5*
36. #link("https://livermetabolism.com/assets/pdf/publication/Grzegorzewski2020_pkdb.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/pkdb")[#fa-icon("git-alt")] #tags("Pharmacometrics", "Open & FAIR") *PK-DB: pharmacokinetics database for individualized and stratified computational modeling*. J. Grzegorzewski, J. Brandhorst, K. Green, D. Eleftheriadou, Y. Duport, F. Barthorscht, A. Köller, D. Y. J. Ke, S. De Angelis, and M. König; Nucleic Acids Res. 2021 Jan 8;49(D1):D1358-D1364, #link("https://doi.org/10.1093/nar/gkaa990")[10.1093/nar/gkaa990], IF: *16.7*, #underline[Last author]
37. #link("https://livermetabolism.com/assets/pdf/publication/Keating2020_sbml.pdf")[#fa-icon("file-pdf")]#link("https://sourceforge.net/projects/sbml/")[#fa-icon("git-alt")] #tags("Open & FAIR") *SBML Level 3: an extensible format for the exchange and reuse of biological models*. S. M. Keating, D. Waltemath, M. König, F. Zhang, A. Dräger, C. Chaouiya, F. T. Bergmann, A. Finney, C. S. Gillespie, T. Helikar, S. Hoops, R. S. Malik-Sheriff, S. L. Moodie, I. I. Moraru, C. J. Myers, A. Naldi, B. G. Olivier, S. Sahle, J. C. Schaff, L. P. Smith, M. J. Swat, DT, L. Watanabe, D. J. Wilkinson, M. L. Blinov, K. Begley, J. R. Faeder, H. F. Gómez, T. M. Hamm, Y. Inagaki, W. Liebermeister, A. L. Lister, D. Lucio, E. Mjolsness, C. J. Proctor, K. Raman, N. Rodriguez, C. A. Shaffer, B. E. Shapiro, J. Stelling, N. Swainston, N. Tanimura, J. Wagner, M. Meier-Schellersheim, H. M. Sauro, B. Palsson, H. Bolouri, H. Kitano, A. Funahashi, H. Hermjakob, J. C. Doyle, M. Hucka, and SBML Community members; Mol Syst Biol. 2020;16(8):e9110, #link("https://doi.org/10.15252/msb.20199110")[10.15252/msb.20199110], IF: *8.8*
38. #link("https://livermetabolism.com/assets/pdf/publication/Neal2020_omex.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Open modeling and exchange (OMEX) metadata specification version 1.0*. M. L. Neal, J. H. Gennari, D. Waltemath, D. P. Nickerson, and M. König; J Integr Bioinform. 2020 Jun 25;17(2-3):20200020, #link("https://doi.org/10.1515/jib-2020-0020")[10.1515/jib-2020-0020], IF: *1.5*, #underline[Last author]
39. #link("https://livermetabolism.com/assets/pdf/publication/Schreiber2020_synthetic.biology.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Specifications of Standards in Systems and Synthetic Biology:Status and Developments in 2020*. F. Schreiber, B. Sommer, G. Bader, P. Gleeson, M. Golebiewski, T. Gorochowski, M. Hucka, S. Keating, M. König, C. Myers, D. Nickerson, and D. Walthemath; J Integr Bioinform. 2020 Jun 29;17(2-3):20200022, #link("https://doi.org/10.1515/jib-2020-0022")[10.1515/jib-2020-0022], IF: *1.5*
40. #link("https://livermetabolism.com/assets/pdf/publication/Waltemath2020_combine2019.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *The first 10 years of the international coordination network for standards in systems and synthetic biology (COMBINE)*. D. Waltemath, M. Golebiewski, M. Blinov, P. Gleeson, H. Hermjakob, E. Inau, S. Keating, M. König, O. Krebs, R. Malik-Sheriff, D. Nickerson, E. Oberortner, H. Sauro, F. Schreiber, L. Smith, M. Stefan, U. Wittig, and C. Myers; J Integr Bioinform. 2020 Jun 29;17(2-3):20200005, #link("https://doi.org/10.1515/jib-2020-0005")[10.1515/jib-2020-0005], IF: *1.5*
41. #link("https://livermetabolism.com/assets/pdf/publication/Smith2020_sbml.distrib.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *The Distributions Package for SBML Level 3*. L. Smith, S. Moodie, F. Bergmann, C. Gillespie, S. Keating, M. König, C. Myers, M. Swat, D. Wilkinson, and M. Hucka; J Integr Bioinform. 2020 Jul 20;17(2-3):20200018, #link("https://doi.org/10.1515/jib-2020-0018")[10.1515/jib-2020-0018], IF: *1.5*
42. #link("https://livermetabolism.com/assets/pdf/publication/Lieven2020_memote.pdf")[#fa-icon("file-pdf")]#link("https://github.com/opencobra/memote")[#fa-icon("git-alt")] #tags("Open & FAIR") *MEMOTE for standardized genome-scale metabolic model testing*. C. Lieven, M. E. Beber, B. G. Olivier, F. T. Bergmann, M. Ataman, P. Babaei, J. A. Bartell, L. M. Blank, S. Chauhan, K. Correia, C. Diener, A. Dräger, B. E. Ebert, J. N. Edirisinghe, J. P. Faria, A. Feist, G. Fengos, R. M. T. Fleming, B. Garcia-Jimenez, V. Hatzimanikatis, W. van Helvoirt, C. Henry, H. Hermjakob, M. J. Herrgard, H. U. Kim, Z. King, J. J. Koehorst, M. König, S. Klamt, E. Klipp, M. Lakshmanan, N. Le Novere, D. Lee, S. Y. Lee, S. Lee, N. E. Lewis, H. Ma, D. Machado, R. Mahadevan, P. Maia, A. Mardinoglu, G. L. Medlock, J. Monk, J. Nielsen, L. K. Nielsen, J. Nogales, I. Nookaew, O. Resendis, B. Palsson, J. A. Papin, K. R. Patil, M. Poolman, N. D. Price, A. Richelle, I. Rocha, B. Sanchez, P. Schaap, R. S. Malik Sheriff, S. Shoaie, N. Sonnenschein, B. Teusink, P. Vilaca, J. O. Vik, J. A. Wodke, J. C. Xavier, Q. Yuan, M. Zakhartsev, and C. Zhang; Nat Biotechnol. 2020;38(3):272-276, #link("https://doi.org/10.1038/s41587-020-0446-y")[10.1038/s41587-020-0446-y], IF: *33.1*
43. #link("https://livermetabolism.com/assets/pdf/publication/Schreiber2019_combine.editorial.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Specifications of Standards in Systems and Synthetic Biology: Status and Developments in 2019*. F. Schreiber, G. Bader, P. Gleeson, M. Golebiewski, M. Hucka, S. M. Keating, M. König, C. Myers, D. Nickerson, B. Sommer, and D. Waltemath; J Integr Bioinform. 2019 Jul 13;16(2), #link("https://doi.org/10.1515/jib-2019-0035")[10.1515/jib-2019-0035], IF: *1.5*
44. #link("https://livermetabolism.com/assets/pdf/publication/Hucka2019_sbml.l3v2.core.pdf")[#fa-icon("file-pdf")]#link("https://sourceforge.net/projects/sbml/")[#fa-icon("git-alt")] #tags("Open & FAIR") *The Systems Biology Markup Language (SBML): Language Specification for Level 3 Version 2 Core*. M. Hucka, F. Bergmann, C. Chaouiya, A. Dräger, S. Hoops, S. Keating, M. König, N. Le Novere, C. Myers, B. Olivier, S. Sahle, J. Schaff, R. Sheriff, L. Smith, D. Waltemath, D. Wilkinson, and F. Zhang; J Integr Bioinform. 2019 Jun 20;16(2);, #link("https://doi.org/10.1515/jib-2019-0021")[10.1515/jib-2019-0021], IF: *1.5*
45. #link("https://livermetabolism.com/assets/pdf/publication/Choi2018_tellurium.pdf")[#fa-icon("file-pdf")]#link("https://github.com/sys-bio/tellurium")[#fa-icon("git-alt")] #tags("Open & FAIR") *Tellurium: An Extensible Python-based Modeling Environment for Systems and Synthetic Biology*. K. Choi, K. Medley, M. König, K. Stocking, L. Smith, S. Gu, and H. M. Sauro; Biosystems. 2018 Jul 24. pii: S0303-2647(18)30125-4, #link("https://doi.org/10.1016/j.biosystems.2018.07.006")[10.1016/j.biosystems.2018.07.006], IF: *2.0*
46. #link("https://livermetabolism.com/assets/pdf/publication/Berndt2018_hepatokin.pdf")[#fa-icon("file-pdf")] #tags("AI") *HEPATOKIN1: A Biochemistry-Based Model of Liver Metabolism Suited for Applications in Medicine and Pharmacology*. N. Berndt, S. Bulik, I. Wallach, T. Wünsch, M. König, M. Stockmann, M. Meierhofer, and H. G. Holzhütter; Nat Commun. 2018 Jun 19;9(1):2386., #link("https://doi.org/10.1038/s41467-018-04720-9")[10.1038/s41467-018-04720-9], IF: *15.4*
47. #link("https://livermetabolism.com/assets/pdf/publication/Bergmann2018_sedml.pdf")[#fa-icon("file-pdf")]#link("https://github.com/SED-ML/sed-ml")[#fa-icon("git-alt")] #tags("Open & FAIR") *Simulation Experiment Description Markup Language (SED-ML) Level 1 Version 3 (L1V3)*. F. T. Bergmann, J. Cooper, M. KönigΔ, I. Moraru, D. Nickerson, N. Le Novère, B. G. Olivier, S. Sahle, L. Smith, and D. Waltemath #highlight(fill: rgb("#e8e8e8"))[Δ corresponding author]; J Integr Bioinform. 2018 Mar 19;15(1), #link("https://doi.org/10.1515/jib-2017-0086")[10.1515/jib-2017-0086], IF: *1.5*
48. #link("https://livermetabolism.com/assets/pdf/publication/Neal2018_annotations.pdf")[#fa-icon("file-pdf")]#link("https://github.com/combine-org/Annotations")[#fa-icon("git-alt")] #tags("Open & FAIR") *Harmonizing semantic annotations for computational models in biology*. M. Neal, M. König, D. Nickerson, G. Misirli, R. Kalbasi, A. Dräger, K. Atalag, V. Chelliah, M. Cooling, D. Cook, S. Crook, M. de Alba, S. Friedman, A. Garny, J. Gennari, P. Gleeson, M. Golebiewski, M. Hucka, N. Juty, N. L. Novère, C. Myers, B. Olivier, H. Sauro, M. Scharm, J. Snoep, V. Touré, A. Wipat, O. Wolkenhauer, and D. Waltemath; Brief Bioinform. 2019 Mar 22;20(2):540-550, #link("https://doi.org/10.1093/bib/bby087")[10.1093/bib/bby087], IF: *7.9*
49. #link("https://livermetabolism.com/assets/pdf/publication/Medley2018_tellurium.pdf")[#fa-icon("file-pdf")]#link("https://github.com/sys-bio/tellurium")[#fa-icon("git-alt")] #tags("Open & FAIR") *Tellurium Notebooks — An Environment for Reproducible Dynamical Modeling in Systems Biology*. K. Medley, K. Choi, M. König, L. Smith, S. Gu, J. Hellerstein, S. Sealfon, and H. M. Sauro; PLoS Comput Biol. 2018 Jun 15;14(6):e1006220, #link("https://doi.org/10.1371/journal.pcbi.1006220")[10.1371/journal.pcbi.1006220], IF: *4.5*
50. #link("https://livermetabolism.com/assets/pdf/publication/Wholecell2016_community.standards.pdf")[#fa-icon("file-pdf")]#link("https://github.com/whole-cell-tutors")[#fa-icon("git-alt")] #tags("Open & FAIR") *Toward community standards and software for whole-cell modeling*. Wholecell Consortium (M. König); IEEE Trans Biomed Eng. 2016 Jun 10., #link("https://doi.org/10.1109/TBME.2016.2560762")[10.1109/TBME.2016.2560762], IF: *4.4*
51. #link("https://livermetabolism.com/assets/pdf/publication/Abshagen2015_cholestasis.pdf")[#fa-icon("file-pdf")]#link("http://github.com/matthiaskoenig/bdl-analysis/")[#fa-icon("git-alt")] #tags("AI") *Pathobiochemical signatures of cholestatic liver disease in bile duct ligated mice*. Kerstin A.#highlight(fill: rgb("#e8e8e8"))[Δ], M. KönigΔ, A. Hoppe, M. Thomas, I. Müller, M. Ebert, H. Weng, H. G. Holzhütter, U. M. Zanger, J. Bode, B. Vollmar, and S. Dooley (Δ equal contribution); BMC Syst Biol. 2015 Nov 20;9(1):83., #link("https://doi.org/10.1186/s12918-015-0229-0")[10.1186/s12918-015-0229-0], IF: *2.2*, #underline[First Equal author]
52. #link("https://livermetabolism.com/assets/pdf/publication/Somogyi2015_libroadrunner.pdf")[#fa-icon("file-pdf")]#link("https://github.com/sys-bio/roadrunner")[#fa-icon("git-alt")] #tags("Open & FAIR") *LibRoadRunner: a high performance SBML simulation and analysis library*. E. T. Somogyi, J. M. Bouteiller, J. A. Glazier, M. König, J. K. Medley, M. H. Swat, and H. M. Sauro; Bioinformatics. 2015 Oct 15;31(20):3315-21, #link("https://doi.org/10.1093/bioinformatics/btv363")[10.1093/bioinformatics/btv363], IF: *6.0*
53. #link("https://livermetabolism.com/assets/pdf/publication/Ricken2014_livertissue.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins") *Modeling function-perfusion behavior in liver lobules including tissue, blood, glucose, lactate and glycogen by use of a coupled two-scale PDE-ODE approach*. T. Ricken, D. Werner, H. G. Holzhütter, M. König, U. Dahmen, and O. Dirsch; Biomech Model Mechanobiol. 2015 Jun;14(3):515-36, #link("https://doi.org/10.1007/s10237-014-0619-z")[10.1007/s10237-014-0619-z], IF: *3.0*
54. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2013_cancertissue.pdf")[#fa-icon("file-pdf")] #tags("AI", "Digital Pathology") *Metabolic Gradients as Key Regulators in Zonation of Tumor Energy Metabolism: A Tissue-scale Model Based Study*. M. König, H. G. Holzhütter, and N. Berndt; Biotechnol J. 2013 Sep;8(9):1058-69., #link("https://doi.org/10.1002/biot.201200393")[10.1002/biot.201200393], IF: *3.7*, #underline[First author]
55. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2012b_glucosemodelt2dm.pdf")[#fa-icon("file-pdf")] #tags("AI") *Kinetic Modeling of Human Hepatic Glucose Metabolism in T2DM Predicts Higher Risk of Hypoglycemic Events in Rigorous Insulin Therapy*. M. König and H. G. Holzhütter; J Biol Chem. 2012 Oct 26;287(44):36978-89, #link("https://doi.org/10.1074/jbc.M112.382069")[10.1074/jbc.M112.382069], IF: *4.7*, #underline[First author]
56. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2012_cysbml.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/cy3sbml")[#fa-icon("git-alt")] #tags("Open & FAIR") *CySBML: a Cytoscape plugin for SBML*. M. König, A. Dräger, and H. G. Holzhütter; Bioinformatics. 2012 Sep 15;28(18):2402-3, #link("https://doi.org/10.1093/bioinformatics/bts432")[10.1093/bioinformatics/bts432], IF: *6.0*, #underline[First author]
57. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2012a_glucosemodel.pdf")[#fa-icon("file-pdf")] #tags("AI") *Quantifying the Contribution of the Liver to the Homeostasis of Plasma Glucose: A Detailed Kinetic Model of Hepatic Glucose Metabolism Integrated with the Hormonal Control by Insulin, Glucagon and Epinephrine*. M. König, S. Bulik, and H. G. Holzhütter; PLoS Comput Biol. 2012 Jun;8(6):e1002577. Epub 2012 Jun 21., #link("https://doi.org/10.1371/journal.pcbi.1002577")[10.1371/journal.pcbi.1002577], IF: *4.9*, #underline[First author]
58. #link("https://livermetabolism.com/assets/pdf/publication/Gille2010_hepatonet1.pdf")[#fa-icon("file-pdf")] #tags("AI") *HepatoNet1: a comprehensive metabolic reconstruction of the human hepatocyte for the analysis of liver physiology*. C. Gille, C. Bölling, A. Hoppe, S. Bulik, S. Hoffmann, K. Hübner, A. Karlstädt, R. Ganeshan, M. König, K. Rother, M. Weidlich, J. Behre, and H. G. Holzhütter; Mol Syst Biol. 2010 Sep 7;6:411, #link("https://doi.org/10.1038/msb.2010.62")[10.1038/msb.2010.62], IF: *8.6*

== Reviews
59. #link("https://livermetabolism.com/assets/pdf/publication/Christ2021_review.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins", "AI") *Hepatectomy-Induced Alterations in Hepatic Perfusion and Function - Toward Multi-Scale Computational Modeling for a Better Prediction of Post-hepatectomy Liver Function*. B. ChristΔ, M. CollatzΔ, U. DahmenΔ, K. HerrmannΔ, S. HöpflΔ, M. KönigΔ, L. LambersΔ, M. MarzΔ, D. MeyerΔ, N. RaddeΔ, J. R. ReichenbachΔ, T. RickenΔ, and H. TautenhahnΔ (Δ equal contribution); Front Physiol. 2021 Nov 18;12:733868, #link("https://doi.org/10.3389/fphys.2021.733868")[10.3389/fphys.2021.733868], IF: *3.2*, #underline[First Equal author]
60. #link("https://livermetabolism.com/assets/pdf/publication/Christ2017_surgery.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins", "AI") *Computational Modeling in Liver Surgery*. B. ChristΔ, U. DahmenΔ, K. H. HerrmannΔ, M. KönigΔ, J. R. ReichenbachΔ, T. RickenΔ, J. SchleicherΔ, L. Ole SchwenΔ, S. VlaicΔ, and N. WaschinskyΔ (Δ equal contribution); Front Physiol. 2017 Nov 14;8:906, #link("https://doi.org/10.3389/fphys.2017.00906")[10.3389/fphys.2017.00906], IF: *3.2*, #underline[First Equal author]
61. #link("https://livermetabolism.com/assets/pdf/publication/Herling2011_cancerglucosereview.pdf")[#fa-icon("file-pdf")] #tags("AI") *Enzymatic Features of the Glucose Metabolism in Tumor Cells*. A. Herling, M. König, S. Bulik, and H. G. Holzhütter; FEBS J. 2011 Jul;<b>278</b>(14):2436-59, #link("https://doi.org/10.1111/j.1742-4658.2011.08174.x")[10.1111/j.1742-4658.2011.08174.x], IF: *5.4*

== Proceedings
62. #link("https://livermetabolism.com/assets/pdf/publication/Tautenhahn2024_simliva.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins", "AI") *SimLivA – Modelling ischemia reperfusion injury in the liver: A first step towards a clinical decision support tool*. H. Tautenhahn, T. Ricken, U. Dahmen, L. Mandl, L. Bütow, S. Gerhäusser, L. Lambers, X. Chen, E. Lehmann, O. Dirsch, and M. König; GAMM-Mitteilungen. (2024), e202370003, #link("https://doi.org/10.1002/gamm.202370003")[10.1002/gamm.202370003], #underline[Last author]
63. #link("https://livermetabolism.com/assets/pdf/publication/Ricken2020_gacm.report.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins") *QuaLiPerF – Multi-X Liver Modelling*. T. Ricken, L. Lambers, B. Christ, U. Dahmen, K. Herrmann, M. König, M. Marz, N. Radde, J. R. Reichenbach, L. O. Schwen, and H. Tautenhahn; GACM - German Association for Computational Mechanics Report, winter 2020: No. 13
64. #link("https://livermetabolism.com/assets/pdf/publication/Lambers2019_mor.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins") *Model Order Reduction (MOR) of Function-Perfusion-Growth Simulation in the Human Fatty Liver via Artificial Neural Network (ANN)*. L. Lambers, T. Ricken, and M. König; Proceedings in Applied Mathematics & Mechanics, PAMM, 2019, #link("https://doi.org/10.1002/pamm.201900429")[10.1002/pamm.201900429], #underline[Last author]
65. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2016_models2clinics.pdf")[#fa-icon("file-pdf")] #tags("AI", "Open & FAIR") *Challenges and opportunities for system biology standards and tools in medical research*. M. KönigΔ, A. Oellrich#highlight(fill: rgb("#e8e8e8"))[Δ], D. Waltemath#highlight(fill: rgb("#e8e8e8"))[Δ], R. Dobson, T. Hubbard, and O. Wolkenhauer (Δ equal contribution); ODLS, p1-6, 2016, #underline[First Equal author]
66.  #tags("Digital Twins") *On the Influence of Growth in Perfusion Dependent Biological Systems - at the Example of the Human Liver*. D. Werner, T. Ricken, U. Dahmen, O. Dirsch, H. G. Holzhütter, and M. König; PAMM 15 (1), 119-120, 2015, #link("https://doi.org/10.1002/pamm.201510050")[10.1002/pamm.201510050], #underline[Last author]
67. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2014_systembiologie.pdf")[#fa-icon("file-pdf")] #tags("AI") *Homeostasis of blood glucose - Computer simulations of central liver functions*. M. König and H. G. Holzhütter; systembiologie.de 2014; 8:p.53-57, #underline[First author]
68. #link("https://livermetabolism.com/assets/pdf/publication/Koenig2011_fluxviz.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/cy2fluxviz")[#fa-icon("git-alt")] #tags("Open & FAIR") *FluxViz - Cytoscape Plug-in for Vizualisation of Flux Distributions in Networks*. M. König and H. G. Holzhütter; Genome Informatics 2010, Vol.24, p.96-103, #underline[First author]

== Preprints
1. #link("https://livermetabolism.com/assets/pdf/preprint/Anton2026_standard.gem_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/MetabolicAtlas/standard-GEM")[#fa-icon("git-alt")] #tags("Open & FAIR") *Standard-GEM supports reproducible development of genome-scale metabolic models*. M. Anton, E. Almaas, F. Bäuerle, M. E. Beber, R. Benfeitas, S. Benito-Vaquerizo, L. M. Blank, F. Clasen, C. de Buck, A. Dräger, J. M. Hancock, V. Hatzimanikatis, M. König, D. Lappa, F. Li, U. W. Liebal, H. Lu, H. Ma, R. Mahadevan, C. D. Maranas, A. Mardinoglu, J. Nielsen, J. Nogales, M. Pagni, J. A. Papin, J. L. Robinson, B. J. Sánchez, S. Shoaie, V. Simensen, M. Suarez-Diez, S. Sulheim, L. T. Svensson, B. Teusink, W. Vongsangnak, A. A. Zeidan, and E. J. Kerkhoven; bioRxiv 2023.03.21.512712, #link("https://doi.org/10.1101/2023.03.21.512712")[10.1101/2023.03.21.512712]
2. #link("https://livermetabolism.com/assets/pdf/preprint/Schwaiger2026_hctz_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/hctz-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A Physiologically Based Pharmacokinetic/Pharmacodynamic Model of the Diuretic Hydrochlorothiazide*. A. Schwaiger and M. König; Preprints 2026, 10.20944/preprints202607.0306.v1, #link("https://doi.org/10.20944/preprints202607.0306.v1")[10.20944/preprints202607.0306.v1], #underline[Last author]
3. #link("https://livermetabolism.com/assets/pdf/preprint/Li2026_tabularqual_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/sys-bio/TabularQual")[#fa-icon("git-alt")] #tags("Open & FAIR") *TabularQual: A spreadsheet-based format for annotating and curating logical models in SBML-qual*. L. X. Li, C. Bleker, S. Soliman, L. Calzone, N. Hiroi, T. Helikar, M. König, L. Ladeira, P. T. Monteiro, V. Noel, S. Pastva, A. Salazar, D. Safranek, D. Thieffry, E. Tsirvouli, A. Niarakis, and J. Gennari; bioRxiv 2026.05.31.727710, #link("https://doi.org/10.64898/2026.05.31.727710")[10.64898/2026.05.31.727710]
4. #link("https://livermetabolism.com/assets/pdf/preprint/Jesionek2026_rapamycin_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/rapamycin-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A PBPK Digital Twin of Rapamycin for Predicting Dose–Exposure Relationships, Organ Impairment Effects, and Drug–Drug Interactions*. M. Jesionek and M. König; Preprints 2026, 10.20944/preprints202605.0249.v1, #link("https://doi.org/10.20944/preprints202605.0328.v1")[10.20944/preprints202605.0328.v1], #underline[Last author]
5. #link("https://livermetabolism.com/assets/pdf/preprint/Myshkina2026_apixaban_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/apixaban-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *An Open and Reproducible Digital Twin for Personalised Anticoagulant Therapy: Modelling Apixaban Pharmacokinetics and Pharmacodynamics*. M. Myshkina, M. Babaeva, L. C. Nguyen, S. Bedón, J. Metternich, M. Elias, and M. König; Preprints 2026, 10.20944/preprints202605.0249.v1, #link("https://doi.org/10.20944/preprints202605.0249.v1")[10.20944/preprints202605.0249.v1], #underline[Last author]
6. #link("https://livermetabolism.com/assets/pdf/preprint/Alejandro2026_empagliflozin_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/empagliflozin-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A Digital Twin of Empagliflozin Pharmacokinetics and Pharmacodynamics*. J. Alejandro, M. Elias, M. Babaeva, and M. König; Preprints 2026, 10.20944/preprints202603.1559.v1, #link("https://doi.org/10.20944/preprints202603.1559.v1")[10.20944/preprints202603.1559.v1], #underline[Last author]
7. #link("https://livermetabolism.com/assets/pdf/preprint/Tereshchuk2026_canagliflozin_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/canagliflozin-model")[#fa-icon("git-alt")] #tags("Digital Twins", "Pharmacometrics") *A Digital Twin of Canagliflozin Pharmacokinetics and Pharmacodynamics in Type 2 Diabetes Mellitus*. V. Tereshchuk, M. Elias, and M. König; Preprints 2026, 10.20944/preprints202601.2095.v1, #link("https://doi.org/10.20944/preprints202601.2095.v1")[10.20944/preprints202601.2095.v1], #underline[Last author]
8. #link("https://livermetabolism.com/assets/pdf/preprint/Myshkina2025_digital.twins_preprint.pdf")[#fa-icon("file-pdf")]#link("https://doi.org/10.5281/zenodo.15013110")[#fa-icon("git-alt")] #tags("Digital Twins", "AI") *Assessing the Impact of AI and Digital Twins on Clinical Decision-Making in Hepatology and Hepatobiliary Surgery*. M. Myshkina, E. Casabianca, A. Schnurpel, T. Ricken, H. Tautenhahn, and M. König; Preprints 2025, #link("https://doi.org/10.20944/preprints202509.1164.v1")[10.20944/preprints202509.1164.v1], #underline[Last author]
9. #link("https://livermetabolism.com/assets/pdf/preprint/Casabianca2025_rivaroxaban_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/rivaroxaban-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A Systems Pharmacology Approach to Rivaroxaban: Physiologically Based Modeling of Pharmacokinetics and Coagulation Dynamics*. E. Casabianca, M. Myshkina, and M. König; Preprints 2025, 202507.1945., #link("https://doi.org/10.20944/preprints202507.1945.v1")[10.20944/preprints202507.1945.v1], #underline[Last author]
10. #link("https://livermetabolism.com/assets/pdf/preprint/Balaur2025_fairification_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/fair-ca-visualization")[#fa-icon("git-alt")] #tags("Open & FAIR") *FAIRification of computational models in biology*. I. Balaur, D. P. Nickerson, D. Welter, J. A. Wodke, F. Ancien, T. Gebhardt, V. Grouès, H. Hermjakob, M. König, N. Radde, A. Rougny, R. Schneider, R. S. Malik-Sheriff, K. B. Shiferaw, M. Stefan, V. Satagopam, and D. Waltemath; bioRxiv 2025.03.21.644517, #link("https://doi.org/10.1101/2025.03.21.644517")[10.1101/2025.03.21.644517]
11. #link("https://livermetabolism.com/assets/pdf/preprint/Raman2024_frog_preprint.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *FROG Analysis Ensures the Reproducibility of Genome Scale Metabolic Models*. K. Raman, M. Kratochvil, B. G. Olivier, M. König, P. Sengupta, D. K. K. Baskaran, T. V. N. Nguyen, D. Lobo, S. E. Wilken, K. K. Tiwari, A. K. Raghu, I. Palanikumar, L. Raajaraam, M. Ibrahim, S. Balakrishnan, S. Umale, F. Bergmann, T. Malpani, V. P. Satagopam, R. Schneider, M. E. Beber, S. Keating, M. Anton, A. Renz, M. Lakshmanan, D. Lee, L. Koduru, R. Mostolizadeh, O. Dias, E. Cunha, A. Oliveira, Y. Q. Lee, K. Zengler, R. Santibanez-Palominos, M. Kumar, M. Barberis, B. L. Puniya, T. Helikar, H. V. Dinh, P. F. Suthers, C. D. Maranas, I. Casini, S. B. Loghmani, N. Veith, N. Leonidou, F. Li, Y. Chen, J. Nielsen, G. Lee, S. M. Lee, G. B. Kim, P. T. Monteiro, M. C. Teixeira, H. U. Kim, S. Y. Lee, U. W. Liebal, L. M. Blank, C. Lieven, C. Tarzi, C. Angione, M. E. Blaise, C. P. Aytar, M. Kulyashov, L. Akberdin, D. Kim, S. H. Yoon, Z. Xu, J. Gautam, W. T. Scott Jr., P. J. Schaap, J. J. Koehorst, C. Zuniga, G. Canto-Encalada, S. Benito-Vaquerizo, I. P. Olm, M. Suarez-Diez, Q. Yuan, H. Ma, M. M. Islam, J. A. Papin, F. Zorrilla, K. R. Patil, A. Basile, J. Nogales, G. San Leon, F. Castillo-Alfonso, R. Olivares-Hernandez, G. Vigueras-Ramirez, H. Hermjakob, A. Drager, and R. S. Malik-Sheriff; bioRxiv 2024.09.24.614797, #link("https://doi.org/10.1101/2024.09.24.614797")[10.1101/2024.09.24.614797]
12. #link("https://livermetabolism.com/assets/pdf/preprint/Gerhaeusser2024_spt.model_preprint.pdf")[#fa-icon("file-pdf")] #tags("Digital Twins", "AI", "Digital Pathology") *Simulation of zonation-function relationships in the liver using coupled multiscale models: Application to drug-induced liver injury*. S. Gerhäusser, L. Lambers, L. Mandl, J. Franquinet, T. Ricken, and M. König; bioRxiv 2024.03.26.586870;, #link("https://doi.org/10.1101/2024.03.26.586870")[10.1101/2024.03.26.586870], #underline[Last author]
13. #link("https://livermetabolism.com/assets/pdf/preprint/StemmerMallol2023_talinolol_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/talinolol-model.git")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Insights into Intestinal P-glycoprotein Function using Talinolol: A PBPK Modeling Approach*. B. S. Mallol, J. Grzegorzewski, and M. König; bioRxiv 2023.11.21.568168, #link("https://doi.org/10.1101/2023.11.21.568168")[10.1101/2023.11.21.568168], #underline[Last author]
14. #link("https://livermetabolism.com/assets/pdf/preprint/Kuettner2023_chlorzoxazone_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/chlorzoxazone-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *A physiologically based pharmacokinetic model for CYP2E1 phenotyping via chlorzoxazone*. J. Küttner, J. Grzegorzewski, H. M. Tautenhahn, and M. König; bioRxiv 2023.04.12.536571, #link("https://doi.org/10.1101/2023.04.12.536571")[10.1101/2023.04.12.536571], #underline[Last author]
15. #link("https://livermetabolism.com/assets/pdf/preprint/Bartsch2023_simvastatin_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/simvastatin-model")[#fa-icon("git-alt")] #tags("Pharmacometrics") *Simvastatin therapy in different subtypes of hypercholesterolemia - a physiologically based modelling approach*. F. Bartsch, J. Grzegorzewski, H. Pujol, H. M. Tautenhahn, and M. König; medRxiv 2023.02.01.23285358, #link("https://doi.org/10.1101/2023.02.01.23285358")[10.1101/2023.02.01.23285358], #underline[Last author]
16. #link("https://livermetabolism.com/assets/pdf/preprint/Ramachandran2022_covid19.models_preprint.pdf")[#fa-icon("file-pdf")]#link("https://www.ebi.ac.uk/biomodels/search?query=submitter_keywords:COVID-19&domain=biomodels")[#fa-icon("git-alt")] #tags("Open & FAIR") *FAIR Sharing of Reproducible Models of Epidemic and Pandemic Forecast*. K. RamachandranΔ, M. KönigΔ, M. Scharm, T. V. N. Nguyen, H. Hermjakob, D. Waltemath, and R. S. Malik Sheriff (Δ equal contribution); Preprints 2022, 2022060137, #link("https://doi.org/10.20944/preprints202206.0137.v1")[10.20944/preprints202206.0137.v1], #underline[First Equal author]
17. #link("https://livermetabolism.com/assets/pdf/preprint/Koenig2022_dfba_preprint.pdf")[#fa-icon("file-pdf")]#link("http://www.github.com/matthiaskoenig/dfba")[#fa-icon("git-alt")] #tags("Open & FAIR") *Dynamic Flux Balance Analysis Models in SBML*. M. KönigΔ, L. H. WatanabeΔ, J. Grzegorzewski, and C. J. Myers (Δ equal contribution); bioRxiv 245076, #link("https://doi.org/10.1101/245076")[10.1101/245076], #underline[First Equal author]
18. #link("https://livermetabolism.com/assets/pdf/preprint/Koenig2021_ten.simple.rules_preprint.pdf")[#fa-icon("file-pdf")] #tags("Open & FAIR") *Ten Simple Rules for FAIR Sharing of Experimental and Clinical Data with the Modeling Community*. M. KönigΔ, J. Grzegorzewski, M. Golebiewski, H. Hermjakob, M. Hucka, B. Olivier, S. M. Keating, D. Nickerson, F. Schreiber, R. Sheriff, and D. Waltemath; Preprints 2021, 2021080303, #link("https://doi.org/10.20944/preprints202108.0303.v2")[10.20944/preprints202108.0303.v2], #underline[First author]
19. #link("https://livermetabolism.com/assets/pdf/preprint/Shaikh2021_sed.ml.validator_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/biosimulators/Biosimulators_utils")[#fa-icon("git-alt")] #tags("Open & FAIR") *SED-ML Validator: tool for debugging simulation experiments*. B. Shaikh, A. P. Freiburger, M. König, F. T. Bergmann, D. P. Nickerson, H. M. Sauro, M. L. Blinov, L. P. Smith, I. I. Moraru, and J. R. Karr; arXiV, 2021, #link("https://doi.org/10.48550/arXiv.2106.00844")[10.48550/arXiv.2106.00844]
20. #link("https://livermetabolism.com/assets/pdf/preprint/Koenig2020_exsimo_preprint.pdf")[#fa-icon("file-pdf")]#link("https://github.com/matthiaskoenig/exsimo")[#fa-icon("git-alt")] #tags("Digital Twins") *Executable Simulation Model of the Liver*. M. König; bioRxiv 2020.01.04.894873, #link("https://doi.org/10.1101/2020.01.04.894873")[10.1101/2020.01.04.894873], #underline[First author]
21. #link("https://livermetabolism.com/assets/pdf/preprint/Koenig2016_cy3sabiork_preprint.pdf")[#fa-icon("file-pdf")]#link("http://www.github.com/matthiaskoenig/cy3sabiork")[#fa-icon("git-alt")] #tags("Open & FAIR") *cy3sabiork: A Cytoscape app for visualizing kinetic data from SABIO-RK*. M. König; [version 1; referees: awaiting peer review]. F1000Research 2016, 5:1736, #link("https://doi.org/10.12688/f1000research.9211.1")[10.12688/f1000research.9211.1], #underline[First author]

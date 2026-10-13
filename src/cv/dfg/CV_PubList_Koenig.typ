// Curriculum vitae of Matthias König for the SPP proposal TWIN-ORG,
// following DFG form 53.200 (07/25, English).
// Form rules: max. 4 pages, Arial >= 11 pt, line spacing >= 1.2, no photo,
// file name CV_PubList_<last name>.
// Compile: typst compile CV_PubList_Koenig.typ

#let form-version = "DFG form 53.200 – 07/25"

#set document(
  title: "Curriculum Vitae - Matthias König",
  author: "Matthias König",
)
#set page(
  paper: "a4",
  // margins of the DFG template (top/left 2.5 cm, right 2 cm, bottom 1.5 cm)
  margin: (top: 2.5cm, left: 2.5cm, right: 2cm, bottom: 1.5cm),
  header: context {
    set text(size: 9pt)
    grid(
      columns: (1fr, auto),
      form-version,
      [Page #counter(page).display() of #counter(page).final().first()],
    )
  },
  header-ascent: 40%,
)
// Liberation Sans is metrically identical to Arial and is used where Arial is
// not installed.
#set text(
  font: ("Arial", "Liberation Sans"),
  size: 11pt,
  lang: "en",
  top-edge: "ascender",
  bottom-edge: "descender",
)
// line spacing 1.2 (as in the template: 288/240)
#set par(leading: 0.25em, spacing: 0.6em, justify: true)
#set enum(spacing: 0.55em, indent: 0pt, body-indent: 0.6em)
#show link: set text(fill: rgb("#1f4e9c"))

#show heading.where(level: 1): it => block(
  above: 1.1em,
  below: 0.55em,
  text(size: 11pt, weight: "bold", it.body),
)
#show heading.where(level: 2): it => block(
  above: 0.8em,
  below: 0.45em,
  text(size: 11pt, weight: "bold", it.body),
)

#let cell-inset = (x: 4pt, y: 3pt)
#set table(stroke: 0.5pt, inset: cell-inset)

// two-column table of the template: label | content
#let form-table(header: none, ..rows) = table(
  columns: (37%, 63%),
  ..if header != none { header.map(h => strong(h)) },
  ..rows,
)

// dated entries (period | text), used for the free-text sections
#let dated(..items) = grid(
  columns: (2.6cm, 1fr),
  column-gutter: 0.3em,
  row-gutter: 0.55em,
  ..items.pos().flatten(),
)

#let doi(d) = link("https://doi.org/" + d)[doi:#d]
#let oa = [_Open Access_]
#let me = strong[König M]

#text(weight: "bold")[Curriculum Vitae]

= Personal Data

#form-table(
  [Title], [Prof. Dr. rer. nat.],
  [First name], [Matthias],
  [Last name], [König],
  [Current position],
  [Professor of Metabolic Inflammation and Carcinogenesis of the Liver (since 06/2026)],
  [Current institution(s)/site(s), country],
  [University of Lübeck and University Hospital Schleswig-Holstein (UKSH), Campus Lübeck, First Department of Medicine, Germany; #link("https://livermetabolism.com")[livermetabolism.com]],
  [Identifiers/ORCID],
  [ORCID: #link("https://orcid.org/0000-0003-1725-179X")[0000-0003-1725-179X]; #link("https://github.com/matthiaskoenig")[GitHub]; #link("https://scholar.google.de/citations?user=xD9IjnYAAAAJ")[Google Scholar]],
)

= Qualifications and Career

#form-table(
  header: ([Stages], [Periods and Details]),
  [Degree programme],
  [Diploma in Biophysics (equivalent to MSc, grade 1.0 with distinction), 2002–2009, Humboldt-Universität zu Berlin, Germany. Diploma thesis on systems biology modelling of hepatic metabolism.],
  [Doctorate],
  [12/2015, Dr. rer. nat. in Biophysics (magna cum laude), Humboldt-Universität zu Berlin and Charité – Universitätsmedizin Berlin, Germany. Thesis: _Computational modeling of glucose metabolism_. Supervisor: Prof. Hermann-Georg Holzhütter.],
  [Stages of academic/professional career],
  [
    *since 06/2026* Professor of Metabolic Inflammation and Carcinogenesis of the Liver, University of Lübeck / UKSH, First Department of Medicine, Germany. Group _Systems Medicine and Digital Twins_.

    *05/2026* Associate Professor of Pharmacoepidemiology and Data Science, University of Southern Denmark (SDU), Odense, Denmark.

    *12/2025–04/2026* Head of the Computational Biomechanics Group, University of Stuttgart, Germany (coordination project of the DFG Priority Programme SPP 2311).

    *06/2021–11/2025* DFG Temporary Position for Principal Investigators (_Eigene Stelle_, FOR 5151 QuaLiPerF), head of the group _Systems Medicine of the Liver_, Institute for Theoretical Biology, Humboldt-Universität zu Berlin, Germany.

    *06/2016–05/2021* Junior group leader, BMBF LiSyM – Systems Medicine of the Liver, Institute for Theoretical Biology, Humboldt-Universität zu Berlin, Germany.

    *2008–2015* Research associate, Computational Systems Biochemistry, Institute of Biochemistry, Charité – Universitätsmedizin Berlin, Germany (BMBF consortia HepatoSys and Virtual Liver).
  ],
)

= Activities in the Research System

#dated(
  [2017–2026], [*Elected COMBINE coordinator* – coordination of the community standards for computational models in biology (SBML, SED-ML, PEtab, SBGN, …) and of the annual COMBINE meetings.],
  [2018–2023, 2025–2027], [*Elected SBML editor* – Systems Biology Markup Language, exchange format for biological models.],
  [2017–2022, 2024–2027], [*Elected SED-ML editor* – Simulation Experiment Description Markup Language for reproducible simulation experiments.],
  [2023–2026], [*Elected PEtab editor* – data format for parameter estimation problems.],
  [2024–2026], [*Open Science Ambassador*, Berlin University Alliance / Humboldt-Universität zu Berlin.],
  [2023–2024], [*Expert panel member*, PharmVar CYP1A2 gene panel (Pharmacogene Variation Consortium).],
  [2025], [*Organiser* of the workshop _Open Science & Reproducibility for Computational Models in Systems Biology & Medicine_, Berlin.],
  [2022], [*Organiser* of the 13th COMBINE meeting, Berlin.],
  [2022–2026], [*Teaching and mentoring*: three BUA X-Student Research Groups on digital twins for drug therapy (hypertension, anticoagulation); certified _Digital Health Professions Educator_ (Charité, 2025) and AI teaching certificate (HU Berlin, 2025).],
)

= Supervision of Researchers in Early Career Phases

Since 2021: 1 completed doctorate (J. Grzegorzewski, 2017–2023, _Physiologically based pharmacokinetic (PBPK) modeling for dynamical liver function tests and CYP phenotyping_, Humboldt-Universität zu Berlin), 4 Master's theses, 8 Bachelor's theses and 18 internship students. Currently supervised: 1 doctoral researcher (M. Myshkina, since 2024, AI and digital twins for decision support in hepatocellular carcinoma) and 1 medical doctoral thesis (A. Schwaiger, since 2023, PBPK/PD digital twin of hydrochlorothiazide). The Bachelor's theses of M. Elias, N. Nemitz and E. Tensil each resulted in a first-author, peer-reviewed digital twin publication (Category A, nos. 1–3).

= Scientific Results

Total: 68 peer-reviewed publications. Own contribution is given in _italics_; all listed publications are related to the topic of TWIN-ORG.

== Category A

+ Tensil E, Myshkina M, #me (2026). A digital twin of the angiotensin II receptor blocker losartan: physiologically based modeling of blood pressure regulation. _Pharmaceutics_ 18(2):262. #doi("10.3390/pharmaceutics18020262"), #oa. \
  _Senior author; conceived and supervised the work. Hepatic metabolism and renal excretion coupled to blood pressure regulation; effect of hepatic and renal impairment and genotypes._
+ Nemitz N, Elias M, #me (2026). A physiologically based pharmacokinetic and pharmacodynamic (PBPK/PD) model of dapagliflozin in type 2 diabetes mellitus: the effect of dosing, hepatorenal impairment, and food. _Pharmaceutics_ 18(3):287. #doi("10.3390/pharmaceutics18030287"), #oa. \
  _Senior author; conceived and supervised the work. Shows that renal effects on drug response become visible only in the coupled liver–kidney model._
+ Elias M, #me (2025). A digital twin of glimepiride for personalized and stratified diabetes treatment. _Front Pharmacol_ 16:1686415. #doi("10.3389/fphar.2025.1686415"), #oa. \
  _Senior author; conceived and supervised the work. Patient stratification by hepatic and renal function and CYP2C9 genotype._
+ Höpfl S, Albadry M, Dahmen U, Herrmann KH, Kindler EM, #me, Reichenbach JR, Tautenhahn HM, Wei W, Zhao WT, Radde NE (2024). Bayesian modelling of time series data (BayModTS) – a FAIR workflow to process sparse and highly variable data. _Bioinformatics_ 40(5):btae312. #doi("10.1093/bioinformatics/btae312"), #oa. \
  _Co-author (DFG FOR 5151 QuaLiPerF). Transfers uncertainties of sparse, highly variable time series data into model predictions._
+ Lambers L, Waschinsky N, Schleicher J, #me, Tautenhahn HM, Albadry M, Dahmen U, Ricken T (2024). Quantifying fat zonation in liver lobules: an integrated multiscale in silico model combining disturbed microperfusion and fat metabolism via a continuum biomechanical bi-scale, tri-phasic approach. _Biomech Model Mechanobiol_. #doi("10.1007/s10237-023-01797-0"), #oa. \
  _Co-author (DFG FOR 5151 QuaLiPerF). Couples microperfusion, oxygen gradient and fat metabolism across scales in a continuum-biomechanical model._
+ Köller A, Grzegorzewski J, Tautenhahn HM, #me (2021). Prediction of survival after hepatectomy using a physiologically based pharmacokinetic model of indocyanine green liver function tests. _Front Physiol_ 12:730418. #doi("10.3389/fphys.2021.730418"), #oa. \
  _Senior author; conceived and supervised the work. Patient-specific prediction of post-operative liver function._
+ Grzegorzewski J, Brandhorst J, Green K, Eleftheriadou D, Duport Y, Barthorscht F, Köller A, Ke DYJ, De Angelis S, #me (2021). PK-DB: pharmacokinetics database for individualized and stratified computational modeling. _Nucleic Acids Res_ 49(D1):D1358–D1364. #doi("10.1093/nar/gkaa990"), #oa. \
  _Senior author; designed and led the database. Open data basis for calibrating and validating digital twins._
+ Sauro HM, …, #me, …, Moraru I (2026). From FAIR to CURE: guidelines for computational models of biological systems. _npj Syst Biol Appl_. #doi("10.1038/s41540-026-00651-0"), #oa. \
  _Co-author. Community guidelines for credible, understandable, reproducible and extensible models._
+ Keating SM, Waltemath D, #me, Zhang F, …, Hucka M, SBML Community (2020). SBML Level 3: an extensible format for the exchange and reuse of biological models. _Mol Syst Biol_ 16(8):e9110. #doi("10.15252/msb.20199110"), #oa. \
  _Third author; SBML editor and co-author of the specification._
+ #me, Bulik S, Holzhütter HG (2012). Quantifying the contribution of the liver to the homeostasis of plasma glucose: a detailed kinetic model of hepatic glucose metabolism integrated with the hormonal control by insulin, glucagon and epinephrine. _PLoS Comput Biol_ 8(6):e1002577. #doi("10.1371/journal.pcbi.1002577"), #oa. \
  _First author; developed the model. Liver metabolism coupled to whole-body hormonal control._

== Category B

+ _Preprint:_ Schwaiger A, #me (2026). A physiologically based pharmacokinetic/pharmacodynamic model of the diuretic hydrochlorothiazide. _Preprints_. #doi("10.20944/preprints202607.0306.v1"). _Senior author. Heart, liver and kidney in one model; Open Science Award 2026 of the University of Lübeck._
+ _Preprint:_ Myshkina M, Babaeva M, Nguyen LC, Bedón S, Metternich J, Elias M, #me (2026). An open and reproducible digital twin for personalised anticoagulant therapy: modelling apixaban pharmacokinetics and pharmacodynamics. _Preprints_. #doi("10.20944/preprints202605.0249.v1"). _Senior author._
+ _Preprint:_ Myshkina M, Casabianca E, Schnurpel A, Ricken T, Tautenhahn HM, #me (2025). Assessing the impact of AI and digital twins on clinical decision-making in hepatology and hepatobiliary surgery. _Preprints_. #doi("10.20944/preprints202509.1164.v1"). _Senior author; survey of clinical users._
+ _Preprint:_ Gerhäusser S, Lambers L, Mandl L, Franquinet J, Ricken T, #me (2024). Simulation of zonation-function relationships in the liver using coupled multiscale models: application to drug-induced liver injury. _bioRxiv_. #doi("10.1101/2024.03.26.586870"). _Senior author; coupling of SBML cell models to finite element tissue simulations._
+ _Reproducible models:_ open digital twin models of dapagliflozin and losartan, independently reproduced and published in _Physiome_ (2026). #doi("10.36903/physiome.31368556"), #doi("10.36903/physiome.31359823"). _Senior author._
+ _Database:_ PK-DB – open pharmacokinetics database, #link("https://pk-db.com")[pk-db.com]; extended to an AI-ready version with an MCP server for AI agents (Anthropic AI for Science Award 2026). _Lead developer._
+ _Software:_ sbmlutils – Python utilities for SBML. #doi("10.5281/zenodo.597149"). _Lead developer._
+ _Software:_ sbmlsim and SBML4Humans – simulation and human-readable reports of SBML models, #link("https://sbml4humans.de")[sbml4humans.de]. _Lead developer._
+ _Standard:_ Smith LP, Bergmann FT, Garny A, Helikar T, Karr J, Nickerson D, Sauro H, Waltemath D, #me (2024). The simulation experiment description markup language (SED-ML): language specification for level 1 version 5. _J Integr Bioinform_. #doi("10.1515/jib-2024-0008"), #oa. _Elected editor; senior author._
+ _Community roadmap:_ EDITH Consortium (2025). Roadmap for the European Virtual Human Twin. #doi("10.5281/zenodo.14769224"). _Co-author._

= Academic Distinctions

#dated(
  [2026], [Open Science Award of the University of Lübeck for the hydrochlorothiazide digital twin.],
  [2026], [Anthropic AI for Science Award for the project _AI-Ready PK-DB_.],
  [2025], [Habilitation completion scholarship, Humboldt-Universität zu Berlin.],
  [2023], [Michael Stifel Prize for interdisciplinary, data-driven research, Friedrich Schiller University Jena.],
  [2015], [Google Summer of Code scholarship (SBML support for Cytoscape).],
  [2005], [Scholarship of the German Academic Scholarship Foundation (Studienstiftung des deutschen Volkes).],
)

= Other Information

*Involvement in the European digital twin community*, directly relevant to TWIN-ORG:

#dated(
  [2024–2025], [*Co-author of the* _Roadmap for the European Virtual Human Twin_ (EDITH Coordination and Support Action, 2025, #doi("10.5281/zenodo.14769224")). Contributed to the roadmap from the perspective of model standards, reproducibility and FAIR digital twin models.],
  [since 2024], [*Member of the VHT user group* of the European Virtual Human Twin (VHT) initiative; participant of the EDITH ecosystem meetings since the first meeting in Paris (01/2024).],
  [since 2025], [*Member of the RDA working group* _Building Immune Digital Twins_ (Research Data Alliance). Develops standards and methods for immune digital twins; the group contributes an open PBPK digital twin of the immunosuppressant rapamycin (sirolimus).],
)

Third-party funding as principal investigator (selection, since 2016): DFG SPP 2311 SimLivA (second phase 2025–2027), BMFTR ATLAS – AI and Simulation for Tumor Liver Assessment (2023–2026), DFG FOR 5151 QuaLiPerF (2021–2025), EU EOSC-Life (2020–2021), BMBF LiSyM junior group (2016–2022). All models, data and software of the group are published openly and in community standards (SBML, SED-ML) to make them reusable across groups.

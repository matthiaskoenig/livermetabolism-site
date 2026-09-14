# Communication Concept — livermetabolism.com Relaunch

Consolidated planning document for the science-communication redesign of the group website: situation analysis, target-audience research, positioning, and the implementation/control plan derived from it. Structured around the four standard phases of a communication concept — **Analysis → Planning → Implementation → Control**. For the executed checklist and final deliverable against this plan, see [`project_output.md`](project_output.md).

## Analysis

### Starting situation (state of the old site)

General:
- Not mobile- or tablet-friendly.

Landing page:
- Very busy, too much text; two-column layout too dense.
- Redundant information duplicated across pages (publications, funding, ...).
- News items too long — should be foldable.
- Everything crammed onto the landing page instead of being distributed.
- Needs more whitespace, fewer headers — "Research" should be able to cover projects, software, and presentations as one umbrella.
- Contact information not prominent; no clear footer.
- Page load not optimized.
- No corporate identity (logo, colors).

People page:
- Not personal enough (no hobbies / additional bio info).
- Current members and alumni not separated.
- Lab photos outdated.

### SWOT analysis

| | |
|---|---|
| **Strengths** | A lot of content already exists (people, projects, publications, software). |
| **Weaknesses** | Unstructured, missing navigation; outdated technology (old Ruby/Jekyll stack). |
| **Opportunities** | Audience-appropriate sub-structuring; the site can become a showcase for the research portfolio. |
| **Threats** | More complex navigation to design (though it also opens new possibilities); a full relaunch is required; extra time investment. |

Systematic analysis of the initial conditions → derive concrete communication tasks from it (see Planning/Implementation below).

### Benchmark: other research-group websites

Notable examples reviewed, with what each one demonstrates:
- MacMillan group (Princeton/Caltech) — clean layout that visually foregrounds publications: https://macmillan.princeton.edu/
- Dahn group (Dalhousie) — informative and easy to navigate, a good low-frills reference for structure and navigation: https://www.dal.ca/diff/dahn/news.html
- Buchwald group (MIT) — widely praised for its design and informative content: https://chemistry-buchwald.mit.edu/
- Burns group (Stanford) — clean, professional, and innovative presentation of the research; the Solomon group was noted as similarly strong: https://www.burnschemistry.com/
- Pharmetheus — pharmacometrics consultancy with a clear value proposition, hierarchical service navigation, and a dedicated publications/thought-leadership section: https://pharmetheus.com/
- Charles Darwin Foundation — leads with a clear mission statement and organizes decades of research output into browsable programs and a public research hub: https://www.darwinfoundation.org/en/
- Metrum Research Group — a clear "what we do" headline paired with organized Services/Solutions/Open-Science navigation: https://www.metrumrg.com/
- Barrett Lab (Meghan Barrett) — makes complex insect research approachable through a calm, user-friendly layout: https://www.meghan-barrett.com/
- Eddy Lab — an inclusive digital space that amplifies diverse voices in STEM education: https://www.eddy-lab.org/
- Emery Lab — shows that scientific rigor and creative design can coexist, studying organism adaptation to extreme environments: https://emery-lab.org/
- NetZero Lab — connects policy implications with scientific findings for climate-tech communication: https://www.netzerolab.science/
- NatCap Insights — turns geospatial sustainability research into practical, decision-ready insights: https://www.natcapinsights.com/

The last five (Barrett, Eddy, Emery, NetZero, NatCap) are drawn from a 2024 roundup of standout academic lab websites: https://www.impactmedialab.com/scicomm/top-research-lab-websites-2024

Common elements that make these sites work:
- Clear navigation and intuitive user experience.
- Compelling visual storytelling that supports the scientific content.
- Accessible language that engages diverse audiences.
- Strategic use of multimedia elements.
- Mobile-responsive design across devices.
- Clear homepage with a concise research summary.
- Team member profiles (roles, sometimes nationality flags).
- Dedicated publication pages with accessible descriptions/graphics.
- A news/updates section for recent work and achievements.

> "Your lab website is more than a digital brochure – it's a platform for sharing your research impact with the world."

---

## Planning (Goals, Strategy, Actions)

### Target audiences and value proposition per group

| Audience | What they need to see |
|---|---|
| Patients / interested relatives | Earlier/better diagnosis; better treatment via individualized prediction (e.g. gender-specific), individualized dosing; fewer side effects; faster recovery; self-determined living. |
| Physicians | Better (risk) predictions — accuracy mainly through individualization/stratification; fewer clinical complications. |
| Society | Resources saved (human and animal experiments); healthcare-system cost savings. |
| Cooperation partners (academia/industry/technology) | Concrete entry points: open data, open code, software, workflows. |
| Students | Interesting projects, future-relevant technology; the people/social side needs more depth for this group. |
| Funding organizations | Investment in a high-potential future technology; transferability of methods/models to other organ systems. |
| PIs / peer groups | Potential collaboration partners. |
| Science communication / press | Expert opinion, expert input. |
| (General public) | Secondary audience. |
| AI agents / crawlers ("Robots & AI") | Clean, structured, machine-legible markup — increasingly a de facto audience of its own. |

Guiding principle: clarity and focus — **3-4 core messages maximum**, prioritized by relevance. Less is more, especially on the landing page, and each audience should be steered clearly toward the content meant for them.

### Positioning & core messages

- Accurate prediction as the core capability.
- Digital twins / models for individualized predictions across different clinical questions (e.g. liver function prediction).
- Triad framing: we build something for the patient, the physician, and society.
- Vision: real clinical application, real clinical questions — keep it broad rather than narrow; should read as a short statement of the future we want.
  - Use a Mission/Vision Canvas (https://itk.mitre.org/mission-vision-canvas/) and the Golden Circle model (why do we do this, how do we make the world better, who do we do it for) to derive it. Needs a genuinely engaging promise to the reader — energy and emotion, not just a dry statement.
- "We are the only organization that …" — needs an honest, specific differentiator, not a generic claim.
- De-emphasize the PI as an individual — don't position the group around one person.
- Core messages: Open Science, Open Data, FAIR, standardization, reproducibility.
- Core argument: computational models create measurable value — the per-audience benefits listed above are the supporting evidence.

### Mission/Vision brainstorm (raw candidate themes)

- Digital twins
- AI/ML
- Pharmacometrics (PK/PD)
- Liver & metabolism
- Digital pathology (image analysis) / spatial omics
- Modelling
- Open source, FAIR, transparency, reproducibility
- Interdisciplinarity
- Applications: liver function testing, personalized medicine, clinical decision support
  - Longer-term/aspirational: patents, a practical product, spin-off funding
- Video teaser (AI-generated)
- Interactive statistics on the landing page

### Strategy: channels & media

- The website itself rarely makes first contact — that happens on other channels (LinkedIn, presentations, posters). The site should sit downstream of those, in accessible language, easy to follow.
- Promotion via LinkedIn.
- Promotion at conferences/talks/posters (QR code + link).
- Mobile as a first-class channel, not an afterthought.

---

## Implementation (Text, Visuals, and Actions)

### Technology direction (brainstormed)

- Mobile-friendly and accessible (different end devices, users with disabilities).
- Simple, plain-text content storage (Markdown, JSON/YAML) — this became the `data/*.yml` tables, validated by pydantic (`src/data.py`) and again by Zod in the site build.
- CI: automatic build/deploy on git push (GitHub Actions) — removes manual deployment steps.
- Modern web framework, TypeScript, a modern CSS framework.
- AI-assisted build and maintenance (Visual Studio Code & Claude Code).
- Possible live API integration (e.g. pull current status from PK-DB).
- GitHub Pages as a hosting option.
- Semi-automatic generation of social-media posts from site content.
- LinkedIn / Instagram / Bluesky presence.
- Interactive/embedded web tools (e.g. visFEM) linked directly from the site.
- Cross-linking of objects (people ↔ projects ↔ publications ↔ software) to make browsing more interesting and interactive.

### Concrete redesign actions identified

(brainstormed asks derived from the Analysis feedback above; execution status for these is tracked separately in [`project_output.md`](project_output.md))

- Declutter the landing page: less text, avoid two-column crowding, remove redundant content, make news items foldable, don't put everything on the landing page, more whitespace.
- Consolidate headers: "Research" as the umbrella for projects, software, and presentations.
- Make contact information prominent, with a clear footer.
- Optimize page load time.
- Define a corporate identity: logo, color palette.
- People page: more personal (hobbies, extra bio info), separate current members from alumni, refresh lab photos.

### How the plan was implemented

(status: release 0.10.0, September 2026; full checklist in [`project_output.md`](project_output.md))

- **Text**: short texts; one vision statement for the group and one per research area; brief descriptions on tiles and cards instead of long prose on the landing page.
- **Visuals**: brand mark and favicon; one color, icon, and artwork per research area, used for badges, filters, charts, and section backgrounds; people photos in author lists, hover cards, and the network graph.
- **Structure**: the five research areas (Digital Twins, AI, Digital Pathology, Pharmacometrics, Open & FAIR) serve as the core messages. The landing page is a one-pager with a start screen (vision, at-a-glance figures, team strip, entry tiles) and one full-screen section per research area, each leading to the matching publications, projects, software, and network view.
- **Linking**: people, publications, projects, software, and news are cross-linked. Each of them opens in one standard detail view with its related items, and the network page shows these links as a graph.
- **Evidence of impact**: citation metrics (Google Scholar), per-paper citations and open-access status (OpenAlex), and software activity (GitHub) are shown on the site and collected daily.
- **Technology**: the brainstormed direction was adopted: Astro with TypeScript, Vue components, and Tailwind; YAML data with automatic validation; automatic build and deployment via GitHub Actions; full-text search; `robots.txt`, `llms.txt`, and `llms-full.txt` so search engines and AI agents (a target audience in the table above) find and read the content. Not yet done: live PK-DB data, social-media post generation, embedded web tools.

### Governance

- Rebuilt and maintained as a static site using Visual Studio Code & Claude Code.
- Change management via GitHub: every change goes through a pull request and must pass the automatic checks (data validation, unit and browser tests) before it reaches `main`.
- Versioned releases with public release notes, and the version is shown in the site footer.
- Legal safeguards: Impressum and Datenschutzerklärung pages added, with a cookie-consent banner gating Google Analytics behind opt-in.

---

## Control (Tracking Goals & Measuring Success)

- Feedback rounds in group meetings.
- Google Analytics / website traffic tracking (opt-in only, so the numbers undercount real traffic).
- Collected feedback from stakeholders.
- Research-impact indicators, updated daily: Google Scholar citations and h-index (with a day-by-day history since 12 September 2026), per-paper citations (OpenAlex), and GitHub stars, releases, and commit activity of the group's software.
- Content quality: automatic validation of all data and cross-references on every change, so broken entries are caught before they go live.
- Success criteria (from the SWOT "Opportunities"):
  - Users are willing to spend more time on the site.
  - Users know where to find which information (via headers, tiles, etc.).
- Current status against these control measures and the completed-work checklist: see [`project_output.md`](project_output.md).

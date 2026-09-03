# Communication Concept — livermetabolism.com Relaunch

Consolidated planning document for the science-communication redesign of the
group website: situation analysis, target-audience research, positioning,
and the implementation/control plan derived from it. Structured around the
four standard phases of a communication concept — **Analysis → Planning →
Implementation → Control**. For the executed checklist and final deliverable
against this plan, see [`project_output.md`](project_output.md).

## Analysis

### Starting situation (state of the old site)

General:
- Not mobile- or tablet-friendly.

Landing page:
- Very busy, too much text; two-column layout too dense.
- Redundant information duplicated across pages (publications, funding, ...).
- News items too long — should be foldable.
- Everything crammed onto the landing page instead of being distributed.
- Needs more whitespace, fewer headers — "Research" should be able to cover
  projects, software, and presentations as one umbrella.
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

Systematic analysis of the initial conditions → derive concrete communication
tasks from it (see Planning/Implementation below).

### Benchmark: other research-group websites

Notable examples reviewed:
- Caltech/Princeton MacMillan group — clean layout, visually clear
  publications: https://macmillan.princeton.edu/
- Jeff Dahn group (Dalhousie) — informative, easy to navigate:
  https://www.dal.ca/diff/dahn/news.html
- MIT Buchwald group — praised for design and informative content:
  https://chemistry-buchwald.mit.edu/
- Stanford Burns group — clean, professional, innovative:
  https://www.burnschemistry.com/ (Solomon group noted similarly)
- Roundup: https://www.impactmedialab.com/scicomm/top-research-lab-websites-2024
- https://www.meghan-barrett.com/
- https://www.eddy-lab.org/
- https://emery-lab.org/
- https://www.netzerolab.science/
- https://www.natcapinsights.com/
- Pharmacometrics-adjacent examples: https://pharmetheus.com/,
  https://www.darwinfoundation.org/en/, https://www.metrumrg.com/

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

> "Your lab website is more than a digital brochure – it's a platform for
> sharing your research impact with the world."

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

Guiding principle: clarity and focus — **3-4 core messages maximum**,
prioritized by relevance. Less is more, especially on the landing page, and
each audience should be steered clearly toward the content meant for them.

### Positioning & core messages

- Accurate prediction as the core capability.
- Digital twins / models for individualized predictions across different
  clinical questions (e.g. liver function prediction).
- Triad framing: we build something for the patient, the physician, and
  society.
- Vision: real clinical application, real clinical questions — keep it broad
  rather than narrow; should read as a short statement of the future we want.
  - Use a Mission/Vision Canvas
    (https://itk.mitre.org/mission-vision-canvas/) and the Golden Circle
    model (why do we do this, how do we make the world better, who do we do
    it for) to derive it. Needs a genuinely engaging promise to the
    reader — energy and emotion, not just a dry statement.
- "We are the only organization that …" — needs an honest, specific
  differentiator, not a generic claim.
- De-emphasize the PI as an individual — don't position the group around one
  person.
- Core messages: Open Science, Open Data, FAIR, standardization,
  reproducibility.
- Core argument: computational models create measurable value — the
  per-audience benefits listed above are the supporting evidence.

### Mission/Vision brainstorm (raw candidate themes)

- Digital twins
- AI/ML
- Pharmacometrics (PK/PD)
- Liver & metabolism
- Digital pathology (image analysis) / spatial omics
- Modelling
- Open source, FAIR, transparency, reproducibility
- Interdisciplinarity
- Applications: liver function testing, personalized medicine, clinical
  decision support
  - Longer-term/aspirational: patents, a practical product, spin-off
    funding
- Video teaser (AI-generated)
- Interactive statistics on the landing page

### Strategy: channels & media

- The website itself rarely makes first contact — that happens on other
  channels (LinkedIn, presentations, posters). The site should sit
  downstream of those, in accessible language, easy to follow.
- Promotion via LinkedIn.
- Promotion at conferences/talks/posters (QR code + link).
- Mobile as a first-class channel, not an afterthought.

---

## Implementation (Text, Visuals, and Actions)

### Technology direction (brainstormed)

- Mobile-friendly and accessible (different end devices, users with
  disabilities).
- Simple, plain-text content storage (Markdown, JSON/YAML) — this became the
  `app/_data/*.yml` + pydantic (`src/data.py`) validation approach actually
  adopted.
- CI: automatic build/deploy on git push (GitHub Actions) — removes manual
  deployment steps.
- Modern web framework, TypeScript, a modern CSS framework.
- AI-assisted build and maintenance (Visual Studio Code & Claude Code).
- Possible live API integration (e.g. pull current status from PK-DB).
- GitHub Pages as a hosting option.
- Semi-automatic generation of social-media posts from site content.
- LinkedIn / Instagram / Bluesky presence.
- Interactive/embedded web tools (e.g. visFEM) linked directly from the
  site.
- Cross-linking of objects (people ↔ projects ↔ publications ↔ software) to
  make browsing more interesting and interactive.

### Concrete redesign actions identified

(brainstormed asks derived from the Analysis feedback above; execution
status for these is tracked separately in
[`project_output.md`](project_output.md))

- Declutter the landing page: less text, avoid two-column crowding, remove
  redundant content, make news items foldable, don't put everything on the
  landing page, more whitespace.
- Consolidate headers: "Research" as the umbrella for projects, software,
  and presentations.
- Make contact information prominent, with a clear footer.
- Optimize page load time.
- Define a corporate identity: logo, color palette.
- People page: more personal (hobbies, extra bio info), separate current
  members from alumni, refresh lab photos.

### Governance

- Rebuilt and maintained as a static site using Visual Studio Code & Claude
  Code.
- Change management via GitHub.
- Legal safeguards: Impressum, privacy/cookie notice, etc. — still an open
  item, see Control below.

---

## Control (Tracking Goals & Measuring Success)

- Feedback rounds in group meetings.
- Google Analytics / website traffic tracking.
- Collected feedback from stakeholders.
- Success criteria (from the SWOT "Opportunities"):
  - Users are willing to spend more time on the site.
  - Users know where to find which information (via headers, tiles, etc.).
- Current status against these control measures and the completed-work
  checklist: see [`project_output.md`](project_output.md).

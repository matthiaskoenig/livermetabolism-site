# Project Output

**Live site:** https://livermetabolism.com

Within this project, a new version of the group website was developed based on the science-communication principles covered in the course.

## Why a relaunch was needed

- The old site was very outdated.
- Too much clutter and information.
- No clear structure.
- No communication strategy or defined target audience.

## Delivered updates, cleanups & improvements

- [x] Collecting, linking, and updating information
  - [x] Updated open positions
  - [x] Linked people to publications
  - [x] Updated projects (collected all current projects)
  - [x] Linked people to projects
  - [x] Linked projects to core tags
  - [x] Linked publications to core tags
  - [x] Linked presentations and posters to core tags
  - [x] Link presentations and posters to people

- [x] Removed clutter
  - [x] Removed duplicate information from the landing page (publications, funding, ...)
  - [x] Collected all contact information and social links into the footer
  - [x] Moved news into a scrollable news reel/carousel
  - [x] Shortened texts and descriptions
  - [x] Merged Software, Funding, and Editorial roles into the Research page
  - [x] Merged People and Open Positions
  - [x] Fixed responsiveness on all pages
  - [x] Simplified and unified teaching content
  - [x] Removed unused assets and code (e.g. stale PDFs)
  - [x] Gave posters, abstracts, and presentations their own dedicated entries

- [x] Database
  - [x] Added validation code for the database and its entries (pydantic)
  - [x] Fixed database errors
  - [x] Improved consistency: unified naming, established naming patterns for files and ids

- [x] Addressing stakeholders
  - [x] Clear description of the lab's new orientation with the start of the professorship in Lübeck
  - [x] Added a vision statement
  - [x] Added core-expertise project highlights
  - [x] Introduced core tags

- [x] Design
  - [x] Simplified, modern styling and fonts
  - [x] Improved navigation/sub-navigation
  - [x] Added a logo (brand mark) and full favicon set

- [x] Usability
  - [x] Improved navigation (clearer navbar, fewer and better-structured items)
  - [x] Mobile-friendly design, responsive layout
  - [x] Improved page load time — especially image sizes/asset optimization (the Projects page used to take forever to load with only a fraction of images visible)
  - [x] Moved hosting to a different server to fix extremely slow page load times (nginx reverse proxy; GitHub Pages considered as an alternative)
  - [x] Split current members and alumni on the Team page
  - [ ] Search functionality
  

- [x] Control & follow-up (see `communication_concept.md` → Control)
  - [x] Google Analytics (GA4) installed for traffic tracking
  - [x] Legal safeguards: added `/impressum/` and `/privacy/` pages, linked from the footer on every page (Lübeck address, per § 5 TMG / § 18 MStV; Datenschutzerklärung covers server logs and Google Analytics)
  - [x] Cookie-consent banner gating Google Analytics behind opt-in (GA script only requested from Google after Accept; choice changeable anytime from the privacy page)
  - [x] Regular feedback rounds in group meetings

 - [x] Security updates
   - [x] removed outdated technology (old Ruby and Jekyll)
   - [x] removed old/deprecated npm packages)

## Future work

As a separate follow-up project, the site could migrate from Jekyll to a modern framework such as Astro: keeping the static-site philosophy while adding modern components, TypeScript, MD/MDX, better image handling, Node.js/Tailwind CSS tooling, and the option to use React/Vue/Svelte components (e.g. interactive statistics overviews) where actually needed.

The People page profiles could also be made more personal, adding details such as hobbies and other personal information alongside the current professional bios.

## Summary

Based on the science-communication principles from this course, the group's website (https://livermetabolism.com) was relaunched. The prior site was outdated, cluttered, and unstructured, with no clear communication strategy or target audience — a communication concept (`communication_concept.md`) was developed first to define target audiences, positioning, and concrete actions, and this project delivered on that plan.

Key results:
- **Restructured content**: all people, projects, publications, software, presentations, and posters now live in a validated, cross-linked database (YAML + a pydantic schema checked in CI), enabling consistent tagging and linking throughout the site.
- **Decluttered, focused design**: redundant content removed from the landing page, news moved into a compact carousel, contact information consolidated into the footer, and navigation simplified.
- **Clearer positioning**: a vision statement and description of the lab's new orientation (following the move to the professorship in Lübeck) were added, along with a logo and consistent modern styling.
- **Better usability and performance**: responsive/mobile-friendly design across all pages, faster page loads through image/asset optimization and improved hosting, and Google Analytics for ongoing traffic tracking.

A larger migration from Jekyll to a modern framework (e.g. Astro) is planned as a separate follow-up project. The full checklist above documents each change against the plan in `communication_concept.md`.

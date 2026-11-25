# Updating project case studies

The six selected projects are configured in `projects.json`. The canonical display name, summary, category, optional case-study fields, and illustrative workflow are kept here. Repository language, stars, forks, last update, and source URL are loaded from GitHub.

To improve a case study:

- Add a verified `status`, `demoUrl`, and `stack` when available.
- Add `screenshots` as objects with `src`, `alt`, and optional `caption`. Store image files under `assets/projects/`.
- Add `contribution`, `outcome`, and `learnings` using accurate, non-sensitive details.
- Add `skills` and `milestones` arrays to power skill mapping and project timelines.
- Keep workflows high-level and label diagrams as illustrative unless they match the implementation.

Only fields with content are shown. Never publish client data, secrets, malware samples, or details outside an authorized disclosure scope.

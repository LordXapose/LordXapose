# Optional site settings

`site-config.json` contains values that should only be filled with verified links or services:

- `certificates`: objects with `label` and HTTPS `url`; links appear on the résumé only after you add them.
- `resumeTranslations`: objects with `label` and a relative or HTTPS `url` for a translated résumé.
- `availabilityText`: optional wording you provide; blank keeps the neutral email-contact message.
- `analytics`: leave `null` to keep tracking off. To opt in, set an approved HTTPS `scriptUrl` and the exact published hostname as `domain`. Visitors must still enable analytics in the site controls; they can revoke consent there.

Project skill mappings and milestones belong in `projects.json`. Add only accurate skills, dates, and results. The site does not fabricate certificate verification links, résumé translations, project outcomes, or analytics credentials.

## Visitor controls

- `Ctrl/⌘ + K` opens the command palette; `?` opens the shortcut guide.
- Theme, accent, text scale, motion preference, project favorites, reading-list saves, and article feedback are stored locally in the visitor's browser.
- The contact form validates fields and opens a prefilled email draft. It has no server and does not transmit or store form contents.
- Browser sharing and clipboard controls require browser support and, in some browsers, HTTPS.

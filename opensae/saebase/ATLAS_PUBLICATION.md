# SAEBase Atlas publication

The public SAEBase Atlas is generated from the source-owned `OpenSAE/SAEBase` repository and deployed independently from OpenResearch.

- Source commit for the current verified generated snapshot: `5b355d9f2cff0bde03550a00f506d27bd42d75e4`
- Changes: remove numbered and synthetic source-navigation nodes, retain real source identities and Context links, and paginate actual children only in the browser.
- Validation: five-tree bilingual checks and Chromium browser verification passed in the isolated SAEBase publication workflow.

This publication record is deliberately outside `atlas/` so a site deployment can include the already verified generated snapshot without regenerating it again.

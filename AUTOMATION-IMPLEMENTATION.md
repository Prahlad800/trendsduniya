# AI News Automation implementation

Reuse Express, MongoDB transactions, the existing authenticated admin proxy, article editor, article validation, Cloudinary and RSS readers. Preserve Groq drafting. Add a separate Groq/Cloudflare automation workspace with durable MongoDB tasks; no second backend or Redis dependency.

New collections: AutomationSettings (singleton settings and worker lease), AutomationTask (daily topic, evidence, generation checkpoints, image metadata, approval, schedule and bounded history). Article gains an optional automationTask reference with a unique partial index. Existing article statuses remain compatible. Task states track generation separately.

Safety: RSS rank is an editorial shortlist, not a measured global ranking. RSS headlines are not fact verification. Require an editor to verify source evidence before generation, and approval after content edits. Publication rechecks task approval, image completeness, current settings and a content fingerprint inside the existing transaction. Jobs checkpoint each successful image and recover leases after restarts. One overdue article can publish per configured spacing period.

Deployment: MongoDB replica set is already required by the CMS. Create indexes before enabling automation. Run a persistent Node server or authenticated external cron. Automation is initially disabled. Never store provider credentials in settings or browser state.

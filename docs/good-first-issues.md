# Starter "good first issue" list

Create these on GitHub (Issues → New issue), and add the labels `good first issue` plus the second label shown.
Edit them to match what you actually find in the code.

---

**1. Add a "Report incorrect info" button to directory pages**
Labels: `good first issue`, `enhancement`
Add a small link on each directory card (dastarkhwan, imambargahs, darbars, melas) that opens a pre-filled GitHub issue or mailto with the record name and ID.
Acceptance: button appears on all four directories; works on mobile; text is translated in en/ur/hi/ar.

**2. Add a "last verified" date to directory records**
Labels: `good first issue`, `data`
Show a "Last verified: <date>" line on Urs, jaloos, and mela entries, and a visible "Unverified" badge when the date is missing.
Acceptance: Prisma field added and applied with `npm run db:push` (this repo does not use prisma migrations — `apps/api/prisma/migrations/` is gitignored); displayed in UI; seed updated.

**3. Check RTL layout on Urdu and Arabic pages**
Labels: `good first issue`, `bug`
Browse each page with the language set to Urdu or Arabic and list or fix layout problems (icons on the wrong side, misaligned filters, overflowing text).
Acceptance: screenshots before/after in the PR.

**4. Add screenshots to the README**
Labels: `good first issue`, `documentation`
Capture the homepage, events list (map view), and event detail page on desktop and mobile, add them under `docs/screenshots`, and reference them in the README.
Acceptance: images referenced from README.md; total added weight kept reasonable (compressed, ~1x per view).

**5. Translate the category-page sections into Urdu, Hindi, and Arabic**
Labels: `good first issue`, `enhancement`
The Charity directory, Muharram Jaloos, and Upcoming Urs sections on category pages are still English-only (the directory explorers were translated in Phase 36). Move their strings into `lib/i18n.ts` and translate them in all 4 locales.
Acceptance: no hardcoded English UI strings left in those components; the `i18n-keys.test.ts` guard passes; spot-check ur/ar renders.

**6. Verify Urs dates for one province against official sources**
Labels: `good first issue`, `data`, `help wanted`
Pick one province, compare entries in the Darbars/Urs calendar with official or organizer sources, and submit corrections with source links in the PR description.
Acceptance: corrections applied to `apps/api/prisma/data/pakistan-urs-dates.json`; source links in the PR; re-run `npm run db:seed --workspace apps/api`.

---

## Optional: create them from the terminal (GitHub CLI)

```bash
gh label create "good first issue" --color 7057ff --force
gh label create data --color 0e8a16 --force

gh issue create --title "Add a \"Report incorrect info\" button to directory pages" \
  --label "good first issue,enhancement" \
  --body "Add a small link on each directory card that opens a pre-filled issue with the record name and ID. Must work on mobile and be translated in en/ur/hi/ar."

gh issue create --title "Add a \"last verified\" date to directory records" \
  --label "good first issue,data" \
  --body "Add a lastVerifiedAt field (apply with npm run db:push — this repo does not use prisma migrations), show it in the UI, and show an Unverified badge when missing."

gh issue create --title "Check RTL layout on Urdu and Arabic pages" \
  --label "good first issue,bug" \
  --body "Browse each page in Urdu/Arabic and fix layout problems. Include before/after screenshots."

gh issue create --title "Add screenshots to the README" \
  --label "good first issue,documentation" \
  --body "Capture homepage, events map view, and event detail (desktop + mobile) into docs/screenshots and reference them in the README."

gh issue create --title "Translate the category-page sections into Urdu, Hindi, and Arabic" \
  --label "good first issue,enhancement" \
  --body "Charity, Muharram Jaloos, and Upcoming Urs sections are English-only. Move strings into lib/i18n.ts, translate all 4 locales, keep i18n-keys.test.ts passing."

gh issue create --title "Verify Urs dates for one province against official sources" \
  --label "good first issue,data,help wanted" \
  --body "Pick one province, compare Urs calendar entries to official sources, and submit corrections with links."
```

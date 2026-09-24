# Changes made to brief 1.0.0 → content/site.json 1.1.0

1. **Private data removed from the repo.** `internal_business_plan` and `publication_checks` are not in
   this public repository. The build refuses to run if either key appears (`src/build.mjs`).
2. **Palette aligned with NUUKquant + the logo:** ink `#0C1223`, blue `#0165FA`, cyan `#00D3F3`, paper `#F6F4EF`.
   The gold accent `#8B6B3F` was dropped (brief also warns against "too much gold").
3. **Typography:** headings Cormorant Garamond (matches the logo's high-contrast serif), body Manrope
   (NUUKquant's face). Inter dropped to stay within two families.
4. **Process steps rewritten in first-person plural** ("We define the requirement" / "İhtiyacı tanımlıyoruz").
   The original imperatives read as instructions to the client.
5. **Added:** employer/candidate split cards, a recruitment-scam notice, "what happens next" for employers,
   a contact page body, a footer line separating NUUK & Human from NUUK financial services, and UI strings.
6. **Candidate-facing translations for client types** (they were English-only).
7. **Form select options** now take their labels from sectors/services, so both languages render real names.
8. **Cookie page** has real content: the site sets no cookies and loads fonts from Google Fonts.
9. **FAQ answers** start with a direct yes/no where the question is yes/no.
10. **Founder track record** stays hidden (`display_by_default: false`), as in the brief.
11. **Launch settings (2026-09-24):** indexing on (sitemap, robots Allow, no preview banner), Open Graph
    image, Organization JSON-LD with verified fields only, draft privacy/candidate-privacy/terms texts,
    and an email form mode that turns on when `identity.contact.email` is set.

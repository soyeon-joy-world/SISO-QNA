# SISO Q&A

Exchange student FAQ website for SISO.

Live site: https://ssuinternational.kro.kr

## Structure

- `index.html`: English landing page
- `RC.html`, `timetable.html`, `dorm.html`, `ssu.html`: English FAQ pages
- `korean/`: Korean pages
- `css/styles.css`: shared styling
- `js/analytics.js`: Google Analytics setup
- `js/faq_loader.js`: optional Google Sheets FAQ loader

## Notes

- Shared styles and analytics should stay in `css/styles.css` and `js/analytics.js`.
- Avoid inline styles in HTML unless a one-off exception is really needed.
- FAQ data loaded from Google Sheets should use the Google Visualization JSON endpoint.

## Updating FAQs With Google Sheets

The FAQ pages can load questions from a public Google Sheet through `js/faq_loader.js`.

1. Share the Google Sheet as public view access.
2. Keep one sheet tab per page:
   - `RC`
   - `Dorm`
   - `Timetable`
   - `SSU`
3. Use these columns in order:
   - `id`
   - `questionKo`
   - `answerKo`
   - `questionEn`
   - `answerEn`
   - `order`
   - `active`
4. Set `active` to `TRUE` for rows that should be shown.
5. To change the spreadsheet, update the default sheet ID in `js/faq_loader.js`, or add this meta tag to an FAQ page:

```html
<meta name="faq-sheet-id" content="YOUR_GOOGLE_SHEET_ID">
```

Answers support:

- line breaks
- `**bold text**`
- `[link text](https://example.com)`

If the sheet cannot be loaded, existing FAQ HTML remains visible as a fallback.

/**
 * Print styles for DOE report PDFs. A4, single column, mirroring the admin
 * "Yfirlit" overview: section headers with a rule, two-column label/value
 * grids, simple tables and the salary stat cards.
 */
export const pdfStyles = `
  * {
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 24mm 18mm;
  }

  body {
    font-family: -apple-system, 'IBM Plex Sans', Arial, sans-serif;
    color: #00003c;
    font-size: 11px;
    line-height: 1.5;
    margin: 0;
  }

  h1.doc-title {
    font-size: 22px;
    margin: 0 0 4px 0;
  }

  .doc-intro {
    color: #5a5a72;
    font-size: 11px;
    margin: 0 0 8px 0;
    max-width: 90%;
  }

  .section {
    margin-top: 22px;
    page-break-inside: avoid;
  }

  .section__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    border-bottom: 1px solid #ccdfff;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }

  .section__title {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }

  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 24px;
  }

  .field__label {
    font-weight: 600;
    font-size: 11px;
    margin: 0;
  }

  .field__value {
    color: #43425a;
    margin: 2px 0 0 0;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  table.data-table th {
    text-align: left;
    background: #f2f7ff;
    color: #00003c;
    font-weight: 600;
    padding: 8px 10px;
    border-bottom: 1px solid #ccdfff;
  }

  table.data-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #eef2f9;
  }

  .stat-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .stat-card {
    border-radius: 8px;
    padding: 14px 16px;
    background: #f2f7ff;
  }

  .stat-card--accent {
    background: #f5edf7;
  }

  .stat-card__label {
    font-size: 11px;
    color: #43425a;
    margin: 0 0 6px 0;
  }

  .stat-card__value {
    font-size: 22px;
    font-weight: 600;
    color: #0061ff;
    margin: 0;
  }

  .stat-card--accent .stat-card__value {
    color: #6a2ea0;
  }

  .chart-wrap {
    margin-top: 12px;
  }

  .rich-content {
    font-size: 11px;
    line-height: 1.6;
  }

  .rich-content h1,
  .rich-content h2,
  .rich-content h3 {
    font-size: 14px;
    margin: 16px 0 6px 0;
  }

  /*
   * A submitted plan follows the Jafnréttisstofa template, so its rich text
   * carries the law quotes as blockquotes and one Markmið/Aðgerð/Ábyrgð/Verklok
   * table per section. Neither carries a class name — the markup comes from the
   * applicant's editor — so these are element selectors scoped to .rich-content.
   */
  .rich-content blockquote {
    margin: 8px 0 12px 0;
    padding: 6px 12px;
    border-left: 3px solid #0061ff;
    background: #f2f7ff;
  }

  .rich-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 16px 0;
    /* Keep a section's table intact rather than splitting it across pages. */
    page-break-inside: avoid;
  }

  .rich-content th,
  .rich-content td {
    border: 1px solid #ccdfff;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }

  .rich-content th {
    background: #f2f7ff;
    font-weight: 600;
  }

  .rich-content ul,
  .rich-content ol {
    margin: 6px 0 12px 0;
    padding-left: 20px;
  }

  .empty-note {
    color: #8a8aa0;
    font-style: italic;
  }

  /**
   * A note that STATES something, as opposed to \`.empty-note\` which marks an
   * absence.
   *
   * ⚠️ Separate class because \`.empty-note\`'s #8a8aa0 italic is 3.37:1 against
   * white — below WCAG AA's 4.5:1 — which is defensible for "engin dótturfyrirtæki
   * skráð" and wrong for a sentence a reader has to act on. #43425a is 9.7:1 and
   * already the body colour elsewhere in this stylesheet.
   *
   * The load-bearing case is ábendingar' "engra skýringa er krafist": muting the
   * one line that tells an employer they owe nothing is exactly the wrong
   * emphasis. The reviewer-web copy of that sentence is rendered semiBold at full
   * contrast, and the two surfaces must not disagree about it.
   */
  .advisory-note {
    color: #43425a;
  }

  .advisory-note--lead {
    color: #00003c;
    font-weight: 600;
  }
`

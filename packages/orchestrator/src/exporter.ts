import { ReportFormat } from '@researchsoul/shared';

export interface ExportInput {
  title: string;
  executiveSummary: string;
  content: string;
  bibliography: string[];
  format: ReportFormat;
}

/** PDF Phase 1 — Export to PDF / Markdown / DOCX */
export class ReportExporter {
  toMarkdown(input: ExportInput): string {
    return `# ${input.title}

## Executive Summary

${input.executiveSummary}

---

${input.content}

---

## References

${input.bibliography.map((b, i) => `${i + 1}. ${b}`).join('\n')}
`;
  }

  toDocxBuffer(input: ExportInput): Buffer {
    const md = this.toMarkdown(input);
    // Minimal DOCX-compatible XML wrapper (opens in Word)
    const paragraphs = md.split('\n').map((line) =>
      `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`,
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
<w:body>${paragraphs}</w:body>
</w:wordDocument>`;

    return Buffer.from(xml, 'utf-8');
  }

  toPdfHtml(input: ExportInput): string {
    const md = this.toMarkdown(input);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(input.title)}</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.6;color:#111}
h1,h2{border-bottom:1px solid #ccc;padding-bottom:8px}
pre{white-space:pre-wrap}
</style></head><body><pre>${escapeHtml(md)}</pre></body></html>`;
  }

  export(input: ExportInput): { data: Buffer | string; contentType: string; extension: string } {
    switch (input.format) {
      case ReportFormat.MARKDOWN:
        return { data: this.toMarkdown(input), contentType: 'text/markdown', extension: 'md' };
      case ReportFormat.DOCX:
        return { data: this.toDocxBuffer(input), contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' };
      case ReportFormat.PDF:
        return { data: this.toPdfHtml(input), contentType: 'text/html', extension: 'html' };
      default:
        return { data: this.toMarkdown(input), contentType: 'text/markdown', extension: 'md' };
    }
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

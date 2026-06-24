import { CitationStyle, CitationMode, type NormalizedDocument } from '@researchsoul/shared';

export interface CitationInput {
  document: NormalizedDocument;
  span?: string;
  index?: number;
}

/** PDF Module 11 — all citation formats + modes */
export class CitationEngine {
  format(input: CitationInput, style: CitationStyle, mode: CitationMode = CitationMode.INLINE): string {
    const base = this.formatByStyle(input, style);
    switch (mode) {
      case CitationMode.FOOTNOTE:
        return `[^${input.index ?? 1}] ${base}`;
      case CitationMode.ENDNOTE:
        return `[${input.index ?? 1}] ${base}`;
      case CitationMode.INLINE:
      default:
        return input.index ? `[${input.index}]` : `(${this.shortAuthor(input)} ${this.year(input)})`;
    }
  }

  formatBibliography(sources: CitationInput[], style: CitationStyle): string[] {
    return sources.map((s, i) => this.format({ ...s, index: i + 1 }, style, CitationMode.ENDNOTE));
  }

  private formatByStyle(input: CitationInput, style: CitationStyle): string {
    const { document } = input;
    const author = document.metadata.author ?? document.metadata.publisher ?? 'Unknown';
    const year = this.year(input);
    const title = document.title ?? 'Untitled';
    const url = document.metadata.url ?? '';

    switch (style) {
      case CitationStyle.APA:
        return `${author}. (${year}). ${title}. ${url}`;
      case CitationStyle.MLA:
        return `${author}. "${title}." Web. ${year}. ${url}`;
      case CitationStyle.CHICAGO:
        return `${author}. "${title}." Accessed ${year}. ${url}.`;
      case CitationStyle.IEEE:
        return `[${input.index ?? 1}] ${author}, "${title}," ${year}. [Online]. Available: ${url}`;
      case CitationStyle.BLUEBOOK:
        return `${author}, ${title} (${year}), ${url}.`;
      default:
        return `${author} (${year}). ${title}.`;
    }
  }

  private shortAuthor(input: CitationInput): string {
    const author = input.document.metadata.author ?? 'Unknown';
    const parts = author.split(' ');
    return parts[parts.length - 1] ?? author;
  }

  private year(input: CitationInput): string {
    const ts = input.document.metadata.timestamp;
    if (!ts) return 'n.d.';
    return new Date(ts).getFullYear().toString();
  }
}

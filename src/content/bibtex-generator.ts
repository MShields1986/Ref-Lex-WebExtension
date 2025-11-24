// BibTeX generation utility

export interface BibtexFields {
  type: string; // article, book, inproceedings, etc.
  key: string;
  title?: string;
  author?: string;
  year?: string;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  [key: string]: string | undefined;
}

/**
 * Escapes special characters in BibTeX field values
 * @param value The string value to escape
 * @returns Escaped string safe for BibTeX
 */
export function escapeBibtexValue(value: string): string {
  if (!value) return '';

  // Use placeholders for special sequences that contain braces
  // to avoid double-escaping when we escape braces later
  const BACKSLASH_PLACEHOLDER = '\x00BACKSLASH\x00';
  const TILDE_PLACEHOLDER = '\x00TILDE\x00';
  const CARET_PLACEHOLDER = '\x00CARET\x00';

  return value
    // Replace backslash first with placeholder
    .replace(/\\/g, BACKSLASH_PLACEHOLDER)
    // Replace tilde with placeholder
    .replace(/~/g, TILDE_PLACEHOLDER)
    // Replace caret with placeholder
    .replace(/\^/g, CARET_PLACEHOLDER)
    // Now escape braces (won't affect placeholders)
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    // Escape other special LaTeX characters
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    // Finally, replace placeholders with proper LaTeX commands (containing braces)
    .replace(new RegExp(BACKSLASH_PLACEHOLDER, 'g'), '\\textbackslash{}')
    .replace(new RegExp(TILDE_PLACEHOLDER, 'g'), '\\textasciitilde{}')
    .replace(new RegExp(CARET_PLACEHOLDER, 'g'), '\\^{}');
}

/**
 * Escapes and formats multi-line BibTeX values (like abstracts)
 * @param value The multi-line string value
 * @returns Formatted string for BibTeX
 */
export function escapeMultilineValue(value: string): string {
  if (!value) return '';

  return value
    // First apply standard escaping
    .split('\n')
    .map(line => escapeBibtexValue(line.trim()))
    .filter(line => line.length > 0)
    .join(' '); // Join with space, not newline (better for BibTeX)
}

export function generateBibtex(fields: BibtexFields): string {
  const { type, key, ...rest } = fields;

  // Validate BibTeX key format
  if (!/^[a-zA-Z0-9_:-]+$/.test(key)) {
    console.warn(`[Ref-Lex] Invalid BibTeX key format: ${key}`);
  }

  const entries = Object.entries(rest)
    .filter(([_, value]) => value && value.trim())
    .map(([fieldKey, value]) => {
      // Value is guaranteed to be a string after the filter above
      const stringValue = value as string;
      // Use multi-line escaping for abstract, standard escaping for others
      const escaped = fieldKey === 'abstract'
        ? escapeMultilineValue(stringValue)
        : escapeBibtexValue(stringValue);
      return `  ${fieldKey} = {${escaped}}`;
    })
    .join(',\n');

  return `@${type}{${key},\n${entries}\n}`;
}

export function generateBibtexKey(paper: {
  authors?: string[];
  year?: string;
  title?: string;
}): string {
  const firstAuthor =
    paper.authors?.[0]
      ?.split(' ')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z]/g, '') || 'unknown';

  const year = paper.year || new Date().getFullYear().toString();

  const titleWord =
    paper.title
      ?.split(' ')[0]
      ?.toLowerCase()
      .replace(/[^a-z]/g, '') || 'paper';

  return `${firstAuthor}${year}${titleWord}`;
}

export function generateBibtexFromMetadata(metadata: {
  title?: string;
  authors?: string[];
  year?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
}): string {
  const key = generateBibtexKey(metadata);
  const author = metadata.authors?.join(' and ') || '';

  return generateBibtex({
    type: 'article',
    key,
    title: metadata.title,
    author,
    year: metadata.year,
    journal: metadata.journal,
    volume: metadata.volume,
    pages: metadata.pages,
    doi: metadata.doi,
    url: metadata.url,
    abstract: metadata.abstract,
  });
}

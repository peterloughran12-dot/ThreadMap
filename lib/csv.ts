// Minimal CSV line parser: handles quoted fields (with embedded commas and
// escaped "" quotes), which plain split(',') would break on.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

export type ParsedContactRow = {
  full_name: string;
  job_title: string;
  email: string;
  linkedin_url: string;
};

// Header aliases seen in real ZoomInfo / Lusha CSV exports (column naming
// varies by export template, so we match loosely rather than requiring an
// exact layout).
const HEADER_ALIASES: Record<keyof ParsedContactRow, string[]> = {
  full_name: ['full name', 'name', 'contact name'],
  job_title: ['job title', 'title', 'position', 'job function'],
  email: ['email', 'email address', 'work email', 'business email'],
  linkedin_url: [
    'linkedin url',
    'linkedin',
    'person linkedin url',
    'linkedin contact profile url',
    'linkedin profile',
  ],
};
const FIRST_NAME_ALIASES = ['first name', 'firstname'];
const LAST_NAME_ALIASES = ['last name', 'lastname', 'surname'];

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function mapRowsToContacts(rows: string[][]): ParsedContactRow[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);

  function findColumn(aliases: string[]) {
    return headers.findIndex((h) => aliases.includes(h));
  }

  const fullNameCol = findColumn(HEADER_ALIASES.full_name);
  const firstNameCol = findColumn(FIRST_NAME_ALIASES);
  const lastNameCol = findColumn(LAST_NAME_ALIASES);
  const jobTitleCol = findColumn(HEADER_ALIASES.job_title);
  const emailCol = findColumn(HEADER_ALIASES.email);
  const linkedinCol = findColumn(HEADER_ALIASES.linkedin_url);

  return rows.slice(1).map((r) => {
    let fullName = fullNameCol >= 0 ? (r[fullNameCol] ?? '').trim() : '';
    if (!fullName && (firstNameCol >= 0 || lastNameCol >= 0)) {
      fullName = [firstNameCol >= 0 ? r[firstNameCol] : '', lastNameCol >= 0 ? r[lastNameCol] : '']
        .filter(Boolean)
        .join(' ')
        .trim();
    }
    return {
      full_name: fullName,
      job_title: jobTitleCol >= 0 ? (r[jobTitleCol] ?? '').trim() : '',
      email: emailCol >= 0 ? (r[emailCol] ?? '').trim() : '',
      linkedin_url: linkedinCol >= 0 ? (r[linkedinCol] ?? '').trim() : '',
    };
  });
}

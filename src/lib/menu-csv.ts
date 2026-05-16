export interface MenuCsvRow {
  category: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  dietary?: string;
  popular?: boolean;
}

const HEADER = ['Category', 'Name', 'Price', 'Description', 'Image', 'Dietary', 'Popular'];

function escapeCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildMenuCsv(items: Array<Record<string, any>>): string {
  const lines = [HEADER.join(',')];
  for (const it of items) {
    lines.push(
      [
        it.category ?? '',
        it.name ?? '',
        it.price ?? '',
        it.description ?? '',
        it.image ?? '',
        it.dietary ?? '',
        it.popular ? 'true' : 'false',
      ]
        .map(escapeCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

// Robust CSV parser supporting quoted fields, escaped quotes, newlines in quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell && cell.trim().length > 0));
}

export function parseMenuCsv(text: string): { items: MenuCsvRow[]; errors: string[] } {
  const rows = parseCsv(text);
  const errors: string[] = [];
  if (rows.length === 0) return { items: [], errors: ['File is empty'] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const iCat = idx('category');
  const iName = idx('name');
  const iPrice = idx('price');
  const iDesc = idx('description');
  const iImg = idx('image');
  const iDiet = idx('dietary');
  const iPop = idx('popular');

  if (iName < 0 || iPrice < 0) {
    return {
      items: [],
      errors: ['Header must include at least Name and Price (expected: Category,Name,Price,Description,Image,Dietary,Popular)'],
    };
  }

  const items: MenuCsvRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (row[iName] ?? '').trim();
    const priceRaw = (row[iPrice] ?? '').trim();
    if (!name) {
      errors.push(`Row ${r + 1}: missing name`);
      continue;
    }
    const price = Number(priceRaw);
    if (!Number.isFinite(price)) {
      errors.push(`Row ${r + 1}: invalid price "${priceRaw}"`);
      continue;
    }
    const popRaw = iPop >= 0 ? (row[iPop] ?? '').trim().toLowerCase() : '';
    items.push({
      category: (iCat >= 0 ? (row[iCat] ?? '').trim() : '') || 'General',
      name,
      price,
      description: iDesc >= 0 ? (row[iDesc] ?? '').trim() : '',
      image: iImg >= 0 ? (row[iImg] ?? '').trim() : '',
      dietary: iDiet >= 0 ? (row[iDiet] ?? '').trim() : '',
      popular: popRaw === 'true' || popRaw === '1' || popRaw === 'yes',
    });
  }
  return { items, errors };
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

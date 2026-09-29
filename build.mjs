// Збирає сторінки сайту з шаблону і словників: index.html (en) та uk/index.html.
//   node build.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');

const pages = {
  en: { out: 'index.html', base: '', switchHref: 'uk/', switchLang: 'uk', switchLabel: 'UA', switchLabelLong: 'Українською' },
  uk: { out: 'uk/index.html', base: '../', switchHref: '../', switchLang: 'en', switchLabel: 'EN', switchLabelLong: 'English' },
};

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
}

for (const [lang, cfg] of Object.entries(pages)) {
  const dict = JSON.parse(fs.readFileSync(path.join(root, `i18n/${lang}.json`), 'utf8'));
  const data = { ...dict, lang, base: cfg.base, switchHref: cfg.switchHref, switchLang: cfg.switchLang,
    switchLabel: cfg.switchLabel, switchLabelLong: cfg.switchLabelLong };
  const missing = new Set();
  const html = template.replace(/\{\{([\w.]+)\}\}/g, (match, key, offset) => {
    const value = lookup(data, key);
    if (value === undefined) { missing.add(key); return match; }
    // Усередині атрибутів лапки треба екранувати.
    const before = template.slice(Math.max(0, offset - 200), offset);
    const inAttr = /="[^"]*$/.test(before);
    return inAttr ? escapeAttr(String(value)) : String(value);
  });
  if (missing.size) throw new Error(`[${lang}] відсутні ключі: ${Array.from(missing).join(', ')}`);
  const outPath = path.join(root, cfg.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`${lang} → ${cfg.out} (${html.length} байт)`);
}

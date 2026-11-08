// Reads the parish website and updates data/events.json. If anything looks wrong
// it stops with an error and leaves the previous good file untouched.
const fs = require('fs');
const path = require('path');
const { applyNewsletterPdf, buildData, cleanLine, formatData, htmlToLines, todayInBritain } = require('./parse');

const SITE = 'https://www.oltonfriary.org.uk';
const AGENT = 'OltonFriaryEvents/1.0 (+https://github.com/ugwueru-glitch/olton-friary-events)';
const DATA_FILE = path.join(__dirname, '..', 'data', 'events.json');
const NEWSLETTER_FILE = path.join(__dirname, '..', 'data', 'newsletter-pdf.json');
const UNREAD_FILE = path.join(__dirname, 'unread.txt');
const PAUSE_MS = 1000;
const LINE_GAP = 2;

async function fetchPage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  return response;
}

async function fetchHtml(pagePath) {
  const response = await fetchPage(SITE + pagePath);
  return response.text();
}

function findPdf(html) {
  const links = [...html.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => m[1]);
  const link = links.find((href) => /coming-up|diary|dates/i.test(href)) || links[0];
  if (!link) throw new Error('The events page has no PDF link');
  return new URL(link, SITE).href;
}

async function pdfLines(url) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const response = await fetchPage(url);
  const file = new Uint8Array(await response.arrayBuffer());
  const pdf = await getDocument({ data: file, useSystemFonts: true, verbosity: 0 }).promise;
  const lines = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const { items } = await page.getTextContent();
    const rows = [];
    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = item.transform[5];
      const row = rows.find((r) => Math.abs(r.y - y) <= LINE_GAP);
      if (row) row.items.push(item);
      else rows.push({ y, items: [item] });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const row of rows) {
      row.items.sort((a, b) => a.transform[4] - b.transform[4]);
      lines.push(cleanLine(row.items.map((item) => item.str).join(' ')));
    }
  }
  return lines;
}

async function main() {
  const newsletter = htmlToLines(await fetchHtml('/welcome/weekly-newsletter/'));
  const diaryPage = htmlToLines(await fetchHtml('/worship-and-sacraments/mass-information/weekly-diary/'));
  const pdf = await pdfLines(findPdf(await fetchHtml('/hire-and-events/events/')));
  const previous = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  const today = todayInBritain();
  const { data, unread, read, kept } = buildData({ newsletter, diaryPage, pdf, previous, today });
  const fromPdf = fs.existsSync(NEWSLETTER_FILE) ? JSON.parse(fs.readFileSync(NEWSLETTER_FILE, 'utf8')) : null;
  const combined = fromPdf ? applyNewsletterPdf(data, fromPdf, today) : data;

  const temporary = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporary, formatData(combined));
  fs.renameSync(temporary, DATA_FILE);
  fs.writeFileSync(UNREAD_FILE, unread.length ? `${unread.join('\n')}\n` : '');
  console.log(`Read ${read} events, kept ${kept} from earlier, ${combined.events.length} now stored.`);
  console.log(unread.length ? `Lines for the owner to check:\n${unread.join('\n')}` : 'No unread lines.');
}

main().catch((error) => {
  console.error(`Refresh failed, previous data kept: ${error.message}`);
  process.exit(1);
});

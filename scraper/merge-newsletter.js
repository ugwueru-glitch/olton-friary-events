// Adds the events in data/newsletter-pdf.json to the site's data without reading
// the parish website. Run after updating that file from a new newsletter PDF.
const fs = require('fs');
const path = require('path');
const { applyNewsletterPdf, formatData, todayInBritain } = require('./parse');

const DATA_FILE = path.join(__dirname, '..', 'data', 'events.json');
const NEWSLETTER_FILE = path.join(__dirname, '..', 'data', 'newsletter-pdf.json');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const newsletter = JSON.parse(fs.readFileSync(NEWSLETTER_FILE, 'utf8'));
const today = todayInBritain();
const combined = applyNewsletterPdf({ ...data, lastRefreshed: today }, newsletter, today);
fs.writeFileSync(DATA_FILE, formatData(combined));
console.log(`${newsletter.newsletter}: ${combined.events.length} events now stored.`);

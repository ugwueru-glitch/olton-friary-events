const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { buildData, cleanLine, htmlToLines, resolveDate } = require('./parse');

const samples = path.join(__dirname, 'samples');
const readLines = (name) => fs.readFileSync(path.join(samples, name), 'utf8').split(/\r?\n/).filter(Boolean);
const newsletter = readLines('2026-11-01-newsletter.txt');
const diaryPage = readLines('2026-11-01-diary.txt');
const pdf = readLines('2026-11-01-pdf.txt');
const expected = JSON.parse(fs.readFileSync(path.join(samples, '2026-11-01-expected.json'), 'utf8'));
const TODAY = '2026-11-01';
const build = (extra = {}) => buildData({ newsletter, diaryPage, pdf, previous: null, today: TODAY, ...extra });
const shape = ({ date, time, title, note, category, icon }) => ({ date, time, title, note, category, icon });
const sortAll = (events) => [...events].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

test('the saved pages give exactly the events in the approved mockups', () => {
  const { data, unread } = build();
  assert.deepEqual(sortAll(data.events.map(shape)), sortAll(expected.events));
  assert.deepEqual(data.feasts, expected.feasts);
  assert.deepEqual(unread, []);
});

test('each day keeps the approved order', () => {
  const { data } = build();
  const titles = (date) => data.events.filter((e) => e.date === date && e.category === 'church').map((e) => e.time);
  assert.deepEqual(titles('2026-11-01'), ['9:00am', '11:00am', '2:00pm', '6:00pm']);
  assert.deepEqual(titles('2026-11-03'), ['7:00am', '10:15am', '10:45am', '7:00pm']);
  assert.deepEqual(titles('2026-11-07'), ['9:30am', '10:15am', 'After Mass', '3:00pm']);
});

test('intentions, names and contact details never reach the data', () => {
  const text = JSON.stringify(build().data);
  assert.doesNotMatch(text, /Sample Name|\bRIP\b|example\.org|0000 000/);
});

test('a date with no year takes the next time it falls', () => {
  assert.deepEqual(resolveDate({ day: 23, month: 'January', weekday: 'Saturday' }, TODAY), { key: '2027-01-23' });
  assert.deepEqual(resolveDate({ day: 14, month: 'Nov' }, TODAY), { key: '2026-11-14' });
});

test('a date that has only just gone is treated as past', () => {
  assert.deepEqual(resolveDate({ day: 3, month: 'October', weekday: 'Saturday' }, TODAY), { past: true });
});

test('impossible dates and wrong weekdays are rejected', () => {
  assert.ok(resolveDate({ day: 31, month: 'November' }, TODAY).error);
  assert.ok(resolveDate({ day: 14, month: 'November', weekday: 'Monday' }, TODAY).error);
});

test('a wrong weekday in a notice is reported and not published', () => {
  const broken = newsletter.map((line) => line.replace('Monday 2 Nov 7.30pm', 'Tuesday 2 Nov 7.30pm'));
  const { data, unread } = build({ newsletter: broken, diaryPage: null });
  assert.ok(!data.events.some((e) => e.title === 'Journey in Faith'));
  assert.ok(unread.some((line) => /weekday/.test(line)));
});

test('a notice with a date and no rule is listed with contact details removed', () => {
  const extra = [...newsletter];
  extra.splice(extra.indexOf('Notices') + 1, 0, 'Quiz supper Sat 21 Nov, ring 0121 706 0505 or a.person@example.org');
  const { unread } = build({ newsletter: extra });
  assert.equal(unread.length, 1);
  assert.match(unread[0], /Quiz supper/);
  assert.doesNotMatch(unread[0], /0121|example\.org/);
});

test('an unknown diary entry is reported without copying its text', () => {
  const extra = [...newsletter];
  extra.splice(extra.indexOf('10.45 Rosary of the unborn') + 1, 0, '4.00 Private Person RIP');
  const { data, unread } = build({ newsletter: extra, diaryPage: null });
  assert.doesNotMatch(JSON.stringify(data), /Private Person/);
  assert.doesNotMatch(unread.join(), /Private Person/);
  assert.equal(unread.length, 1);
});

test('events stay stored when a newsletter stops mentioning them', () => {
  const previous = { feasts: { '2026-12-25': 'Christmas Day', '2026-10-01': 'Old' }, events: [
    { date: '2026-12-20', time: '3:00pm', title: 'Carol Service', note: '', category: 'church', icon: '⛪', source: 'newsletter' },
    { date: '2026-10-01', time: '3:00pm', title: 'Old Event', note: '', category: 'church', icon: '⛪', source: 'newsletter' }
  ] };
  const { data } = build({ previous });
  assert.ok(data.events.some((e) => e.title === 'Carol Service'));
  assert.ok(!data.events.some((e) => e.title === 'Old Event'));
  assert.equal(data.feasts['2026-12-25'], 'Christmas Day');
  assert.equal(data.feasts['2026-10-01'], undefined);
});

test('running again on the same pages changes nothing', () => {
  const first = build().data;
  const stored = JSON.parse(JSON.stringify(first));
  assert.deepEqual(build({ previous: stored }).data, first);
});

test('newer details replace what was stored for the same event', () => {
  const stored = JSON.parse(JSON.stringify(build().data));
  stored.events.find((e) => e.title === 'Christmas Market').note = 'An older and much longer note than the one in the newest notice';
  const market = build({ previous: stored }).data.events.filter((e) => e.title === 'Christmas Market');
  assert.equal(market.length, 1);
  assert.equal(market[0].note, 'Until 2:00pm. Parish Hall. Tables £15');
});

test('a fresh diary replaces its own days, so a moved Mass does not linger', () => {
  const previous = { feasts: {}, events: [
    { date: '2026-11-05', time: '8:00am', title: 'Mass', note: '', category: 'church', icon: 'mass', source: 'newsletter-diary' }
  ] };
  const { data } = build({ previous });
  assert.ok(!data.events.some((e) => e.date === '2026-11-05' && e.time === '8:00am'));
});

test('sample events never carry into real data', () => {
  const previous = { feasts: {}, events: [
    { date: '2026-12-20', time: '3:00pm', title: 'Pretend', note: '', category: 'church', icon: '⛪', source: 'sample' }
  ] };
  assert.ok(!build({ previous }).data.events.some((e) => e.title === 'Pretend'));
});

test('a run that reads far fewer events than before stops', () => {
  const previous = { feasts: {}, events: Array.from({ length: 200 }, (_, i) => (
    { date: '2026-12-20', time: '3:00pm', title: `Event ${i}`, note: '', category: 'church', icon: '⛪', source: 'newsletter' }
  )) };
  assert.throws(() => build({ previous }), /looks wrong/);
});

test('a page with no diary stops the run', () => {
  assert.throws(() => build({ newsletter: ['Nothing useful here'] }), /no Weekly Diary/);
});

test('a page that reads as almost empty stops the run', () => {
  assert.throws(() => build({ newsletter: newsletter.slice(0, 8), pdf: [] }), /looks wrong/);
});

test('the site\'s habits are tidied before reading', () => {
  assert.equal(cleanLine('Monday 2 nd November'), 'Monday 2nd November');
  assert.equal(cleanLine('6 . 00 Mass'), '6.00 Mass');
  assert.equal(cleanLine('10 .15 Mass'), '10.15 Mass');
  assert.deepEqual(htmlToLines('<p>Tickets &pound;12&nbsp;now</p><script>x</script><div>Next</div>'), ['Tickets £12 now', 'Next']);
});

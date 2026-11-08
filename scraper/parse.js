// Fixed rules that turn the parish website's hand-written text into dated events.
// See handoffs/04-data-and-scraper.md. Nothing here reads the network or files.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_WORD = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
const DAY_WORD = 'Sun(?:day)?|Mon(?:day)?|Tue(?:s(?:day)?)?|Wed(?:nesday)?|Thu(?:r(?:s(?:day)?)?)?|Fri(?:day)?|Sat(?:urday)?';
const DAY_FIRST = new RegExp(`(?:\\b(${DAY_WORD})\\.?,?\\s+)?\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_WORD})\\b\\.?(?:,?\\s+(20\\d\\d))?`, 'gi');
const MONTH_FIRST = new RegExp(`(?:\\b(${DAY_WORD})\\.?,?\\s+)?\\b(${MONTH_WORD})\\b\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(20\\d\\d))?`, 'gi');
const FULL_WEEKDAY = /\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i;
const OLD_DATE_DAYS = 90;
const NO_TIME = 24 * 60;

// Regular Mass slots, from the home page and the weekly diary. An entry with no
// event name at one of these times is a Mass whose intention is all that is written.
const MASS_SLOTS = {
  0: ['9:00am', '11:00am', '6:00pm'],
  1: ['7:00am', '10:15am'],
  2: ['7:00am', '10:15am'],
  3: ['7:00am', '10:15am'],
  4: ['7:00am', '10:15am'],
  5: ['7:00am', '10:15am'],
  6: ['10:15am']
};

const DIARY_ACTIVITIES = [
  { match: /^confessions?\b/i, title: 'Confessions', icon: '🙏' },
  { match: /^rosary of the unborn\b/i, title: 'Rosary of the Unborn', icon: '📿' },
  { match: /^rosary\b/i, title: 'Rosary', icon: '📿' },
  { match: /^prayer before the blessed sacrament\b/i, title: 'Prayer before the Blessed Sacrament', icon: '🕯️' }
];

// Notices the rules recognise by name. Anything else with a date goes to the owner.
// Each name must start the line, so a sentence that only mentions an event, such as
// "after the Christmas Fayre ... email Paul by November 23", can't give it a date.
const KNOWN = [
  { id: 'market', match: /^(?:friary )?christmas market/i, title: 'Christmas Market', category: 'social', icon: '🎄', hall: true },
  { id: 'hcpt', match: /^(?:hcpt|music and spice)/i, title: 'Music and Spice Night', category: 'social', icon: '🎶', hall: true, opening: 'In aid of HCPT' },
  { id: 'flowers', match: /^christmas flower workshop/i, category: 'social', icon: '💐' },
  { id: 'fayre', match: /^(?:parish (?:&|and) school |olton friary \/ our lady of compassion )?christmas fayre/i, title: 'Parish and School Christmas Fayre', category: 'social', icon: '🎁', opening: 'Our Lady of Compassion', noTime: true },
  { id: 'journey', match: /^journey in faith/i, title: 'Journey in Faith', category: 'church', icon: '✝️', opening: 'For those seeking to join the Catholic Church' },
  { match: /^celebration of life mass/i, title: 'Celebration of Life Mass', category: 'church', icon: 'mass' }
];

const PDF_ICONS = [
  { match: /singer/i, icon: '🎤' },
  { match: /race night/i, icon: '🏇' },
  { match: /tea dance/i, icon: '☕' },
  { match: /irish night/i, icon: '☘️' }
];

const IGNORED_LINES = /week starting|job opening|please pray for|exit appeal/i;
const FORBIDDEN_TEXT = /@|\b0\d{2,4}[\s-]?\d{3}[\s-]?\d{3,4}\b|\bRIP\b|\banniv|\bbirthday\b|\bintention/i;
const ENTITIES = { nbsp: ' ', amp: '&', pound: '£', hellip: '...', ndash: '-', mdash: '-', bull: '•', lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"', frac12: '½', eacute: 'é', copy: '©' };

function cleanLine(line) {
  return line
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s+(st|nd|rd|th)\b/g, '$1$2')
    .replace(/\b(\d{1,2})\s*\.\s*(\d{2})\b/g, '$1.$2')
    .trim();
}

function htmlToLines(html) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/td)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z0-9]+);/gi, (_, name) => ENTITIES[name] ?? ' ')
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);
}

function findDates(text) {
  const found = [];
  for (const m of text.matchAll(DAY_FIRST)) found.push({ weekday: m[1], day: Number(m[2]), month: m[3], year: m[4], index: m.index, end: m.index + m[0].length });
  for (const m of text.matchAll(MONTH_FIRST)) found.push({ weekday: m[1], month: m[2], day: Number(m[3]), year: m[4], index: m.index, end: m.index + m[0].length });
  found.sort((a, b) => a.index - b.index);
  return found.filter((d, i) => i === 0 || d.index >= found[i - 1].end);
}

function dateKey(year, month, day) {
  const d = new Date(Date.UTC(year, month, day));
  if (d.getUTCMonth() !== month || d.getUTCDate() !== day) return null;
  return d.toISOString().slice(0, 10);
}

function addDays(key, days) {
  const d = new Date(key + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(key) {
  return new Date(key + 'T12:00:00Z').getUTCDay();
}

// Finds the real calendar date. A date with no year takes the next time it falls,
// unless it has only just gone, which means the notice is out of date.
function resolveDate({ day, month, year, weekday }, today) {
  const monthIndex = MONTHS.indexOf(month.slice(0, 3).toLowerCase());
  const thisYear = Number(today.slice(0, 4));
  const years = year ? [Number(year)] : [thisYear - 1, thisYear, thisYear + 1];
  const real = years.map((y) => dateKey(y, monthIndex, day)).filter(Boolean);
  if (!real.length) return { error: 'impossible date' };
  const oldest = addDays(today, year ? -36500 : -OLD_DATE_DAYS);
  const key = real.find((candidate) => candidate >= oldest);
  if (!key) return { error: 'date is too far in the past' };
  if (key < today) return { past: true };
  // The weekday only checks the date. It must never move an event to another year.
  if (weekday && weekdayOf(key) !== WEEKDAYS.indexOf(weekday.slice(0, 3).toLowerCase())) {
    return { error: 'weekday does not match the date' };
  }
  return { key };
}

function formatMinutes(minutes) {
  const hour = Math.floor(minutes / 60);
  const pm = hour >= 12;
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')}${pm ? 'pm' : 'am'}`;
}

function toMinutes(hour, minute, suffix) {
  const h = Number(hour) % 12 + (suffix.toLowerCase() === 'pm' ? 12 : 0);
  return h * 60 + Number(minute || 0);
}

function minutesOf(time) {
  const m = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(time);
  return m ? toMinutes(m[1], m[2], m[3]) : null;
}

// Reads "3pm - 4.30pm", "11am-2pm", "6pm to 8pm" or "7 pm".
function findTimes(text) {
  const range = /\b(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)\b/i.exec(text);
  if (range) {
    return { time: formatMinutes(toMinutes(range[1], range[2], range[3] || range[6])), until: formatMinutes(toMinutes(range[4], range[5], range[6])) };
  }
  const single = /\b(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)\b/i.exec(text);
  return single ? { time: formatMinutes(toMinutes(single[1], single[2], single[3])), until: '' } : { time: '', until: '' };
}

function joinNote(...parts) {
  return parts.filter(Boolean).join('. ');
}

function event(fields) {
  return { note: '', icon: '', ...fields };
}

// ---- Weekly Diary ----

function diaryRange(lines) {
  for (let i = 1; i < lines.length; i++) {
    if (/^weekly diary$/i.test(lines[i - 1]) && findDates(lines[i]).length >= 2) return i;
  }
  return -1;
}

function diaryHeading(line) {
  const dates = findDates(line);
  const date = dates[dates.length - 1];
  if (dates.length !== 1 || date.end !== line.length) return null;
  const before = line.slice(0, date.index).trim();
  if (date.weekday) return { ...date, feast: before && `${before} ${date.weekday}` };
  const named = FULL_WEEKDAY.exec(before);
  return { ...date, weekday: named ? named[1] : undefined, feast: before };
}

// The site writes "7.00" with no am or pm, so the order of the day's list decides.
function inferClock(rows) {
  let previous = -1;
  rows.forEach((row, i) => {
    const hour = Number(row.hour);
    let minutes = (hour % 12) * 60 + Number(row.minute);
    if (row.suffix === 'pm' || (i === 0 && hour >= 1 && hour <= 6)) minutes += 12 * 60;
    else if (row.suffix !== 'am' && minutes <= previous) minutes += 12 * 60;
    row.clock = minutes;
    previous = minutes;
  });
}

function diaryRow(row, date, unread) {
  const time = formatMinutes(row.clock);
  const base = { date, time, category: 'church', source: 'newsletter-diary', sort: row.clock };
  if (/^mass\b/i.test(row.rest)) {
    return event({ ...base, title: 'Mass', icon: 'mass', note: /^mass\s*\(in church\)/i.test(row.rest) ? 'In church' : '' });
  }
  const namedMass = /^((?:[A-Z][a-z]+\s+|of\s+){1,5}Mass)$/.exec(row.rest);
  if (namedMass) return event({ ...base, title: namedMass[1], icon: 'mass' });
  const activity = DIARY_ACTIVITIES.find((a) => a.match.test(row.rest));
  if (activity) return event({ ...base, title: activity.title, icon: activity.icon });
  if (MASS_SLOTS[weekdayOf(date)].includes(time)) return event({ ...base, title: 'Mass', icon: 'mass' });
  // The rest of the line may be a name, so it is never copied into the report.
  unread.push(`Weekly Diary, ${date} at ${time}: an entry that isn't a known event`);
  return null;
}

function parseDiary(lines, today) {
  const start = diaryRange(lines);
  const result = { events: [], feasts: {}, dates: [], unread: [] };
  if (start < 0) return result;

  const days = [];
  let day = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^(notices|header text)$/i.test(line)) break;
    const heading = diaryHeading(line);
    if (heading) {
      const resolved = resolveDate(heading, today);
      if (resolved.error) result.unread.push(`Weekly Diary, "${line}": ${resolved.error}`);
      day = { key: resolved.key, rows: [] };
      if (resolved.key) days.push(day);
      const next = lines[i + 1] || '';
      let feast = heading.feast;
      if (!feast && !/\d/.test(next)) feast = next;
      if (resolved.key && feast) result.feasts[resolved.key] = feast;
      continue;
    }
    const row = /^(\d{1,2})[.:](\d{2})\s*(am|pm)?\b\s*(.*)$/i.exec(line);
    if (day && row) day.rows.push({ hour: row[1], minute: row[2], suffix: (row[3] || '').toLowerCase(), rest: row[4] });
  }

  for (const { key, rows } of days) {
    result.dates.push(key);
    inferClock(rows);
    result.events.push(...rows.map((row) => diaryRow(row, key, result.unread)).filter(Boolean));
  }
  return result;
}

// ---- Notices ----

function parseGraves(lines, start, today, out) {
  const fallback = findTimes(lines[start + 1] || '').time;
  let i = start + 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\(all at/i.test(line)) continue;
    if (!line.startsWith('*')) break;
    const date = findDates(line)[0];
    if (!date) continue;
    const resolved = resolveDate(date, today);
    if (resolved.error) out.unread.push(`Blessing of Graves, "${line}": ${resolved.error}`);
    if (!resolved.key) continue;
    const rest = line.slice(date.end).replace(/^[\s-]+/, '');
    const place = rest.split(/\s*\(|\s+after\s|\s+\d|\s*[,.]|\s+Lawn/)[0].trim();
    const part = /\(part (\d+)\)/i.exec(rest);
    const afterMass = /\bafter (\d{1,2})\.(\d{2}) mass/i.exec(rest);
    const time = afterMass ? 'After Mass' : findTimes(rest).time || fallback;
    const sort = afterMass ? toMinutes(afterMass[1], afterMass[2], 'am') + 1 : minutesOf(time);
    out.events.push(event({
      date: resolved.key, time, title: 'Blessing of Graves', note: part ? `${place}, part ${part[1]}` : place,
      category: 'church', icon: 'graves', source: 'newsletter', sort
    }));
  }
  return i - 1;
}

// Splits a line into one piece per date, because "Friday 27th Nov. 6pm to 8pm,
// Saturday 28th Nov. 11am to 1pm" gives each date its own times.
function datedPieces(text) {
  const dates = findDates(text);
  return dates.map((date, i) => ({ date, text: dates.length === 1 ? text : text.slice(date.index, i + 1 < dates.length ? dates[i + 1].index : undefined) }));
}

function resolvePieces(text, label, today, out, build) {
  for (const piece of datedPieces(text)) {
    const resolved = resolveDate(piece.date, today);
    if (resolved.error) out.unread.push(`${label}: ${resolved.error}`);
    if (resolved.key) out.events.push(build(resolved.key, findTimes(piece.text)));
  }
}

function hallExtras(text) {
  const table = /\btable £(\d+)/i.exec(text);
  return joinNote(table && `Tables £${table[1]}`, /sign up[^.!]*after mass/i.test(text) && 'Sign up after Mass');
}

function knownEvent(known, text, today, out) {
  resolvePieces(text, known.title || text, today, out, (date, { time, until }) => event({
    date, time: known.noTime ? '' : time, title: known.title || 'Christmas Flower Workshop',
    note: joinNote(known.opening, until && `Until ${until}`, known.hall && 'Parish Hall', hallExtras(text)),
    category: known.category, icon: known.icon, source: 'newsletter'
  }));
}

function parseRetreat(line, today, out) {
  const m = new RegExp(`^(.*?\\bRetreat)\\b.*?\\b(${MONTH_WORD})\\s+(\\d{1,2})-(\\d{1,2})\\s+(20\\d\\d)\\s+(.*)$`, 'i').exec(line);
  if (!m) return false;
  const resolved = resolveDate({ day: Number(m[3]), month: m[2], year: m[5] }, today);
  if (!resolved.key) return true;
  const place = m[6].split(/\s*info\b/i)[0].replace(/[.\s]+$/, '');
  out.events.push(event({ date: resolved.key, time: `${m[3]} to ${m[4]} ${m[2]}`, title: m[1], note: place, category: 'church', icon: '⛪', source: 'newsletter' }));
  return true;
}

function parseMeditation(line, today, out) {
  const place = /\bin ([A-Z][\w ]+?)\s*,/.exec(line);
  const list = line.slice(line.search(new RegExp(`\\b(?:${MONTH_WORD})\\b`, 'i')));
  const { time } = findTimes(line);
  let month = null;
  for (const m of list.matchAll(new RegExp(`\\b(${MONTH_WORD})\\b|\\b(\\d{1,2})\\b`, 'gi'))) {
    if (m[1]) {
      month = m[1];
      continue;
    }
    const resolved = resolveDate({ day: Number(m[2]), month }, today);
    if (resolved.error) out.unread.push(`Monday Meditation, ${m[2]} ${month}: ${resolved.error}`);
    if (resolved.key) out.events.push(event({ date: resolved.key, time, title: 'Monday Meditation', note: place ? place[1] : '', category: 'church', icon: '🕊️', source: 'newsletter' }));
  }
}

function parseBereavement(lines, start, today, out) {
  const timing = lines.slice(start, start + 4).find((line) => /^time\s*:/i.test(line)) || '';
  const place = /,\s*([^,.]+?)\.?$/.exec(timing);
  const { time, until } = findTimes(timing);
  resolvePieces(lines[start], 'Bereavement Support Group', today, out, (date) => event({
    date, time, title: 'Bereavement Support Group', note: joinNote(until && `Until ${until}`, place && place[1]),
    category: 'social', icon: '🤝', source: 'newsletter'
  }));
}

function parseTalk(line, today, out) {
  const m = /\b((?:illustrated )?talk on (?:the )?[A-Z][\w ]*?)(?= upstairs| in | at | on |\s+\d)/i.exec(line);
  if (!m) return false;
  const title = m[1][0].toUpperCase() + m[1].slice(1);
  const place = /\bin the ([A-Z][\w ]*?)(?=\s+\d)/.exec(line);
  const signUp = /sign your name on the sheet at back of the church/i.test(line) && 'Sign the sheet at the back of the church';
  resolvePieces(line, title, today, out, (date, { time }) => event({
    date, time, title, note: joinNote(place && place[1], signUp), category: 'social', icon: '🗣️', source: 'newsletter'
  }));
  return true;
}

function parseHallBullet(line, today, out) {
  const text = line.replace(/^[*•]\s*/, '');
  const firstDate = findDates(text)[0];
  const firstTime = /\b\d{1,2}(?:[.:]\d{2})?\s*(?:am|pm)\b/i.exec(text);
  const end = Math.min(firstDate.index, firstTime ? firstTime.index : Infinity);
  const title = text.slice(0, end).replace(/\s+(?:also|on|at)\s*$/i, '').replace(/[\s,:-]+$/, '');
  resolvePieces(text, title, today, out, (date, { time, until }) => event({
    date, time, title, note: joinNote(until && `Until ${until}`, 'Parish Hall', hallExtras(text)), category: 'social', icon: '🎉', source: 'newsletter'
  }));
}

function addLifeMassNote(lines, events) {
  const text = lines.join(' ');
  const celebrant = /\b(?:celebrated with|presence of) (Bishop [A-Z][a-z]+ [A-Z][a-z]+)/.exec(text);
  const refreshments = /refreshments afterwards in (?:the )?parish hall/i.test(text);
  const note = joinNote(celebrant && `With ${celebrant[1]}`, refreshments && 'Refreshments afterwards in the Parish Hall');
  events.filter((e) => e.title === 'Celebration of Life Mass').forEach((e) => { e.note = note; });
}

function parseNotices(lines, today, diary) {
  const out = { events: [], feasts: {}, unread: [] };
  const start = lines.findIndex((line) => /^notices$/i.test(line));
  if (start < 0) return out;
  const stop = lines.findIndex((line, i) => i > start && /^regular activities in our parish hall/i.test(line));
  const notices = lines.slice(start + 1, stop < 0 ? undefined : stop);

  let inHall = false;
  let lastHall = null;
  for (let i = 0; i < notices.length; i++) {
    let line = notices[i];
    if (IGNORED_LINES.test(line)) continue;

    const feast = new RegExp(`^(.+?) feast on (${DAY_WORD})\\b`, 'i').exec(line);
    if (feast) {
      const weekday = WEEKDAYS.indexOf(feast[2].slice(0, 3).toLowerCase());
      const date = diary.dates.find((key) => weekdayOf(key) === weekday);
      if (date && !diary.feasts[date]) out.feasts[date] = feast[1];
      continue;
    }
    if (/^blessing of graves/i.test(line)) {
      i = parseGraves(notices, i, today, out);
      continue;
    }
    if (/^upcoming parish hall/i.test(line)) {
      inHall = true;
      continue;
    }
    if (line.startsWith('•')) {
      const tickets = /tickets[^£]*£(\d+)\s*incl/i.exec(line);
      if (tickets && lastHall) lastHall.extra = `Tickets £${tickets[1]} including supper`;
      continue;
    }
    if (!line.startsWith('*')) inHall = inHall && !findDates(line).length && /fayre/i.test(line);

    if (/^next meeting/i.test(line) && notices.slice(Math.max(0, i - 6), i).some((l) => /bereavement/i.test(l))) {
      parseBereavement(notices, i, today, out);
      continue;
    }
    if (/\bmonday meditation\b/i.test(line)) {
      parseMeditation(line, today, out);
      continue;
    }
    if (!findDates(line).length && /^on\s/i.test(notices[i + 1] || '')) line = `${line} ${notices[++i]}`;
    if (/\bretreat\b/i.test(line) && parseRetreat(line, today, out)) continue;

    const bare = line.replace(/^[*•]\s*/, '');
    const known = KNOWN.find((k) => k.match.test(bare));
    if (known && findDates(bare).length) {
      const before = out.events.length;
      knownEvent(known, bare, today, out);
      if (known.hall && out.events.length > before) lastHall = out.events[out.events.length - 1];
      continue;
    }
    if (!findDates(line).length) continue;
    if (/\btalk on\b/i.test(line) && parseTalk(line, today, out)) continue;
    if (inHall && line.startsWith('*')) {
      parseHallBullet(line, today, out);
      lastHall = out.events[out.events.length - 1];
      continue;
    }
    out.unread.push(`Notices: ${line}`);
  }

  out.events.forEach((e) => {
    if (e.extra) {
      e.note = joinNote(e.note, e.extra);
      delete e.extra;
    }
  });
  addLifeMassNote(notices, [...out.events, ...diary.events]);
  return out;
}

// ---- PDF "Dates for your diary" ----

function parsePdf(lines, today) {
  const out = { events: [], unread: [] };
  for (const line of lines) {
    const date = findDates(line)[0];
    if (!date) continue;
    if (date.index !== 0) {
      out.unread.push(`PDF: ${line}`);
      continue;
    }
    const resolved = resolveDate(date, today);
    if (resolved.error) out.unread.push(`PDF, "${line}": ${resolved.error}`);
    if (!resolved.key) continue;
    const rest = line.slice(date.end).replace(/^[\s-]+/, '');
    const split = /^(.*?)(?:\s+-\s+(\d.*))?$/.exec(rest);
    const raw = split[1].replace(/^Olton Friary hosts\s+/i, '');
    const known = KNOWN.find((k) => k.match.test(raw));
    const aid = /^(.*?)\s+(in aid of .+)$/i.exec(raw);
    const { time, until } = findTimes(split[2] || '');
    const title = (known && known.title) || (aid ? aid[1] : raw);
    const opening = known ? known.opening : aid && aid[2][0].toUpperCase() + aid[2].slice(1);
    const icon = known ? known.icon : (PDF_ICONS.find((p) => p.match.test(raw)) || { icon: '🎉' }).icon;
    out.events.push(event({
      date: resolved.key, time: known && known.noTime ? '' : time, title, note: joinNote(opening, until && `Until ${until}`),
      category: 'social', icon, source: 'events-pdf'
    }));
  }
  return out;
}

// ---- Combining and checking ----

// Stored events are compared with fresh ones, so this uses saved fields only.
function eventKey(e) {
  const known = KNOWN.find((k) => k.id && k.match.test(e.title));
  const name = known ? known.id : e.title.toLowerCase();
  if (e.icon === 'mass') return `${e.date}|${name}|${e.time}`;
  return e.icon === 'graves' ? `${e.date}|${name}|${e.note}` : `${e.date}|${name}`;
}

// The same event can come from two sources. The fuller details win.
function combine(events) {
  const byKey = new Map();
  for (const e of events) {
    const key = eventKey(e);
    const held = byKey.get(key);
    if (!held) {
      byKey.set(key, { ...e });
      continue;
    }
    held.time = held.time || e.time;
    if (e.title.length > held.title.length) held.title = e.title;
    if (e.note.length > held.note.length) held.note = e.note;
  }
  return [...byKey.values()];
}

function checkEvent(e) {
  const real = /^\d{4}-\d{2}-\d{2}$/.test(e.date) && dateKey(Number(e.date.slice(0, 4)), Number(e.date.slice(5, 7)) - 1, Number(e.date.slice(8))) === e.date;
  if (!real) return 'impossible date';
  if (!e.title) return 'no title';
  if (FORBIDDEN_TEXT.test(`${e.title} ${e.note}`)) return 'holds text that must never appear';
  return null;
}

function sortKey(e, day) {
  if (e.sort !== undefined && e.sort !== null) return e.sort;
  if (e.time === 'After Mass') {
    const masses = day.filter((other) => other.icon === 'mass' && minutesOf(other.time) < 12 * 60).map((other) => minutesOf(other.time));
    return masses.length ? Math.max(...masses) + 1 : NO_TIME;
  }
  const minutes = minutesOf(e.time);
  return minutes === null ? NO_TIME : minutes;
}

function sortEvents(events) {
  const byDate = (date) => events.filter((e) => e.date === date);
  return events
    .map((e, order) => ({ e, order, sort: sortKey(e, byDate(e.date)) }))
    .sort((a, b) => a.e.date.localeCompare(b.e.date) || a.sort - b.sort || a.order - b.order)
    .map(({ e }) => e);
}

function scrub(line) {
  return line
    .replace(/\S+@\S+/g, '[email removed]')
    .replace(/\b0\d{2,4}[\s-]?\d{3}[\s-]?\d{3,4}\b/g, '[phone removed]');
}

function publicEvent({ date, time, title, note, category, icon, source }) {
  return { date, time, title, note, category, icon, source };
}

// Builds the new data file, or throws so the previous good data stays live.
function buildData({ newsletter, diaryPage, pdf, previous, today, minDays = 3, minEvents = 10, minShare = 0.5 }) {
  const diary = parseDiary(newsletter, today);
  if (diaryRange(newsletter) < 0) throw new Error('The newsletter has no Weekly Diary');
  const notices = parseNotices(newsletter, today, diary);
  const fromPdf = parsePdf(pdf, today);
  const unread = [...diary.unread, ...notices.unread, ...fromPdf.unread];

  if (diaryPage) {
    const rows = (events) => events.map((e) => `${e.date} ${e.time} ${e.title}`).sort().join('\n');
    const other = parseDiary(diaryPage, today);
    if (rows(other.events) !== rows(diary.events)) unread.push('The Weekly Diary page and the newsletter list different events this week');
  }

  const accepted = [];
  for (const e of combine([...diary.events, ...notices.events, ...fromPdf.events])) {
    const problem = checkEvent(e);
    if (problem) unread.push(`Rejected an event on ${e.date}: ${problem}`);
    else accepted.push(e);
  }

  // Sample events don't carry over, and a fresh diary replaces its own days,
  // so a moved or cancelled Mass doesn't linger beside the new list.
  const fresh = new Set(accepted.map(eventKey));
  const kept = ((previous && previous.events) || []).filter((e) => e.date >= today && e.source !== 'sample'
    && !fresh.has(eventKey(e)) && !(e.source === 'newsletter-diary' && diary.dates.includes(e.date)));
  if (diary.dates.length < minDays) unread.push(`The Weekly Diary only had ${diary.dates.length} upcoming days`);
  if (accepted.length < minEvents) throw new Error(`Only ${accepted.length} events were read, so the result looks wrong`);
  const before = ((previous && previous.events) || []).filter((e) => e.date >= today && e.source !== 'newsletter-pdf').length;
  if (accepted.length < before * minShare) throw new Error(`Only ${accepted.length} events were read, down from ${before}, so the result looks wrong`);

  const feasts = {};
  for (const [date, name] of Object.entries((previous && previous.feasts) || {})) if (date >= today) feasts[date] = name;
  Object.assign(feasts, diary.feasts, notices.feasts);
  const sortedFeasts = Object.fromEntries(Object.entries(feasts).sort(([a], [b]) => a.localeCompare(b)));

  const events = sortEvents([...accepted, ...kept]).map(publicEvent);
  return { data: { lastRefreshed: today, feasts: sortedFeasts, events }, unread: [...new Set(unread)].map(scrub), read: accepted.length, kept: kept.length };
}

// Events the owner sends from the WhatsApp newsletter PDF, kept in
// data/newsletter-pdf.json. They hold fuller details than the website,
// so they replace the website's copy of the same event.
function applyNewsletterPdf(data, newsletter, today) {
  const own = newsletter.events.filter((e) => e.date >= today).map((e) => ({ ...e, source: 'newsletter-pdf' }));
  const theirs = new Set(own.map(eventKey));
  const rest = data.events.filter((e) => e.source !== 'newsletter-pdf' && !theirs.has(eventKey(e)));
  const feasts = { ...data.feasts };
  for (const [date, name] of Object.entries(newsletter.feasts || {})) if (date >= today) feasts[date] = name;
  return {
    ...data,
    feasts: Object.fromEntries(Object.entries(feasts).sort(([a], [b]) => a.localeCompare(b))),
    events: sortEvents([...rest, ...own]).map(publicEvent)
  };
}

function todayInBritain() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
}

function formatData(data) {
  const lines = data.events.map((e) => `    ${JSON.stringify(e)}`);
  return `{
  "lastRefreshed": ${JSON.stringify(data.lastRefreshed)},
  "feasts": ${JSON.stringify(data.feasts, null, 2).replace(/\n/g, '\n  ')},
  "events": [
${lines.join(',\n')}
  ]
}
`;
}

module.exports = { applyNewsletterPdf, buildData, cleanLine, findDates, formatData, htmlToLines, parseDiary, parseNotices, parsePdf, resolveDate, todayInBritain };

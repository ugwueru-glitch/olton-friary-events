// Draws a list screen and its Week/Month filter from data/events.json.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_ICON = { church: '⛪', social: '🎉' };
const UNOFFICIAL = 'Unofficial site. Events come from oltonfriary.org.uk';

const category = document.body.dataset.category;
const filter = document.querySelector('.filter');
const viewButtons = [...document.querySelectorAll('.filter-view button')];
const earlier = document.querySelector('[data-step="-1"]');
const later = document.querySelector('[data-step="1"]');
const label = document.querySelector('.filter-label');
const scroller = document.querySelector('.scroller');
const dayList = document.querySelector('.day-list');
const footer = document.querySelector('.list-footer');

let days = [];
let feasts = {};
let view = 'week';
let index = 0;

function toDate(key) {
  return new Date(key + 'T12:00:00Z');
}

// The visitor's own calendar date, so today's events stay listed all day.
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function weekStart(key) {
  const d = toDate(key);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

function periodKey(key) {
  return view === 'week' ? weekStart(key) : key.slice(0, 7);
}

function periodLabel(period) {
  if (view === 'month') {
    const [year, month] = period.split('-');
    return `${MONTHS[Number(month) - 1]} ${year}`;
  }
  const start = toDate(period);
  const end = toDate(period);
  end.setUTCDate(end.getUTCDate() + 6);
  const from = start.getUTCDate() + (start.getUTCMonth() === end.getUTCMonth() ? '' : ` ${MONTHS[start.getUTCMonth()]}`);
  return `${from} to ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`;
}

function longDate(key) {
  const d = toDate(key);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function dayHeading(key) {
  const text = `${WEEKDAYS[toDate(key).getUTCDay()]} ${longDate(key)}`;
  return key === todayKey() ? `Today, ${text}` : text;
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function eventIcon(icon) {
  const box = element('div', 'event-icon');
  if (icon === 'mass' || icon === 'graves') {
    const img = element('img');
    img.src = `assets/icon-${icon}.svg`;
    img.alt = '';
    box.append(img);
  } else {
    const emoji = element('span', '', icon || DEFAULT_ICON[category]);
    emoji.setAttribute('aria-hidden', 'true');
    box.append(emoji);
  }
  return box;
}

function eventRow(event) {
  const row = element('div', 'event');
  const body = element('div', 'event-body');
  body.append(element('div', 'event-title', event.title));
  if (event.note) body.append(element('div', 'event-note', event.note));
  row.append(element('div', 'event-time', event.time || 'Time to be confirmed'), body, eventIcon(event.icon));
  return row;
}

function dayBlock(day) {
  const block = element('section', 'day');
  block.append(element('h2', '', dayHeading(day.date)));
  if (category === 'church' && feasts[day.date]) block.append(element('div', 'day-feast', feasts[day.date]));
  block.append(...day.events.map(eventRow));
  return block;
}

function render() {
  const periods = [...new Set(days.map((day) => periodKey(day.date)))];
  const period = periods[index];
  label.textContent = periodLabel(period);
  earlier.style.visibility = index > 0 ? 'visible' : 'hidden';
  later.style.visibility = index < periods.length - 1 ? 'visible' : 'hidden';
  viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  dayList.replaceChildren(...days.filter((day) => periodKey(day.date) === period).map(dayBlock));
  scroller.scrollTop = 0;
}

viewButtons.forEach((button) => button.addEventListener('click', () => {
  view = button.dataset.view;
  index = 0;
  render();
}));

[earlier, later].forEach((button) => button.addEventListener('click', () => {
  index += Number(button.dataset.step);
  render();
}));

async function load() {
  try {
    const response = await fetch('data/events.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    const today = todayKey();
    feasts = data.feasts;
    const upcoming = data.events.filter((event) => event.category === category && event.date >= today);
    const dates = [...new Set(upcoming.map((event) => event.date))].sort();
    days = dates.map((date) => ({ date, events: upcoming.filter((event) => event.date === date) }));
    const updated = toDate(data.lastRefreshed);
    footer.textContent = `Last updated ${longDate(data.lastRefreshed)} ${updated.getUTCFullYear()}. ${UNOFFICIAL}`;
    if (days.length) {
      filter.hidden = false;
      render();
    } else {
      dayList.append(element('p', 'list-message', `No ${category} events are listed just now. Please check back soon.`));
    }
  } catch (error) {
    console.error(error);
    dayList.append(element('p', 'list-message', 'Events can\'t be shown just now. Please try again later.'));
    footer.textContent = UNOFFICIAL;
  }
}

load();

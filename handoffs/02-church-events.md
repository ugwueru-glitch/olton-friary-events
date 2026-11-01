# Handoff 02: Church Events

**Mockup:** `mockups/ChurchEvents.dc.html` (computer), `mockups/ChurchEventsPhone.dc.html` (phone)

## Layout

Top to bottom, with content up to 736px wide and centred on computer.

1. **Header bar:** friary purple, white back arrow, "Church Events" in white bold, 32px on computer and 28px on phone.
2. **Filter:**
   - A Week/Month control. The selected side is filled purple.
   - A left arrow, the period label and a right arrow. Example labels: "1 to 7 November", "29 November to 5 December", "November 2026".
   - On computer these sit on one row. On phone they stack.
3. **Event list:** fills the rest of the screen and scrolls on its own, with a visible scroll bar. The header and filter stay in place.

Each day shows:

- A purple bold heading, such as "Sunday 8 November". Today's reads "Today, Sunday 1 November".
- The feast or saint's name below it in soft grey, when there is one.
- One row per event: bold time, title, optional grey note, and a large icon on the right (64px on computer, 56px on phone).

At the very end of the list, in soft grey 18px text: "Last updated" with the date of the last good refresh, then "Unofficial site. Events come from oltonfriary.org.uk". Remove the unofficial wording if the parish adopts the site.

## Behavior

- Week and Month each start at the earliest period with events.
- Arrows move to the next or previous period that has events. Empty weeks and months are skipped.
- An arrow is hidden when there is nothing further that way.
- Switching between Week and Month returns to the first period.
- Weeks run Sunday to Saturday, matching the parish diary.

## What counts as a church event

Masses, Confessions, Blessing of Graves, Rosary, Prayer before the Blessed Sacrament, Monday Meditation, Journey in Faith, retreats, holy days and feasts.

Feasts show under the day heading. They are not separate rows.

## Icons

| Event | Icon |
|---|---|
| Any Mass, including Celebration of Life Mass | Drawn: two hands with brown skin tone and white sleeves, raising a host with a cross and gold rays |
| Blessing of Graves | Drawn: a priest with brown skin tone in a purple vestment and gold stole, hand raised towards two headstones, gold cross above |
| Confessions | 🙏 |
| Rosary | 📿 |
| Prayer before the Blessed Sacrament | 🕯️ |
| Monday Meditation | 🕊️ |
| Journey in Faith | ✝️ |
| Retreat | ⛪ |
| Any other church event | ⛪ until the owner picks one |

## Content rules

- Rows say "Mass", without the intention.
- The site writes "7.00" with no am or pm. Work it out from the order of that day's list: the 7.00 before 10.15 is am, and the 7.00 after it is pm. The Sunday 6.00 after 11.00 is pm.
- Sunday's unnamed 11.00 entry is a Mass, because the home page lists Sunday Mass at 11am.
- Blessing of Graves rows show the cemetery as the note.

## Not shown in the mockup

- Today's events stay listed all day, even after they have happened.
- With no events at all, show a short friendly message in place of the list.

## Planned for later

Nothing.

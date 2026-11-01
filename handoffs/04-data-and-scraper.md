# Handoff 04: Data and scraper

This part runs behind the scenes and has no screen.

## Job

Every 3 days, read the parish website, turn what it finds into a clean list of dated events, and update the live site with no manual steps.

## Sources

Checked on 1 November 2026.

| Source | Format | Holds |
|---|---|---|
| `/welcome/weekly-newsletter/` | Web page text | Main source: the Weekly Diary for about one week, plus notices with later dates |
| `/hire-and-events/events/` | Web page linking a PDF | The link to the PDF below |
| `coming-up-in-2026-and-2027-1-.pdf` | PDF | "Dates for your diary": fundraising events up to March 2027 |
| `/worship-and-sacraments/mass-information/weekly-diary/` | Web page text | The same diary as the newsletter, useful as a cross-check |
| Home page | Web page text | Regular Mass times, used to fill gaps such as the unnamed 11.00 |

The PDF's file name will change over time, so find it from the link on the events page, and never hard-code it.

The site has no calendar and no events feed. Its text is written by hand, with typing errors and changing layouts.

The site's robots file blocks `/control/`, `printer-friendly.php`, search pages and five named bots. None of these sources are affected. The scraper should identify itself honestly and fetch only these few pages.

## Reading the text

The project must be free, so the scraper uses fixed rules and no AI or paid service. The rules cover three kinds of text:

- **Weekly Diary:** a day heading with a date, then lines starting with a time. Rows become Masses, Confessions and so on, following handoffs 02 and 00. Whatever follows "Mass" is dropped, so intentions are never kept.
- **PDF "Dates for your diary":** one event per line, in the form date, title, time.
- **Notices:** lines holding a recognisable date, plus a known section such as "Blessing of Graves" or "Upcoming Parish hall events". Lists of dates, such as "Nov 2, 16 & 30, Dec 14", become one event per date.

The rules allow for the site's habits: "1st November", "Nov 14" and "Saturday 5 December", times like "7.00" and "11am-2pm", stray spaces and small typing errors. A notice with no year takes the next time that date falls.

Fixed rules can miss a notice worded in a new way. So any line that looks like it holds a date but produces no event is listed for the owner, and new rules are added when needed.

## Output

One data file that the site reads. Each event holds:

| Field | Example |
|---|---|
| `date` | `2026-11-14` |
| `time` | `11:00am`, or empty when not published |
| `title` | `Christmas Market` |
| `note` | `Until 2:00pm. Parish Hall. Tables £15` |
| `category` | `church` or `social` |
| `icon` | An emoji, or `mass` or `graves` for the drawn icons. New kinds of event use ⛪ or 🎉 by category |
| `source` | Which page it came from |

Feast names are stored by date. The file also records when it was last refreshed.

## Keeping events over time

The newsletter is replaced each week, so an event mentioned once must not vanish when that newsletter does. Events stay stored until their date has passed. Newer information about the same event replaces older information.

## Safety checks

Wrong dates are worse than missing ones, because people could turn up at the wrong time. Every refresh must:

1. Reject any event with an impossible date, or whose weekday doesn't match its date.
2. Keep the previous good data if a page can't be read or the result looks wrong, such as having far fewer events than before.
3. Never publish a failed or partial run.
4. Send the owner an automatic email when a run fails, or when it finds lines it couldn't read. The hosting service's own free notifications are used for this.

## Testing

Save real copies of the current pages and PDF as test samples. The expected results for those samples are the events shown in the approved mockups. Add a new sample each time a newsletter breaks a rule, so the fix stays fixed.

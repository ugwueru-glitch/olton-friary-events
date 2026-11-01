# Handoff 00: Shared rules

## Product rule

Olton Friary Events is one simple place to see upcoming church and social events at Olton Friary, kept up to date automatically from the parish website.

It must stay simple: two buttons, two lists, one filter. It is not a parish website, a news feed, a booking system or a place to read the newsletter.

## Platform

A public website that works on phones and computers. There is nothing to install. The final output is a live web link, refreshed automatically every 3 days.

## Design tokens

Colours:

| Name | Value | Used for |
|---|---|---|
| Friary purple | `#4A1D7A` | Church Events: Home button, header bar, Week/Month control, day headings |
| Warm gold | `#F5B82E` | Social Events: Home button, header bar, Week/Month selection |
| White | `#FFFFFF` | List backgrounds, text on purple |
| Dark ink | `#231A33` | Reading text, all text on gold, Social day headings |
| Black | `#000000` | The Home title only |
| Soft grey | `#5B5368` | Feast names and event notes |
| Divider | `#E8E4EE` | Lines between events |
| Border | `#D8D4E0` | Line under the filter |
| Pale purple | `#EFE9F6` | Church arrow buttons, scroll bar track |
| Pale gold | `#FDF1D3` | Social arrow buttons, scroll bar track |

Fonts, all free from Google Fonts:

- **Atkinson Hyperlegible**, regular and bold, for everything except the Home title.
- **Gelasio**, regular, for the Home title only. It matches the Georgia-style lettering in the logo on oltonfriary.org.uk, which is a picture on that site.

The smallest text anywhere is 18px.

## Navigation

- Home opens Church Events or Social Events.
- The back arrow in each list's header bar returns to Home.
- There are no tabs and no menu.

## Shared components

- **Header bar:** back arrow, then the screen title.
- **Filter:** see handoff 02. Social Events uses the same one in gold.
- **Event row:** time, then title with an optional note, then a large icon on the right.

Touch targets are at least 44px.

## Data to store

See handoff 04. Visitors store nothing, and the site needs no accounts or sign-in.

## Behaviour rules

- Lists show events from today onwards. Past events disappear.
- Only published events appear. Regular Masses are never projected beyond what the site lists.
- Times are shown in the form `7:00am`.
- Mass intentions, names of the dead and birthdays never appear.
- Contact details and email addresses never appear.
- If the source doesn't state something, the app says so ("Time to be confirmed") and never guesses a date.

## How the mockup differs from the real app

- The mockup's date is fixed at 1 November 2026, and its events are typed in. The real app uses the current date and scraped data.
- The canvas shows computer and phone as separate boards. The real app is one responsive site.
- The phone board is a fixed 390 × 844. The real app must fit any width with no sideways scrolling.

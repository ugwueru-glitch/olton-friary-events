# Olton Friary Events

A simple website showing upcoming church and social events at Olton Friary, kept up to date automatically from [oltonfriary.org.uk](https://www.oltonfriary.org.uk/).

**Status:** mockups approved. The website shell is being built on the `website` branch: Home works, and the two lists are still empty.

## What it does

- **Home:** two big buttons, Church Events and Social Events, over a picture of the Friary.
- **Church Events:** Masses, Confessions, blessings, feasts and more, from today onwards.
- **Social Events:** markets, concerts, fundraising nights and talks, from today onwards.
- **Filter:** move through weeks or months that have events.
- **Automatic updates:** the parish website is read every 3 days.

## What's here

| Path | Contents |
|---|---|
| `index.html` | The Home screen |
| `church.html`, `social.html` | The two list screens |
| `style.css` | Colours, fonts and layout for every screen |
| `handoffs/` | The specification: shared rules, one document per screen, the scraper, and decisions |
| `mockups/` | The approved screens from the design canvas |
| `assets/church-background.png` | The cleaned Home background, 932 × 462 pixels |

## Where to start

1. `handoffs/00-shared.md` for the rules that apply everywhere.
2. `handoffs/01-home.md`, `02-church-events.md` and `03-social-events.md` for the screens.
3. `handoffs/04-data-and-scraper.md` for how the data is gathered.
4. `handoffs/05-open-choices.md` for the decisions made and why.

The design canvas is at https://claude.ai/artifact/3XEwcVeaMyMCD2AGEDa3pH and is private to its owner.

## Mockup files

The `.dc.html` files are canvas source files, so they don't run on their own. They load the background from the canvas, not from `assets/`. Use them as a reference for layout and sizes alongside the handoffs.

## Data source

All event information belongs to Olton Friary. This project is not an official parish service unless the parish says so.

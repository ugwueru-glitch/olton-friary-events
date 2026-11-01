# Coding session brief

## Background

Olton Friary Events is a simple public website showing upcoming church and social events at Olton Friary, updated automatically from oltonfriary.org.uk. The owner doesn't code and directs the work, so explain things in plain words.

All three screens are approved. The handoffs in `handoffs/` are the specification, with `mockups/` as the visual reference. The stack is in `handoffs/05-open-choices.md`.

## Task

Phase 4, finished and approved on 1 November 2026: build the shell.

1. Create a branch called `website` from `main`.
2. Build the site with no framework: colours, fonts (Atkinson Hyperlegible and Gelasio), background image, the finished Home screen, and navigation to two empty list screens with their header bars.
3. Keep the site working from a sub-path, because the address is `https://ugwueru-glitch.github.io/olton-friary-events/`.
4. Check it at phone and computer widths, then give the owner a link they can open to see it.

Phase 5, started on 1 November 2026: the lists, the filter and the scraper, one item at a time. Church Events comes first, then Social Events, then the scraper.

## Rules

- Do what the owner asks, no more and no less. One item at a time, then wait for their verdict.
- Never build on `main`. Commit and push only when told.
- The project must stay free. Don't add a paid service.
- Nothing private goes in this public repository. Commits use the no-reply email already set in this repository's git settings.
- When the owner changes something, update the handoffs and README in the same piece of work.
- Report honestly what was and wasn't tested.
- The owner handles their own accounts and passwords.

## Location

- Repository: `C:\Users\Andrew Ugwueru\Projects\olton-friary-events`
- GitHub: https://github.com/ugwueru-glitch/olton-friary-events
- Read `handoffs/00-shared.md` and `handoffs/01-home.md` first.

## Output

The Home screen and shell open from a link, and matching `handoffs/01-home.md`, for the owner to approve before the first commit. There is no APK and no phone tooling.

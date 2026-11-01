# Handoff 05: Decisions

There are no open choices. The owner decided all of these on 1 November 2026, and each is written into the handoff shown. The whole project must be free to run.

| # | Choice | Decision | Why | In handoff |
|---|---|---|---|---|
| 1 | How the scraper reads the hand-written text | Free fixed rules, with safety checks and an email listing anything unread. No AI | It must be free. The trade-off is that unusual notices may need a rule added | 04 |
| 2 | Regular Masses beyond the newsletter | Show only what's published | A repeated pattern could show a moved or cancelled Mass | 00 |
| 3 | "Last updated" date | One small line at the bottom of each list, never on Home | People can tell if the information has gone stale | 02, 03 |
| 4 | Icon for a new kind of event | ⛪ for church and 🎉 for social, until the owner picks one | Rows should never be blank | 02, 03, 04 |
| 5 | Refresh timing | Every 3 days | As the owner asked. Daily is an easy later change | 04 |
| 6 | Telling the parish | Ask the Parish Office before sharing the link publicly | The app uses the parish's name and content | This file |
| 7 | Marking the site as unofficial | One small line at the bottom of each list, unless the parish adopts it | The title could otherwise look like an official service | 02, 03 |
| 8 | Failure alerts | An automatic email to the owner when a refresh fails | Otherwise the site could go stale unnoticed | 04 |
| 9 | Web address | A free address first, and possibly the owner's own later | A custom address has a yearly fee | This file |

## Also decided

- Mass intentions are left out.
- Am and pm are worked out from the order of the day's list.
- Bereavement group and Shroud talk go under Social Events.
- Weekly Parish Hall classes are left out.
- Icons are as listed in handoffs 02 and 03.

## Before the public launch

The owner contacts the Parish Office (choice 6), and only then shares the link.

## Stack

The owner chose this on 1 November 2026. Everything must stay free.

- **Website:** plain HTML, CSS and JavaScript, with no framework.
- **Scraper:** a small Node program.
- **Refresh:** a GitHub Actions timer every 3 days.
- **Hosting:** GitHub Pages, which means the repository is public. Nothing private or secret goes in it, and public commits use the owner's GitHub no-reply email.
- **Alerts:** failed runs use GitHub's own email notice. Lines the scraper can't read open a GitHub issue, which also emails the owner.
- **Address:** `https://ugwueru-glitch.github.io/olton-friary-events/` to start with.

GitHub turns off timed jobs in a public repository after 60 days with no activity, so each refresh must leave a commit, even when no events changed. The "last refreshed" date in the data file does this.

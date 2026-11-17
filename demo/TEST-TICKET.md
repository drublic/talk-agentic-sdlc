# Live demo ticket

Paste this into Linear before the room. Keep it tiny. Do not use the Garmin bug for the live run.

---

**Title:** Training calendar shows the weather for today and tomorrow

**Status:** Ready

**Labels:** Feature · Demo · Agent-ready

**Parent:** NPO-88 (Training page: location-aware weather). This ticket is the first, smallest slice.

## Problem

Riders plan outdoor rides in the Training calendar, but they have to leave the app to check the weather.

## Acceptance

- Today and tomorrow show a weather chip in the day header: icon, high temperature, and rain % when it is over 30%.
- The forecast uses the rider's location (`getCachedLocationForUser` in `lib/integrations/geolocation.ts`), not the default coordinates.
- All other days look as they do today.
- If the weather request fails, the calendar still loads, without the chip.
- A test covers which days get a chip and the failure case.
- New copy in `messages/en.json` and `messages/de.json`.

## Out of scope

- No location override per day.
- No bad-weather hints on sessions.
- No change to the weather API or the mobile app.

## Links

- [NPO-88](https://linear.app/nplusone/issue/NPO-88) (full scope)
- `components/training/day-column.tsx` (day header)
- `GET /api/weather`, `lib/types/weather.ts` (hourly forecast, 24–48 h)

## Before the room

- Without `OPENWEATHER_API_KEY` the API returns mock data. Decide which you want on stage.
- Without a location the API falls back to the default coordinates (London). The acceptance line above is there to catch that in review.

---

## Agent prompt after the ticket is Ready

Use this once Linear MCP can see the issue:

> Read DEMO-1 (or the issue id) from Linear. Draft an OpenSpec change for it. Stop after `proposal.md`, `tasks.md`, and the scenario. Do not write application code yet.

Then, after you approve the plan:

> Execute the approved plan. One task at a time. Open a PR when the tests pass.

Then review:

> Review this PR against the OpenSpec acceptance scenarios. List misses only.

---

## Fallback if the app is awkward on stage

**Title:** Health check returns ok

**Problem:** Ops cannot tell if the app is up without loading a full page.

**Acceptance:** `GET /api/health` returns `200` and `{ "status": "ok" }`. No auth. A test covers it.

**Out:** No database check. No version payload.

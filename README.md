# Intervals

An interval-workout timer built with [Exact](https://github.com/expo/exact), Expo's agent-native app framework. One Contract file is the whole app; it runs natively on the web, macOS, iOS and Linux, and an AI agent can build it, drive it, see it and test it on every one of them.

| Light | Dark |
| --- | --- |
| ![Intervals mid-workout, light](docs/wide.png) | ![Intervals mid-workout, dark](docs/wide-dark.png) |

## What it shows off

Timers are the classic thing UI tests can't test well: you either wait in real time or mock the clock and hope the mock matches the platform. Exact's agent owns the app's clock instead, so the same script runs a full workout deterministically, in about a second, on every host:

```contract-test
test "a whole Tabata finishes and is logged to history"
  clock data
  tap "start"
  clock +230000          // 3 minutes 50 seconds of workout, instantly
  clock data
  expect text "phase" == "DONE"
  expect text "history-summary" == "1 workout · 3:50 total"
  reload                 // a relaunch keeps the history
  clock data
  expect text "history-summary" == "1 workout · 3:50 total"
```

- **One typed Contract app** ([app.contract](app.contract)): state, derived values, the ticking task, actions and the view in ~250 lines. The countdown is derived from a start mark and `performanceNow()`, never by counting ticks, so it can't drift and a virtual-clock jump lands exactly.
- **A tiny TypeScript data source** ([app.ts](app.ts)): finished workouts are appended to a JSON file through Exact's sandboxed storage grant; the view never sees I/O, only typed `History` and `Reply` shapes generated from the contract.
- **Platform-native by default**: colours, fonts, control metrics and the safe area are left unsaid, so each host supplies its own; dark mode, the responsive two-column layout and accessibility (`role="timer"` with a spoken label) come with it. A phase change plays a haptic where the platform has one.
- **Agent-driven tests** ([app.test.contract](app.test.contract)): six tests tap, type and read the screen by `testId` the way an agent does, covering countdown, work→rest transitions, pause/resume, a full logged workout across a reload, custom workouts and reset.

## Run it

Exact expects its checkout beside this one and Bun 1.4.2:

```sh
git clone https://github.com/expo/exact ../exact
(cd ../exact && bun scripts/exact.mjs setup)

bun exact.mjs web          # dev server with live reload
bun exact.mjs test web     # the agent-driven tests in headless Chrome
bun exact.mjs linux        # the native Linux host (also: ios --run, mac --run)
```

Drive it yourself the way the tests do, and look at the result:

```sh
bun exact.mjs agent web --storage demo "tap start" "clock +12000" "screenshot work.png" tree
```

On Linux without Playwright's Chromium, point `CHROME` at any Chrome binary.

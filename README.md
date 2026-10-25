# Mirror Habit New Tab

A calm Chromium new tab: today's habits, weather, and quiet search.

Pair with [Mirror Habit](https://mirrorhabit.pages.dev) — sign in with the same
account and your rituals follow you from the browser to the app.

## Features

- **Today's habits** — check off what you set out to do, right from every new tab (requires a free Mirror Habit account)
- **Email + Google sign-in** — sessions live in the extension's own storage
- **Weather** — Open-Meteo conditions with a location picker; no account needed
- **Quiet search** — Google, DuckDuckGo, Bing, Kagi, Startpage, Perplexity, or your own `%s` URL
- **Themes** — 21 hand-drawn theme presets plus wallpaper upload, accent picker, density, reduce-motion
- **Focus clock** — big clock, tiny seconds, and a check-off ledger that stays out of the way

## Install (no build tools required)

1. Download the repository as a ZIP (**Code → Download ZIP**) and unzip it.
2. Open your browser's extensions page — `chrome://extensions`, `brave://extensions`, or `edge://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the **`dist` folder** inside the unzipped repository.
5. Open a new tab. Sign in if you keep habits; just search if you don't.

## Build from source

```bash
npm install
npm run build     # typecheck + production build into dist/
npm run dev       # dev server on http://localhost:5174
```

Requires Node 20+. The two environment values in `.env` are the Supabase
project's *public* anon key and URL — the same credentials the site ships in
its own bundle. Keep your service key out of everything.

## Privacy

- The extension never reads your browsing history, data, or other tabs.
- Habits are checked off through your Mirror Habit account; the extension
  cannot write challenge results or stats on its own.
- Weather and search work fully signed-out.
- No analytics, no search logging, no trackers.

## Server note

Sign-in uses a fixed extension ID (via the `key` pinned in
`public/manifest.json`), so the OAuth callback
`https://iincdfmanfpdcnniflcnlfdikpmnmido.chromiumapp.org/auth/callback`
stays identical for every installation and the Supabase redirect allowlist
only needs it once.

## License

[MIT](./LICENSE)

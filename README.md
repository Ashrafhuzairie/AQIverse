# AQIverse

An interactive 3D air-quality globe with an original nature, wind, atmosphere and heartbeat identity.

## Features

- Live IQAir observations for selected cities, with observation timestamps and reporting-location details.
- A separate simulated Demo day with a 24-hour timeline and playback speeds.
- Rotating Earth with zoom up to 1000%, cursor-centred wheel/pinch zoom, double-tap zoom, country and state/province labels, clustered city markers, and an automatic handoff at maximum zoom to the detailed OpenStreetMap view.
- Country → state/province → city search with direct fly-to navigation.
- On-demand interactive OpenStreetMap view with pan/zoom, exact-coordinate numeric AQI markers, and a visible-coverage count. Live mode shows only loaded IQAir observations; Demo day shows all 77 clearly labelled simulated city readings.
- Saved cities, region filters, search reset, clear sorting, and locally computed nearest listed city.
- AQI scale explainer, mobile drawer, keyboard shortcuts and reduced-motion support.
- A stationary default globe and reduced idle WebGL redraws.

## API key

On the hosted Site, store the key as a **secret** named `IQAir_API_KEY`. `IQAIR_API_KEY` is also supported. The key is read only by the Worker; it is never embedded in HTML, client JavaScript, API responses, or GitHub.

For local use, copy `.dev.vars.example` to `.dev.vars` and replace the placeholder there. `.dev.vars` is ignored by Git.

## Run locally

Node 20 or later is sufficient; there are no package dependencies to install. The detailed browser map loads pinned Leaflet 1.9.4 assets from unpkg.

```sh
npm run dev
```

Open the local URL printed by the server. The local server binds to loopback only.

```sh
npm test
npm run build
```

`public/` contains editable browser assets. `worker/index.js` contains the server and an automatically refreshed asset block. `scripts/prepare-worker.mjs` embeds essential assets, including raster bytes, into the dependency-free Worker. The Sites Worker ESM build and validator produce `dist/server/index.js`.

For an independent Cloudflare Worker, use `wrangler.jsonc` and configure the API key as a Worker secret. The ChatGPT-hosted Site uses `.openai/hosting.json`; its identity and audience are preserved.

## Data and limits

Live city mode uses IQAir's nearest-city endpoint for 77 listed city coordinates. The reporting location returned by IQAir can differ from the requested city and is shown when it does. Unloaded or unavailable locations display a dash; they never receive simulated readings in live mode.

IQAir-style station-by-station density is not available from the Community city API. Individual station endpoints require an IQAir Startup plan or above, and a production implementation also needs quota-aware server caching. The map therefore never invents live values: it displays every loaded live observation, while full marker coverage is available only in the explicitly simulated Demo day.

The API plan determines available fields. PM2.5 concentrations are shown only if returned by IQAir in the expected units; they are not derived from the live AQI. Demo mode derives illustrative PM2.5 values from its fictional AQI values and is explicitly labelled.

Successful observations are cached for up to 30 minutes. Requests to new uncached cities are spaced conservatively, and API-limit errors are surfaced. The app does not automatically fetch all cities or run unattended polling. Cloudflare cache and isolate memory reduce requests; isolate spacing is not a global quota guarantee.

The observation timestamp is distinct from the fetch time. Observations older than six hours are labelled. Pollution halos are illustrative interpolation, and air trails are decorative; neither represents measured global coverage or wind transport.

Geolocation is requested only after Near me is clicked, used locally to choose the nearest listed city, and never stored. Saved city IDs and display preferences are kept locally in the browser.

The detailed city map is loaded from OpenStreetMap only after its button is clicked. OpenStreetMap availability is best effort, and its map remains subject to OpenStreetMap’s usage policy and attribution requirements.

## Logo and geography

`public/logo.svg` is the full wordmark; `public/logo-mark.svg` is the transparent symbol. `public/favicon.svg` uses the same mark. `public/logo-preview.png` is a rendered preview on the site background.

Country outlines and label positions use public-domain Natural Earth 1:110m data, with additional small-country labels. Deep-zoom state/province boundaries and search points use a simplified local copy of Natural Earth 1:50m Admin-1 data; `node scripts/generate-admin1.mjs` refreshes that generated asset. AQIverse is an independent project inspired by IQAir and is not affiliated with it.

References: https://www.iqair.com/sg/, https://api-docs.iqair.com/, https://www.airnow.gov/aqi/aqi-basics/, https://www.naturalearthdata.com/, https://www.openstreetmap.org/copyright.

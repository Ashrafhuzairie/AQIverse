# AQIverse

An interactive 3D air-quality globe with an original nature, wind, atmosphere and heartbeat identity.

## Features

- Live IQAir observations for selected cities, with observation timestamps and reporting-location details.
- Live-only readings: unavailable locations remain empty instead of receiving generated values.
- Rotating Earth with fast zoom up to 600%, cursor-centred wheel/pinch zoom, double-tap zoom, country and state/province labels, and clustered city AQI markers.
- Country → state/province → city search with direct fly-to navigation.
- 163 listed locations across Asia, Europe, the Americas, Africa, and Oceania, including dense Malaysia and Singapore coverage.
- Saved cities, region filters, search reset, clear sorting, and locally computed nearest listed city.
- AQI scale explainer, mobile drawer, keyboard shortcuts and reduced-motion support.
- A stationary default globe and reduced idle WebGL redraws.

## API key

On the hosted Site, store the key as a **secret** named `IQAir_API_KEY`. `IQAIR_API_KEY` is also supported. The key is read only by the Worker; it is never embedded in HTML, client JavaScript, API responses, or GitHub.

For local use, copy `.dev.vars.example` to `.dev.vars` and replace the placeholder there. `.dev.vars` is ignored by Git.

## Run locally

Node 20 or later is sufficient; there are no package dependencies to install.

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

AQIverse uses IQAir's nearest-city endpoint for 163 listed coordinates. The reporting location returned by IQAir can differ from the requested location and is shown when it does. Unloaded or unavailable locations display a dash.

The interface displays the US AQI together with available temperature and humidity observations.

Successful observations are cached for up to 30 minutes. Requests to new uncached locations are spaced conservatively, and API-limit or plan errors are surfaced. The app does not automatically fetch every location or run unattended polling. Cloudflare cache and isolate memory reduce requests; isolate spacing is not a global quota guarantee.

The observation timestamp is distinct from the fetch time. Observations older than six hours are labelled. Pollution halos are illustrative interpolation, and air trails are decorative; neither represents measured global coverage or wind transport.

Geolocation is requested only after Near me is clicked, used locally to choose the nearest listed city, and never stored. Saved city IDs and display preferences are kept locally in the browser.

## Logo and geography

`public/logo.svg` is the full wordmark; `public/logo-mark.svg` is the transparent symbol. `public/favicon.svg` uses the same mark. `public/logo-preview.png` is a rendered preview on the site background.

Country outlines and label positions use public-domain Natural Earth 1:110m data, with additional small-country labels. Deep-zoom state/province boundaries and search points use a simplified local copy of Natural Earth 1:50m Admin-1 data; `node scripts/generate-admin1.mjs` refreshes that generated asset.

References: https://www.iqair.com/sg/, https://api-docs.iqair.com/, https://www.airnow.gov/aqi/aqi-basics/, https://www.naturalearthdata.com/.

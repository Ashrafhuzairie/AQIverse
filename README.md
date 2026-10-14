# AQIverse

The Atmos Atlas prototype for the AQIverse project.

An animated 3D world concept inspired by IQAir, with 41 simulated city readings.

The site is dependency-free static HTML, CSS, and JavaScript. WebGL renders the
globe, with a Canvas 2D orthographic 3D projection fallback. All assets are local.
`dist/world.json` contains public-domain Natural Earth 1:110m country outlines and geographic label positions.

## Features

- Brighter blue oceans, fresh green land, and cyan interface accents.
- Geographic country labels with zoom thresholds, horizon hiding, and collision avoidance.
- Country-name visibility switch.
- Drag, arrow keys, scroll, pinch, and button controls for rotation and zoom.
- Searchable cities, region filters, and reversible US AQI sorting.
- City selection and smooth camera focus.
- US AQI, PM2.5, and temperature layers; grid and illustrative halo switches.
- Simulated 24-hour readings and playback.
- Reduced-motion support, keyboard controls, responsive layout, and data notes.

## Local use

Serve `dist` with any static HTTP server. For example, from the project directory:

```sh
python -m http.server 8000 --directory dist
```

## Data status

Every AQI, pollutant value, weather value, and hourly trend is simulated. No
IQAir API key is configured, and no live observations are fetched. PM2.5 values
are derived from the simulated AQI using the US EPA PM2.5 category breakpoints.
The halos are a visual interpolation around cities, not measured global coverage.
Particle trails are decorative and do not represent measured wind or transport.

## Future live integration

Use an IQAir API plan that covers the desired fields, with server-side credentials
and cached requests to respect the plan's rate limits. Normalize the API response
to city coordinates, US AQI, timestamps, and available weather/pollutant fields.
Remove the demo badges only after connecting verified observations. Show source
timestamps and distinguish stale, missing, and forecast values. The free API plan
does not provide the same pollutant fields as paid plans.

References: https://www.iqair.com/sg/, https://www.iqair.com/air-pollution-data-api,
https://www.airnow.gov/aqi/aqi-basics/, https://www.naturalearthdata.com/.

The independently designed site is not affiliated with IQAir.

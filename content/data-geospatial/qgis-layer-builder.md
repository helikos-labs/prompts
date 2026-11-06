---
title: "QGIS layer builder: the open-data source, its CRS and exact steps to load it"
summary: Turn a layer request and a place into the best open source, its access terms and CRS, exact QGIS menu steps and a URL or query to paste.
category: data-geospatial
tags: [maps, open-data, skills]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: prompt
---

## The prompt

This is the compact version, to paste into a chat. Turn on web search or fetch so Claude can test each endpoint; without it, it marks them "not verified here". For repeat use, install the skill. It adds per-type workflows, a failure-mode table and `references/sources.md`, an endpoint list by data type and region that was tested on 6 November 2026.

```text
Find open data for the request below and give exact steps to load it into QGIS. Assume the user knows QGIS.

Request: {{data_need}}
Area: {{area}}

Before you answer:
1. Decide what is needed: vector features, raster values (elevation, land cover), imagery or a basemap. A WMS, WMTS or XYZ layer is a picture: you can't select its features, read heights or compute slope from it. If the request implies analysis, lead with features or a raster with values, and offer the picture only as an alternative.
2. Pick one best source. Rank by fit first (resolution, how current it is, coverage of this area), then by access: open beats a free API key, which beats a free login, which beats paid. National mapping agencies often beat global datasets locally. For elevation, say whether the source is a surface model (DSM, with roofs and trees) or bare-earth terrain (DTM). For terrain in a built-up area, look for a national LiDAR DTM first.
3. If you can fetch URLs, test the endpoint before you present it: GetCapabilities for WMS, WMTS or WFS, ?f=json for ArcGIS REST, one tile for XYZ, the first bytes of a file. Check that the layer's bounding box covers the area. If you can't fetch, write "not verified here" and give the test URL. Never invent an endpoint, layer name or tile pattern. If you don't know one, name the portal and how to search it.

Answer with one block per layer, in this shape:
**Source:** name and landing page URL
**Access:** open / free API key / free login / paid, plus any licence limit (non-commercial, share-alike). Flag keys and logins here, not inside the steps.
**Format:** service or file type, resolution or scale
**CRS:** native CRS with EPSG code
**Checked:** verified (and how) or not verified here
**Steps:** numbered, one action each, with exact QGIS menu labels for the user's version, else the current long-term release (e.g. Layer → Add Layer → Add WMS/WMTS Layer…), and the exact field to paste into. For WMTS, name the tile matrix set that matches the project CRS.
**Paste:** the URL or endpoint, alone in a code block
**Alternatives:** at most 3, one line each

In each block, also add one line with a caveat the user would otherwise find the hard way: a surface model passed off as terrain, {y}/{x} tile order, a server page limit, data last updated years ago.

Then add one **Project setup** section: the projected CRS to work in for this area and how to set it (Project → Properties… → CRS). Use the national grid where one exists. Otherwise use the UTM zone: floor((lon + 180) / 6) + 1, EPSG:326xx north or 327xx south. Never measure or buffer in EPSG:4326 or EPSG:3857.

Defaults checked on 6 November 2026, for when nothing better covers the area:
- OSM features: the QuickOSM plugin (Vector → QuickOSM → QuickOSM…, Quick query tab), which queries the Overpass API. For part of a city, zoom to it and use Canvas Extent. If it times out or returns 429, pick another server in QuickOSM's settings, or use a Geofabrik extract.
- Elevation: Copernicus DEM GLO-30 cloud-optimised GeoTIFFs. No key, loadable by URL (Add Raster Layer… → Source Type: Protocol: HTTP(S), cloud, etc.). Pattern: https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N38_00_W010_00_DEM/Copernicus_DSM_COG_10_N38_00_W010_00_DEM.tif. Tiles are named by their south-west corner (2-digit latitude, 3-digit longitude), e.g. 38.7° N, 9.1° W → N38_00_W010_00. Ocean-only tiles don't exist. It is a surface model, so roofs and trees are included.
- Elevation through an API: the OpenTopography Global DEM API needs a free API key.
- Imagery basemaps: the EOX Sentinel-2 cloudless WMTS at https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml (layers from 2018 on are CC BY-NC-SA: non-commercial, share-alike). Esri World Imagery XYZ at https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x} (Esri terms of use, attribution required; note {y} before {x}).
- Old Stamen tile URLs are dead. Stamen styles now come from Stadia Maps and need an API key.
```

## Example

**Input**:
- `data_need`: building footprints and a terrain layer
- `area`: central Lisbon

**Output** (trimmed to the opening, each layer's source, access, checks and caveat, two of the building steps, the Copernicus alternative and the CRS choice; the full answer has every step, the other alternatives and how to set the project CRS):

````markdown
Central Lisbon has authoritative open data for both layers. The buildings come as vector features from the city council, and the terrain is a bare-earth LiDAR elevation model (DTM) from the national mapping agency. You need both for analysis, so neither layer here is a WMS or XYZ picture. Menu labels are for QGIS 3.44, the current long-term release.
…
### 1. Building footprints

**Source:** Câmara Municipal de Lisboa (the city council), layer "Edificado e Vias" → "Edificado". Landing page: https://geodados-cml.hub.arcgis.com/datasets/cd5e9081bb4e45d38554760a0ec40db2_0/about
**Access:** Open, with no key or login. Licence is CC0, and the council asks for credit ("CM Lisboa"). The council marks it as uncertified mapping ("cartografia não homologada"), so it can't be used for legal or official purposes.
…
**Checked:** Verified on 6 Nov 2026.
- `?f=json` on the service and on layer 0 returned a polygon layer in EPSG:3763.
- Its extent (M −95 872 to −82 256, P −110 935 to −91 405) covers the whole municipality, centre included.
…
- The server returns at most 2 000 features per request. QGIS pages through them automatically.

**Watch out:** There is no height or floor-count field. The only attributes are COD_SIG, IDTIPO, NPRINCIP and MORADA, and the service doesn't say what the IDTIPO codes mean. For heights, use the LiDAR surface model minus the terrain model (see the terrain alternatives).

**Steps:**
1. Layer → Add Layer → Add ArcGIS REST Server Layer… (the Data Source Manager opens on the ArcGIS REST Server tab).
…
4. Paste the URL below into **URL** and click **OK**.
…
**Paste:**
```
https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services/Edificado_e_Vias/FeatureServer
```
…
### 2. Terrain (bare-earth DTM)

**Source:** Direção-Geral do Território (DGT, Portugal's national mapping agency), LiDAR 2024 "MDT-50cm" (Modelo Digital do Terreno). …
**Access:** Free login: register at cdd.dgterritorio.gov.pt and confirm the e-mail. Licence is CC BY 4.0, so credit "Direção-Geral do Território".
**Format:** GeoTIFF, Float32, 0.5 m pixels, in 1 km × 1 km tiles (2000 × 2000 px, about 16 MB each), NoData −999. It is bare-earth terrain (DTM), made from ground-class points only at 10 points/m², flown April to September 2024.
…
**Checked:** Verified on 6 Nov 2026 through the portal's STAC API (the catalogue interface behind the download site).
…
- The download links redirect to the login page, so you can't load these tiles in QGIS by URL.

**Watch out:**
- The catalogue lists MDS-50cm right next to this collection, with the same tile IDs. MDS is a surface model with roofs and trees, so check that every file name starts with `MDT-`.
…
- Copernicus DEM GLO-30 by URL: … Verified: the server returned a GeoTIFF header. It is a 30 m surface model with roofs included, too coarse for central Lisbon's streets.
…
Work in **ETRS89 / Portugal TM06, EPSG:3763**. It is Portugal's national grid and the native CRS of both layers, so nothing needs reprojecting.
````

Both layers lead with data that can be analysed: the city's building polygons and the national agency's 50 cm bare-earth LiDAR, with the 30 m Copernicus surface model left as an alternative. The LiDAR's login sits in Access, each layer names the trap a user would hit (no height field, MDS tiles with the same IDs as MDT), and the Checked lines say what each test found, including that the LiDAR tiles can't be loaded by URL.

## Why it works

- **Picture or data comes first.** A WMS of building outlines looks right until you try to select one. Making the model decide between viewing and analysing before it picks a source prevents the most common wrong answer: a backdrop when the user needed features or heights. The surface-or-terrain rule and the caveat line catch the next traps: roofs in a "terrain" layer, swapped tile axes, a server page limit.
- **Test before presenting, and never invent.** Geodata endpoints rot. Stamen's tile URLs moved behind a key, ESA's SciHub was retired, and an old Geoscience Australia WMS path now returns 404. A GetCapabilities or `?f=json` request settles it in a second, and the extent it returns shows whether the layer covers the area. In the example, the test is also what found that the LiDAR tiles redirect to a login, so the answer gives download steps instead of a URL that would fail in QGIS. "Not verified here" keeps a chat without web access honest, instead of letting it guess a plausible URL.
- **Fit decides, access is flagged first.** Ranking by fit before access lets a 50 cm LiDAR DTM behind a free login beat an open 30 m surface model. The login, like any key or non-commercial licence, then sits on its own line, before the user has worked through the steps. Exact menu labels and a paste-only block make the answer work without rereading.
- **CRS is a decision, not a footnote.** Each layer states its native CRS, and the answer ends with one projected CRS for the area. This prevents wrong areas and lengths from measuring in degrees or Web Mercator, and blurry tiles from a mismatched tile matrix set.

## Variations

- **Troubleshooting.** Paste the failing URL and what QGIS shows. The skill's failure-mode table maps symptoms (blank XYZ tiles, a WFS that stops at 1000 features, a harsh black-and-white hillshade) to fixes.
- **Scripted loads.** Ask for PyQGIS (`QgsRasterLayer` or `QgsVectorLayer` with the provider URI) instead of GUI steps when the same layers go into many projects.
- **Keep the list fresh.** Re-run the endpoint tests in `references/sources.md` every few months and update its Checked column. Add rows for the regions you work in.
- Generalised from a skill for finding open GIS data.

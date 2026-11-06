---
name: qgis-layer-builder
description: >-
  Finds open geospatial data for a place and shows exactly how to load it into QGIS. For each layer it gives the
  best source, access terms (API keys, logins and licence limits flagged first), format, native CRS, numbered
  steps with exact QGIS menu labels, and a URL to paste. It also says whether the endpoint was tested. Covers
  OpenStreetMap (QuickOSM, Overpass), WMS, WMTS, WFS, WCS, XYZ tiles, ArcGIS REST, elevation (Copernicus DEM,
  SRTM, national LiDAR), Sentinel and Landsat imagery, land cover and national portals, with a curated endpoint
  list by region. Use it whenever someone wants a layer, basemap or dataset in QGIS, even when they ask it as a
  general question. Triggers: "where do I get X for QGIS", "find me a WMS for Y", "add building footprints",
  "load elevation / a DEM / terrain", "get satellite imagery into QGIS", "is there a WFS for this country",
  "hunt for GIS data links", "why won't this WMS / WFS / tile layer load".
---

# QGIS layer builder

Turn "I need X for Y in QGIS" into a source that works, steps to load it and a URL to paste. Assume the user knows QGIS: skip explanations of what a WMS is unless they ask.

## Workflow

1. **Read the request.** Pin down four things. Infer them from context, and ask only if the area is missing entirely.
   - **Data type:** vector features, raster values (elevation, land cover), imagery, or a basemap.
   - **Purpose: to look at, or to analyse.** A WMS, WMTS or XYZ layer is a picture. You cannot select its features, read heights from it or compute slope. For analysis, use vector features (WFS, ArcGIS FeatureServer, OSM, a download) or a raster with values (GeoTIFF or COG, WCS). If the purpose isn't stated, lead with the source the user can analyse and offer the picture as an alternative.
   - **Area:** country, region, city or bounding box. "Central <city>" means a part of the city, not the whole municipality.
   - **QGIS version:** the one the user names, else the current long-term release. The Add Layer menu labels below are the same in 3.44 and 4.2.
2. **Pick sources.** Read `references/sources.md`: the table for the data type, then the region. Lead with one best source. Rank by fit for the area and purpose (resolution, how current it is, coverage), then by access: open beats a free key, which beats a login. National agencies often beat global datasets locally.
3. **Test before you present.** If you can fetch URLs, test each endpoint (see "Testing an endpoint" in the references): GetCapabilities for OGC services, `?f=json` for ArcGIS REST, one tile for XYZ, a range request for a file. Check that the layer covers the area. If you can't fetch, write "not verified here" and give the test URL. **Never invent an endpoint, layer name or tile pattern.** If neither the references nor a search finds a source, say so and give the portal and search route instead.
4. **Answer in the shape below.**

## Answer shape

One block per layer requested:

````markdown
### <Layer>: <what it gives the user>
**Source:** <name>, <landing page URL>
**Access:** <open | free API key | free login | paid>; <licence limit if any: non-commercial, share-alike, no redistribution>
**Format:** <WMS | WMTS | WFS | WCS | ArcGIS REST | XYZ | COG/GeoTIFF | GeoPackage | GeoJSON | Shapefile | OSM PBF>, <resolution or scale>
**CRS:** <native CRS, EPSG code>
**Checked:** <verified today: how> | <not verified here: test with the URL below>

**Steps:**
1. <Menu → Submenu → Item…>
2. <Exact field label>: paste the URL below
3. <One action per step>
4. Click **Add**

**Paste:**
```
<URL or endpoint, alone>
```

**Alternatives:** <up to 3, one line each: name, when to prefer it, access>
````

After the blocks, add one **Project setup** section: the project CRS for this area and how to set it, plus any step shared by all layers (clip to the area, reproject, save as GeoPackage).

Rules:

- **Access goes first.** Flag keys, logins and non-commercial or share-alike licences on the Access line, never only inside the steps.
- **Use exact menu labels** from the QGIS version, with → between levels and button names in bold. Name the exact field to paste into.
- **Add a caveat a user would otherwise find the hard way**, as one line in the block: a surface model passed off as terrain, `{y}/{x}` tile order, a server page limit, data last updated years ago.
- **Keep it short.** No preamble, no recap at the end.

## Workflows by data type

### OpenStreetMap features (QuickOSM)

1. Plugins → Manage and Install Plugins… → search **QuickOSM** → **Install Plugin** (once).
2. Vector → QuickOSM → QuickOSM… → **Quick query** tab.
3. **Key**: the OSM tag (`building`, `highway`, `landuse`). **Value**: blank means any value.
4. Spatial filter: **In** + a place name for a whole named area, or **Canvas Extent** after zooming to the part you want. For part of a city, use Canvas Extent.
5. **Run query**. Results load as temporary layers in EPSG:4326. Keep them with right-click → Export → Save Features As… → GeoPackage, choosing the project CRS.

For a saved or complex query, write it in Overpass Turbo (patterns in the references), then Export → GeoJSON and load the file with Layer → Add Layer → Add Vector Layer…. For a whole country or region, download a Geofabrik or BBBike extract instead of querying Overpass.

### WMS / WMTS (pictures)

1. Layer → Add Layer → Add WMS/WMTS Layer…
2. **New** → **Name**: something descriptive, **URL**: the endpoint → **OK**.
3. **Connect** → expand the tree → select a layer with a name. Group entries without a name can't be requested.
4. For WMTS, pick the tile matrix set that matches the project CRS. Otherwise QGIS resamples and the tiles go blurry.
5. **Add**.

### WFS / OGC API - Features (vector data)

1. Layer → Add Layer → Add WFS / OGC API - Features Layer…
2. **New** → **Name**, **URL** → **Version**: leave on Maximum, or click **Detect** → **OK**.
3. **Connect** → select the feature type. Tick **Only request features overlapping the view extent** for large layers.
4. **Add**.

### WCS (raster values from a service)

Layer → Add Layer → Add WCS Layer… → **New** → URL → **Connect** → select the coverage → **Add**. Use WCS when a service offers both a WMS picture and real values, as the Canadian elevation service does.

### XYZ tiles (basemaps)

1. Browser panel → **XYZ Tiles** → right-click → **New Connection…**
2. **Name**, **URL** with `{z}`, `{x}` and `{y}` → **OK**. Set **Referer** or add `?api_key=` if the provider requires it.
3. Double-click the new entry to add it.

### ArcGIS REST services

1. Layer → Add Layer → Add ArcGIS REST Server Layer…
2. **New** → **URL**: the services root (`…/rest/services`) or a folder, not a single layer's URL → **OK**.
3. **Connect** → browse to the MapServer or FeatureServer layer → **Add**. FeatureServer layers are features you can analyse; MapServer layers are usually pictures.

### Elevation

- **Cloud-optimised GeoTIFF by URL** (Copernicus GLO-30 and others): Layer → Add Layer → Add Raster Layer… → **Source Type**: Protocol: HTTP(S), cloud, etc. → **Type**: HTTP/HTTPS/FTP → **URI**: paste the `.tif` URL → **Add**. QGIS streams only the parts it needs.
- **Downloaded GeoTIFF**: Layer → Add Layer → Add Raster Layer… → browse to the file → **Add**.
- **Several tiles**: Raster → Miscellaneous → Merge…
- **Cut to the area**: Raster → Extraction → Clip Raster by Extent…
- **To metres**: Raster → Projections → Warp (Reproject)… into the local projected CRS before slope or hillshade.
- **Shaded relief**: Layer Properties → Symbology → **Render type**: Hillshade for a quick look, or Raster → Analysis → Hillshade… for a new layer. On a DEM still in EPSG:4326, set **Scale (ratio of vertical units to horizontal)** to 111120 in Raster → Analysis → Hillshade…, or **Z Factor** to 0.000009 in the Symbology renderer. Otherwise the shading is harsh and nearly black and white. On a DEM in metres, leave Scale at 1, or the result looks flat.
- **Surface or terrain?** Say which one the source is. Copernicus GLO-30, SRTM and ALOS are surface models, with buildings and trees included. National LiDAR DTMs are bare earth.

### Sentinel and Landsat imagery

- Quick look: the NASA GIBS WMS or the EOX Sentinel-2 cloudless WMTS (CC BY-NC-SA from 2018: non-commercial, share-alike).
- Real bands: download from Copernicus Browser (Sentinel) or USGS EarthExplorer (Landsat Collection 2 Level-2). Both need a free login. Load the bands with Add Raster Layer…, then use Raster → Miscellaneous → Build Virtual Raster… with **Place each input file into a separate band** ticked to stack them, or use the Semi-Automatic Classification Plugin.

## CRS

- State the native CRS of every source. Most global services are EPSG:4326 or EPSG:3857.
- Work in the local projected CRS for anything you measure, buffer or analyse. Use the national grid where one exists (the references give it per region). Otherwise use the UTM zone: zone = floor((longitude + 180) / 6) + 1, then EPSG:326<zone> in the north or EPSG:327<zone> in the south (WGS 84).
- Set it with Project → Properties… → **CRS** tab, or the CRS button at the bottom right of the window.
- QGIS 3 reprojects layers on the fly, so different CRSs line up on screen. A layer that lands near 0°, 0° or far from the others has the **wrong CRS assigned**, usually a shapefile with no `.prj`. Fix it with right-click → Layer CRS → Set Layer CRS…, which assigns the CRS without reprojecting.
- Never measure areas or distances in EPSG:4326 or EPSG:3857. Save a copy in the local CRS first.

## Failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| WMS connects but layers can't be added | You selected a group entry without a name, or the server offers no CRS QGIS can use | Select a named child layer. Check the CRS list in the capabilities. |
| WMS or WMTS blank at some zooms | Scale limits in the capabilities, or the tile matrix doesn't cover the area | Zoom in or out. Check the layer's scale range and bounding box. |
| WMTS tiles blurry or slow | The tile matrix set's CRS differs from the project CRS | For viewing, set the project CRS to the tile set's CRS. |
| WMS or WMTS layer blank or in the wrong place in EPSG:4326 | Axis-order mismatch (WMS 1.3 or WMTS) | Edit the connection → tick **Ignore axis orientation (WMS 1.3/WMTS)** or **Invert axis orientation**. |
| Capabilities load but the map or tiles never draw | The server reports an internal GetMap or GetTile URL | Edit the connection → tick **Ignore GetMap/GetTile/GetLegendGraphic URI reported in capabilities**. |
| XYZ layer blank, or 401/403 | Needs an API key or Referer, or the URL has `{x}` and `{y}` swapped | Add the key or Referer. Check the order (Esri uses `{z}/{y}/{x}`). Stamen styles now need a Stadia Maps key. |
| WFS stops at a round number of features (1000, 5000) | The server's page limit | Turn on feature paging in the connection, or zoom in and tick **Only request features overlapping the view extent**. Download the file for the full set. |
| ArcGIS REST connection fails | The URL points to a layer, not the services root | Connect to `…/rest/services`, then browse to the layer. |
| Overpass "runtime error: Query timed out", or 429 | The area is too big or the server is busy | Use `[timeout:180][maxsize:1073741824]`, a smaller extent, or another Overpass server in QuickOSM's settings. For big areas, use an extract. |
| GeoTIFF loads grey or invisible | The stretch comes from estimated statistics, or NoData isn't set | Layer Properties → Symbology → Min / Max Value Settings → Accuracy: **Actual (slower)**. Set NoData under Transparency. |
| Hillshade harsh, noisy or nearly black and white | The DEM is in degrees but heights are in metres | Warp to a metric CRS first, or set Scale to 111120 (Z Factor 0.000009 in the Symbology renderer). |
| Hillshade almost flat | Scale 111120 used on a DEM already in metres, or the Z factor is too low | Set Scale back to 1, or raise the Z factor. |
| "Terrain" shows roofs and trees | The source is a surface model (DSM) | Use a national LiDAR DTM for bare earth, or label it as a surface model. |
| Layer in the wrong place | The wrong CRS is assigned | Use Set Layer CRS… to assign the right one. Don't reproject. |
| Areas or lengths wrong | You measured in EPSG:4326 or 3857 | Save Features As… in the local projected CRS, then measure. |

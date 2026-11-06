# Open geospatial sources for QGIS

Curated endpoints, download portals and query patterns. Read the section for the data type, then the region.

**Checked** records a test on 6 November 2026 from one client:

- **yes**: the service answered (capabilities XML, JSON, a tile or the first bytes of the file).
- **page**: the landing or download page loads. It is a portal, not a service to paste into QGIS.
- **no answer**: unreachable when checked on 6 November 2026. Widely used, but test it before you present it.
- **key** or **401**: answered, but only with an API key or login.

Endpoints move. Test any URL before you present it, and drop or flag it if the test fails.

---

## Basemaps (view only)

Pictures for context. You cannot query or measure them.

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| OpenStreetMap Standard | XYZ | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Open. Follow the OSM tile usage policy: light interactive use, no bulk download or offline caching. QGIS ships this under Browser → XYZ Tiles. | yes |
| OpenTopoMap | XYZ | `https://tile.opentopomap.org/{z}/{x}/{y}.png` | Open (CC BY-SA). Slow at peak times. | yes |
| CARTO Positron | XYZ | `https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png` | Open for light use. Check CARTO's terms before commercial use. | yes |
| Esri World Imagery | XYZ | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | Esri terms, attribution required. **Note `{y}` before `{x}`.** | yes |
| EOX Sentinel-2 cloudless | WMTS | `https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml` | Layers `s2cloudless-<year>` (EPSG:4326) and `s2cloudless-<year>_3857` from 2017 on; the 2016 layer is `s2cloudless` (and `s2cloudless_3857`). 2016 and 2017 are CC BY 4.0. 2018 and later are CC BY-NC-SA 4.0: non-commercial, share-alike. | yes |
| Stamen Terrain / Toner / Watercolor | XYZ | `https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png?api_key=YOUR_KEY` | **Needs a Stadia Maps API key** (401 without one). The old `stamen-tiles.a.ssl.fastly.net` URLs are dead (503). | 401 |
| QuickMapServices | Plugin | Plugins → Manage and Install Plugins… → QuickMapServices | A catalogue of basemaps. Each service keeps its own terms. | page |

## Imagery and Earth observation

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| NASA GIBS (EPSG:4326) | WMS | `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi` | Open. Daily MODIS and VIIRS layers. Time-enabled. | yes |
| NASA GIBS (EPSG:3857) | WMTS | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi` | Open | yes |
| Copernicus Browser | Portal | `https://browser.dataspace.copernicus.eu/` | **Free login.** Sentinel-1, -2, -3 and -5P. Download a scene as GeoTIFF. | page |
| USGS EarthExplorer | Portal | `https://earthexplorer.usgs.gov/` | **Free login.** Landsat 8/9 Collection 2 Level-2 surface reflectance. | page |
| NASA Earthdata | Portal | `https://www.earthdata.nasa.gov/` | **Free login.** MODIS, VIIRS, SRTM, NASADEM. | page |
| Semi-Automatic Classification Plugin | Plugin | Plugins → Manage and Install Plugins… → Semi-Automatic Classification Plugin | Search, download and composite Landsat and Sentinel bands. Downloads need the logins above. | page |
| ESA SciHub | Retired | (none) | Shut down. Replaced by the Copernicus Data Space Ecosystem (Copernicus Browser above). | no answer |

## Elevation

Global DEMs at 30 m (Copernicus GLO-30, SRTM, ALOS) are **surface models**: roofs and tree canopy are included. For bare-earth terrain in a city, look for a national LiDAR DTM first.

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| Copernicus DEM GLO-30 | COG by URL | `https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N38_00_W010_00_DEM/Copernicus_DSM_COG_10_N38_00_W010_00_DEM.tif` | Open, no key, attribution required. 1° tiles named by the **south-west corner**: `N`/`S` + 2-digit latitude, `E`/`W` + 3-digit longitude (e.g. 38.7° N, 9.1° W is `N38_00_W010_00`). EPSG:4326 horizontal, EGM2008 heights. Ocean-only tiles don't exist. | yes |
| Copernicus DEM GLO-90 | COG by URL | `https://copernicus-dem-90m.s3.amazonaws.com/Copernicus_DSM_COG_30_N38_00_W010_00_DEM/Copernicus_DSM_COG_30_N38_00_W010_00_DEM.tif` | Open. Same naming, with `_30_` in place of `_10_`. | yes |
| OpenTopography Global DEM API | REST → GeoTIFF | `https://portal.opentopography.org/API/globaldem?demtype=COP30&south=S&north=N&west=W&east=E&outputFormat=GTiff&API_Key=YOUR_KEY` | **Free API key** (401 without one). `demtype` values include SRTMGL1, NASADEM, COP30, COP90 and AW3D30. The **OpenTopography DEM Downloader** plugin wraps it. | 401 |
| SRTM Downloader | Plugin | Plugins → Manage and Install Plugins… → SRTM Downloader | **Needs a NASA Earthdata login.** Downloads SRTM 1″ tiles for the canvas extent. | page |
| CGIAR SRTM 90 m | Download | `https://srtm.csi.cgiar.org/srtmdata/` | Open, void-filled | page |
| ALOS World 3D 30 m | Download | `https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm` | **Free registration** | page |
| AWS Terrain Tiles (Terrarium) | XYZ, encoded | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | Open. Heights are encoded in RGB. In QGIS versions whose XYZ connection dialog has an **Interpretation** option, choose Terrarium Terrain RGB to get elevation values. | yes |
| GEBCO grid | WMS | `https://wms.gebco.net/mapserv` | Open. Layer `GEBCO_LATEST`: global bathymetry and topography. | yes |

## OpenStreetMap and other vector data

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| QuickOSM | Plugin | Vector → QuickOSM → QuickOSM… | Open. Queries Overpass for you. Output is EPSG:4326. | page |
| Overpass API | REST | `https://overpass-api.de/api/interpreter` | Open, fair use. You can change the server in QuickOSM's settings. | no answer |
| Overpass Turbo | Web GUI | `https://overpass-turbo.eu/` | Open. Write and test a query, then Export → GeoJSON. | page |
| Geofabrik extracts | Download | `https://download.geofabrik.de/` | Open (ODbL). Country and region `.osm.pbf` and shapefiles, updated daily. | no answer |
| BBBike extracts | Download | `https://extract.bbbike.org/` | Open (ODbL). Custom polygons in many formats. | page |
| Overture Maps | GeoParquet / CLI | Docs: `https://docs.overturemaps.org/`. CLI: `pip install overturemaps`, then `overturemaps download --bbox=W,S,E,N -f geojson --type=building -o buildings.geojson` | Open (licence varies by theme: buildings are ODbL). Buildings merged from OSM and ML footprints, plus places, transport and divisions. QGIS reads GeoJSON everywhere, and GeoParquet where its GDAL build supports it. | page |
| Natural Earth | Download | `https://www.naturalearthdata.com/downloads/` | Public domain. Small-scale admin boundaries, coastlines, rivers. | page |
| geoBoundaries | Download | `https://www.geoboundaries.org/` | Open (mostly CC BY 4.0). Admin boundaries. | page |
| GADM | Download | `https://gadm.org/download_country.html` | **Non-commercial use only, no redistribution.** Detailed admin levels. | page |
| OCHA HDX | Portal | `https://data.humdata.org/` | Licence per dataset. Humanitarian layers. | page |

## Land cover

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| ESA WorldCover 10 m | Download | `https://esa-worldcover.org/en/data-access` | Open (CC BY 4.0). The Terrascope WMS `https://services.terrascope.be/wms/v2` did not answer. | page |
| CORINE Land Cover 2018 (Europe) | WMS | `https://image.discomap.eea.europa.eu/arcgis/services/Corine/CLC2018_WM/MapServer/WmsServer` | Open | yes |
| Copernicus Land Monitoring Service | Portal | `https://land.copernicus.eu/` | **Free login** for downloads | page |
| NLCD (USA) | Download | `https://www.mrlc.gov/data` | Open | page |

---

## By region

National agencies often have sharper, more current data than global sets. Check here first for the area, then fall back to the global tables.

### Europe

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| INSPIRE Geoportal | Catalogue | `https://inspire-geoportal.ec.europa.eu/` | Open. Search by country and theme to find national WMS and WFS. | no answer |
| EEA services | ArcGIS REST | `https://image.discomap.eea.europa.eu/arcgis/rest/services` | Open. Use this root as the URL in Add ArcGIS REST Server Layer… → **New**. Folders include Corine, Elevation and Natura2000. | yes |

### Portugal (national grid: ETRS89 / PT-TM06, EPSG:3763)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| DGT GeoServer | WMS | `https://geo2.dgterritorio.gov.pt/geoserver/ows` | Open. Layers include admin areas (`caop_continente:*`), land use (`COS-S2:cos2023v1-s2`), contours (`altimetria:Curva_de_nivel`) and the 50 m terrain model (`MDT50m:MDT50m`). The DTM layer is a styled picture, not heights. | yes |
| DGT orthophotos 2021 | WMTS | `https://cartografia.dgterritorio.gov.pt/ortos2021/service?service=wmts&request=getcapabilities` | Open. Layer `Ortos2021-RGB`, tile matrix set `PTTM_06` (EPSG:3763). | yes |
| DGT OGC API | OGC API | `https://ogcapi.dgterritorio.gov.pt/` | Open. 2023 30 cm imagery, 2025 admin areas, cadastre, land use. | yes |
| DGT download service (CDD) | Download | `https://cdd.dgterritorio.gov.pt/` | **Free login** (DGT account). LiDAR MDT/MDS at 2 m and 50 cm, 1 km GeoTIFF tiles, EPSG:3763, CC BY 4.0. | page |

### United Kingdom (British National Grid, EPSG:27700)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| OS Open Data downloads | Download | `https://osdatahub.os.uk/downloads/open` | Open (OGL). OS OpenMap Local (building outlines), OS Open Zoomstack, OS Terrain 50. OS Data Hub APIs need a free key. | page |
| Environment Agency LiDAR DTM 1 m (England) | WMS | `https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wms` | Open. Layers `Lidar_Composite_Hillshade_DTM_1m` and `Lidar_Composite_Elevation_DTM_1m`. Download the tiles at `https://environment.data.gov.uk/survey`. | yes |

### United States (NAD83 / UTM zones EPSG:26901–26923, CONUS Albers EPSG:5070)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| USGS Topo | WMS | `https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WMSServer` | Open | yes |
| USGS 3DEP elevation | WMS | `https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer` | Open. Slow, and timed out on the first try. | yes |
| Census TIGERweb | WMS | `https://tigerweb.geo.census.gov/arcgis/services/TIGERweb/tigerWMS_Current/MapServer/WMSServer` | Open. Census boundaries and roads. It is a WMS, not a WFS. | yes |
| USGS National Map (carto) | ArcGIS REST | `https://carto.nationalmap.gov/arcgis/rest/services` | Open. MapServer services for contours, geographic names, government units, structures and transportation. | yes |
| The National Map Downloader | Download | `https://apps.nationalmap.gov/downloader/` | Open. 3DEP DEMs and LiDAR, hydrography, structures. | page |

### Canada (NAD83(CSRS) / UTM zones, e.g. EPSG:3157 for zone 10N; Canada Atlas Lambert EPSG:3979)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| Canada elevation (CanElevation) | WMS and WCS | `https://datacube.services.geo.ca/ows/elevation` | Open. WMS layers `dtm`, `dsm`, `dtm-hillshade` and slope are pictures. **WCS** at the same URL returns height values. | yes |
| Canada Base Map (CBMT) | WMS | `https://maps.geogratis.gc.ca/wms/CBMT` | Open. WMS 1.1.1. | yes |
| NRCan STAC catalogue | STAC | `https://datacube.services.geo.ca/stac/api/` | Open. Cloud-optimised GeoTIFFs you can load by URL. | yes |
| Open Maps | Portal | `https://open.canada.ca/en/open-maps` | Open | page |

### Australia (GDA2020 / MGA zones 49–56, EPSG:7849–7856)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| Geoscience Australia topographic base map | WMS | `https://services.ga.gov.au/gis/services/Topographic_Base_Map/MapServer/WMSServer` | Open. The old `www.ga.gov.au/gis/services/topography/...` path returns 404. | yes |
| ELVIS elevation and depth | Download | `https://elevation.fsdf.org.au/` | Open. LiDAR DEMs, with resolution varying by area. | page |
| data.gov.au | Portal | `https://data.gov.au/` | Licence per dataset. Each dataset's metadata lists its WMS or WFS. | page |

### New Zealand (NZTM2000, EPSG:2193)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| LINZ Data Service | Portal, WMTS, WFS | `https://data.linz.govt.nz/` | Open (CC BY 4.0). **WMTS and WFS URLs need a free API key**, which goes in the URL. The national 8 m DEM is layer 51768. | page |

### Japan (JGD2011 plane rectangular zones, EPSG:6669–6687)

| Name | Type | URL | Access | Checked |
|---|---|---|---|---|
| GSI standard map | XYZ | `https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png` | Open, credit 国土地理院 (GSI) | yes |
| GSI hillshade | XYZ | `https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png` | Open, credit GSI | yes |
| GSI elevation tiles | XYZ, encoded | `https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png` | Open. Heights are encoded in RGB. No tile at zoom 0. | yes |

---

## Finding a source that isn't listed

1. Search with service words and the place:
   - `<country> WMS OR WFS "<theme>" site:gov.<tld>` (or the national government domain)
   - `<region> geoportal WFS GeoJSON download <theme>`
   - `INSPIRE <country> <theme> WMS` (Europe)
   - `<city> open data <theme> ArcGIS REST` or `<country> geonode`
2. Search the catalogues: the INSPIRE Geoportal (Europe), ArcGIS Hub `https://hub.arcgis.com/` (many city and state REST services), national CKAN portals (`data.<country domain>`).
3. On a dataset page, look for "WMS", "WFS", "API", "REST", "OGC" or a download link. A web map viewer alone is not a source.
4. Test it (next section) before presenting it.

## Testing an endpoint

| Kind | Test request | Good answer |
|---|---|---|
| WMS | `<url>?SERVICE=WMS&REQUEST=GetCapabilities` | `WMS_Capabilities` (WMS 1.3.0) or `WMT_MS_Capabilities` (WMS 1.1.1) XML listing named layers |
| WMTS | `<url>?SERVICE=WMTS&REQUEST=GetCapabilities`, or the `WMTSCapabilities.xml` URL | `Capabilities` XML with layers and tile matrix sets |
| WFS | `<url>?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities` | XML listing feature types |
| WCS | `<url>?SERVICE=WCS&REQUEST=GetCapabilities` | XML listing coverages |
| ArcGIS REST | `<url>?f=json` | JSON listing services, folders or layers |
| XYZ | Replace `{z}/{x}/{y}` with `0/0/0`, or with a tile over the area | An image |
| File or COG | A HEAD or range request, or `gdalinfo /vsicurl/<url>` | 200 or 206 with the expected content type |

A `ServiceException`, an HTML login page, a 401 or 403, or an empty body means the URL is not usable as given. Also check that the layer's bounding box covers the area.

## Overpass query patterns

In Overpass Turbo, `{{bbox}}` fills in the map extent. Elsewhere, replace it with `south,west,north,east` in decimal degrees.

Buildings:

```
[out:json][timeout:90];
(
  way["building"]({{bbox}});
  relation["building"]["type"="multipolygon"]({{bbox}});
);
out body;
>;
out skel qt;
```

Main roads:

```
[out:json][timeout:90];
(
  way["highway"~"^(motorway|trunk|primary|secondary)$"]({{bbox}});
);
out body;
>;
out skel qt;
```

Land use:

```
[out:json][timeout:90];
(
  way["landuse"]({{bbox}});
  relation["landuse"]({{bbox}});
);
out body;
>;
out skel qt;
```

Parks and green space:

```
[out:json][timeout:90];
(
  way["leisure"="park"]({{bbox}});
  relation["leisure"="park"]({{bbox}});
);
out body;
>;
out skel qt;
```

For a large area, raise the limits in the header (`[out:json][timeout:180][maxsize:1073741824];`), split the area, or use a Geofabrik or BBBike extract instead.

## Bounding-box order by tool

| Tool | Order |
|---|---|
| Overpass | `south,west,north,east` |
| `overturemaps --bbox` | `west,south,east,north` |
| OpenTopography API | named parameters `south`, `north`, `west`, `east` |
| QGIS extent fields | `xmin,xmax,ymin,ymax [EPSG:code]` |

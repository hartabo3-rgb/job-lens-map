import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import { SAUDI_REGIONS_GEOJSON } from "@/lib/saudiRegions";
import { SAUDI_BOUNDARY_GEOJSON } from "@/lib/saudiBoundary";

// World rectangle used to "punch out" Saudi shape and dim the rest.
const WORLD_RING: number[][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

// Build a single Polygon with world as outer ring and Saudi outline(s) as holes,
// so everything outside Saudi gets a translucent dim color.
function buildMaskFeature(): GeoJSON.Feature {
  const holes: number[][][] = [];
  for (const f of (SAUDI_BOUNDARY_GEOJSON as any).features as any[]) {
    const g = f.geometry;
    if (g.type === "Polygon") {
      // Use only the outer ring of each polygon as a hole
      holes.push(g.coordinates[0]);
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) holes.push(poly[0]);
    }
  }
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [WORLD_RING, ...holes],
    },
  };
}

const MASK_FEATURE = buildMaskFeature();

export const SaudiOverlay = () => {
  return (
    <>
      {/* Dim everything outside Saudi Arabia */}
      <GeoJSON
        data={MASK_FEATURE as any}
        style={{
          color: "transparent",
          weight: 0,
          fillColor: "#0f172a",
          fillOpacity: 0.55,
        }}
        interactive={false}
        pane="overlayPane"
      />

      {/* Colored 13 administrative regions */}
      <GeoJSON
        data={SAUDI_REGIONS_GEOJSON as any}
        style={(feature) => {
          const color = (feature?.properties as any)?.color || "#64748b";
          return {
            color,
            weight: 1.5,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: 0.12,
          };
        }}
        onEachFeature={(feature, layer) => {
          const name = (feature.properties as any)?.name;
          if (name) {
            layer.bindTooltip(name, {
              sticky: true,
              direction: "center",
              className: "region-tooltip",
            });
          }
          layer.on({
            mouseover: (e) => {
              const l = e.target as L.Path;
              l.setStyle({ fillOpacity: 0.28, weight: 2.5 });
            },
            mouseout: (e) => {
              const l = e.target as L.Path;
              l.setStyle({ fillOpacity: 0.12, weight: 1.5 });
            },
          });
        }}
      />

      {/* Saudi outer border highlight */}
      <GeoJSON
        data={SAUDI_BOUNDARY_GEOJSON as any}
        style={{
          color: "#0f172a",
          weight: 2,
          opacity: 0.85,
          fill: false,
        }}
        interactive={false}
      />
    </>
  );
};

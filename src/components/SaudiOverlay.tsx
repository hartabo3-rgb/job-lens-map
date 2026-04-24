import { GeoJSON } from "react-leaflet";
import { SAUDI_REGIONS_GEOJSON } from "@/lib/saudiRegions";
import { SAUDI_BOUNDARY_GEOJSON } from "@/lib/saudiBoundary";

export const SaudiOverlay = () => {
  return (
    <>
      {/* 13 administrative regions: black borders only, no fill */}
      <GeoJSON
        data={SAUDI_REGIONS_GEOJSON as any}
        style={{
          color: "#000000",
          weight: 1,
          opacity: 0.7,
          fill: false,
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
        }}
      />

      {/* Saudi outer border highlight */}
      <GeoJSON
        data={SAUDI_BOUNDARY_GEOJSON as any}
        style={{
          color: "#000000",
          weight: 2.5,
          opacity: 1,
          fill: false,
        }}
        interactive={false}
      />
    </>
  );
};

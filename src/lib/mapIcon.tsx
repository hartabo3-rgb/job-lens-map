import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Briefcase } from "lucide-react";

export function createJobMarkerIcon() {
  const iconSvg = renderToStaticMarkup(
    <Briefcase size={16} strokeWidth={2.5} />
  );

  const html = `
    <div class="job-marker">
      <span class="job-marker-inner">${iconSvg}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

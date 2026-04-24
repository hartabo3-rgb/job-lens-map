import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Briefcase, Building2, Landmark } from "lucide-react";

export type MarkerKind = "job" | "gov_job" | "company";

const COLORS: Record<MarkerKind, { bg: string; ring: string }> = {
  // Blue – regular jobs
  job: { bg: "linear-gradient(135deg,#1d4ed8,#3b82f6)", ring: "#1e3a8a" },
  // Red – government jobs
  gov_job: { bg: "linear-gradient(135deg,#b91c1c,#ef4444)", ring: "#7f1d1d" },
  // Green – company locations
  company: { bg: "linear-gradient(135deg,#047857,#10b981)", ring: "#064e3b" },
};

export function createMarkerIcon(kind: MarkerKind = "job") {
  const Icon =
    kind === "company" ? Building2 : kind === "gov_job" ? Landmark : Briefcase;
  const iconSvg = renderToStaticMarkup(<Icon size={16} strokeWidth={2.5} />);
  const { bg, ring } = COLORS[kind];

  const html = `
    <div class="map-marker" style="background:${bg};border-color:#fff;box-shadow:0 4px 14px -2px ${ring}99;">
      <span class="map-marker-inner">${iconSvg}</span>
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

// Backwards compatibility
export const createJobMarkerIcon = () => createMarkerIcon("job");

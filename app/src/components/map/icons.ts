/**
 * MapParnikDrawer - Leaflet icons (de-minified)
 */

import { Icon } from "leaflet";

/**
 * Small edit point icon - red circle outline
 */
export const editIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjREMxNDNDIiBzdHJva2Utd2lkdGg9IjMiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48L3N2Zz4=",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/**
 * Standard map marker - red pin
 */
export const markerIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0RDMTQzQyI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

/**
 * Distance measurement point - small black dot
 */
export const distanceIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIvPjwvc3ZnPg==",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

/**
 * Selected point icon - blue circle outline
 */
export const selectedPointIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA3YmZmIiBzdHJva2Utd2lkdGg9IjQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48L3N2Zz4=",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * Create a dynamic label icon with distance text
 */
export function createDistanceLabelIcon(distanceKm: number): Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="20">
    <rect x="0" y="0" width="60" height="20" rx="4" fill="rgba(0,0,0,0.7)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10">${distanceKm.toFixed(2)} km</text>
  </svg>`;

  return new Icon({
    iconUrl:
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg))),
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });
}

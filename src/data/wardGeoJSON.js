// Simplified GeoJSON for Bangalore Wards (Demo Version)
// These polygons represent key wards discussed in wardData.js
// In a production environment, this would be a full 243-ward dataset.

export const bangaloreWardsGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "ward-52",
      "properties": { "ward": 52, "name": "Indiranagar", "zone": "East" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.63, 12.97], [77.65, 12.97], [77.65, 12.98], [77.63, 12.98], [77.63, 12.97]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "ward-150",
      "properties": { "ward": 150, "name": "HSR Layout", "zone": "South" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.62, 12.91], [77.64, 12.91], [77.64, 12.93], [77.62, 12.93], [77.62, 12.91]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "ward-68",
      "properties": { "ward": 68, "name": "Koramangala", "zone": "South" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.61, 12.93], [77.63, 12.93], [77.63, 12.94], [77.61, 12.94], [77.61, 12.93]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "ward-99",
      "properties": { "ward": 99, "name": "Whitefield", "zone": "Mahadevapura" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.74, 12.96], [77.76, 12.96], [77.76, 12.98], [77.74, 12.98], [77.74, 12.96]
        ]]
      }
    },
    {
      "type": "Feature",
      "id": "ward-165",
      "properties": { "ward": 165, "name": "Hebbal", "zone": "North" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.58, 13.02], [77.61, 13.02], [77.61, 13.05], [77.58, 13.05], [77.58, 13.02]
        ]]
      }
    }
  ]
};

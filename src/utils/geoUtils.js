import * as turf from '@turf/turf';
import { wardMLAData, completeMLAList, getMPByZone } from '../data/wardData';

let wardGeoJSON = null;

/**
 * Loads the Ward GeoJSON if not already loaded.
 */
export async function loadWardGeoJSON() {
  if (wardGeoJSON) return wardGeoJSON;
  try {
    const res = await fetch('/data/bangalore-wards.geojson?v=datameet_243');
    wardGeoJSON = await res.json();
    return wardGeoJSON;
  } catch (e) {
    console.error('Failed to load ward GeoJSON', e);
    return null;
  }
}

/**
 * Finds which ward containing a specific latitude and longitude.
 * Returns the ward properties and the matched MLA data.
 */
export async function getWardFromLatLng(lat, lng) {
  const geojson = await loadWardGeoJSON();
  if (!geojson) return null;

  const point = turf.point([lng, lat]);
  
  let matchedFeature = null;
  for (const feature of geojson.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      matchedFeature = feature;
      break;
    }
  }

  if (!matchedFeature) return null;

  const wardProps = matchedFeature.properties;
  const wardNo = wardProps.KGISWardNo || wardProps.ward_no;
  
  // Link to our internal MLA data
  let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
  
  if (!mlaData) {
    // Fallback logic
    const zone = wardProps.KGISWardName?.split('(')[1]?.replace(')', '') || 'Central';
    const fallbackMla = completeMLAList.find(m => m.constituency === zone) || completeMLAList[Number(wardNo) % completeMLAList.length];
    mlaData = { ...fallbackMla, ...getMPByZone(zone) };
  }

  return {
    ward: wardNo,
    name: wardProps.KGISWardName,
    mla: mlaData.mla,
    party: mlaData.party,
    partyColor: mlaData.partyColor,
    authority: mlaData.authority || 'BBMP Authority',
    mlaData: mlaData,
    properties: wardProps
  };
}

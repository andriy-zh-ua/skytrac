import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const AIRCRAFT_ICON = L.divIcon({
  className: 'single-aircraft-icon',
  html: '<div style="font-size:48px;font-weight:bold;color:#1976d2;">&#x2708;</div>',
  iconSize: [60, 45],
  iconAnchor: [30, 22]
});

const AircraftMarker = ({ position, onDragEnd }) => {
  if (!position) return null;
  
  return (
    <Marker
      position={position}
      icon={AIRCRAFT_ICON}
      draggable={true}
      eventHandlers={{ dragend: onDragEnd }}
    />
  );
};

export default AircraftMarker;

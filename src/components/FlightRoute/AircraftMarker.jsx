import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const AIRCRAFT_ICON = L.divIcon({
  className: 'single-aircraft-icon',
  html: '<div style="font-size:48px;font-weight:bold;color:#1976d2;">&#x2708;</div>',
  iconSize: [60, 45],
  iconAnchor: [30, 22]
});

const AircraftMarker = ({ position, onDragEnd, rotation = 0 }) => {
  if (!position) return null;
  
  // Create dynamic icon with rotation
  const rotatedIcon = L.divIcon({
    className: 'single-aircraft-icon',
    html: `<div style="font-size:48px;font-weight:bold;color:#1976d2;transform:rotate(${rotation + 270}deg);transform-origin:center;">&#x2708;</div>`,
    iconSize: [60, 45],
    iconAnchor: [30, 22]
  });
  
  return (
    <Marker
      position={position}
      icon={rotatedIcon}
      draggable={true}
      eventHandlers={{ dragend: onDragEnd }}
    />
  );
};

export default AircraftMarker;

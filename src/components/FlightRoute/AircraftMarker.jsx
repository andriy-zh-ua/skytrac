import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const AircraftMarker = ({ position, onDragEnd, rotation = 0 }) => {
  if (!position) return null;
  
  // Create dynamic icon with rotation
  const rotatedIcon = L.divIcon({
    className: 'single-aircraft-icon',
    html: `<div style="font-size:60px;font-weight:bold;color:#d32f2f;transform:rotate(${rotation + 270}deg);transform-origin:center;display:flex;align-items:center;justify-content:center;width:70px;height:70px;">&#x2708;</div>`,
    iconSize: [70, 70],
    iconAnchor: [35, 35]
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

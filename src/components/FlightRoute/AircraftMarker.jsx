import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const AIRCRAFT_ICON = L.divIcon({
  className: 'single-aircraft-icon',
  html: ' Aircraft ',
  iconSize: [60, 20],
  iconAnchor: [30, 10],
  style: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1976d2',
    backgroundColor: 'white',
    border: '2px solid #1976d2',
    borderRadius: '4px',
    padding: '2px'
  }
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

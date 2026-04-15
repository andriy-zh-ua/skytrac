import { Marker } from 'react-leaflet';
import L from 'leaflet';

const AircraftMarker = ({ position, onDragEnd, rotation = 0, selected = false, onClick }) => {
  if (!position) return null;
  
  // Red for selected, gray for unselected
  const color = selected ? '#d32f2f' : '#808080';

  // Create dynamic icon with rotation and selection-based color
  const rotatedIcon = L.divIcon({
    className: 'single-aircraft-icon',
    html: `<div style="transform:rotate(${rotation}deg);transform-origin:center;display:flex;align-items:center;justify-content:center;width:35px;height:35px;"><svg width="25" height="25" viewBox="0 0 24 24" fill="${color}" style="margin:auto;"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>`,
    iconSize: [35, 35],
    iconAnchor: [17.5, 17.5]
  });
  
  return (
    <Marker
      position={position}
      icon={rotatedIcon}
      draggable={true}
      eventHandlers={{ 
        dragend: onDragEnd,
        click: onClick
       }}
    />
  );
};

export default AircraftMarker;

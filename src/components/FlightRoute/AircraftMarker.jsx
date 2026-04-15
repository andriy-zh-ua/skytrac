import { Marker } from 'react-leaflet';
import L from 'leaflet';

const AircraftMarker = ({ position, onDragEnd, onDragStart, rotation = 0, selected = false, onClick }) => {
  if (!position) return null;
  
  // Red for selected, gray for unselected
  const color = selected ? '#d32f2f' : '#808080';

  // Create dynamic icon with rotation and selection-based color
  const rotatedIcon = L.divIcon({
    className: 'single-aircraft-icon',
    html: `<div style="font-size:60px;font-weight:bold;color:${color};transform:rotate(${rotation + 270}deg);transform-origin:center;display:flex;align-items:center;justify-content:center;width:70px;height:70px;">&#x2708;</div>`,
    iconSize: [70, 70],
    iconAnchor: [35, 35]
  });
  
  return (
    <Marker
      position={position}
      icon={rotatedIcon}
      draggable={true}
      eventHandlers={{ 
        dragstart: onDragStart,
        dragend: onDragEnd,
        click: onClick
       }}
    />
  );
};

export default AircraftMarker;

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FlightRouteKafkaProducer from './FlightRouteKafkaProducer';
import AircraftMarker from './AircraftMarker';

// Ottawa International Airport coordinates: 45.3225° N, 75.6672° W
const OTTAWA_AIRPORT_LAT = 45.3225;
const OTTAWA_AIRPORT_LON = -75.6672;

// Step distance constant for route generation
const STEP_DISTANCE_METERS = 50;

const DEST_ICON = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Map zoom tracker component
function MapZoomTracker({ onZoomChange }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      const handleZoomEnd = () => {
        onZoomChange(map.getZoom());
      };
      
      map.on('zoomend', handleZoomEnd);
      
      return () => {
        map.off('zoomend', handleZoomEnd);
      };
    }
  }, [map, onZoomChange]);
  
  return null;
}

const FlightRouteMap = ({ onRouteUpdate, initialCenter = [OTTAWA_AIRPORT_LAT, OTTAWA_AIRPORT_LON], kafkaIntegration, producers, selectedProducerId, onProducerActivate, onProducerDeactivate, onAircraftSelect }) => {
  const [aircraft, setAircraft] = useState([]); // Array to store aircraft objects from Kafka canvas
  const [selectedAircraftId, setSelectedAircraftId] = useState(null);
  const [mapZoom, setMapZoom] = useState(10); // Track map zoom level
  const aircraftListRef = useRef(null); // Ref for scrollable aircraft list
  const prevAircraftLengthRef = useRef(0); // Track previous aircraft array length

  // Auto-scroll to selected aircraft in the list
  useEffect(() => {
    if (selectedAircraftId && aircraftListRef.current) {
      const selectedElement = aircraftListRef.current.querySelector(`[data-aircraft-id="${selectedAircraftId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedAircraftId]);

  // Sync map selection with canvas selection for producer/aircraft nodes (when selecting from canvas)
  useEffect(() => {
    if (selectedProducerId && selectedProducerId !== selectedAircraftId) {
      setSelectedAircraftId(selectedProducerId);
    }
  }, [selectedProducerId, selectedAircraftId]);

  // Add aircraft information from Kafka canvas producers into aircraft array
  useEffect(() => {
    if (producers && producers.length > 0) {
      setAircraft(prevAircraft => {
        const updatedAircraft = [...prevAircraft];
        
        // Add new aircraft that don't already exist
        producers.forEach(producer => {
          const existingAircraft = updatedAircraft.find(ac => ac.id === producer.id);
          
          if (!existingAircraft) {
            // Add new aircraft with default position
            updatedAircraft.push({
              id: producer.id,
              startPoint: L.latLng(OTTAWA_AIRPORT_LAT, OTTAWA_AIRPORT_LON),
              destinationPoint: null,
              stepCoordinates: [],
              aircraftRotation: 0
            });
          }
        });
        
        // Remove aircraft that no longer have corresponding producers
        const producerIds = new Set(producers.map(p => p.id));
        const filteredAircraft = updatedAircraft.filter(ac => producerIds.has(ac.id));
        
        return filteredAircraft;
      });
    }
  }, [producers]);

  // Auto-select most recently added aircraft when new aircraft is added
  useEffect(() => {
    const currentLength = aircraft.length;
    const prevLength = prevAircraftLengthRef.current;
    
    // Check if a new aircraft was added (array length increased)
    if (currentLength > prevLength && currentLength > 0) {
      // Select the last aircraft (most recently added)
      setSelectedAircraftId(aircraft[aircraft.length - 1].id);
    }
    
    // Update the previous length reference
    prevAircraftLengthRef.current = currentLength;
  }, [aircraft]);

  // Calculate distance between two points
  const calculateRouteDistance = useCallback(async (start, destination) => {
    if (!start || !destination) {
      console.log('Invalid coordinates for distance calculation:', { start, destination });
      return 0;
    }
    
    // Use timeout for distance calculation
    const distance = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(start.distanceTo(destination)); // in meters
      }, 0);
    });
    
    return distance;
  }, []);

  // Handle aircraft drag end to update aircraft position
  const handleAircraftDragEnd = useCallback((e, aircraftId) => {
    const position = e.target.getLatLng();

    setAircraft(prev =>
      prev.map(ac =>
        ac.id === aircraftId
          ? { ...ac, startPoint: position }
          : ac
      )
    );

    setSelectedAircraftId(aircraftId);

    // Notify canvas of selection change
    if (onAircraftSelect) {
      onAircraftSelect(aircraftId);
    }
  }, [onAircraftSelect]);

  // Handle aircraft click to select aircraft
  const handleAircraftClick = useCallback((aircraftId) => {
    setSelectedAircraftId(aircraftId);
    
    // Notify canvas of selection change
    if (onAircraftSelect) {
      onAircraftSelect(aircraftId);
    }
  }, [onAircraftSelect]);

  // Calculate responsive stroke width based on zoom level
  const getStrokeWidth = useCallback((zoom) => {
    // Base width at zoom 10, adjust inversely with zoom
    const baseWidth = 2;
    const minWidth = 0.5;
    const maxWidth = 4;
    
    // Inverse relationship: higher zoom = thinner line
    const width = Math.max(minWidth, Math.min(maxWidth, baseWidth / Math.pow(2, (zoom - 10) * 0.2)));
    return Math.round(width * 10) / 10; // Round to 1 decimal place
  }, []);

  // Calculate bearing between two points
  const calculateBearing = useCallback((startLat, startLon, endLat, endLon) => {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLonRad = (startLon * Math.PI) / 180;
    const endLatRad = (endLat * Math.PI) / 180;
    const endLonRad = (endLon * Math.PI) / 180;

    const dLon = endLonRad - startLonRad;

    const y = Math.sin(dLon) * Math.cos(endLatRad);
    const x = Math.cos(startLatRad) * Math.sin(endLatRad) - 
              Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLon);

    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
  }, []);

  // Route data for Kafka streaming - based on selected aircraft
  const selectedAircraft = aircraft.find(a => a.id === selectedAircraftId);

  const routeData = {
    start: selectedAircraft?.startPoint 
      ? { lat: selectedAircraft.startPoint.lat, lon: selectedAircraft.startPoint.lng } 
      : null,
      
    destination: selectedAircraft?.destinationPoint 
      ? { lat: selectedAircraft.destinationPoint.lat, lon: selectedAircraft.destinationPoint.lng } 
      : null,
      
    stepCoordinates: selectedAircraft?.stepCoordinates || []
  };

  // Kafka producer hook
  const kafkaProducer = FlightRouteKafkaProducer(routeData, kafkaIntegration);

  // Haversine distance calculation
  const haversineDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Great-circle route (accounts for Earth's curvature)
  const getGreatCircleRoute = useCallback((start, end, numPoints = 50) => {
    const points = [];
    
    // Convert to radians
    const lat1 = start.lat * Math.PI / 180;
    const lon1 = start.lng * Math.PI / 180;
    const lat2 = end.lat * Math.PI / 180;
    const lon2 = end.lng * Math.PI / 180;
    
    // Calculate great-circle distance
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Generate points along the great-circle path
    for (let i = 0; i <= numPoints; i++) {
      const f = i / numPoints;
      
      // Calculate intermediate point
      const A = Math.sin((1-f) * c) / Math.sin(c);
      const B = Math.sin(f * c) / Math.sin(c);
      
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      
      // Convert back to degrees
      const lat = Math.atan2(z, Math.sqrt(x*x + y*y)) * 180 / Math.PI;
      const lon = Math.atan2(y, x) * 180 / Math.PI;
      
      points.push({ lat, lon });
    }
    
    return points;
  }, []);

  // Resample route into small steps
  const resampleRoute = useCallback((route, targetDistanceMeters = STEP_DISTANCE_METERS) => {
    if (route.length < 2) return route;

    const steps = [];
    steps.push({ ...route[0] }); // start point

    let accumulated = 0;

    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1];
      const b = route[i];

      const segmentDist = haversineDistance(a.lat, a.lon, b.lat, b.lon);

      if (segmentDist === 0) continue;

      let remainingInSegment = segmentDist;

      while (accumulated + remainingInSegment >= targetDistanceMeters) {
        const needed = targetDistanceMeters - accumulated;
        const ratio = needed / segmentDist;

        const newLat = a.lat + (b.lat - a.lat) * ratio;
        const newLon = a.lon + (b.lon - a.lon) * ratio;

        steps.push({ lat: newLat, lon: newLon });

        accumulated = 0;
        remainingInSegment -= needed;
      }

      accumulated += remainingInSegment;
    }

    // Always add the final destination
    if (steps[steps.length - 1].lat !== route[route.length - 1].lat ||
        steps[steps.length - 1].lon !== route[route.length - 1].lon) {
      steps.push({ ...route[route.length - 1] });
    }

    return steps;
  }, [haversineDistance]);

  // Generate route for selected aircraft
  const generateRoute = useCallback(async () => {
    if (!selectedAircraft || !selectedAircraft.destinationPoint) return;

    const start = selectedAircraft.startPoint;
    const end = selectedAircraft.destinationPoint;

    // Always use Great Circle routing for aircraft
    const routeCoords = getGreatCircleRoute(start, end, 50);

    // Resample the route into small steps
    const steps = resampleRoute(routeCoords);

    // Calculate route distance
    const routeDistance = await calculateRouteDistance(start, end);
    
    // Round to 2 decimal places
    const roundedDistance = Math.round(routeDistance * 100) / 100;

    // Update the specific aircraft
    setAircraft(prev =>
      prev.map(ac =>
        ac.id === selectedAircraft.id
          ? { ...ac, stepCoordinates: steps, routeDistance: roundedDistance }
          : ac
      )
    );

    onRouteUpdate({
      start: { lat: start.lat, lon: start.lng },
      destination: { lat: end.lat, lon: end.lng },
      stepCoordinates: steps,
      routeDistance: roundedDistance
    });
  }, [selectedAircraft, getGreatCircleRoute, resampleRoute, onRouteUpdate, calculateRouteDistance]);

  const handleMapClick = useCallback((latlng) => {
    if (!selectedAircraftId) return;

    setAircraft(prev =>
      prev.map(ac =>
        ac.id === selectedAircraftId
          ? { ...ac, destinationPoint: latlng }
          : ac
      )
    );
  }, [selectedAircraftId]);

  // Auto-generate route when selected aircraft has both start and destination
  useEffect(() => {
    if (selectedAircraft?.startPoint && selectedAircraft?.destinationPoint) {
      generateRoute();
    }
  }, [selectedAircraft?.startPoint, selectedAircraft?.destinationPoint]);

  // Update aircraft rotation when destination is set
  useEffect(() => {
    if (!selectedAircraft || !selectedAircraft.startPoint || !selectedAircraft.destinationPoint) return;

    const bearing = calculateBearing(
      selectedAircraft.startPoint.lat,
      selectedAircraft.startPoint.lng,
      selectedAircraft.destinationPoint.lat,
      selectedAircraft.destinationPoint.lng
    );

    setAircraft(prev =>
      prev.map(ac =>
        ac.id === selectedAircraft.id
          ? { ...ac, aircraftRotation: bearing }
          : ac
      )
    );
  }, [selectedAircraft?.id, selectedAircraft?.startPoint, selectedAircraft?.destinationPoint, calculateBearing]);

  // Get simulation state
  // const getSimulationState = useCallback(() => ({
  //   start: startPoint ? { lat: startPoint.lat, lon: startPoint.lng } : null,
  //   destination: destinationPoint ? { lat: destinationPoint.lat, lon: destinationPoint.lng } : null,
  //   stepCoordinates
  // }), [startPoint, destinationPoint, stepCoordinates]);
  const getSimulationState = useCallback(() => {
    const ac = selectedAircraft;
    return {
      start: ac?.startPoint ? { lat: ac.startPoint.lat, lon: ac.startPoint.lng } : null,
      destination: ac?.destinationPoint ? { lat: ac.destinationPoint.lat, lon: ac.destinationPoint.lng } : null,
      stepCoordinates: ac?.stepCoordinates || []
    };
  }, [selectedAircraft]);

  // Expose state to parent
  useEffect(() => {
    window.getFlightState = getSimulationState;
  }, [getSimulationState]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Map Container */}
      <MapContainer
        center={initialCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapClickHandler onMapClick={handleMapClick} />
        <MapZoomTracker onZoomChange={setMapZoom} />

        {aircraft.map((ac) => (
          <AircraftMarker 
            key={ac.id}
            position={ac.startPoint}
            onDragEnd={(e) => handleAircraftDragEnd(e, ac.id)}
            rotation={ac.aircraftRotation}
            selected={ac.id === selectedAircraftId}
            onClick={() => handleAircraftClick(ac.id)}
          />
        ))}

        {aircraft.map((ac) => 
          ac.destinationPoint && (
            <Marker
              key={`dest-${ac.id}`}
              position={ac.destinationPoint}
              icon={DEST_ICON}
            />
          )
        )}

        {aircraft.map((ac) => 
          ac.stepCoordinates.length > 0 && (
            <Polyline
              key={`route-${ac.id}`}
              positions={ac.stepCoordinates.map(p => [p.lat, p.lon])}
              color={ac.id === selectedAircraftId ? "blue" : "gray"}
              weight={getStrokeWidth(mapZoom)}
              opacity={ac.id === selectedAircraftId ? 0.9 : 0.5}
            />
          )
        )}
      </MapContainer>

      {/* Control Panel */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          p: 2,
          zIndex: 1000,
          minWidth: 280,
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}
      >
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '14px' }}>
          Flight Route Controls
        </Typography>
        
        <Typography variant="body2" gutterBottom sx={{ fontSize: '11px' }}>
          <strong>Instructions:</strong><br />
          1. Add Producer in Kafka schema (aircraft appears)<br />
          2. Click on map to set destination<br />
          3. Route generates automatically<br />
          4. Drag aircraft to adjust start point
        </Typography>
        
        {/* Aircraft Records Section */}
        {aircraft.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 'bold', mb: 1 }}>
              Aircraft Records ({aircraft.length})
            </Typography>
            <Box 
              ref={aircraftListRef}
              sx={{ maxHeight: '150px', overflowY: 'auto' }}
            >
              {[...aircraft].reverse().map((ac) => (
                <Box 
                  key={ac.id}
                  data-aircraft-id={ac.id}
                  sx={{ 
                    mb: 1, 
                    p: 1, 
                    border: ac.id === selectedAircraftId ? '1px solid #d32f2f' : '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: ac.id === selectedAircraftId ? 'rgba(211, 47, 47, 0.1)' : 'transparent'
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                    {ac.id}
                    {ac.id === selectedAircraftId && ' (Selected)'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '9px', color: '#666' }}>
                    Position: {ac.startPoint ? `${ac.startPoint.lat.toFixed(4)}, ${ac.startPoint.lng.toFixed(4)}` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '9px', color: '#666' }}>
                    Destination: {ac.destinationPoint ? `${ac.destinationPoint.lat.toFixed(4)}, ${ac.destinationPoint.lng.toFixed(4)}` : 'Not set'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '9px', color: '#666' }}>
                    Distance: {ac.routeDistance ? `${(ac.routeDistance / 1000).toFixed(1)} km` : 'N/A'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FlightRouteMap;

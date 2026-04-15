import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import { Box, Paper, Typography, Switch, FormControlLabel, Slider, Button, LinearProgress } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FlightRouteKafkaProducer from './FlightRouteKafkaProducer';
import AircraftMarker from './AircraftMarker';

// Fix for default markers in webpack - ensure clean state
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const AIRCRAFT_ICON = L.divIcon({
  className: 'aircraft-marker',
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

const FlightRouteMap = ({ onRouteUpdate, initialCenter = [45.4215, -75.6972], kafkaIntegration }) => {
  const [startPoint, setStartPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [fullRoute, setFullRoute] = useState([]);
  const [stepCoordinates, setStepCoordinates] = useState([]);
  const [useOSRM, setUseOSRM] = useState(true);
  const [stepDistance, setStepDistance] = useState(200); // meters

  // Route data for Kafka streaming
  const routeData = {
    start: startPoint ? { lat: startPoint.lat, lon: startPoint.lng } : null,
    destination: destinationPoint ? { lat: destinationPoint.lat, lon: destinationPoint.lng } : null,
    fullRoute: fullRoute || [],
    stepCoordinates: stepCoordinates || []
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

  // OSRM routing
  const getOSRMRoute = useCallback(async (start, end) => {
    const profile = 'driving';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM request failed');

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) throw new Error('No route found');

    const encoded = data.routes[0].geometry;
    // Decode polyline (precision 5 for OSRM)
    const decoded = L.PolylineUtil.decode(encoded, 5); // returns [[lat, lon], ...]

    // Convert to Leaflet-friendly {lat, lon} objects
    return decoded.map(([lat, lon]) => ({ lat, lon }));
  }, []);

  // Straight-line fallback
  const getStraightLineRoute = useCallback((start, end, numSegments = 50) => {
    const points = [];
    for (let i = 0; i <= numSegments; i++) {
      const fraction = i / numSegments;
      const lat = start.lat + (end.lat - start.lat) * fraction;
      const lon = start.lng + (end.lng - start.lng) * fraction;
      points.push({ lat, lon });
    }
    return points;
  }, []);

  // Resample route into small steps
  const resampleRoute = useCallback((route, targetDistanceMeters = 200) => {
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

  // Generate route
  const generateRoute = useCallback(async () => {
    if (!startPoint || !destinationPoint) return;

    let routeCoords = [];

    try {
      if (useOSRM) {
        routeCoords = await getOSRMRoute(startPoint, destinationPoint);
      }
    } catch (err) {
      console.warn('OSRM failed, using straight line fallback', err);
    }

    if (routeCoords.length === 0) {
      routeCoords = getStraightLineRoute(startPoint, destinationPoint, 50);
    }

    setFullRoute(routeCoords);

    // Process into small simulation steps
    const steps = resampleRoute(routeCoords, stepDistance);
    setStepCoordinates(steps);

    // Notify parent component
    onRouteUpdate({
      start: { lat: startPoint.lat, lon: startPoint.lng },
      destination: { lat: destinationPoint.lat, lon: destinationPoint.lng },
      fullRoute: routeCoords,
      stepCoordinates: steps
    });
  }, [startPoint, destinationPoint, useOSRM, stepDistance, getOSRMRoute, getStraightLineRoute, resampleRoute, onRouteUpdate]);

  // Handle map click for destination or aircraft placement
  const handleMapClick = useCallback((latlng) => {
    if (!startPoint) {
      // If no aircraft exists, place it
      setStartPoint(latlng);
    } else {
      // If aircraft exists, set destination
      setDestinationPoint(latlng);
    }
  }, [startPoint]);

  // Handle aircraft drag end
  const handleAircraftDragEnd = useCallback((e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setStartPoint(position);
  }, []);

  // Auto-generate route when both points are set
  useEffect(() => {
    if (startPoint && destinationPoint) {
      generateRoute();
    }
  }, [startPoint, destinationPoint, generateRoute]);

  // Map starts empty - user will place aircraft manually

  // Get simulation state
  const getSimulationState = useCallback(() => ({
    start: startPoint ? { lat: startPoint.lat, lon: startPoint.lng } : null,
    destination: destinationPoint ? { lat: destinationPoint.lat, lon: destinationPoint.lng } : null,
    fullRoute,
    stepCoordinates
  }), [startPoint, destinationPoint, fullRoute, stepCoordinates]);

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Aircraft (draggable start point) */}
        <AircraftMarker 
          position={startPoint}
          onDragEnd={handleAircraftDragEnd}
        />

        {/* Destination marker */}
        {destinationPoint && (
          <Marker
            key="destination-marker"
            position={destinationPoint}
            icon={DEST_ICON}
          />
        )}

        {/* Route polyline */}
        {fullRoute.length > 0 && (
          <Polyline
            positions={fullRoute.map(p => [p.lat, p.lon])}
            color="blue"
            weight={4}
            opacity={0.8}
          />
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
        <Typography variant="h6" gutterBottom>
          Flight Route Controls
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          <strong>Instructions:</strong><br />
          1. Click anywhere to place aircraft<br />
          2. Click again to set destination<br />
          3. Route generates automatically<br />
          4. Drag aircraft to adjust start point
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={useOSRM}
              onChange={(e) => setUseOSRM(e.target.checked)}
              size="small"
            />
          }
          label="Use OSRM Routing"
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Step Distance: {stepDistance}m
          </Typography>
          <Slider
            value={stepDistance}
            onChange={(e, newValue) => setStepDistance(newValue)}
            min={50}
            max={500}
            step={50}
            size="small"
          />
        </Box>

        {stepCoordinates.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Route: {fullRoute.length} points<br />
              Steps: {stepCoordinates.length} points
            </Typography>

            {/* Kafka Streaming Controls */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Kafka Streaming
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={kafkaProducer.startStreaming}
                  disabled={kafkaProducer.isStreaming || stepCoordinates.length === 0}
                  color="success"
                >
                  Start Stream
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={kafkaProducer.stopStreaming}
                  disabled={!kafkaProducer.isStreaming}
                  color="error"
                >
                  Stop Stream
                </Button>
              </Box>

              {kafkaProducer.isStreaming && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Streaming: Step {kafkaProducer.currentStep} / {kafkaProducer.totalSteps}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={kafkaProducer.streamingProgress}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="success.main">
                    Broadcasting to Kafka topic: flight-routes
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default FlightRouteMap;

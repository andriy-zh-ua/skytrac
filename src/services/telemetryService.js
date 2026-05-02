import AircraftMovementCalculator from './aircraftMovementCalculator.js';
import RouteCoordinateCalculator from './routeCoordinateCalculator.js';

// Service for sending telemetry data to the backend
class TelemetryService {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.activeProducers = new Map(); // Store active producers and their intervals
    this.aircraftStates = new Map(); // Store movement calculators for each aircraft
  }

  // Initialize aircraft movement state
  initializeAircraftMovement(producerId, aircraft) {
    if (/*!aircraft.routeDistance ||*/ !aircraft.stepCoordinates || aircraft.stepCoordinates.length < 2) {
      console.warn(`Aircraft ${producerId} has incomplete route data`);
      return null;
    }

    // Create movement calculator
    const movementCalculator = new AircraftMovementCalculator(
      aircraft.routeDistance,
      500, // max speed 500 km/h
      5000 // max altitude 5000 meters
    );

    // Create route coordinate calculator
    const routeCalculator = new RouteCoordinateCalculator(aircraft.stepCoordinates);

    // Store aircraft state
    this.aircraftStates.set(producerId, {
      movementCalculator,
      routeCalculator,
      aircraft,
      isActive: true
    });

    console.log(`Initialized movement for aircraft ${producerId}:`, {
      totalDistance: aircraft.routeDistance,
      segments: aircraft.stepCoordinates.length,
      totalTime: movementCalculator.totalTime
    });

    return this.aircraftStates.get(producerId);
  }

  // Start sending telemetry data for a specific producer
  startTelemetryTransmission(producerId, streamKeys, aircraft) {
    console.log(`Starting telemetry transmission for aircraft ${producerId} with stream keys ${streamKeys}`);
    
    // Initialize aircraft movement
    const aircraftState = this.initializeAircraftMovement(producerId, aircraft);
    if (!aircraftState) {
      console.error(`Failed to initialize movement for aircraft ${producerId}`);
      return;
    }
    
    // Send telemetry every 1 second
    const interval = setInterval(() => {
      this.sendTelemetryData(producerId, streamKeys, aircraft);
    }, 1000);

    // Store the interval so we can stop it later
    this.activeProducers.set(producerId, interval);

    // Send initial data immediately
    this.sendTelemetryData(producerId, streamKeys, aircraft);
  }

  // Stop sending telemetry data for a specific producer
  stopTelemetryTransmission(producerId) {
    const interval = this.activeProducers.get(producerId);
    if (interval) {
      clearInterval(interval);
      this.activeProducers.delete(producerId);
    }
    
    // Clean up aircraft state
    this.aircraftStates.delete(producerId);
    console.log(`Stopped telemetry transmission for aircraft ${producerId}`);
  }

  // Generate realistic telemetry data with dynamic movement
  generateTelemetryData(producerId, streamKeys, aircraft) {
    const now = new Date();
    const aircraftState = this.aircraftStates.get(producerId);
    
    if (!aircraftState || !aircraftState.isActive) {
      // Fallback to static data if movement not initialized
      return {
        aircraft_id: producerId,
        stream_keys: streamKeys,
        timestamp: now.toISOString(),
        data: {
          altitude: 0,
          speed: 0,
          location: aircraft.startPoint ? {
            lat: aircraft.startPoint.lat,
            lng: aircraft.startPoint.lng
          } : { lat: 0, lng: 0 },
          fuel_status: 'good',
          alerts: [],
          maintenance_required: false,
          progress_percentage: 0
        }
      };
    }

    // Update movement state
    const movementUpdate = aircraftState.movementCalculator.updatePosition(1); // 1 second delta
    
    // Get current coordinates based on position
    let currentLocation;
    if (movementUpdate.isCompleted) {
      // Aircraft has reached destination
      currentLocation = aircraftState.routeCalculator.getCoordinatesAtDistance(
        aircraftState.routeCalculator.getTotalDistance()
      );
    } else {
      currentLocation = aircraftState.routeCalculator.getCoordinatesAtDistance(
        movementUpdate.position
      );
    }

    // Round to nearest route segment
    const roundedLocation = aircraftState.routeCalculator.roundToNearestSegment(currentLocation);
    
    // Get current bearing
    const bearing = aircraftState.routeCalculator.getCurrentBearing(movementUpdate.position);
    
    // Generate realistic telemetry data
    const telemetryData = {
      aircraft_id: producerId,
      stream_keys: streamKeys,
      timestamp: now.toISOString(),
      data: {
        altitude: Math.round(movementUpdate.altitude),
        speed: Math.round(movementUpdate.speed),
        location: {
          lat: parseFloat(roundedLocation.lat.toFixed(6)),
          lng: parseFloat(roundedLocation.lon.toFixed(6))
        },
        bearing: Math.round(bearing),
        fuel_status: this.calculateFuelStatus(movementUpdate.progressPercentage),
        alerts: this.generateAlerts(movementUpdate.altitude, movementUpdate.speed),
        maintenance_required: Math.random() > 0.9,
        progress_percentage: Math.round(movementUpdate.progressPercentage),
        segment_index: roundedLocation.segmentIndex,
        time_elapsed: Math.round(movementUpdate.timeElapsed),
        is_completed: movementUpdate.isCompleted,
        distance_traveled: Math.round(movementUpdate.position),
        remaining_distance: Math.round(aircraftState.routeCalculator.getTotalDistance() - movementUpdate.position)
      }
    };

    // If journey is completed, mark as inactive
    if (movementUpdate.isCompleted) {
      aircraftState.isActive = false;
      console.log(`Aircraft ${producerId} has completed its journey`);
    }

    return telemetryData;
  }

  // Calculate fuel status based on progress
  calculateFuelStatus(progressPercentage) {
    if (progressPercentage < 30) return 'excellent';
    if (progressPercentage < 60) return 'good';
    if (progressPercentage < 80) return 'moderate';
    if (progressPercentage < 95) return 'low';
    return 'critical';
  }

  // Generate alerts based on flight conditions
  generateAlerts(altitude, speed) {
    const alerts = [];
    
    // Turbulence alert at high altitudes
    if (altitude > 4000 && Math.random() > 0.7) {
      alerts.push('turbulence');
    }
    
    // Speed alert if too fast or too slow
    if (speed > 450) {
      alerts.push('high_speed');
    } else if (speed < 100 && speed > 0) {
      alerts.push('low_speed');
    }
    
    // Weather alert
    if (Math.random() > 0.9) {
      alerts.push('weather_advisory');
    }
    
    return alerts;
  }

  // Send telemetry data to the backend
  async sendTelemetryData(producerId, streamKeys, aircraft) {
    try {
      const telemetryData = this.generateTelemetryData(producerId, streamKeys, aircraft);
      
      const response = await fetch(`${this.baseUrl}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telemetryData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Try to parse JSON response, but don't fail if it's empty
      let result;
      try {
        const text = await response.text();
        if (text) {
          result = JSON.parse(text);
        } else {
          result = { success: true };
        }
      } catch (jsonError) {
        console.warn(`Non-JSON response from backend:`, jsonError);
        result = { success: true };
      }
      
      console.log(`Telemetry sent successfully for aircraft ${producerId}:`, result);

    } catch (error) {
      console.error(`Failed to send telemetry from aircraft ${producerId}:`, error);
    }
  }
}

export default TelemetryService;

import AircraftMovementCalculator from './aircraftMovementCalculator';

export class TelemetryGenerator {
  constructor(id) {
    this.id = id;
    this.sequenceNumber = 1;
    this.movementCalculator = null;
  }

  calculateBearing(startLat, startLon, endLat, endLon) {
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
  }

  generate() {
    const now = new Date();

    const flightState = window.getFlightState ? window.getFlightState() : null;

    let currentPosition = null;
    let bearing = 0;

    if (flightState && flightState.stepCoordinates?.length > 0) {
      const totalDistance = flightState.routeDistance || 0;

      if (!this.movementCalculator || this.movementCalculator.totalDistance !== totalDistance) {
        this.movementCalculator = new AircraftMovementCalculator(totalDistance, 300, 5000);
      }

      const movement = this.movementCalculator.updatePosition(1);

      currentPosition = {
        latitude: flightState.stepCoordinates[0].lat,
        longitude: flightState.stepCoordinates[0].lon
      };

      bearing = 0;
    }

    return {
      aircraft_id: this.id,
      event_time: now.toISOString(),
      telemetry_id: `telemetry-${Date.now()}`,
      sequence_number: this.sequenceNumber++,
      state: {
        position: currentPosition,
        bearing
      }
    };
  }
}
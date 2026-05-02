// Enhanced Telemetry Service with Protocol Buffers support
// This shows how to integrate protobuf with your existing telemetry service

import TelemetryService from './telemetryService.js';

// Import generated protobuf types (when available)
// import { AircraftTelemetry, TelemetryData, Location } from '../../proto/generated/js/telemetry.js';

class TelemetryServiceProto extends TelemetryService {
  constructor(baseUrl = 'http://localhost:8080') {
    super(baseUrl);
    this.useProtobuf = false; // Toggle between JSON and protobuf
  }

  // Convert telemetry data to protobuf format
  convertToProtobuf(telemetryData) {
    // This would use the generated protobuf classes
    // For now, returning the same structure as an example
    
    /*
    const protobufData = AircraftTelemetry.create({
      aircraft_id: telemetryData.aircraft_id,
      stream_keys: telemetryData.stream_keys,
      timestamp: telemetryData.timestamp,
      data: TelemetryData.create({
        altitude: telemetryData.data.altitude,
        speed: telemetryData.data.speed,
        location: Location.create({
          lat: telemetryData.data.location.lat,
          lng: telemetryData.data.location.lng
        }),
        bearing: telemetryData.data.bearing,
        fuel_status: telemetryData.data.fuel_status,
        alerts: telemetryData.data.alerts,
        maintenance_required: telemetryData.data.maintenance_required,
        progress_percentage: telemetryData.data.progress_percentage,
        segment_index: telemetryData.data.segment_index,
        time_elapsed: telemetryData.data.time_elapsed,
        is_completed: telemetryData.data.is_completed,
        distance_traveled: telemetryData.data.distance_traveled,
        remaining_distance: telemetryData.data.remaining_distance,
        pressure: telemetryData.data.pressure || 0.0,
        humidity: telemetryData.data.humidity || 0,
        temperature: telemetryData.data.temperature || 25.5
      })
    });

    // Encode to binary
    return AircraftTelemetry.encode(protobufData).finish();
    */

    // Placeholder - return JSON for now
    return JSON.stringify(telemetryData);
  }

  // Override sendTelemetryData to support protobuf
  async sendTelemetryData(producerId, streamKeys, aircraft) {
    try {
      const telemetryData = this.generateTelemetryData(producerId, streamKeys, aircraft);
      
      let payload;
      let contentType;
      
      if (this.useProtobuf) {
        // Use protobuf binary format
        payload = this.convertToProtobuf(telemetryData);
        contentType = 'application/x-protobuf';
      } else {
        // Use JSON format (current behavior)
        payload = JSON.stringify(telemetryData);
        contentType = 'application/json';
      }
      
      const response = await fetch(`${this.baseUrl}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Telemetry sent from aircraft ${producerId}:`, result);

    } catch (error) {
      console.error(`Failed to send telemetry from aircraft ${producerId}:`, error);
    }
  }

  // Toggle between JSON and protobuf
  setUseProtobuf(useProtobuf) {
    this.useProtobuf = useProtobuf;
    console.log(`Telemetry service now using: ${useProtobuf ? 'Protocol Buffers' : 'JSON'}`);
  }
}

export default TelemetryServiceProto;

// Service for sending telemetry data to the backend
class TelemetryService {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.activeProducers = new Map(); // Store active producers and their intervals
  }

  // Start sending telemetry data for a specific producer
  startTelemetryTransmission(producerId, streamKeys, aircraft) {
    console.log(`Starting telemetry transmission for aircraft ${producerId} with stream keys ${streamKeys}`);
    
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
      console.log(`Stopped telemetry transmission for aircraft ${producerId}`);
    }
  }

  // Generate realistic telemetry data
  generateTelemetryData(producerId, streamKeys, aircraft) {
    const now = new Date();
    
    return {
      aircraft_id: producerId,
      stream_keys: streamKeys,
      timestamp: now.toISOString(),
      data: {
        // temperature: a,
        pressure: 0.0,
        humidity: 0,
        // altitude: x,
        // speed: y,
        // location: {
        //   lat: z,
        //   lng: w
        // },
        // fuel_status: v,
        alerts: Math.random() > 0.8 ? ['turbulence'] : [],
        maintenance_required: Math.random() > 0.9
      }
    };
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

      const result = await response.json();
      console.log(`Telemetry sent from aircraft ${producerId}:`, result);

    } catch (error) {
      console.error(`Failed to send telemetry from aircraft ${producerId}:`, error);
    }
  }
}

export default TelemetryService;

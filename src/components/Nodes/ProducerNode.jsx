import { Handle, Position } from '@xyflow/react';
import { useState, useEffect, useRef } from 'react';

import AircraftMovementCalculator from '../../services/aircraftMovementCalculator';

// Node to represent a Kafka producer
const ProducerNode = props => {
  // const { id, hasConnections, activateProducer, deactivateProducer, selectNode } = props;
  const [isActive, setIsActive] = useState(props.data?.active || false);
  const sequenceNumberRef = useRef(1);
  const movementCalculatorRef = useRef(null); // Reference to movement calculator
  const { id } = props;

  const {
    hasConnections,
    activateProducer,
    deactivateProducer,
    selectNode
  } = props.data || {};

  // // Calculate bearing between two points
  // const calculateBearing = (startLat, startLon, endLat, endLon) => {
  //   const startLatRad = (startLat * Math.PI) / 180;
  //   const startLonRad = (startLon * Math.PI) / 180;
  //   const endLatRad = (endLat * Math.PI) / 180;
  //   const endLonRad = (endLon * Math.PI) / 180;

  //   const dLon = endLonRad - startLonRad;

  //   const y = Math.sin(dLon) * Math.cos(endLatRad);
  //   const x = Math.cos(startLatRad) * Math.sin(endLatRad) - 
  //             Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLon);

  //   const bearing = Math.atan2(y, x) * (180 / Math.PI);
  //   return (bearing + 360) % 360;
  // };

  // // Generate telemetry data using real flight route coordinates
  // const generateTelemetryData = () => {
  //   const now = new Date();

  //   let currentPosition = null;
  //   let nextPosition = null;
  //   let totalDistance = 0;
  //   let remainingDistance = 0;
  //   let progressPercentage = 0;
  //   let bearing = 0;
  //   let segmentIndex = 0;
  //   let currentSpeed = 0;
  //   let currentAltitude = 0;
  //   let timeElapsed = 0;
  //   let isCompleted = false;

  //   // Get flight route data from global state
  //   const flightState = window.getFlightState ? window.getFlightState() : null;

  //   if (flightState && flightState.stepCoordinates && flightState.stepCoordinates.length > 0) {
  //     // Use pre-calculated route distance from flight state
  //     totalDistance = flightState.routeDistance || 0;
      
  //     // Initialize movement calculator if not exists or distance changed
  //     if (!movementCalculatorRef.current || movementCalculatorRef.current.totalDistance !== totalDistance) {
  //       movementCalculatorRef.current = new AircraftMovementCalculator(totalDistance, 300, 5000);
  //     }

  //     // Update position using movement calculator
  //     const movementState = movementCalculatorRef.current.updatePosition(1); // 1 second interval
      
  //     currentSpeed = movementState.speed;
  //     currentAltitude = movementState.altitude;
  //     timeElapsed = movementState.timeElapsed;
  //     isCompleted = movementState.isCompleted;
      
  //     // Reset if completed the route
  //     if (isCompleted) {
  //       movementCalculatorRef.current = new AircraftMovementCalculator(totalDistance, 300, 5000);
  //     }

  //     const currentProgress = movementState.position;

  //     // Find current position along route using step coordinates
  //     let accumulatedDistance = 0;
  //     for (let i = 1; i < flightState.stepCoordinates.length; i++) {
  //       // Use 50m step distance (constant)
  //       const segmentDistance = 50;

  //       if (accumulatedDistance + segmentDistance >= currentProgress) {
  //         // Current position is in this segment
  //         const progressInSegment = currentProgress - accumulatedDistance;
  //         const segmentRatio = progressInSegment / segmentDistance;
          
  //         currentPosition = {
  //           latitude: flightState.stepCoordinates[i - 1].lat + 
  //                     (flightState.stepCoordinates[i].lat - flightState.stepCoordinates[i - 1].lat) * segmentRatio,
  //           longitude: flightState.stepCoordinates[i - 1].lon + 
  //                     (flightState.stepCoordinates[i].lon - flightState.stepCoordinates[i - 1].lon) * segmentRatio
  //         };
          
  //         // Next position for bearing calculation
  //         if (i < flightState.stepCoordinates.length - 1) {
  //           nextPosition = flightState.stepCoordinates[i + 1];
  //         } else {
  //           nextPosition = flightState.stepCoordinates[i];
  //         }
          
  //         segmentIndex = i - 1;
  //         break;
  //       }
        
  //       accumulatedDistance += segmentDistance;
  //     }

  //     // Calculate bearing
  //     if (currentPosition && nextPosition) {
  //       bearing = calculateBearing(
  //         currentPosition.latitude,
  //         currentPosition.longitude,
  //         nextPosition.lat,
  //         nextPosition.lon
  //       );
  //     }

  //     // Calculate remaining distance and progress
  //     remainingDistance = totalDistance - currentProgress;
  //     progressPercentage = (currentProgress / totalDistance) * 100;
  //   } else {
  //     // Fallback to default position if no route data available
  //     currentPosition = {
  //       latitude: 45.3225, // Ottawa Airport
  //       longitude: -75.6672
  //     };
  //     bearing = 0;
  //     totalDistance = 0;
  //     remainingDistance = 0;
  //     progressPercentage = 0;
  //     segmentIndex = 0;
  //     currentSpeed = 0;
  //     currentAltitude = 0;
  //     timeElapsed = 0;
  //     isCompleted = false;
  //   }

  //   const telemetryData = {
  //     aircraft_id: id,
  //     stream_keys: [`partition-${Date.now()}`, `partition-${Date.now() + 1000}`],
  //     event_time: now.toISOString(),
  //     telemetry_id: `telemetry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  //     sequence_number: sequenceNumberRef.current++,
  //     state: {
  //       altitude: Math.round(currentAltitude * 3.28084), // Convert meters to feet
  //       speed: Math.round(currentSpeed), // Already in km/h from movement calculator
  //       position: currentPosition,
  //       bearing: Math.round(bearing),
  //       fuel_status: "FUEL_STATUS_NORMAL",
  //       aircraft_state: progressPercentage >= 95 ? "AIRCRAFT_STATE_DESCENDING" : 
  //                      progressPercentage <= 5 ? "AIRCRAFT_STATE_ASCENDING" : "AIRCRAFT_STATE_CRUISING",
  //       maintenance_required: false,
  //       progress_percentage: Math.floor(progressPercentage),
  //       segment_index: segmentIndex,
  //       time_elapsed: Math.floor(timeElapsed),
  //       flight_completed: isCompleted,
  //       distance_traveled: Math.round(movementCalculatorRef.current?.position || 0),
  //       remaining_distance: Math.round(remainingDistance),
  //       environment_data: {
  //         pressure: Math.round(1013.25 - (currentAltitude * 0.0115) + (Math.random() - 0.5) * 2), // Pressure at altitude
  //         humidity: Math.round(20 + Math.random() * 15), // Lower humidity at altitude
  //         temperature: Math.round(15 - (currentAltitude / 1000) * 6.5 + (Math.random() - 0.5) * 2) // Temperature at altitude
  //       }
  //     }
  //   };

  //   return telemetryData;
  // };

  // Send telemetry data to entrypoint service
  // const sendTelemetryData = async () => {
  //   try {
  //     const telemetryData = generateTelemetryData();
  //     console.log(`📡 Attempting to send telemetry from ${id}, sequence: ${telemetryData.sequence_number}`);
      
  //     const response = await fetch('http://localhost:8080/telemetry', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(telemetryData)
  //     });

  //     if (!response.ok) {
  //       console.error(`❌ Failed to send telemetry from ${id}:`, response.statusText);
  //     } else {
  //       console.log(`✅ Telemetry sent from ${id}, sequence: ${telemetryData.sequence_number}`);
  //     }
  //   } catch (error) {
  //     console.error(`❌ Error sending telemetry from ${id}:`, error);
  //     console.log(`⚠️  Backend service on localhost:8080 is not running. Start it with: cd services/entrypoint && go run service.go`);
  //   }
  // };

  const handleActivate = () => {
    if (hasConnections && activateProducer) {
      console.log(`🚀 Activating producer ${id} and starting telemetry`);
      // First activate the producer, then select it
      activateProducer(id);
      // selectNode(id);
      setIsActive(true);
    }
  };

  const handleDeactivate = () => {
    if (hasConnections && deactivateProducer) {
      console.log(`🛑 Deactivating producer ${id} and stopping telemetry`);
      // First deactivate the producer, then select it
      deactivateProducer(id);
      // selectNode(id);
      setIsActive(false);
      
      // Reset movement calculator for next activation
      movementCalculatorRef.current = null;
    }
  };

  // // Control telemetry sending based on isActive
  // useEffect(() => {
  //   console.log(`..........................................isActive: ${isActive}`);
  //   if (!isActive) return;

  //   console.log(`🚀 Started telemetry transmission for ${id}`);

  //   // Send immediately
  //   sendTelemetryData();

  //   const interval = setInterval(() => {
  //     sendTelemetryData();
  //   }, 1000);

  //   return () => {
  //     clearInterval(interval);
  //     console.log(`🛑 Stopped telemetry transmission for ${id}`);
  //   };
  // }, [isActive]);

  // // Sync the component's local state with props that can change from outside the component
  // useEffect(() => {
  //   setIsActive(props.data?.active || false);
  // }, [props.data?.active]);
  useEffect(() => {
    if (props.data?.active !== isActive) {
      setIsActive(props.data?.active || false);
    }
  }, [props.data?.active]);

  console.log('nodeTypes ref changed');
  return (
    <div
      onClick={() => selectNode && selectNode(id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        minWidth: '80px',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Aircraft SVG icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill={isActive ? "#4caf50" : props.selected ? "#ef5350" : "#757575"}
        style={{ marginBottom: '4px', transform: 'rotate(90deg)' }}
      >
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
      {/* Output handle positioned at the fuselage of the plane */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: '31px', right: '12px' }}
      />
      <span style={{ fontSize: '8px', marginTop: '4px' }}>{id}</span>
      
      {/* Activate/Deactivate button - only show if has connections */}
      {hasConnections && (
        <button
          onClick={isActive ? handleDeactivate : handleActivate}
          style={{
            fontSize: '8px',
            padding: '2px 6px',
            marginTop: '4px',
            backgroundColor: isActive ? '#4caf50' : '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      )}
    </div>
  );
};

export default ProducerNode;

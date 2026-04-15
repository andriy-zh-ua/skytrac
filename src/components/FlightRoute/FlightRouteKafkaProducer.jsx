import { useState, useEffect, useCallback } from 'react';

const FlightRouteKafkaProducer = ({ routeData, kafkaIntegration }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingInterval, setStreamingInterval] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  
  // Start streaming flight position data to Kafka
  const startStreaming = useCallback(() => {
    if (!routeData || !routeData.stepCoordinates || routeData.stepCoordinates.length === 0) {
      console.warn('No route data available for streaming');
      return;
    }

    setIsStreaming(true);
    setCurrentStep(0);

    // Send initial route metadata
    const routeMetadata = {
      type: 'route_metadata',
      timestamp: new Date().toISOString(),
      routeId: `route-${Date.now()}`,
      start: routeData.start,
      destination: routeData.destination,
      totalSteps: routeData.stepCoordinates.length,
      stepDistance: 200 // meters
    };

    // Send to Kafka (simulated through console for now)
    console.log('Kafka Producer - Route Metadata:', routeMetadata);
    
    // In a real implementation, you would use kafkaIntegration to send messages
    // For now, we'll simulate the streaming with console output
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        
        if (nextStep >= routeData.stepCoordinates.length) {
          // Route completed
          stopStreaming();
          return prev;
        }

        const position = routeData.stepCoordinates[nextStep];
        const flightData = {
          type: 'flight_position',
          timestamp: new Date().toISOString(),
          routeId: routeMetadata.routeId,
          step: nextStep,
          position: {
            lat: position.lat,
            lon: position.lon
          },
          altitude: 10000, // meters (simulated)
          speed: 250, // knots (simulated)
          heading: calculateHeading(routeData.stepCoordinates[nextStep - 1], position)
        };

        // Send position data to Kafka
        console.log(`Kafka Producer - Flight Position Step ${nextStep}:`, flightData);
        
        // In real implementation:
        // kafkaIntegration.producer.send({
        //   topic: FLIGHT_TOPIC,
        //   messages: [{
        //     key: routeMetadata.routeId,
        //     value: JSON.stringify(flightData),
        //     timestamp: Date.now()
        //   }]
        // });

        return nextStep;
      });
    }, 1000); // Send position every second

    setStreamingInterval(interval);
  }, [routeData, kafkaIntegration]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamingInterval) {
      clearInterval(streamingInterval);
      setStreamingInterval(null);
    }
    setIsStreaming(false);
    
    const completionMessage = {
      type: 'route_completed',
      timestamp: new Date().toISOString(),
      finalStep: currentStep
    };
    
    console.log('Kafka Producer - Route Completed:', completionMessage);
  }, [streamingInterval, currentStep]);

  // Calculate heading between two points
  const calculateHeading = (point1, point2) => {
    if (!point1 || !point2) return 0;
    
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLon = (point2.lon - point1.lon) * Math.PI / 180;
    
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    
    const heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingInterval) {
        clearInterval(streamingInterval);
      }
    };
  }, [streamingInterval, stopStreaming]);

  return {
    isStreaming,
    currentStep,
    totalSteps: routeData?.stepCoordinates?.length || 0,
    startStreaming,
    stopStreaming,
    streamingProgress: routeData?.stepCoordinates?.length > 0 
      ? (currentStep / routeData.stepCoordinates.length) * 100 
      : 0
  };
};

export default FlightRouteKafkaProducer;

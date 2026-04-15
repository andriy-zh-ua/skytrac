import { useState, useCallback, useEffect } from 'react';

import { Box } from '@mui/material';
import { ReactFlowProvider } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

// Custom node components
import { KafkaCanvas } from './components/KafkaCanvas/KafkaCanvas.jsx';
import CustomAppBar from './components/AppBar.jsx';
import FlightRouteMap from './components/FlightRoute';

// Import Kafka Canvas Integration
import { KafkaCanvasIntegration } from './kafka-designer/CanvasIntegration.js';

// Import animation configuration
import { ANIMATION_CONFIG } from './config/animationConfig.js';

const App = () => {
  
  // Kafka Canvas Integration
  const [kafkaIntegration] = useState(() => new KafkaCanvasIntegration());

  // React Flow state hooks - initialize empty, let KafkaIntegration manage
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Track current selected objects
  const [currentObjects, setCurrentObjects] = useState({
    producer: null,
    topic: null,
    consumer: null,
    broker: null,
    partition: null,
  });

  // Animation speed from config (in milliseconds)
  const animationSpeed = ANIMATION_CONFIG.producerEdgeAnimationSpeed;

  // Set CSS custom property for animation speed
  useEffect(() => {
    document.documentElement.style.setProperty('--producer-animation-speed', `${animationSpeed}ms`);
  }, [animationSpeed]);

  // Handle flight route updates
  const handleRouteUpdate = useCallback((routeData) => {
    console.log('Flight route updated:', routeData);
  }, []);

  // Handle producer activation - start flight route streaming
  const handleProducerActivate = useCallback((producerId) => {
    // Find the producer node and start streaming if route data exists
    const producerNode = nodes.find(node => node.id === producerId);
    if (producerNode && window.getFlightState) {
      const flightState = window.getFlightState();
      if (flightState && flightState.stepCoordinates && flightState.stepCoordinates.length > 0) {
        // Start streaming the flight route
        console.log('Starting flight route streaming for producer:', producerId);
        // The streaming will be handled by the FlightRouteKafkaProducer hook
      }
    }
  }, [nodes]);

  // Handle producer deactivation - stop flight route streaming
  const handleProducerDeactivate = useCallback((producerId) => {
    console.log('Stopping flight route streaming for producer:', producerId);
    // The streaming stop will be handled by the FlightRouteKafkaProducer hook
  }, []);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params) => {
      // Add the new edge
      const newEdges = addEdge({
        ...params,
        style: { 
          stroke: '#b1b1b7',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#b1b1b7',
        }
      }, edges);
      
      // Automatically select the producer if this is a producer connection
      const producerNode = nodes.find(node => node.id === params.source && node.type === 'producer');
      if (producerNode && !producerNode.selected) {
        // Update nodes to select the producer and deselect others
        setNodes((nds) => nds.map(node => 
          node.id === params.source 
            ? { ...node, selected: true }
            : { ...node, selected: false } // Deselect all others
        ));
      }
      
      setEdges(newEdges);
    },
    [setEdges, setNodes, nodes, edges]
  );

  // Update edge styles based on producer state
  const updateEdgeStyles = useCallback((producerId, isActive) => {
    setEdges((eds) => eds.map(edge => {
      if (edge.source === producerId) {
        return {
          ...edge,
          style: isActive ? {
            stroke: '#4caf50',
            strokeWidth: 3,
          } : {
            stroke: '#b1b1b7',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: isActive ? '#4caf50' : '#b1b1b7',
          },
          className: isActive ? 'running-producer' : undefined
        };
      }
      return edge;
    }));
  }, [setEdges]);

  // Selection function - select one node, deselect others, and track current objects
  const selectNode = (nodeId, preserveBroker = false) => {
    setNodes((nds) => {
      const clickedNode = nds.find(n => n.id === nodeId);
      if (!clickedNode) {
        console.warn('Node not found in canvas');
        return nds;
      }
      
      // Clear other category selections when selecting a different type
      const newCurrentObjects = {
        producer: null,
        topic: null,
        consumer: null,
        broker: null,
        partition: null,
        [clickedNode.type]: nodeId
      };
      
      // Auto-select parent broker when selecting a topic
      let parentBrokerId = null;
      let parentTopicId = null;
      
      if (clickedNode.type === 'topic' && clickedNode.parentId) {
        parentBrokerId = clickedNode.parentId;
        newCurrentObjects.broker = parentBrokerId;
      }
      // Auto-select parent topic and broker when selecting a partition
      else if (clickedNode.type === 'partition' && clickedNode.parentId) {
        parentTopicId = clickedNode.parentId;
        newCurrentObjects.topic = parentTopicId;
        
        // Find the parent topic node to get its broker
        const parentTopicNode = nds.find(n => n.id === parentTopicId);
        if (parentTopicNode && parentTopicNode.parentId) {
          parentBrokerId = parentTopicNode.parentId;
          newCurrentObjects.broker = parentBrokerId;
        }
      }
      // Preserve broker selection if explicitly requested and not selecting a broker
      else if (preserveBroker && clickedNode.type !== 'broker' && currentObjects.broker) {
        newCurrentObjects.broker = currentObjects.broker;
      }
      
    setCurrentObjects(newCurrentObjects);
      
      return nds.map((node) =>
        node.id === nodeId || 
        node.id === parentBrokerId ||
        node.id === parentTopicId ||
        (preserveBroker && node.id === currentObjects.broker)
          ? { ...node, selected: true }
          : { ...node, selected: false }
      );
    });
  };

  // Handle aircraft selection from FlightRouteMap
  const handleAircraftSelect = useCallback((producerId) => {
    selectNode(producerId);
  }, [selectNode]);

  const clearSelection = () => {
    // Clear all node selections
    setNodes((nds) => 
      nds.map((node) => ({ ...node, selected: false }))
    );
    
    // Clear current objects
    setCurrentObjects({
      producer: null,
      topic: null,
      consumer: null,
      broker: null,
      partition: null
    });
  };

  const handleDuplicateTopic = (topicId) => {
    // Find the topic node to get its position
    const topicNode = nodes.find(n => n.id === topicId);
    if (!topicNode) {
      console.error('Topic not found for duplication');
      return;
    }

    // Calculate position for the duplicated topic (diagonal bottom-right offset)
    // Since duplicated topic is standalone, we need absolute canvas position
    const offset = 20; // Moderate offset for clear separation
    
    // Get the original topic node
    const originalTopicNode = nodes.find(n => n.id === topicId);
    
    // Calculate absolute position of the original topic
    let absoluteTopicPosition;
    if (originalTopicNode.parentId) {
      // Topic is attached to a broker - find broker position
      const brokerNode = nodes.find(n => n.id === originalTopicNode.parentId);
      if (brokerNode) {
        absoluteTopicPosition = {
          x: brokerNode.position.x + originalTopicNode.position.x,
          y: brokerNode.position.y + originalTopicNode.position.y
        };
      } else {
        // Fallback if broker not found
        absoluteTopicPosition = originalTopicNode.position;
      }
    } else {
      // Topic is already standalone - use its position directly
      absoluteTopicPosition = originalTopicNode.position;
    }
    
    // Calculate position for duplicate with offset
    const newPosition = {
      x: absoluteTopicPosition.x + offset,
      y: absoluteTopicPosition.y + offset
    };

    // Create duplicate topic configuration
    const duplicateConfig = {
      name: `${topicId}-duplicate-${Date.now()}`,
      // Copy other properties from original topic if needed
      replicationFactor: topicNode.data?.replicationFactor || 1,
      partitions: topicNode.data?.partitions || []
    };

    // Use Kafka Integration to create standalone topic
    const kafkaResult = kafkaIntegration.handleAddStandaloneTopic(newPosition, duplicateConfig);
    
    // Update React Flow nodes and edges
    setNodes(kafkaResult.nodes);
    setEdges(kafkaResult.edges);
    
    // Select the newly created duplicated topic
    const newTopicId = kafkaResult.topic.name;
    selectNode(newTopicId);
  };

// Calculate position for new broker - offset to the right from the last broker
const calculateBrokerPosition = (nodes) => {
  const brokerNodes = nodes.filter(n => n.type === 'broker');
  const lastBrokerX = Math.max(...brokerNodes.map(n => n.position.x), 0);
  return { x: lastBrokerX + 350, y: 100 }; // 350px offset to account for 300px width + 50px gap
};

// Calculate position for new topic - vertical offset from the last topic in the same broker
const calculateTopicPosition = (nodes, brokerId) => {
  const brokerTopics = nodes.filter(n => n.type === 'topic' && n.parentId === brokerId);
  const topicCount = brokerTopics.length;
  const baseY = 20; // Start 20px from top edge of broker
  const verticalSpacing = 230; // 200px height + 30px gap
  return { 
    x: 10, 
    y: baseY + (topicCount * verticalSpacing) 
  }; // Center horizontally: (300px broker - 280px topic) / 2 = 10px
};

const calculatePartitionPosition = (nodes, topicId) => {
  const topicPartitions = nodes.filter(n => n.type === 'partition' && n.parentId === topicId);
  const partitionCount = topicPartitions.length;
  const baseX = 20; // Start 20px from left edge of topic
  const baseY = 20; // Start 20px from top (account for label)
  const verticalSpacing = 70; // 70px vertical spacing between partitions
  
  return { 
    x: baseX, 
    y: baseY + (partitionCount * verticalSpacing)
  };
};

// Calculate position for new producer - place on the left side of the canvas
const calculateProducerPosition = (nodes) => {
  const producerNodes = nodes.filter(n => n.type === 'producer');
  const producerCount = producerNodes.length;
  const baseX = 50; // Start 50px from left edge
  const baseY = 100; // Start 100px from top
  const verticalSpacing = 150; // 150px vertical spacing between producers
  
  return { 
    x: baseX, 
    y: baseY + (producerCount * verticalSpacing)
  };
};

// Calculate position for new consumer - place on the right side of the canvas
const calculateConsumerPosition = (nodes) => {
  const consumerNodes = nodes.filter(n => n.type === 'consumer');
  const consumerCount = consumerNodes.length;
  const baseX = 1200; // Start 1200px from left edge (right side)
  const baseY = 100; // Start 100px from top
  const verticalSpacing = 150; // 150px vertical spacing between consumers
  
  return { 
    x: baseX, 
    y: baseY + (consumerCount * verticalSpacing)
  };
};

// Add a new node of the specified type
  const addNode = (type) => {
    // Use Kafka Integration for business logic
    let kafkaResult = null;
    if (type === 'broker') {
      // Calculate position for new broker using standalone function
      const position = calculateBrokerPosition(nodes);
      
      // Add broker to Kafka Integration
      kafkaResult = kafkaIntegration.handleAddBroker(position);

      // Update React Flow nodes and edges from KafkaIntegration
      setNodes(kafkaResult.nodes);
      setEdges(kafkaResult.edges);
      
      // Select the newly added broker
      const newBrokerId = kafkaResult.broker.id;
      selectNode(newBrokerId);

    } else if (type === 'topic') {
      // Check if a broker is selected
      if (!currentObjects.broker) {
        alert('Please select a broker first to assign the topic to');
        return;
      }
      
      // Calculate position for new topic using standalone function
      const position = calculateTopicPosition(nodes, currentObjects.broker);
      
      // Add topic to Kafka Integration
      kafkaResult = kafkaIntegration.handleAddTopic(position, {
        name: `topic-${Date.now()}`,
        brokerId: currentObjects.broker
      });

      // Update React Flow nodes and edges from KafkaIntegration
      setNodes(kafkaResult.nodes);
      setEdges(kafkaResult.edges);
      
      // Select the newly added topic but keep broker selected
      const newTopicId = kafkaResult.topic.name;
      selectNode(newTopicId, true); // preserveBroker = true

    } else if (type === 'partition') {
      // Check if a topic is selected
      if (!currentObjects.topic) {
        alert('Please select a topic first to add partitions to');
        return;
      }
      
      // Calculate position for new partition within the selected topic
      const position = calculatePartitionPosition(nodes, currentObjects.topic);
      
      // Add partition to Kafka Integration
      kafkaResult = kafkaIntegration.handleAddPartition(position, {
        id: `partition-${Date.now()}`,
        topicId: currentObjects.topic,
        brokerId: currentObjects.broker
      });
      
      // Update React Flow nodes and edges from KafkaIntegration
      setNodes(kafkaResult.nodes);
      setEdges(kafkaResult.edges);
      
      // Select the newly added partition
      const newPartitionId = kafkaResult.partition.id;
      selectNode(newPartitionId);

    } else if (type === 'producer') {
      // Calculate position for new producer
      const position = calculateProducerPosition(nodes);
      
      // Add producer to Kafka Integration
      kafkaResult = kafkaIntegration.handleAddProducer(position, {
        id: `producer-${Date.now()}`,
        clientId: `producer-client-${Date.now()}`
      });
      
      // Update React Flow nodes and edges from KafkaIntegration
      setNodes(kafkaResult.nodes);
      
      // Preserve existing manual edges while adding new ones from KafkaIntegration
      setEdges((currentEdges) => {
        const existingEdgeIds = new Set(currentEdges.map(e => `${e.source}-${e.target}`));
        const newEdges = kafkaResult.edges.filter(e => 
          !existingEdgeIds.has(`${e.source}-${e.target}`)
        );
        return [...currentEdges, ...newEdges];
      });
      
      // Select the newly added producer
      const newProducerId = kafkaResult.producer.id;
      selectNode(newProducerId);

    } else if (type === 'consumer') {
      // Calculate position for new consumer
      const position = calculateConsumerPosition(nodes);
      
      // Add consumer to Kafka Integration
      kafkaResult = kafkaIntegration.handleAddConsumer(position, {
        id: `consumer-${Date.now()}`,
        groupId: `group-${Date.now()}`,
        clientId: `consumer-client-${Date.now()}`
      });
      
      // Update React Flow nodes and edges from KafkaIntegration
      setNodes(kafkaResult.nodes);
      // Preserve existing manual edges while adding new ones from KafkaIntegration
      setEdges((currentEdges) => {
        const existingEdgeIds = new Set(currentEdges.map(e => `${e.source}-${e.target}`));
        const newEdges = kafkaResult.edges.filter(e => 
          !existingEdgeIds.has(`${e.source}-${e.target}`)
        );
        return [...currentEdges, ...newEdges];
      });
      
      // Select the newly added consumer
      const newConsumerId = kafkaResult.consumer.id;
      selectNode(newConsumerId);
    }
  };

  // Export schema as JSON to console
  const exportSchema = () => {
    try {
      const schema = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          selected: n.selected,
          parentId: n.parentId,
          extent: n.extent
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
        })),
        cluster: kafkaIntegration.cluster.toJSON()
      };
      console.log('Kafka Schema:', JSON.stringify(schema, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}`);
      console.error('Schema export error:', error);
    }
  };

  return (
    <ReactFlowProvider>
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomAppBar 
          onAddNode={addNode}
          hasBrokers={nodes.filter(node => node.type === 'broker').length > 0}
          onExportSchema={exportSchema}
        />
        
        {/* Split-screen layout */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'row',
          overflow: 'hidden'
        }}>
          {/* Flight Route Map - Left Side */}
          <Box sx={{ 
            width: '50%', 
            height: '100%', 
            borderRight: '1px solid #ddd',
            position: 'relative'
          }}>
            <FlightRouteMap 
              onRouteUpdate={handleRouteUpdate}
              initialCenter={[45.4215, -75.6972]} // Ottawa/Gatineau area
              kafkaIntegration={kafkaIntegration}
              producers={nodes.filter(node => node.type === 'producer')}
              selectedProducerId={currentObjects.producer}
              onProducerActivate={handleProducerActivate}
              onProducerDeactivate={handleProducerDeactivate}
              onAircraftSelect={handleAircraftSelect}
            />
          </Box>
          
          {/* Kafka Canvas - Right Side */}
          <Box sx={{ 
            width: '50%', 
            height: '100%'
          }}>
            <KafkaCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              selectNode={selectNode}
              clearSelection={clearSelection}
              onDuplicateTopic={handleDuplicateTopic}
              currentObjects={currentObjects}
              kafkaIntegration={kafkaIntegration}
              updateEdgeStyles={updateEdgeStyles}
              onProducerActivate={handleProducerActivate}
              onProducerDeactivate={handleProducerDeactivate}
            />
          </Box>
        </Box>
      </Box>
    </ReactFlowProvider>
  );
};

export default App;

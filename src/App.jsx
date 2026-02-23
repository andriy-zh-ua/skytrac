import { useState, useCallback } from 'react';

import { Box } from '@mui/material';

import '@xyflow/react/dist/style.css';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

// Custom node components
import { KafkaCanvas } from './components/KafkaCanvas/KafkaCanvas.jsx';
import CustomAppBar from './components/AppBar.jsx';

// Import Kafka Canvas Integration
import { KafkaCanvasIntegration } from './kafka-designer/CanvasIntegration.js';

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

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Selection function - select one node, deselect others, and track current objects
  const selectNode = (nodeId) => {
    setNodes((nds) => {
      const clickedNode = nds.find(n => n.id === nodeId);
      if (!clickedNode) {
        console.warn('Node not found in canvas');
        return nds;
      }
      
      // Update current objects for this category
      setCurrentObjects(prev => ({
        ...prev,
        [clickedNode.type]: nodeId
      }));
      
      return nds.map((node) =>
        node.id === nodeId
          ? { ...node, selected: true }
          : { ...node, selected: false }
      );
    });
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
      
      // Select the newly added topic
      const newTopicId = kafkaResult.topic.name;
      selectNode(newTopicId);

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
      // const position = { x: 100, y: 100 };
      // kafkaResult = kafkaIntegration.handleAddProducer(position, {
      //   id: `producer-${Date.now()}`,
      //   clientId: `producer-client-${Date.now()}`
      // });
      // setNodes(kafkaResult.nodes);
      // setEdges(kafkaResult.edges);
    } else if (type === 'consumer') {
      // const position = { x: 100, y: 100 };
      // kafkaResult = kafkaIntegration.handleAddConsumer(position, {
      //   id: `consumer-${Date.now()}`,
      //   groupId: `group-${Date.now()}`,
      //   clientId: `consumer-client-${Date.now()}`
      // });
      // setNodes(kafkaResult.nodes);
      // setEdges(kafkaResult.edges);
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
      // alert('Schema exported to console! Press F12 to view.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}`);
      console.error('Schema export error:', error);
    }
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomAppBar 
        onAddNode={addNode}
        hasBrokers={nodes.filter(node => node.type === 'broker').length > 0}
        onExportSchema={exportSchema}
      />
      {/* React Flow Canvas */}
      <KafkaCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        selectNode={selectNode}
        currentObjects={currentObjects}
      />
    </Box>
  );
};

export default App;

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  NodeChange,
  applyNodeChanges,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box } from '@mui/material';

// Import Kafka Canvas Integration
import { KafkaCanvasIntegration } from './kafka-designer/CanvasIntegration.js';

// Custom node components
import ProducerNode from './components/ProducerNode';
import TopicNode from './components/TopicNode';
import ConsumerNode from './components/ConsumerNode';
import BrokerNode from './components/BrokerNode';
import PartitionNode from './components/PartitionNode';
import CustomAppBar from './components/AppBar';

// Configuration
import { animationConfig } from './config/animation';

// Initial empty canvas
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const App = () => {
  // Kafka Canvas Integration
  const [kafkaIntegration] = useState(() => new KafkaCanvasIntegration());
  const [kafkaStats, setKafkaStats] = useState(kafkaIntegration.cluster.getClusterStats());

  // React Flow state hooks
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);

  // Custom onNodesChange that handles broker-partition movement
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        let updatedNodes = applyNodeChanges(changes, nds);
        
        // Check if any broker was moved
        const brokerChanges = changes.filter((change: NodeChange) => 
          change.type === 'position' && 
          nds.find((n: Node) => n.id === change.id && n.type === 'broker')
        );
        
        if (brokerChanges.length > 0) {
          // Move associated partitions and topics with their brokers
          updatedNodes = updatedNodes.map((node: Node) => {
            if (node.type === 'partition' || node.type === 'topic') {
              // Find the broker this node belongs to
              const broker = nds.find((n: Node) => n.id === node.data.brokerId && n.type === 'broker');
              if (broker) {
                // Find the corresponding updated broker
                const updatedBroker = updatedNodes.find((n: Node) => n.id === broker.id && n.type === 'broker');
                if (updatedBroker) {
                  // Calculate the position difference
                  const deltaX = updatedBroker.position.x - broker.position.x;
                  const deltaY = updatedBroker.position.y - broker.position.y;
                  
                  // Move the node by the same amount, maintaining centered position
                  return {
                    ...node,
                    position: {
                      x: node.position.x + deltaX,
                      y: node.position.y + deltaY
                    }
                  };
                }
              }
            }
            return node;
          });
        }
        
        return updatedNodes;
      });
    },
    []
  );
  const [counters, setCounters] = useState({
    producer: 0,
    topic: 0,
    consumer: 0,
    broker: 0,
    partition: 0,
  });
  
  // Track current selected object for each category
  const [currentObjects, setCurrentObjects] = useState<Record<string, string | null>>({
    producer: null,
    topic: null,
    consumer: null,
    broker: null,
    partition: null,
  });

  // Handle new connections between nodes
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle connection start - select the producer when starting to connect
  const onConnectStart = useCallback(
    (event: any, params: any) => {
      if (params.nodeId && params.handleType === 'source') {
        const node = nodes.find(n => n.id === params.nodeId);
        if (node?.type === 'producer') {
          // Select the producer when starting to connect
          setNodes((nds) => 
            nds.map((n) => ({
              ...n,
              selected: n.id === params.nodeId
            }))
          );
          
          // Update current objects
          setCurrentObjects(prev => ({ ...prev, producer: params.nodeId }));
        }
      }
    },
    [setNodes, nodes, setCurrentObjects]
  );

  
  // Handle node deletion - remove associated partitions when broker is deleted
  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      setNodes((nds) => {
        let updatedNodes = nds;
        
        // Check if any brokers are being deleted
        const deletedBrokers = nodesToDelete.filter(node => node.type === 'broker');
        
        if (deletedBrokers.length > 0) {
          // Find all partitions associated with deleted brokers
          const partitionsToRemove = nds.filter(node => 
            node.type === 'partition' && 
            deletedBrokers.some(broker => broker.id === node.data.brokerId)
          );
          
          // Find producers connected to these partitions
          const producersToDeactivate = nds.filter(node => 
            node.type === 'producer' && 
            partitionsToRemove.some(partition => 
              edges.some(edge => edge.source === node.id && edge.target === partition.id)
            )
          );
          
          // Remove the brokers and their associated partitions
          const nodesToRemoveIds = [...nodesToDelete, ...partitionsToRemove].map(n => n.id);
          updatedNodes = nds.filter(node => !nodesToRemoveIds.includes(node.id));
          
          // Deactivate producers connected to removed partitions
          updatedNodes = updatedNodes.map(node => {
            if (producersToDeactivate.some(producer => producer.id === node.id)) {
              return { ...node, data: { ...node.data, active: false } };
            }
            return node;
          });
          
          // Also remove edges connected to removed nodes
          setEdges((eds) => eds.filter(edge => 
            !nodesToRemoveIds.includes(edge.source) && !nodesToRemoveIds.includes(edge.target)
          ));
        } else {
          // Check if any partitions are being deleted
          const deletedPartitions = nodesToDelete.filter(node => node.type === 'partition');
          
          if (deletedPartitions.length > 0) {
            // Find producers connected to deleted partitions
            const producersToDeactivate = nds.filter(node => 
              node.type === 'producer' && 
              deletedPartitions.some(partition => 
                edges.some(edge => edge.source === node.id && edge.target === partition.id)
              )
            );
            
            // Deactivate these producers
            updatedNodes = nds.map(node => {
              if (producersToDeactivate.some(producer => producer.id === node.id)) {
                return { ...node, data: { ...node.data, active: false } };
              }
              return node;
            });
            
            // Remove the deleted partitions
            const nodesToRemoveIds = nodesToDelete.map(n => n.id);
            updatedNodes = updatedNodes.filter(node => !nodesToRemoveIds.includes(node.id));
            
            // Remove edges connected to removed nodes
            setEdges((eds) => eds.filter(edge => 
              !nodesToRemoveIds.includes(edge.source) && !nodesToRemoveIds.includes(edge.target)
            ));
          } else {
            // Just remove the non-broker, non-partition nodes normally
            const nodesToRemoveIds = nodesToDelete.map(n => n.id);
            updatedNodes = nds.filter(node => !nodesToRemoveIds.includes(node.id));
          }
        }
        
        return updatedNodes;
      });
    },
    [edges]
  );

  // Add a new node of the specified type
  const addNode = (type: 'producer' | 'topic' | 'consumer' | 'broker' | 'partition') => {
    const newCount = counters[type] + 1;
    setCounters({ ...counters, [type]: newCount });

    const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${newCount}`;

    // Use Kafka Integration for business logic
    let kafkaResult = null;
    if (type === 'broker') {
      kafkaResult = kafkaIntegration.handleAddBroker({ x: 100, y: 100 });
      setKafkaStats(kafkaIntegration.cluster.getClusterStats());

    } else if (type === 'topic') {
      kafkaResult = kafkaIntegration.handleAddTopic({ x: 100, y: 100 }, {
        name: label,
        partitions: 3,
        replicationFactor: 1
      });
      setKafkaStats(kafkaIntegration.cluster.getClusterStats());

    } else if (type === 'producer') {
      kafkaResult = kafkaIntegration.handleAddProducer({ x: 100, y: 100 }, {
        id: `producer-${Date.now()}`,
        clientId: `producer-client-${Date.now()}`
      });
      setKafkaStats(kafkaIntegration.cluster.getClusterStats());

    } else if (type === 'consumer') {
      kafkaResult = kafkaIntegration.handleAddConsumer({ x: 100, y: 100 }, {
        id: `consumer-${Date.now()}`,
        groupId: `group-${Date.now()}`,
        clientId: `consumer-client-${Date.now()}`
      });
      setKafkaStats(kafkaIntegration.cluster.getClusterStats());

    } else if (type === 'partition') {
      kafkaResult = kafkaIntegration.handleAddPartition({ x: 100, y: 100 }, {
        id: `partition-${Date.now()}`,
        topic: 'default-topic'
      });
      setKafkaStats(kafkaIntegration.cluster.getClusterStats());
    }
    
    // Special positioning logic
    let position;
    let nodeData: any = {
      label, 
      active: false // Initialize active as false for producers
    };
    
    if (type === 'broker') {
      // Find the rightmost existing broker
      const existingBrokers = nodes.filter(node => node.type === 'broker');
      let xPosition = 100; // Default position for first broker
      
      if (existingBrokers.length > 0) {
        // Find the broker with the highest x position
        const rightmostBroker = existingBrokers.reduce((rightmost, broker) => 
          broker.position.x > rightmost.position.x ? broker : rightmost
        );
        xPosition = rightmostBroker.position.x + 300; // 300px spacing to the right
      }
      
      position = { x: xPosition, y: 100 };
    } else if (type === 'topic') {
      // Check if there are any brokers on the canvas
      const brokers = nodes.filter(node => node.type === 'broker');
      if (brokers.length === 0) {
        return;
      }
      
      // Get current broker from currentObjects state
      const currentBrokerId = currentObjects.broker;
      const selectedBroker = currentBrokerId ? nodes.find(n => n.id === currentBrokerId) : null;
      
      if (selectedBroker) {
        // Find existing topics in this broker
        const existingTopics = nodes.filter(node => 
          node.type === 'topic' && 
          node.data.brokerId === selectedBroker.id // Track which broker this topic belongs to
        );
                
        // Find the lowest existing topic
        let lowestY = selectedBroker.position.y + 20; // Default top position (close to top edge)
        if (existingTopics.length > 0) {
          // Find the bottom of the lowest topic (position.y + topic height + spacing)
          // Topic height: 50px (minHeight) + 24px (padding top/bottom) = 74px total
          const bottomOfLowestTopic = Math.max(...existingTopics.map(n => n.position.y + 74)); // 74px is total topic height
          lowestY = bottomOfLowestTopic;
        }
        
        nodeData.brokerId = selectedBroker.id; // Track which broker this topic belongs to
        
        // Center topic inside broker (200px broker - 150px topic width) / 2 = 25px
        position = { 
          x: selectedBroker.position.x + 25, // Center horizontally inside 200px broker
          y: lowestY + 15 // Add 15px spacing between topics
        };
      } else {
        position = { x: 100 + (counters[type] * 50), y: 100 + (counters[type] * 50) };
      }
    } else if (type === 'partition') {
      // Check if there are any brokers on the canvas
      const brokers = nodes.filter(node => node.type === 'broker');
      if (brokers.length === 0) {
        return;
      }
      
      // Get current broker from currentObjects state
      const currentBrokerId = currentObjects.broker;
      const selectedBroker = currentBrokerId ? nodes.find(n => n.id === currentBrokerId) : null;
      
      if (selectedBroker) {
        // Find existing partitions in this broker
        const existingPartitions = nodes.filter(node => 
          node.type === 'partition' && 
          node.data.brokerId === selectedBroker.id // Track which broker this partition belongs to
        );
                
        // Find the lowest existing partition
        let lowestY = selectedBroker.position.y + 20; // Default top position (close to top edge)
        if (existingPartitions.length > 0) {
          lowestY = Math.max(...existingPartitions.map(n => n.position.y));
        }
        
        nodeData.brokerId = selectedBroker.id; // Track which broker this partition belongs to
        
        position = { 
          x: selectedBroker.position.x + 40, // Center horizontally inside 200px broker (200px - 120px partition width) / 2 = 40px
          y: lowestY + 50 // Place below the lowest partition with increased spacing
        };
      } else {
        position = { x: 100 + (counters[type] * 50), y: 100 + (counters[type] * 50) };
      }
    } else {
      position = { x: 100 + (counters[type] * 50), y: 100 + (counters[type] * 50) };
    }
    
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: nodeData,
      selected: true, // Use React Flow's built-in selected property
      zIndex: type === 'broker' ? -1 : type === 'partition' ? 3000 : 1000, // Partitions highest (3000), brokers lowest (-1), others medium (1000)
    };

    setNodes((nds) => {
      const updatedNodes = [
        ...nds.map(node => ({ 
          ...node, 
          selected: false,
          // Ensure all nodes have correct z-index
          zIndex: node.type === 'broker' ? -1 : node.type === 'partition' ? 3000 : 1000
        })),
        newNode
      ];
      
      // Update currentObjects for the new node type
      if (type === 'broker' && newNode.id) {
        setCurrentObjects(prev => ({ ...prev, broker: newNode.id }));
      }
      
      return updatedNodes;
    });
  };

  // Simple selection function - select one node, deselect others, and track current objects
  const selectNode = (nodeId: string) => {
    setNodes((nds) => {
      const clickedNode = nds.find(n => n.id === nodeId);
      if (!clickedNode) return nds;
      
      // Update current objects for this category
      setCurrentObjects(prev => ({
        ...prev,
        [clickedNode.type as string]: nodeId
      }));
      
      return nds.map((node) =>
        node.id === nodeId
          ? { ...node, selected: true }
          : { ...node, selected: false }
      );
    });
  };

  // Toggle producer active state (green/transmitting) - only if connected to partition
  const toggleProducerActive = (nodeId: string) => {
    // Check if producer has connection to a partition
    const hasPartitionConnection = edges.some(edge => 
      edge.source === nodeId && 
      nodes.some(node => node.id === edge.target && node.type === 'partition')
    );

    if (!hasPartitionConnection) {
      return;
    }

    setNodes((nds) => {
      const updatedNodes = nds.map((node) =>
        node.id === nodeId && node.type === 'producer'
          ? { 
              ...node, 
              data: { ...node.data, active: !node.data.active }
            }
          : node
      );
      return updatedNodes;
    });
  };

  // Register custom node types with click handlers
  const nodeTypes = {
    producer: (props: any) => {
      const hasConnections = edges.some(edge => edge.source === props.id);
      return (
        <ProducerNode 
          {...props} 
          hasConnections={hasConnections}
          onClick={() => selectNode(props.id)} 
          onDoubleClick={() => hasConnections ? toggleProducerActive(props.id) : undefined} 
        />
      );
    },
    topic: (props: any) => <TopicNode {...props} onClick={() => selectNode(props.id)} onDuplicate={() => duplicateTopic(props.id)} />,
    consumer: (props: any) => <ConsumerNode {...props} onClick={() => selectNode(props.id)} />,
    broker: (props: any) => <BrokerNode {...props} selected={props.selected} isCurrentBroker={currentObjects.broker === props.id} onClick={() => selectNode(props.id)} />,
    partition: (props: any) => <PartitionNode {...props} onClick={() => selectNode(props.id)} />,
  };

  // Duplicate topic function
  const duplicateTopic = (topicId: string) => {
    const originalTopic = nodes.find(n => n.id === topicId);
    if (!originalTopic) return;

    // Create new topic with same name but unique ID
    const newTopic: Node = {
      id: `${originalTopic.id}-copy-${Date.now()}`, // Keep original ID but add copy suffix
      type: 'topic',
      position: { 
        x: originalTopic.position.x + 50, 
        y: originalTopic.position.y + 50 
      },
      data: { 
        label: originalTopic.data.label, // Keep same name
        // Copy brokerId if original topic has one
        ...(originalTopic.data.brokerId ? { brokerId: originalTopic.data.brokerId } : {})
      },
      selected: true,
      zIndex: 1000,
    };

    setNodes((nds) => [
      ...nds.map(node => ({ ...node, selected: false })),
      newTopic
    ]);

    // Update current objects for the new topic
    setCurrentObjects(prev => ({ ...prev, topic: newTopic.id }));
  };

  // Update edges with animation for active producers
  const updatedEdges = edges.flatMap(edge => {
    if (nodes.filter(node => node.type === 'producer' && node.data.active).map(node => node.id).includes(edge.source)) {
      // Calculate number of pulses needed based on interval and duration
      const numPulses = Math.ceil(animationConfig.pulseDuration / animationConfig.pulseInterval);
      const pulseEdges = [
        { ...edge, id: `${edge.id}-solid`, className: 'solid-line' }
      ];
      
      // Create staggered pulse edges
      for (let i = 0; i < numPulses; i++) {
        pulseEdges.push({
          ...edge,
          id: `${edge.id}-pulse${i}`,
          className: `animated-flow pulse${i}`,
          style: { 
            animationDelay: `${i * animationConfig.pulseInterval}ms`,
            animationDuration: `${animationConfig.pulseDuration}ms`
          }
        });
      }
      
      return pulseEdges;
    }
    return [edge];
  });

  // Export schema as JSON to console
  const exportSchema = () => {
    try {
      // Validate cluster has at least one broker
      if (kafkaIntegration.cluster.brokers.length === 0) {
        throw new Error('Cluster must have at least one broker to export schema');
      }


      // Topics exist, validate each topic has at least one partition
      kafkaIntegration.cluster.topics.forEach(topic => {
        topic.validateTopic();
      });

      // No topics exist, check if we have standalone partitions
      const standalonePartitionCount = kafkaIntegration.cluster.standalonePartitions.length;
      if (standalonePartitionCount === 0) {
        throw new Error('Cluster must have at least one partition (from topics or standalone) to export schema');
      }

      // Validate all producers have valid configuration
      // kafkaIntegration.cluster.producers.forEach(producer => {
      //   if (!producer.config.bootstrapServers || producer.config.bootstrapServers.length === 0) {
      //     throw new Error(`Producer ${producer.id} must have at least one bootstrap server`);
      //   }
      // });

      // Validate all consumers have valid configuration
      // kafkaIntegration.cluster.consumers.forEach(consumer => {
      //   if (!consumer.config.bootstrapServers || consumer.config.bootstrapServers.length === 0) {
      //     throw new Error(`Consumer ${consumer.id} must have at least one bootstrap server`);
      //   }
      //   if (!consumer.config.groupId) {
      //     throw new Error(`Consumer ${consumer.id} must have a group ID`);
      //   }
      // });

      const schema = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.data.label,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
        })),
        cluster: kafkaIntegration.cluster.toJSON()
      };
      console.log('Kafka Schema:', JSON.stringify(schema, null, 2));
      alert('Schema exported to console! Press F12 to view.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}`);
      console.error('Schema export error:', error);
    }
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <CustomAppBar 
        onAddNode={addNode}
        hasBrokers={nodes.filter(node => node.type === 'broker').length > 0}
        onExportSchema={exportSchema}
        kafkaStats={kafkaStats}
      />

      {/* React Flow Canvas */}
      <Box sx={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={updatedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </Box>
    </Box>
  );
}

export default App;

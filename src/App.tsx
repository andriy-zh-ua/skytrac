import { useState, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';

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
  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);
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
    
    // Special positioning logic
    let position;
    let nodeData: any = {
      label, 
      active: false // Initialize active as false for producers
    };
    
    if (type === 'broker') {
      position = { x: 100 + (counters[type] * 300), y: 100 }; // 300px spacing for side-by-side
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
          x: selectedBroker.position.x + 15, // Inside broker with padding offset
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
      zIndex: type === 'broker' ? -1 : 1000, // Keep brokers in background
    };

    setNodes((nds) => {
      const updatedNodes = [
        ...nds.map(node => ({ ...node, selected: false })),
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
    topic: (props: any) => <TopicNode {...props} onClick={() => selectNode(props.id)} />,
    consumer: (props: any) => <ConsumerNode {...props} onClick={() => selectNode(props.id)} />,
    broker: (props: any) => <BrokerNode {...props} onClick={() => selectNode(props.id)} />,
    partition: (props: any) => <PartitionNode {...props} onClick={() => selectNode(props.id)} />,
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
    };
    console.log('Kafka Schema:', JSON.stringify(schema, null, 2));
    alert('Schema exported to console! Press F12 to view.');
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <CustomAppBar 
        onAddNode={addNode}
        hasBrokers={nodes.filter(node => node.type === 'broker').length > 0}
        onExportSchema={exportSchema}
      />

      {/* React Flow Canvas */}
      <Box sx={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={updatedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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

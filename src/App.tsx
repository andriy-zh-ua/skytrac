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

// Configuration
import { animationConfig } from './config/animation';

// Initial empty canvas
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const App = () => {
  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Counters for unique node labels
  const [counters, setCounters] = useState({
    producer: 0,
    topic: 0,
    consumer: 0,
    broker: 0,
    partition: 0,
  });

  // Handle new connections between nodes
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Add a new node of the specified type
  const addNode = (type: 'producer' | 'topic' | 'consumer' | 'broker' | 'partition') => {
    const newCount = counters[type] + 1;
    setCounters({ ...counters, [type]: newCount });

    const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${newCount}`;
    
    // Special positioning for brokers to place them side by side
    let position;
    if (type === 'broker') {
      position = { x: 100 + (counters[type] * 300), y: 100 }; // 300px spacing for side-by-side
    } else {
      position = { x: 100 + (counters[type] * 50), y: 100 + (counters[type] * 50) };
    }
    
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label, active: false }, // Initialize active as false for producers
      selected: true, // Use React Flow's built-in selected property
      zIndex: type === 'broker' ? -1 : 1000, // Keep brokers in background
    };

    setNodes((nds) => [
      ...nds.map(node => ({ ...node, selected: false })),
      newNode
    ]);
  };

  // Simple selection function - select one node, deselect others
  const selectNode = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, selected: true }
          : { ...node, selected: false }
      )
    );
  };

  // Toggle producer active state (green/transmitting) - only if connected to partition
  const toggleProducerActive = (nodeId: string) => {
    // Check if producer has connection to a partition
    const hasPartitionConnection = edges.some(edge => 
      edge.source === nodeId && 
      nodes.some(node => node.id === edge.target && node.type === 'partition')
    );

    if (!hasPartitionConnection) {
      console.log('Producer must be connected to a partition to activate');
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
      console.log('Toggle producer active:', updatedNodes.filter(n => n.type === 'producer').map(n => ({ id: n.id, active: n.data.active })));
      return updatedNodes;
    });
  };

  // Get selected producer IDs
  const selectedProducers = nodes
    .filter(node => node.type === 'producer' && node.selected)
    .map(node => node.id);

  // Get active producer IDs (green, transmitting)
  const activeProducers = nodes
    .filter(node => node.type === 'producer' && node.data.active)
    .map(node => node.id);

  // Register custom node types with click handlers
  const nodeTypes = {
    producer: (props: any) => {
      const hasConnections = edges.some(edge => edge.source === props.id);
      return (
        <ProducerNode 
          {...props} 
          hasConnections={hasConnections}
          onClick={() => hasConnections ? selectNode(props.id) : undefined} 
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
    if (activeProducers.includes(edge.source)) {
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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Kafka Architecture Builder
          </Typography>
          <Button color="inherit" onClick={() => addNode('producer')}>
            Add Producer
          </Button>
          <Button color="inherit" onClick={() => addNode('topic')}>
            Add Topic
          </Button>
          <Button color="inherit" onClick={() => addNode('consumer')}>
            Add Consumer
          </Button>
          <Button color="inherit" onClick={() => addNode('broker')}>
            Add Broker
          </Button>
          <Button color="inherit" onClick={() => addNode('partition')}>
            Add Partition
          </Button>
          <Button color="inherit" variant="outlined" sx={{ ml: 2 }} onClick={exportSchema}>
            Export Schema
          </Button>
        </Toolbar>
      </AppBar>

      {/* React Flow Canvas */}
      <Box sx={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={updatedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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

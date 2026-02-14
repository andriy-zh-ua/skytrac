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
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 100 + (counters[type] * 50), y: 100 + (counters[type] * 50) },
      data: { label, selected: false },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // Toggle producer selection state
  const toggleProducerSelection = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId && node.type === 'producer'
          ? { ...node, data: { ...node.data, selected: !node.data.selected } }
          : node
      )
    );
  };

  // Get selected producer IDs
  const selectedProducers = nodes
    .filter(node => node.type === 'producer' && node.data.selected)
    .map(node => node.id);

  // Register custom node types with access to toggleProducerSelection
  const nodeTypes = {
    producer: (props: any) => {
      const hasConnections = edges.some(edge => edge.source === props.id);
      return (
        <ProducerNode 
          {...props} 
          hasConnections={hasConnections}
          onClick={() => toggleProducerSelection(props.id)} 
        />
      );
    },
    topic: TopicNode,
    consumer: ConsumerNode,
    broker: BrokerNode,
    partition: PartitionNode,
  };

  // Update edges with animation for selected producers
  const updatedEdges = edges.flatMap(edge => {
    if (selectedProducers.includes(edge.source)) {
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

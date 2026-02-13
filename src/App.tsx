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

// Register custom node types
const nodeTypes = {
  producer: ProducerNode,
  topic: TopicNode,
  consumer: ConsumerNode,
  broker: BrokerNode,
  partition: PartitionNode,
};

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
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: { label },
    };

    setNodes((nds) => [...nds, newNode]);
  };

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
          edges={edges}
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

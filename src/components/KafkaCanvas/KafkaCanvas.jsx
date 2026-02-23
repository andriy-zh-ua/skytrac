import { Box } from '@mui/material';
import { ReactFlow } from '@xyflow/react';
import { NodeTypes } from './NodeTypes.jsx';
import { CanvasControls } from './CanvasControls.jsx';

export const KafkaCanvas = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  selectNode,
  clearSelection,
  currentObjects
}) => {
  // Handle canvas click to deselect all nodes
  const handlePaneClick = () => {
    // Deselect all nodes by updating their selected property
    onNodesChange(nodes.map(node => ({
      ...node,
      selected: false
    })));
    
    // Clear current objects selection
    clearSelection();
  };
  // Enhanced NodeTypes with injected functions
  const EnhancedNodeTypes = {
    broker: props => (
      <NodeTypes.Broker 
        {...props} 
        selectNode={selectNode}
        currentObjects={currentObjects}
      />
    ),
    producer: props => (
      <NodeTypes.Producer 
        {...props} 
        selectNode={selectNode}
        currentObjects={currentObjects}
      />
    ),
    topic: props => (
      <NodeTypes.Topic 
        {...props} 
        selectNode={selectNode}
        currentObjects={currentObjects}
      />
    ),
    consumer: props => (
      <NodeTypes.Consumer 
        {...props} 
        selectNode={selectNode}
        currentObjects={currentObjects}
      />
    ),
    partition: props => (
      <NodeTypes.Partition 
        {...props} 
        selectNode={selectNode}
        currentObjects={currentObjects}
      />
    ),
  };
  return (
    <Box sx={{ flexGrow: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        // onConnectStart={onConnectStart}
        // onNodesDelete={onNodesDelete}
        nodeTypes={EnhancedNodeTypes}
        fitView
      >
        <CanvasControls />
      </ReactFlow>
    </Box>
  );
};

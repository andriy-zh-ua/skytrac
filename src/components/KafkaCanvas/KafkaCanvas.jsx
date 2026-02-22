import { Box } from '@mui/material';
import { ReactFlow, MiniMap, Controls, Background } from '@xyflow/react';
import { NodeTypes } from './NodeTypes.jsx';
import { CanvasHandlers } from './CanvasHandlers.jsx';
import { CanvasControls } from './CanvasControls.jsx';

export const KafkaCanvas = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect, 
  onConnectStart, 
  onNodesDelete, 
  onPaneClick 
}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onNodesDelete={onNodesDelete}
        onPaneClick={onPaneClick}
        nodeTypes={NodeTypes}
        fitView
      >
        <CanvasControls />
      </ReactFlow>
    </Box>
  );
};

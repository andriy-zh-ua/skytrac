import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { ReactFlow, useReactFlow } from '@xyflow/react';
import { NodeTypes } from './NodeTypes.jsx';
import { CanvasControls } from './CanvasControls.jsx';
import { KafkaTopic } from '../../kafka-designer/KafkaTopic.js';

export const KafkaCanvas = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  selectNode,
  clearSelection,
  onDuplicateTopic,
  currentObjects,
  kafkaIntegration,
  updateEdgeStyles,
  onProducerActivate,
  onProducerDeactivate
}) => {
  const { getIntersectingNodes } = useReactFlow();

  // Check if a producer has connections (edges)
  const hasProducerConnections = useCallback((producerId) => {
    return edges.some(edge => edge.source === producerId);
  }, [edges]);

  // Activate producer
  const activateProducer = useCallback((producerId) => {
    const producerNode = nodes.find(node => node.id === producerId);
    if (producerNode) {
      const updatedData = {
        ...producerNode.data,
        active: true
      };
      
      const updatedNode = {
        ...producerNode,
        data: updatedData
      };
      
      // Update node state
      onNodesChange([{
        id: producerId,
        type: 'replace',
        item: updatedNode
      }]);
      
      // Update edge styles based on producer state
      if (updateEdgeStyles) {
        updateEdgeStyles(producerId, true);
      }
      
      // Trigger flight route streaming
      if (onProducerActivate) {
        onProducerActivate(producerId);
      }
    }
  }, [nodes, onNodesChange, updateEdgeStyles, onProducerActivate]);

  // Deactivate producer
  const deactivateProducer = useCallback((producerId) => {
    const producerNode = nodes.find(node => node.id === producerId);
    if (producerNode) {
      const updatedData = {
        ...producerNode.data,
        active: false
      };
      
      const updatedNode = {
        ...producerNode,
        data: updatedData
      };
      
      // Update node state
      onNodesChange([{
        id: producerId,
        type: 'replace',
        item: updatedNode
      }]);
      
      // Update edge styles based on producer state
      if (updateEdgeStyles) {
        updateEdgeStyles(producerId, false);
      }
      
      // Stop flight route streaming
      if (onProducerDeactivate) {
        onProducerDeactivate(producerId);
      }
    }
  }, [nodes, onNodesChange, updateEdgeStyles, onProducerDeactivate]);
  
  // Calculate position for new topic - same as regular topic addition
  const calculateTopicPosition = (nodes, brokerId) => {
    const brokerTopics = nodes.filter(n => n.type === 'topic' && n.parentId === brokerId);
    const topicCount = brokerTopics.length;
    const baseY = 20; // Start 20px from top (account for label)
    const verticalSpacing = 230; // 120px vertical spacing between topics
    
    return { 
      x: 10, 
      y: baseY + (topicCount * verticalSpacing)
    };
  };
  
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

  // Handle node drag to detect intersections with brokers
  const handleNodeDrag = useCallback((event, node) => {
    // Only care about topic nodes being dragged
    if (node.type !== 'topic') {
      return;
    }

    // Get all intersecting nodes
    const intersections = getIntersectingNodes(node);
    
    // Find broker nodes that intersect with the dragged topic
    const intersectingBrokers = intersections.filter(n => n.type === 'broker');
    
    // Create node changes for highlighting intersecting brokers
    const nodeChanges = nodes.map((n) => {
      const shouldHighlight = n.type === 'broker' && intersectingBrokers.some(b => b.id === n.id);
      const currentClassName = n.className || '';
      const isCurrentlyHighlighted = currentClassName.includes('highlight');
      
      // Only add change if highlight state needs to change
      if (shouldHighlight && !isCurrentlyHighlighted) {
        return {
          id: n.id,
          type: 'replace',
          item: {
            ...n,
            className: currentClassName ? `${currentClassName} highlight` : 'highlight'
          }
        };
      } else if (!shouldHighlight && isCurrentlyHighlighted) {
        return {
          id: n.id,
          type: 'replace',
          item: {
            ...n,
            className: currentClassName.replace('highlight', '').trim()
          }
        };
      }
      return null;
    }).filter(Boolean); // Remove null changes
    
    // Apply the changes
    if (nodeChanges.length > 0) {
      onNodesChange(nodeChanges);
    }
  }, [getIntersectingNodes, onNodesChange, nodes]);

  // Handle node drag stop to embed topic into broker and select producers
  const handleNodeDragStop = useCallback((event, node) => {
    // For producers, ensure they are properly selected and trigger map sync
    if (node.type === 'producer' && selectNode) {
      // Always call selectNode to ensure currentObjects is updated and map sync triggers
      selectNode(node.id);
      // Don't need to continue with intersection logic for producers
      return;
    }
    
    // Only care about topic nodes being dropped for embedding logic
    if (node.type !== 'topic') {
      return;
    }

    // Get all intersecting nodes at drop position
    const intersections = getIntersectingNodes(node);
    
    // Find broker nodes that intersect with the dropped topic
    const intersectingBrokers = intersections.filter(n => n.type === 'broker');
    
    // If exactly one broker is intersecting, embed the topic
    if (intersectingBrokers.length === 1) {
      const targetBroker = intersectingBrokers[0];
      
      // Calculate position for the topic using the same logic as regular topic addition
      const topicPosition = calculateTopicPosition(nodes, targetBroker.id);
      
      // Create node changes for embedding topic and selecting broker
      const nodeChanges = [
        // Embed the topic into broker
        {
          id: node.id,
          type: 'replace',
          item: {
            ...node,
            parentId: targetBroker.id,
            extent: 'parent',
            draggable: false,
            position: topicPosition // Use calculated position
          }
        }
      ];
      
      // Apply the changes
      onNodesChange(nodeChanges);
      
      // Add the topic to the broker in the cluster
      if (kafkaIntegration && kafkaIntegration.cluster) {
        const broker = kafkaIntegration.cluster.getBroker(targetBroker.id);
        const topicNode = nodes.find(n => n.id === node.id);
        
        if (broker && topicNode && topicNode.data) {
          // Create proper KafkaTopic instance from the topic node data
          const topicData = topicNode.data;
          const topicConfig = {
            name: topicNode.id,
            partitions: topicData.partitions || [],
            createdAt: topicData.createdAt || new Date().toISOString()
          };
          
          // Create KafkaTopic instance
          const kafkaTopic = new KafkaTopic(topicConfig);
          
          // Add topic to broker using assignTopic
          broker.assignTopic(kafkaTopic);
        }
      }
      
      // Select the broker in the app state
      selectNode(targetBroker.id);
      
      // Select the topic in the app state
      selectNode(node.id);

      // Clear all highlights
      const clearHighlights = nodes.map((n) => {
        const currentClassName = n.className || '';
        if (currentClassName.includes('highlight')) {
          return {
            id: n.id,
            type: 'replace',
            item: {
              ...n,
              className: currentClassName.replace('highlight', '').trim()
            }
          };
        }
        return null;
      }).filter(Boolean);
      
      if (clearHighlights.length > 0) {
        onNodesChange(clearHighlights);
      }
    } else {
      // Clear all highlights if no single broker target
      const clearHighlights = nodes.map((n) => {
        const currentClassName = n.className || '';
        if (currentClassName.includes('highlight')) {
          return {
            id: n.id,
            type: 'replace',
            item: {
              ...n,
              className: currentClassName.replace('highlight', '').trim()
            }
          };
        }
        return null;
      }).filter(Boolean);
      
      if (clearHighlights.length > 0) {
        onNodesChange(clearHighlights);
      }
    }
  }, [getIntersectingNodes, onNodesChange, nodes, selectNode, kafkaIntegration]);
  
  // Enhanced NodeTypes with injected functions
  const EnhancedNodeTypes = useCallback(() => ({
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
        hasConnections={hasProducerConnections(props.id)}
        activateProducer={activateProducer}
        deactivateProducer={deactivateProducer}
      />
    ),
    topic: props => (
      <NodeTypes.Topic 
        {...props} 
        selectNode={selectNode}
        currentObjects={currentObjects}
        onDuplicateTopic={onDuplicateTopic}
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
  }), [selectNode, currentObjects, hasProducerConnections, activateProducer, deactivateProducer, onDuplicateTopic])();
  return (
    <Box sx={{ flexGrow: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={EnhancedNodeTypes}
        fitView
      >
        <CanvasControls />
      </ReactFlow>
    </Box>
  );
};

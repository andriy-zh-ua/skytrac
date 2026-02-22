import { useCallback } from 'react';

export const useNodeSelector = (setNodes, setCurrentObjects) => {
  const selectNode = useCallback((nodeId) => {
    setNodes((nds) => {
      console.log('selectNode called with nodeId:', nodeId);
      console.log('Current nodes in canvas:', nds.map(n => ({ id: n.id, type: n.type })));
      
      const clickedNode = nds.find(n => n.id === nodeId);
      console.log('Found clickedNode:', clickedNode ? { id: clickedNode.id, type: clickedNode.type } : 'NOT FOUND');
      
      if (!clickedNode) {
        console.warn('Node not found in canvas, but proceeding with selection');
        return nds;
      }
      
      // Update current objects for this category
      console.log(`selectNode: Setting ${clickedNode.type} to ${nodeId}`);
      
      setCurrentObjects(prev => {
        const updated = {
          ...prev,
          [clickedNode.type]: nodeId
        };
        console.log('Updated currentObjects:', updated);
        return updated;
      });
      
      return nds.map((node) =>
        node.id === nodeId
          ? { ...node, selected: true }
          : { ...node, selected: false }
      );
    });
  }, [setNodes, setCurrentObjects]);

  return { selectNode };
};

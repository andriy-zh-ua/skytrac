import { Handle, Position } from '@xyflow/react';

// Node to represent a Kafka partition
const PartitionNode = props => {
  const { id, selected, isCurrentTopic, onClick } = props;
  const showBorder = selected || isCurrentTopic;
  return (
    <div
      data-type="partition"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#ab47bc',
        color: 'white',
        border: showBorder ? '3px solid #ab47bc' : 'none',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {id}
      
      {/* Input handle on the left */}
      <Handle type="target" position={Position.Left} />
      {/* Output handle on the right */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default PartitionNode;

import { Handle, Position } from '@xyflow/react';

// Node to represent a Kafka consumer
const ConsumerNode = props => {
  const { id, onClick } = props;
  return (
    <div
      data-type="consumer"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#ffa726',
        color: 'white',
        border: '2px solid #f57c00',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {id}
      {/* Input handle on the left - receives from Topics */}
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default ConsumerNode;

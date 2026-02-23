import { Handle, Position } from '@xyflow/react';

// Node to represent a Kafka partition
const PartitionNode = props => {
  const { id, selected, isCurrentTopic, onClick } = props;
  const showBorder = selected || isCurrentTopic;
  return (
    <div
      data-type="partition"
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        background: 'white',
        color: '#333',
        border: showBorder ? '1px solid #ab47bc' : 'none',
        minWidth: '250px',
        minHeight: '40px',
        fontSize: '12px',
        textAlign: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.2s ease-in-out',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
      onClick={onClick}
    >
      {/* Label at the very top */}
      <div style={{
        position: 'absolute',
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        fontWeight: 'bold',
        color: showBorder ? '#ab47bc' : '#333',
        zIndex: 1,
      }}>
        {id}
      </div>
      
      {/* Input handle on the left */}
      <Handle type="target" position={Position.Left} />
      {/* Output handle on the right */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default PartitionNode;

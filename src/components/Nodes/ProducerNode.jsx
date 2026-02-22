import { Handle, Position } from '@xyflow/react';

// Node to represent a Kafka producer
const ProducerNode = props => {
  const { id, onClick, hasConnections, toggleProducerActive } = props;

  const handleClick = e => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    }
  };

  const handleActivate = e => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasConnections && toggleProducerActive) {
      toggleProducerActive(id);
    }
    // Also select the producer when activate/deactivate button is clicked
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        minWidth: '80px',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {/* Aircraft SVG icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill={props.data?.active ? "#4caf50" : props.selected ? "#ef5350" : "#757575"}
        style={{ marginBottom: '4px', transform: 'rotate(90deg)' }}
      >
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
      {/* Output handle positioned at the fuselage of the plane */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: '31px', right: '12px' }}
      />
      <span style={{ fontSize: '8px', marginTop: '4px' }}>{id}</span>
      
      {/* Activate button - only show if has connections */}
      {hasConnections && (
        <button
          onClick={handleActivate}
          style={{
            fontSize: '8px',
            padding: '2px 6px',
            marginTop: '4px',
            backgroundColor: props.data?.active ? '#4caf50' : '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {props.data?.active ? 'Deactivate' : 'Activate'}
        </button>
      )}
    </div>
  );
};

export default ProducerNode;

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

interface ProducerNodeProps {
  data: { label: string; selected?: boolean; active?: boolean };
  onClick?: () => void;
  onDoubleClick?: () => void;
  hasConnections?: boolean;
}

// ProducerNode: Aircraft icon representing a Kafka producer
const ProducerNode = ({ data, onClick, onDoubleClick, hasConnections }: ProducerNodeProps) => {
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasConnections && onClick) {
      onClick();
    }
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Activate button clicked');
    if (hasConnections && onDoubleClick) {
      onDoubleClick();
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
        cursor: hasConnections ? 'pointer' : 'not-allowed',
      }}
      onClick={handleClick}
    >
      {/* Aircraft SVG icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill={data.active ? "#4caf50" : data.selected ? "#ef5350" : "#757575"}
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
      <span style={{ fontSize: '12px', marginTop: '4px' }}>{data.label}</span>
      
      {/* Activate button - only show if has connections */}
      {hasConnections && (
        <button
          onClick={handleActivate}
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            marginTop: '4px',
            backgroundColor: data.active ? '#4caf50' : '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {data.active ? 'Active' : 'Activate'}
        </button>
      )}
    </div>
  );
};

export default ProducerNode;

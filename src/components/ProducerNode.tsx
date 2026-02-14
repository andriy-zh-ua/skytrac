import { Handle, Position } from '@xyflow/react';

interface ProducerNodeProps {
  data: { label: string; selected?: boolean };
  onClick?: () => void;
}

// ProducerNode: Aircraft icon representing a Kafka producer
const ProducerNode = ({ data, onClick }: ProducerNodeProps) => {

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
      onClick={onClick}
    >
      {/* Aircraft SVG icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill={data.selected ? "#ef5350" : "#757575"}
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
      <span
        style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
        }}
      >
        {data.label}
      </span>
    </div>
  );
};

export default ProducerNode;

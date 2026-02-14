import { Handle, Position } from '@xyflow/react';

interface BrokerNodeProps {
  data: { label: string };
  onClick?: () => void;
}

// BrokerNode: Blue box representing a Kafka broker
const BrokerNode = ({ data, onClick }: BrokerNodeProps) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#42a5f5',
        color: 'white',
        border: '2px solid #1976d2',
        width: '150px',
        height: '80vh',
        textAlign: 'center',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {data.label}
      {/* Input handle on the left */}
      <Handle type="target" position={Position.Left} />
      {/* Output handle on the right */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default BrokerNode;

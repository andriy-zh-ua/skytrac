import { Handle, Position } from '@xyflow/react';

interface ProducerNodeProps {
  data: { label: string };
}

// ProducerNode: Red box representing a Kafka producer
const ProducerNode = ({ data }: ProducerNodeProps) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#ef5350',
        color: 'white',
        border: '2px solid #c62828',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
      }}
    >
      {data.label}
      {/* Output handle on the right - connects to Topics */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ProducerNode;

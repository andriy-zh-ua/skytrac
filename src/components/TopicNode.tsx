import { Handle, Position } from '@xyflow/react';

interface TopicNodeProps {
  data: { label: string };
  onClick?: () => void;
}

// TopicNode: Green box representing a Kafka topic
const TopicNode = ({ data, onClick }: TopicNodeProps) => {
  return (
    <div
      data-type="topic"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#66bb6a',
        color: 'white',
        border: '2px solid #388e3c',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
              }}
      onClick={onClick}
    >
      {data.label}
      {/* Input handle on the left - receives from Producers */}
      <Handle type="target" position={Position.Left} />
      {/* Output handle on the right - connects to Consumers */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default TopicNode;

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
        padding: '12px 24px',
        borderRadius: '8px',
        background: '#66bb6a',
        color: 'white',
        border: '2px solid #388e3c',
        minWidth: '150px',
        minHeight: '50px',
        fontSize: '14px',
        textAlign: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
              }}
      onClick={onClick}
    >
      {data.label}
    </div>
  );
};

export default TopicNode;

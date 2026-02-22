import { Handle, Position } from '@xyflow/react';

interface TopicNodeProps {
  data: { label: string };
  selected?: boolean;
  isCurrentTopic?: boolean;
  onClick?: () => void;
}

// TopicNode: Green box representing a Kafka topic
const TopicNode = ({ data, selected, isCurrentTopic, onClick }: TopicNodeProps) => {
  const showBorder = selected || isCurrentTopic;
  return (
    <div
      data-type="topic"
      style={{
        padding: '12px 24px',
        borderRadius: '8px',
        background: '#66bb6a',
        color: 'white',
        border: showBorder ? '3px solid #388e3c' : 'none',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span>{data.label}</span>
      </div>
    </div>
  );
};

export default TopicNode;

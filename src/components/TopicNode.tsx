import { Handle, Position } from '@xyflow/react';

interface TopicNodeProps {
  data: { label: string };
  selected?: boolean;
  isCurrentTopic?: boolean;
  onClick?: () => void;
  onDuplicate?: () => void;
}

// TopicNode: Green box representing a Kafka topic
const TopicNode = ({ data, selected, isCurrentTopic, onClick, onDuplicate }: TopicNodeProps) => {
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
        {/* Duplicate button */}
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'white',
              padding: '0',
              marginLeft: '8px'
            }}
            title="Duplicate topic"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

export default TopicNode;

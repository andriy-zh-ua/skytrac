import { Handle, Position } from '@xyflow/react';

interface ConsumerNodeProps {
  data: { label: string };
}

// ConsumerNode: Orange box representing a Kafka consumer
const ConsumerNode = ({ data }: ConsumerNodeProps) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#ffa726',
        color: 'white',
        border: '2px solid #f57c00',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
      }}
    >
      {data.label}
      {/* Input handle on the left - receives from Topics */}
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default ConsumerNode;

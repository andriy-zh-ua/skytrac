import { Handle, Position } from '@xyflow/react';

interface PartitionNodeProps {
  data: { label: string };
  onClick?: () => void;
}

// PartitionNode: Purple box representing a Kafka partition
const PartitionNode = ({ data, onClick }: PartitionNodeProps) => {
  return (
    <div
      data-type="partition"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#ab47bc',
        color: 'white',
        border: 'none',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: 'bold',
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

export default PartitionNode;

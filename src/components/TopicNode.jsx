// Node to represent a Kafka topic
const TopicNode = props => {
  const { id, selected, isCurrentTopic, onClick } = props;
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
        <span>{id}</span>
      </div>
    </div>
  );
};

export default TopicNode;

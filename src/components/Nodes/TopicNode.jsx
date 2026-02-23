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
        background: 'white',
        color: '#333',
        border: showBorder ? '1px solid #388e3c' : 'none',
        minWidth: '270px',
        minHeight: '200px',
        fontSize: '14px',
        textAlign: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.2s ease-in-out',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
      onClick={onClick}
    >
      {/* Label at the very top */}
      <div style={{
        position: 'absolute',
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        fontWeight: 'bold',
        color: showBorder ? '#388e3c' : '#333',
        zIndex: 1,
      }}>
        {id}
      </div>
    </div>
  );
};

export default TopicNode;

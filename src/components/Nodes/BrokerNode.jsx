// Node to represent a Kafka broker
const BrokerNode = props => {
  const { id, selected, isCurrentBroker, onClick } = props;
  const showBorder = selected || isCurrentBroker;
  return (
    <div
      data-type="broker"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: 'white',
        color: '#333',
        border: showBorder ? '1px solid #1976d2' : 'none',
        width: '300px',
        height: '80vh',
        textAlign: 'center',
        fontWeight: 'bold',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
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
        color: showBorder ? '#1976d2' : '#333',
        zIndex: 1,
      }}>
        {id}
      </div>
    </div>
  );
};

export default BrokerNode;

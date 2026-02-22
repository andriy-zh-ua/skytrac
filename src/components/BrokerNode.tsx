// Node to represent a Kafka broker
const BrokerNode = (props: any) => {
  const { id, selected, isCurrentBroker, onClick } = props;
  const showBorder = selected || isCurrentBroker;
  return (
    <div
      data-type="broker"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: '#42a5f5',
        color: 'white',
        border: showBorder ? '3px solid #1976d2' : 'none',
        width: '200px',
        height: '80vh',
        textAlign: 'center',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {id}
    </div>
  );
};

export default BrokerNode;

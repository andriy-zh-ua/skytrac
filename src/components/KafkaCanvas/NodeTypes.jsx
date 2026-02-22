import { BrokerNode, TopicNode, ConsumerNode, ProducerNode, PartitionNode } from '../Nodes/index.js';

export const NodeTypes = {
  producer: (props) => {
    const hasConnections = props.edges?.some(edge => edge.source === props.id) || false;
    return (
      <ProducerNode 
        {...props} 
        hasConnections={hasConnections}
        onClick={() => props.selectNode(props.id)} 
        onDoubleClick={() => hasConnections ? props.toggleProducerActive(props.id) : undefined} 
      />
    );
  },
  topic: (props) => (
    <TopicNode 
      {...props} 
      selected={props.selected}
      isCurrentTopic={props.currentObjects?.topic === props.id}
      onClick={() => props.selectNode(props.id)} 
    />
  ),
  consumer: (props) => <ConsumerNode {...props} onClick={() => props.selectNode(props.id)} />,
  broker: (props) => (
    <BrokerNode 
      {...props} 
      isCurrentBroker={props.currentObjects?.broker === props.id} 
      onClick={() => props.selectNode(props.id)} 
    />
  ),
  partition: (props) => <PartitionNode {...props} onClick={() => props.selectNode(props.id)} />,
};

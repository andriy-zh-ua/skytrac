import { BrokerNode, TopicNode, ConsumerNode, ProducerNode, PartitionNode } from '../Nodes/index.js';

export const NodeTypes = {
  producer: props => {
    const hasConnections = props.edges?.some(edge => edge.source === props.id) || false;
    return (
      <ProducerNode 
        {...props} 
        hasConnections={hasConnections}
        onClick={() => {
          if (props.data?.selectNode) {
            props.data.selectNode(props.id);
          }
        }}
      />
    );
  },
  consumer: props => (
    <ConsumerNode 
      {...props} 
      onClick={() => {
        if (props.data?.selectNode) {
          props.data.selectNode(props.id);
        }
      }} />
  ),
  broker: props => (
    <BrokerNode 
      {...props} 
      isCurrentBroker={props.data?.currentObjects?.broker === props.id} 
      onClick={() => {
        if (props.data?.selectNode) {
          props.data.selectNode(props.id);
        }
      }} 
    />
  ),  
  topic: props => (
    <TopicNode 
      {...props} 
      selected={props.selected}
      isCurrentTopic={props.data?.currentObjects?.topic === props.id}
      onClick={() => {
        if (props.data?.selectNode) {
          props.data.selectNode(props.id);
        }
      }} 
    />
  ),
  partition: props => (
    <PartitionNode 
      {...props} 
      isCurrentPartition={props.data?.currentObjects?.partition === props.id}
      onClick={() => {
        if (props.data?.selectNode) {
          props.data.selectNode(props.id);
        }
      }} 
    />
  )
};

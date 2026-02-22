import { BrokerNode, TopicNode, ConsumerNode, ProducerNode, PartitionNode } from '../Nodes/index.js';

export const NodeTypes = {
  producer: props => {
    return (
      <ProducerNode 
        {...props} 
        onClick={() => {
          if (props.selectNode) {
            props.selectNode(props.id);
          }
        }} 
      />
    );
  },
  consumer: props => (
    <ConsumerNode 
      {...props} 
      onClick={() => {
        if (props.selectNode) {
          props.selectNode(props.id);
        }
      }} 
    />
  ),
  broker: props => (
    <BrokerNode 
      {...props} 
      isCurrentBroker={props.currentObjects?.broker === props.id} 
      onClick={() => {
        if (props.selectNode) {
          props.selectNode(props.id);
        }
      }}
    />
  ),  
  topic: props => (
    <TopicNode 
      {...props} 
      selected={props.selected}
      isCurrentTopic={props.currentObjects?.topic === props.id}
      onClick={() => {
        if (props.selectNode) {
          props.selectNode(props.id);
        }
      }} 
    />
  ),
  partition: props => (
    <PartitionNode 
      {...props} 
      isCurrentPartition={props.currentObjects?.partition === props.id}
      onClick={() => {
        if (props.selectNode) {
          props.selectNode(props.id);
        }
      }} 
    />
  )
};

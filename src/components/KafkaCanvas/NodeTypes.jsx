import { BrokerNode, TopicNode, ConsumerNode, ProducerNode, PartitionNode } from '../Nodes/index.js';

export const NodeTypes = {
  Producer: props => {
    return (
      <ProducerNode 
        {...props} 
      />
    );
  },
  Consumer: props => (
    <ConsumerNode 
      {...props} 
      onClick={() => {
        if (props.selectNode) {
          props.selectNode(props.id);
        }
      }} 
    />
  ),
  Broker: props => (
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
  Topic: props => (
    <TopicNode 
      {...props} 
      selected={props.selected}
      isCurrentTopic={props.currentObjects?.topic === props.id}
      onClick={() => {
        if (props.selectNode) {
          props.selectNode(props.id);
        }
      }} 
      onDuplicateTopic={props.onDuplicateTopic}
    />
  ),
  Partition: props => (
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

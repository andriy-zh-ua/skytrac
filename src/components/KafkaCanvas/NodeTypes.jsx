import { BrokerNode, TopicNode, ConsumerNode, ProducerNode, PartitionNode } from '../Nodes/index.js';

// export const NodeTypes = {
//   Producer: ProducerNode,
//   Consumer: ConsumerNode,
//   Broker: BrokerNode,
//   Topic: TopicNode,
//   Partition: PartitionNode
// };

export const nodeTypes = {
  producer: ProducerNode,
  broker: BrokerNode,
  topic: TopicNode,
  consumer: ConsumerNode,
  partition: PartitionNode,
};
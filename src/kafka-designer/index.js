// Main export file for Kafka Architecture classes
export { KafkaBroker } from './KafkaBroker.js';
export { KafkaPartition } from './KafkaPartition.js';
export { KafkaTopic } from './KafkaTopic.js';
export { KafkaProducer } from './KafkaProducer.js';
export { KafkaConsumer } from './KafkaConsumer.js';
export { KafkaCluster } from './KafkaCluster.js';

// Example usage
import { KafkaBroker, KafkaPartition, KafkaTopic, KafkaProducer, KafkaConsumer, KafkaCluster } from './index.js';

// Example: Create a complete Kafka cluster
export function createExampleCluster() {
  // Create brokers
  const broker1 = new KafkaBroker({
    id: 'broker-1',
    host: 'localhost',
    port: 9092,
    controller: true
  });

  const broker2 = new KafkaBroker({
    id: 'broker-2',
    host: 'localhost',
    port: 9093,
    controller: false
  });

  const broker3 = new KafkaBroker({
    id: 'broker-3',
    host: 'localhost',
    port: 9094,
    controller: false
  });

  // Create topic
  const topic = new KafkaTopic({
    name: 'civilian_topic',
    partitions: 3,
    replicationFactor: 3,
    retentionMs: 604800000, // 7 days
    cleanupPolicy: 'delete'
  });

  // Create producer
  const producer = new KafkaProducer({
    id: 'producer-1',
    clientId: 'skytrac-producer',
    bootstrapServers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
    acks: 'all',
    retries: 3,
    batchSize: 16384,
    lingerMs: 5,
    compressionType: 'gzip'
  });

  // Create consumers
  const consumer1 = new KafkaConsumer({
    id: 'consumer-1',
    groupId: 'skytrac-group',
    clientId: 'skytrac-consumer-1',
    bootstrapServers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
    autoOffsetReset: 'latest',
    enableAutoCommit: true,
    autoCommitIntervalMs: 1000,
    sessionTimeoutMs: 30000,
    heartbeatIntervalMs: 3000,
    maxPollRecords: 500
  });

  const consumer2 = new KafkaConsumer({
    id: 'consumer-2',
    groupId: 'skytrac-group',
    clientId: 'skytrac-consumer-2',
    bootstrapServers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
    autoOffsetReset: 'latest',
    enableAutoCommit: true,
    autoCommitIntervalMs: 1000,
    sessionTimeoutMs: 30000,
    heartbeatIntervalMs: 3000,
    maxPollRecords: 500
  });

  // Create cluster
  const cluster = new KafkaCluster({
    name: 'skytrac-cluster',
    brokers: [broker1, broker2, broker3],
    topics: [topic],
    producers: [producer],
    consumers: [consumer1, consumer2]
  });

  return cluster;
}

// Example: Canvas integration
export function getCanvasData(cluster) {
  return {
    nodes: cluster.getCanvasNodes(),
    edges: cluster.getCanvasEdges()
  };
}

// Example: Simulate message flow
export async function simulateMessageFlow(cluster, topicName, messageCount = 10) {
  const producer = cluster.producers[0];
  const consumers = cluster.consumers;

  // Connect producer and consumers
  producer.connect();
  consumers.forEach(consumer => consumer.connect());

  // Assign partitions to consumers
  const topic = cluster.getTopic(topicName);
  const assignments = [];

  topic.getAllPartitions().forEach((partition, index) => {
    const consumerIndex = index % consumers.length;
    assignments.push({
      topic: topicName,
      partition: partition.id,
      currentOffset: 0,
      committedOffset: 0
    });
  });

  consumers.forEach((consumer, index) => {
    const consumerAssignments = assignments.filter((_, i) => i % consumers.length === index);
    consumer.assignPartitions(consumerAssignments);
  });

  // Produce messages
  const messages = [];
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      topic: topicName,
      key: `key-${i}`,
      value: `message-${i}`,
      timestamp: Date.now()
    });
  }

  await producer.produceBatch(messages);

  // Consume messages
  const consumedMessages = [];
  for (const consumer of consumers) {
    for (const assignment of consumer.getAllAssignments()) {
      const messages = await consumer.consume(assignment.topic, assignment.partition, 5);
      consumedMessages.push(...messages);
    }
  }

  // Commit offsets
  for (const consumer of consumers) {
    await consumer.commitOffsets();
  }

  return {
    produced: messageCount,
    consumed: consumedMessages.length,
    producerStats: producer.stats,
    consumerStats: consumers.map(c => ({
      id: c.id,
      messagesConsumed: c.messagesConsumed,
      totalLag: c.getTotalLag()
    }))
  };
}

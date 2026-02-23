import { KafkaBroker } from './KafkaBroker.js';
import { KafkaTopic } from './KafkaTopic.js';
import { KafkaProducer } from './KafkaProducer.js';
import { KafkaConsumer } from './KafkaConsumer.js';

export class KafkaCluster {
  constructor(config) {
    this.config = config;
    this.createdAt = new Date();
    this.validateCluster();
  }

  // Getters
  get name() { return this.config.name; }
  get brokers() { return [...this.config.brokers]; }
  get topics() { return [...this.config.topics]; }
  get producers() { return [...this.config.producers]; }
  get consumers() { return [...this.config.consumers]; }
  get standalonePartitions() { return [...this.config.standalonePartitions]; }
  get created() { return this.createdAt; }

  // Broker management
  addBroker(broker) {
    this.config.brokers.push(broker);
  }

  removeBroker(brokerId) {
    this.config.brokers = this.config.brokers.filter(b => b.id !== brokerId);
  }

  getBroker(brokerId) {
    return this.config.brokers.find(b => b.id === brokerId);
  }
  
  // Topic management
  addTopic(topic, brokerId) {
    // Add topic to specific broker
    const broker = this.getBroker(brokerId);
    if (!broker) {
      throw new Error(`Broker ${brokerId} not found`);
    }
    
    // Assign topic to broker
    broker.assignTopic(topic);
    
    // // Handle partition assignment
    // this.assignTopicToBrokers(topic);
  }

  removeTopic(topicName) {
    // Remove topic from all brokers (topics are stored under brokers)
    this.config.brokers.forEach(broker => broker.removeTopic(topicName));
  }

  getTopic(topicName) {
    // Search for topic in all brokers (topics are stored under brokers)
    for (const broker of this.config.brokers) {
      const topic = broker.getTopic(topicName);
      if (topic) {
        return topic;
      }
    }
    return null;
  }

  // Add partition to a specific topic
  addPartition(partition, brokerId, topicId) {
    // Get the specific broker
    const broker = this.getBroker(brokerId);
    if (!broker) {
      throw new Error(`Broker ${brokerId} not found`);
    }
    
    // Get the topic from that broker
    const topic = broker.getTopic(topicId);
    if (!topic) {
      throw new Error(`Topic ${topicId} not found in broker ${brokerId}`);
    }
    
    // Assign partition to topic
    topic.assignPartition(partition);
  }

  // assignTopicToBrokers(topic) {
  //   const healthyBrokers = this.config.brokers.filter(b => b.healthStatus);
  //   const replicationFactor = Math.min(topic.replicationFactor, healthyBrokers.length);

  //   topic.getAllPartitions().forEach(partition => {
  //     // Assign leader
  //     const leaderIndex = partition.id % healthyBrokers.length;
  //     const leader = healthyBrokers[leaderIndex];
      
  //     // Assign replicas
  //     const replicas = [];
  //     for (let i = 0; i < replicationFactor; i++) {
  //       const replicaIndex = (leaderIndex + i) % healthyBrokers.length;
  //       replicas.push(healthyBrokers[replicaIndex].id);
  //     }

  //     // Update partition assignment
  //     topic.assignPartitionLeader(partition.id, leader.id);
  //     topic.setPartitionReplicas(partition.id, replicas);

  //     // Update broker topic assignments
  //     replicas.forEach(brokerId => {
  //       const broker = this.getBroker(brokerId);
  //       if (broker) {
  //         broker.assignTopic(topic); // Pass the topic object, not the name
  //       }
  //     });
  //   });
  // }

  // Producer management
  addProducer(producer) {
    this.config.producers.push(producer);
  }

  removeProducer(producerId) {
    this.config.producers = this.config.producers.filter(p => p.id !== producerId);
  }

  getProducer(producerId) {
    return this.config.producers.find(p => p.id === producerId);
  }

  // Consumer management
  addConsumer(consumer) {
    this.config.consumers.push(consumer);
  }

  removeConsumer(consumerId) {
    this.config.consumers = this.config.consumers.filter(c => c.id !== consumerId);
  }

  getConsumer(consumerId) {
    return this.config.consumers.find(c => c.id === consumerId);
  }

  getConsumersByGroup(groupId) {
    return this.config.consumers.filter(c => c.groupId === groupId);
  }

  // Standalone partition management
  addStandalonePartition(partition, brokerId) {
    const broker = this.getBroker(brokerId);
    if (!broker) {
      throw new Error(`Broker ${brokerId} not found`);
    }
    broker.addStandalonePartition(partition);
  }

  removeStandalonePartition(partitionId) {
    // Remove from all brokers
    this.config.brokers.forEach(broker => {
      broker.removeStandalonePartition(partitionId);
    });
  }

  getStandalonePartition(partitionId) {
    // Search in all brokers
    for (const broker of this.config.brokers) {
      const partition = broker.getStandalonePartition(partitionId);
      if (partition) {
        return partition;
      }
    }
    return null;
  }

  // Cluster health and statistics
  isHealthy() {
    return this.config.brokers.every(b => b.healthStatus) &&
           this.config.topics.every(t => t.isHealthy());
  }

  getTotalPartitionCount() {
    const topicPartitionCount = this.config.topics.reduce((total, topic) => 
      total + topic.partitionCount, 0);
    
    const standalonePartitionCount = this.config.standalonePartitions.length;
    
    return topicPartitionCount + standalonePartitionCount;
  }

  getClusterStats() {
    const partitionCount = this.getTotalPartitionCount();
     
    const totalMessages = this.config.topics.reduce((total, topic) => 
      total + topic.getTotalMessages(), 0);

    return {
      brokerCount: this.config.brokers.length,
      topicCount: this.config.topics.length,
      partitionCount,
      producerCount: this.config.producers.length,
      consumerCount: this.config.consumers.length,
      totalMessages,
      healthStatus: this.isHealthy()
    };
  }

  // Validation
  validateCluster() {
    // Only validate if we have brokers - allow empty clusters during initialization
    if (this.config.brokers.length > 0) {
      const hasController = this.config.brokers.some(b => b.isController);
      if (!hasController) {
        throw new Error('Cluster must have at least one controller broker');
      }

      // Check for duplicate broker IDs
      const brokerIds = this.config.brokers.map(b => b.id);
      const uniqueIds = new Set(brokerIds);
      if (brokerIds.length !== uniqueIds.size) {
        throw new Error('Duplicate broker IDs found');
      }
    }

    // Check for duplicate topic names
    const topicNames = this.config.topics.map(t => t.name);
    const uniqueTopicNames = new Set(topicNames);
    if (topicNames.length !== uniqueTopicNames.size) {
      throw new Error('Duplicate topic names found');
    }
  }

  // Canvas integration helpers
  getCanvasNodes() {
    const nodes = [];

    // Broker nodes
    this.config.brokers.forEach(broker => {
      nodes.push({
        id: broker.id,
        type: 'broker',
        data: broker.toJSON(),
        position: { x: 0, y: 0 } // Will be set by canvas
      });
    });

    // Topic nodes - collect from all brokers
    this.config.brokers.forEach(broker => {
      if (broker.topics) {
        broker.topics.forEach(topic => {
          nodes.push({
            id: topic.name,
            type: 'topic',
            parentId: broker.id,
            extent: 'parent',
            draggable: false,
            data: topic.toJSON(),
            position: { x: 0, y: 0 } // Will be set by canvas
          });
        });
      }
    });

    // Partition nodes
    // 1. Collect partitions from all topics
    this.config.brokers.forEach(broker => {
      broker.topics.forEach(topic => {
        topic.partitions.forEach(partition => {
          nodes.push({
            id: partition.id,
            type: 'partition',
            parentId: topic.name,
            extent: 'parent',
            draggable: false,
            data: partition,
            position: { x: 0, y: 0 } // Will be set by canvas
          });
        });
      });
    });
    // 2. Collect standalone partitions from brokers
    this.config.brokers.forEach(broker => {
      broker.getAllStandalonePartitions().forEach(partition => {
        nodes.push({
          id: partition.id,
          type: 'partition',
          parentId: broker.id,
          extent: 'parent',
          draggable: false,
          data: partition,
          position: { x: 0, y: 0 } // Will be set by canvas
        });
      });
    });

    // Producer nodes
    this.config.producers.forEach(producer => {
      nodes.push({
        id: producer.id,
        type: 'producer',
        label: `Producer ${producer.id}`,
        data: producer.toJSON(),
        position: { x: 0, y: 0 } // Will be set by canvas
      });
    });

    // Consumer nodes
    this.config.consumers.forEach(consumer => {
      nodes.push({
        id: consumer.id,
        type: 'consumer',
        label: `Consumer ${consumer.id}`,
        data: consumer.toJSON(),
        position: { x: 0, y: 0 } // Will be set by canvas
      });
    });

    return nodes;
  }

  getCanvasEdges() {
    const edges = [];

    // Broker to topic edges
    this.config.topics.forEach(topic => {
      topic.getAllPartitions().forEach(partition => {
        edges.push({
          id: `${topic.name}-${partition.id}-leader`,
          source: partition.leader,
          target: topic.name,
          type: 'leader',
          label: `Partition ${partition.id}`
        });
      });
    });

    // Producer to topic edges
    this.config.producers.forEach(producer => {
      // This would be based on actual producer usage
      this.config.topics.forEach(topic => {
        edges.push({
          id: `${producer.id}-${topic.name}`,
          source: producer.id,
          target: topic.name,
          type: 'produce'
        });
      });
    });

    // Consumer to topic edges
    this.config.consumers.forEach(consumer => {
      consumer.getAllAssignments().forEach(assignment => {
        edges.push({
          id: `${consumer.id}-${assignment.topic}-${assignment.partition}`,
          source: consumer.id,
          target: assignment.topic,
          type: 'consume',
          label: `Partition ${assignment.partition}`
        });
      });
    });

    return edges;
  }

  // Serialization
  toJSON() {
    return {
      name: this.config.name,
      brokers: this.config.brokers.map(b => b.toJSON()),
      topics: [], // Topics are now included in broker JSON
      producers: this.config.producers.map(p => p.toJSON()),
      consumers: this.config.consumers.map(c => c.toJSON()),
      standalonePartitions: this.config.standalonePartitions.map(p => ({
        id: p.id,
        topic: p.topic,
        offset: p.offset,
        size: p.size,
        createdAt: p.createdAt
      })),
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(data) {
    const brokers = (data.brokers || []).map(b => KafkaBroker.fromJSON(b));
    const topics = (data.topics || []).map(t => KafkaTopic.fromJSON(t));
    const producers = (data.producers || []).map(p => KafkaProducer.fromJSON(p));
    const consumers = (data.consumers || []).map(c => KafkaConsumer.fromJSON(c));

    const cluster = new KafkaCluster({
      name: data.name,
      brokers,
      topics,
      producers,
      consumers
    });

    cluster.createdAt = new Date(data.createdAt || Date.now());
    return cluster;
  }
}

import { KafkaPartition } from './KafkaPartition.js';

export class KafkaTopic {
  constructor(config) {
    this.config = config;
    this.partitions = new Map(); // Store partition objects
    this.createdAt = new Date();
    this.initializePartitions();
  }

  // Validate that topic has at least one partition
  validateTopic() {
    if (!this.partitions || this.partitions.size === 0) {
      throw new Error('KafkaTopic must contain at least one KafkaPartition to be valid');
    }
  }

  initializePartitions() {
    // Only create partitions if explicitly specified
    const partitionCount = this.config.partitions || 0;
    
    for (let i = 0; i < partitionCount; i++) {
      const partitionConfig = {
        id: i,
        leader: '',
        replicas: [],
        isr: []
      };
      this.partitions.set(i, new KafkaPartition(partitionConfig));
    }
  }

  // Getters
  get name() { return this.config.name; }
  get partitionCount() { return this.partitions.size; }
  get replicationFactor() { return this.config.replicationFactor; }
  get retentionMs() { return this.config.retentionMs; }
  get cleanupPolicy() { return this.config.cleanupPolicy; }
  get created() { return this.createdAt; }

  // Partition management
  getPartition(id) {
    return this.partitions.get(id);
  }

  getAllPartitions() {
    return Array.from(this.partitions.values());
  }

  assignPartitionLeader(partitionId, brokerId) {
    const partition = this.partitions.get(partitionId);
    if (partition) {
      partition.config.leader = brokerId;
    }
  }

  setPartitionReplicas(partitionId, replicas) {
    const partition = this.partitions.get(partitionId);
    if (partition) {
      partition.config.replicas = [...replicas];
      partition.config.isr = [...replicas];
    }
  }

  // Topic operations
  isHealthy() {
    const partitions = this.getAllPartitions();
    // If no partitions, topic is not healthy
    if (partitions.length === 0) {
      return false;
    }
    return partitions.every(partition => partition.isHealthy());
  }

  getTotalMessages() {
    return this.getAllPartitions().reduce((total, partition) => 
      total + partition.currentOffset, 0);
  }

  toJSON() {
    return {
      ...this.config,
      partitions: this.getAllPartitions().map(p => p.toJSON ? p.toJSON() : p),
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(data) {
    const topic = new KafkaTopic(data);
    topic.createdAt = new Date(data.createdAt);
    
    // Restore partitions
    data.partitions?.forEach(partitionData => {
      const partition = KafkaPartition.fromJSON(partitionData);
      topic.partitions.set(partition.id, partition);
    });
    
    return topic;
  }
}

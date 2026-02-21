class KafkaPartition {
  constructor(config) {
    this.config = config;
    this.offset = 0;
  }

  // Getters
  get id() { return this.config.id; }
  get leader() { return this.config.leader; }
  get replicas() { return [...this.config.replicas]; }
  get isr() { return [...this.config.isr]; }
  get currentOffset() { return this.offset; }

  // Partition operations
  incrementOffset() {
    this.offset++;
  }

  setOffset(newOffset) {
    this.offset = Math.max(0, newOffset);
  }

  updateISR(newISR) {
    this.config.isr = [...newISR];
  }

  isHealthy() {
    return this.config.isr.length > 0;
  }

  // Leadership management
  setLeader(brokerId) {
    this.config.leader = brokerId;
  }

  setReplicas(replicas) {
    this.config.replicas = [...replicas];
    this.config.isr = [...replicas]; // Initially, all replicas are in sync
  }

  // Replica management
  addReplica(brokerId) {
    if (!this.config.replicas.includes(brokerId)) {
      this.config.replicas.push(brokerId);
      this.config.isr.push(brokerId); // Add to ISR initially
    }
  }

  removeReplica(brokerId) {
    this.config.replicas = this.config.replicas.filter(id => id !== brokerId);
    this.config.isr = this.config.isr.filter(id => id !== brokerId);
  }

  removeFromISR(brokerId) {
    this.config.isr = this.config.isr.filter(id => id !== brokerId);
  }

  addToISR(brokerId) {
    if (this.config.replicas.includes(brokerId) && !this.config.isr.includes(brokerId)) {
      this.config.isr.push(brokerId);
    }
  }

  // Statistics
  getReplicaCount() {
    return this.config.replicas.length;
  }

  getISRCount() {
    return this.config.isr.length;
  }

  getLag() {
    return this.config.replicas.length - this.config.isr.length;
  }

  // Serialization
  toJSON() {
    return {
      ...this.config,
      offset: this.offset
    };
  }

  static fromJSON(data) {
    const partition = new KafkaPartition(data);
    partition.setOffset(data.offset || 0);
    return partition;
  }
}

export default KafkaPartition;

class KafkaConsumer {
  constructor(config) {
    this.config = config;
    this.assignments = new Map();
    this.messagesConsumedCount = 0;
    this.lastCommitTime = new Date();
    this.isConnected = false;
    this.isPaused = false;
  }

  // Getters
  get id() { return this.config.id; }
  get groupId() { return this.config.groupId; }
  get clientId() { return this.config.clientId; }
  get status() {
    if (!this.isConnected) return 'disconnected';
    return this.isPaused ? 'paused' : 'connected';
  }
  get messagesConsumed() { return this.messagesConsumedCount; }
  get assignmentCount() { return this.assignments.size; }

  // Connection management
  connect() {
    this.isConnected = true;
  }

  disconnect() {
    this.isConnected = false;
    this.assignments.clear();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  // Assignment management
  assignPartitions(assignments) {
    assignments.forEach(assignment => {
      const key = `${assignment.topic}-${assignment.partition}`;
      this.assignments.set(key, assignment);
    });
  }

  unassignPartition(topic, partition) {
    const key = `${topic}-${partition}`;
    this.assignments.delete(key);
  }

  getAssignment(topic, partition) {
    const key = `${topic}-${partition}`;
    return this.assignments.get(key);
  }

  getAllAssignments() {
    return Array.from(this.assignments.values());
  }

  // Message consumption
  async consume(topic, partition, maxMessages = 1) {
    if (!this.isConnected || this.isPaused) {
      throw new Error('Consumer not ready for consumption');
    }

    const assignment = this.getAssignment(topic, partition);
    if (!assignment) {
      throw new Error(`No assignment for topic ${topic}, partition ${partition}`);
    }

    try {
      // Simulate message consumption
      const messages = await this.simulateConsumption(assignment, maxMessages);
      
      // Update offset
      if (messages.length > 0) {
        assignment.currentOffset += messages.length;
        this.messagesConsumedCount += messages.length;
      }

      return messages;
    } catch (error) {
      throw new Error(`Consumption failed: ${error}`);
    }
  }

  async simulateConsumption(assignment, maxMessages) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    
    // Simulate available messages (random between 0 and maxMessages)
    const messageCount = Math.floor(Math.random() * (maxMessages + 1));
    const messages = [];

    for (let i = 0; i < messageCount; i++) {
      messages.push({
        topic: assignment.topic,
        partition: assignment.partition,
        offset: assignment.currentOffset + i,
        key: `key-${assignment.currentOffset + i}`,
        value: `message-${assignment.currentOffset + i}`,
        timestamp: Date.now()
      });
    }

    return messages;
  }

  // Offset management
  async commitOffsets(topic, partition) {
    if (topic && partition) {
      const assignment = this.getAssignment(topic, partition);
      if (assignment) {
        assignment.committedOffset = assignment.currentOffset;
      }
    } else {
      // Commit all offsets
      this.assignments.forEach(assignment => {
        assignment.committedOffset = assignment.currentOffset;
      });
    }
    
    this.lastCommitTime = new Date();
  }

  getLag(topic, partition) {
    const assignment = this.getAssignment(topic, partition);
    if (!assignment) return 0;
    
    return assignment.currentOffset - assignment.committedOffset;
  }

  getTotalLag() {
    let totalLag = 0;
    this.assignments.forEach(assignment => {
      totalLag += this.getCurrentLag(assignment);
    });
    return totalLag;
  }

  getCurrentLag(assignment) {
    return assignment.currentOffset - assignment.committedOffset;
  }

  // Configuration updates
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  // Reset statistics
  resetStats() {
    this.messagesConsumedCount = 0;
    this.lastCommitTime = new Date();
  }

  toJSON() {
    return {
      ...this.config,
      assignments: this.getAllAssignments(),
      messagesConsumed: this.messagesConsumedCount,
      isConnected: this.isConnected,
      isPaused: this.isPaused,
      lastCommitTime: this.lastCommitTime.toISOString()
    };
  }

  static fromJSON(data) {
    const consumer = new KafkaConsumer(data);
    consumer.assignPartitions(data.assignments || []);
    consumer.messagesConsumedCount = data.messagesConsumed || 0;
    consumer.isConnected = data.isConnected || false;
    consumer.isPaused = data.isPaused || false;
    consumer.lastCommitTime = new Date(data.lastCommitTime || Date.now());
    return consumer;
  }
}

export default KafkaConsumer;
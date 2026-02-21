export class KafkaProducer {
  constructor(config) {
    this.config = config;
    this.messagesSent = 0;
    this.errors = 0;
    this.isConnected = false;
  }

  // Getters
  get id() { return this.config.id; }
  get clientId() { return this.config.clientId; }
  get bootstrapServers() { return [...this.config.bootstrapServers]; }
  get acks() { return this.config.acks.toString(); }
  get status() {
    return this.isConnected ? 'connected' : 'disconnected';
  }
  get stats() {
    const total = this.messagesSent + this.errors;
    return {
      messagesSent: this.messagesSent,
      errors: this.errors,
      errorRate: total > 0 ? this.errors / total : 0
    };
  }

  // Connection management
  connect() {
    this.isConnected = true;
  }

  disconnect() {
    this.isConnected = false;
  }

  // Message production
  async produce(message) {
    if (!this.isConnected) {
      throw new Error('Producer not connected');
    }

    try {
      // Simulate message production
      await this.simulateProduction(message);
      this.messagesSent++;
    } catch (error) {
      this.errors++;
      throw error;
    }
  }

  async produceBatch(messages) {
    if (!this.isConnected) {
      throw new Error('Producer not connected');
    }

    const results = await Promise.allSettled(
      messages.map(msg => this.produce(msg))
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      throw new Error(`${failed} messages failed to produce`);
    }
  }

  async simulateProduction(message) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    // Simulate occasional failures (5% error rate)
    if (Math.random() < 0.05) {
      throw new Error('Production failed');
    }
  }

  // Configuration updates
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  // Reset statistics
  resetStats() {
    this.messagesSent = 0;
    this.errors = 0;
  }

  toJSON() {
    return {
      ...this.config,
      messagesSent: this.messagesSent,
      errors: this.errors,
      isConnected: this.isConnected
    };
  }

  static fromJSON(data) {
    const producer = new KafkaProducer(data);
    producer.messagesSent = data.messagesSent || 0;
    producer.errors = data.errors || 0;
    producer.isConnected = data.isConnected || false;
    return producer;
  }
}
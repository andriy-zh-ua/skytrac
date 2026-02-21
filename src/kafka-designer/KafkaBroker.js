class KafkaBroker {
  constructor(config) {
    this.config = config;
    this.topics = new Set();
    this.isHealthy = true;
  }

  // Getters
  get id() { return this.config.id; }
  get host() { return this.config.host; }
  get port() { return this.config.port; }
  get address() { return `${this.host}:${this.port}`; }
  get isController() { return this.config.controller || false; }
  get topicCount() { return this.topics.size; }
  get healthStatus() { return this.isHealthy; }

  // Topic management
  assignTopic(topicName) {
    this.topics.add(topicName);
  }

  removeTopic(topicName) {
    this.topics.delete(topicName);
  }

  hasTopic(topicName) {
    return this.topics.has(topicName);
  }

  // Health management
  setHealth(healthy) {
    this.isHealthy = healthy;
  }

  // Serialization
  toJSON() {
    return {
      ...this.config,
      topics: Array.from(this.topics),
      isHealthy: this.isHealthy
    };
  }

  static fromJSON(data) {
    const broker = new KafkaBroker(data);
    data.topics?.forEach(topic => broker.assignTopic(topic));
    broker.setHealth(data.isHealthy ?? true);
    return broker;
  }
}

export default KafkaBroker;
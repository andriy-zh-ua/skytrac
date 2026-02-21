export class KafkaBroker {
  constructor(config) {
    this.config = config;
    this.topics = new Map(); // Store topic objects, not just names
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
  assignTopic(topic) {
    this.topics.set(topic.name, topic);
  }

  removeTopic(topicName) {
    this.topics.delete(topicName);
  }

  hasTopic(topicName) {
    return this.topics.has(topicName);
  }

  getTopic(topicName) {
    return this.topics.get(topicName);
  }

  getAllTopics() {
    return Array.from(this.topics.values());
  }

  // Health management
  setHealth(healthy) {
    this.isHealthy = healthy;
  }

  // Serialization
  toJSON() {
    return {
      ...this.config,
      topics: Array.from(this.topics.values()).map(topic => topic.toJSON()),
      isHealthy: this.isHealthy
    };
  }

  static fromJSON(data) {
    const broker = new KafkaBroker(data);
    // Note: Topics will be reconstructed from JSON at cluster level
    broker.setHealth(data.isHealthy ?? true);
    return broker;
  }
}
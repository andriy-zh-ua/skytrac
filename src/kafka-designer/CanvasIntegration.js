import { useState, useCallback } from 'react';
import { KafkaCluster } from './KafkaCluster.js';
import { KafkaBroker } from './KafkaBroker.js';
import { KafkaTopic } from './KafkaTopic.js';
import { KafkaProducer } from './KafkaProducer.js';
import { KafkaConsumer } from './KafkaConsumer.js';

export class KafkaCanvasIntegration {
  constructor() {
    this.cluster = new KafkaCluster({
      name: 'skytrac-cluster',
      brokers: [],
      topics: [],
      producers: [],
      consumers: [],
      standalonePartitions: []
    });
    this.nodes = [];
    this.edges = [];
  }

  // Event Handlers
  handleAddBroker(position) {
    // Set broker config
    const brokerConfig = {
      id: `broker-${Date.now()}`,
      host: 'localhost',
      port: 9092 + this.cluster.brokers.length,
      controller: this.cluster.brokers.length === 0
    };
    
    // Create a new broker
    const newBroker = new KafkaBroker(brokerConfig);
    // Add broker to cluster
    this.cluster.addBroker(newBroker);
    // Update canvas
    this.updateCanvas();
    
    return {
      broker: newBroker,
      nodes: this.nodes,
      edges: this.edges
    };
  }

  handleAddTopic(position, config = {}) {
    // Set topic config
    const topicConfig = {
      name: config.name || `topic-${Date.now()}`,
      partitions: config.partitions || 0,
    };

    // Create a new topic
    const newTopic = new KafkaTopic(topicConfig);
    // Add topic to cluster
    this.cluster.addTopic(newTopic, config.brokerId);
    // Update canvas
    this.updateCanvas();
    
    return {
      topic: newTopic,
      nodes: this.nodes,
      edges: this.edges
    };
  }

  handleAddProducer(position, config = {}) {
    const producerConfig = {
      id: config.id || `producer-${Date.now()}`,
      clientId: config.clientId || `producer-client-${Date.now()}`,
      bootstrapServers: this.cluster.brokers.map(b => b.address),
      acks: config.acks || 'all',
      retries: config.retries || 3,
      batchSize: config.batchSize || 16384,
      lingerMs: config.lingerMs || 5,
      compressionType: config.compressionType || 'gzip'
    };

    const newProducer = new KafkaProducer(producerConfig);
    this.cluster.addProducer(newProducer);
    this.updateCanvas();
    
    return {
      producer: newProducer,
      nodes: this.nodes,
      edges: this.edges
    };
  }

  handleAddConsumer(position, config = {}) {
    const consumerConfig = {
      id: config.id || `consumer-${Date.now()}`,
      groupId: config.groupId || `group-${Date.now()}`,
      clientId: config.clientId || `consumer-client-${Date.now()}`,
      bootstrapServers: this.cluster.brokers.map(b => b.address),
      autoOffsetReset: config.autoOffsetReset || 'latest',
      enableAutoCommit: config.enableAutoCommit !== false,
      autoCommitIntervalMs: config.autoCommitIntervalMs || 1000,
      sessionTimeoutMs: config.sessionTimeoutMs || 30000,
      heartbeatIntervalMs: config.heartbeatIntervalMs || 3000,
      maxPollRecords: config.maxPollRecords || 500
    };

    const newConsumer = new KafkaConsumer(consumerConfig);
    this.cluster.addConsumer(newConsumer);
    this.updateCanvas();
    
    return {
      consumer: newConsumer,
      nodes: this.nodes,
      edges: this.edges
    };
  }

  handleAddPartition(position, config = {}) {
    // Partitions are created as part of topics, so this method
    // would typically be called when a topic is created or modified
    // For now, we'll create a standalone partition for visualization
    const partitionConfig = {
      id: config.id || `partition-${Date.now()}`,
      topic: config.topic || 'default-topic',
      leader: config.leader || null,
      replicas: config.replicas || [],
      isr: config.isr || []
    };

    // Note: In a real Kafka cluster, partitions are managed by topics
    // This is a simplified implementation for visualization purposes
    const newPartition = {
      ...partitionConfig,
      offset: 0,
      size: 0,
      createdAt: new Date()
    };

    // Add to cluster (require brokerId for standalone partitions)
    if (!config.brokerId) {
      throw new Error('Standalone partition must be assigned to a broker');
    }
    this.cluster.addStandalonePartition(newPartition, config.brokerId);

    // Add to visualization nodes
    this.nodes.push({
      id: newPartition.id,
      type: 'partition',
      label: `Partition ${newPartition.id}`,
      position: position || { x: 0, y: 0 }
    });

    this.updateCanvas();
    
    return {
      partition: newPartition,
      nodes: this.nodes,
      edges: this.edges
    };
  }

  handleRemoveNode(nodeId, nodeType) {
    switch (nodeType) {
      case 'broker':
        this.cluster.removeBroker(nodeId);
        break;
      case 'topic':
        this.cluster.removeTopic(nodeId);
        break;
      case 'producer':
        this.cluster.removeProducer(nodeId);
        break;
      case 'consumer':
        this.cluster.removeConsumer(nodeId);
        break;
      case 'partition':
        // Partitions are handled as part of topics in the cluster
        // For visualization, we'll just remove it from the nodes
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        break;
    }
    
    this.updateCanvas();
    return { nodes: this.nodes, edges: this.edges };
  }

  handleConnectNodes(sourceId, targetId, connectionType) {
    // This handles creating connections between nodes
    // For example, connecting a producer to a topic
    if (connectionType === 'produce') {
      const producer = this.cluster.getProducer(sourceId);
      const topic = this.cluster.getTopic(targetId);
      
      if (producer && topic) {
        // Add edge for visualization
        this.edges.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'produce',
          animated: true
        });
      }
    } else if (connectionType === 'consume') {
      const consumer = this.cluster.getConsumer(sourceId);
      const topic = this.cluster.getTopic(targetId);
      
      if (consumer && topic) {
        // Assign partitions to consumer
        const assignments = topic.getAllPartitions().map(partition => ({
          topic: topic.name,
          partition: partition.id,
          currentOffset: 0,
          committedOffset: 0
        }));
        
        consumer.assignPartitions(assignments);
        this.updateCanvas();
      }
    }
    
    return { nodes: this.nodes, edges: this.edges };
  }

  // Update canvas data
  updateCanvas() {
    const clusterData = this.cluster.getCanvasNodes();
    const clusterEdges = this.cluster.getCanvasEdges();
    
    // Merge with existing positions
    this.nodes = clusterData.map(node => {
      const existing = this.nodes.find(n => n.id === node.id);
      return {
        ...node,
        position: existing?.position || node.position,
        data: {
          ...node.data,
          // Add event handlers for React Flow
          onDelete: () => this.handleRemoveNode(node.id, node.type)
        }
      };
    });
    
    this.edges = clusterEdges;
  }

  // Get current state
  getState() {
    return {
      cluster: this.cluster,
      nodes: this.nodes,
      edges: this.edges,
      stats: this.cluster.getClusterStats()
    };
  }

  // Load from saved state
  loadState(savedState) {
    this.cluster = KafkaCluster.fromJSON(savedState.cluster);
    this.nodes = savedState.nodes || [];
    this.edges = savedState.edges || [];
    this.updateCanvas();
  }

  // Save current state
  saveState() {
    return {
      cluster: this.cluster.toJSON(),
      nodes: this.nodes,
      edges: this.edges
    };
  }
}

// React Hook Example
export function useKafkaCanvas() {
  const [integration] = useState(() => new KafkaCanvasIntegration());
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const onNodeAdd = useCallback((nodeType, position, config) => {
    const result = integration[`handleAdd${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`](position, config);
    setNodes(result.nodes);
    setEdges(result.edges);
    return result;
  }, [integration]);

  const onNodeRemove = useCallback((nodeId, nodeType) => {
    const result = integration.handleRemoveNode(nodeId, nodeType);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [integration]);

  const onConnect = useCallback((params) => {
    const result = integration.handleConnectNodes(params.source, params.target, params.type);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [integration]);

  return {
    nodes,
    edges,
    onNodeAdd,
    onNodeRemove,
    onConnect,
    cluster: integration.cluster,
    stats: integration.cluster.getClusterStats()
  };
}

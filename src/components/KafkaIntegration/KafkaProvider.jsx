import { useState, useCallback } from 'react';
import { KafkaCanvasIntegration } from '../../kafka-designer/CanvasIntegration.js';

export const useKafkaProvider = () => {
  const [kafkaIntegration] = useState(() => new KafkaCanvasIntegration());
  const [kafkaStats, setKafkaStats] = useState(kafkaIntegration.cluster.getClusterStats());

  const updateStats = useCallback(() => {
    setKafkaStats(kafkaIntegration.cluster.getClusterStats());
  }, [kafkaIntegration]);

  const handleAddBroker = useCallback((position, config) => {
    const result = kafkaIntegration.handleAddBroker(position, config);
    updateStats();
    return result;
  }, [kafkaIntegration, updateStats]);

  const handleAddTopic = useCallback((position, config) => {
    const result = kafkaIntegration.handleAddTopic(position, config);
    updateStats();
    return result;
  }, [kafkaIntegration, updateStats]);

  const handleAddProducer = useCallback((position, config) => {
    const result = kafkaIntegration.handleAddProducer(position, config);
    updateStats();
    return result;
  }, [kafkaIntegration, updateStats]);

  const handleAddConsumer = useCallback((position, config) => {
    const result = kafkaIntegration.handleAddConsumer(position, config);
    updateStats();
    return result;
  }, [kafkaIntegration, updateStats]);

  const handleAddPartition = useCallback((position, config) => {
    const result = kafkaIntegration.handleAddPartition(position, config);
    updateStats();
    return result;
  }, [kafkaIntegration, updateStats]);

  const handleRemoveNode = useCallback((nodeId, nodeType) => {
    const result = kafkaIntegration.handleRemoveNode(nodeId, nodeType);
    updateStats();
    return result;
  }, [kafkaIntegration, updateStats]);

  const exportSchema = useCallback(() => {
    try {
      if (kafkaIntegration.cluster.brokers.length === 0) {
        throw new Error('Cluster must have at least one broker to export schema');
      }

      kafkaIntegration.cluster.topics.forEach(topic => {
        topic.validateTopic();
      });

      let standalonePartitionCount = 0;
      for (const broker of kafkaIntegration.cluster.brokers) {
        standalonePartitionCount += broker.getAllStandalonePartitions()?.length || 0;
      }
      
      if (standalonePartitionCount === 0) {
        throw new Error('Cluster must have at least one partition to export schema');
      }

      const schema = kafkaIntegration.cluster.toJSON();
      console.log('Kafka Schema:', JSON.stringify(schema, null, 2));
      alert('Schema exported to console! Press F12 to view.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}`);
      console.error('Schema export error:', error);
    }
  }, [kafkaIntegration]);

  return {
    kafkaIntegration,
    kafkaStats,
    handleAddBroker,
    handleAddTopic,
    handleAddProducer,
    handleAddConsumer,
    handleAddPartition,
    handleRemoveNode,
    exportSchema
  };
};

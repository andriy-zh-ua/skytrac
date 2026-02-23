import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';

const CustomAppBar = ({ onAddNode, hasBrokers, onExportSchema/*, kafkaStats */}) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Kafka Architecture Builder
        </Typography>
        <Button color="inherit" onClick={() => onAddNode('producer')}>
          Add Producer
        </Button>
        <Button 
          color="inherit" 
          onClick={() => onAddNode('topic')}
          disabled={!hasBrokers}
        >
          Add Topic
        </Button>
        <Button color="inherit" onClick={() => onAddNode('consumer')}>
          Add Consumer
        </Button>
        <Button color="inherit" onClick={() => onAddNode('broker')}>
          Add Broker
        </Button>
        <Button 
          color="inherit" 
          onClick={() => onAddNode('partition')}
          disabled={!hasBrokers}
        >
          Add Partition
        </Button>
        <Button color="inherit" variant="outlined" sx={{ ml: 2 }} onClick={onExportSchema}>
          Export Schema
        </Button>
        
        {/* Kafka Stats Display */}
        {/* {kafkaStats && (
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              🏢 {kafkaStats.brokerCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              📋 {kafkaStats.topicCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              📊 {kafkaStats.partitionCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              📤 {kafkaStats.producerCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              📥 {kafkaStats.consumerCount}
            </Typography>
            <Typography variant="body2" sx={{ color: kafkaStats.healthStatus ? '#4caf50' : '#f44336' }}>
              {kafkaStats.healthStatus ? '✅' : '❌'}
            </Typography>
          </Box>
        )} */}
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;

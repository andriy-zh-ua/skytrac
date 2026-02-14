import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';

interface AppBarProps {
  onAddNode: (type: 'producer' | 'topic' | 'consumer' | 'broker' | 'partition') => void;
  hasBrokers: boolean;
  onExportSchema: () => void;
}

const CustomAppBar: React.FC<AppBarProps> = ({ onAddNode, hasBrokers, onExportSchema }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Kafka Architecture Builder
        </Typography>
        <Button color="inherit" onClick={() => onAddNode('producer')}>
          Add Producer
        </Button>
        <Button color="inherit" onClick={() => onAddNode('topic')}>
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
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;

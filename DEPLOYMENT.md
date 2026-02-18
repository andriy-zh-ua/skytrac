# Kafka UI Builder

A React-based Kafka architecture builder with drag-and-drop functionality.

## Quick Start

### Development
```bash
npm install
npm start
```

### Build for Production
```bash
npm run build
```

### Docker Build
```bash
docker build -t skytrac .
docker run -p 80:80 skytrac
```

## Deployment Options

### 1. Static Hosting (Recommended)
- Build: `npm run build`
- Deploy the `build/` folder to any static hosting service
- Works with: Netlify, Vercel, GitHub Pages, AWS S3, Firebase

### 2. Docker Deployment
```bash
# Build and run locally
docker build -t skytrac .
docker run --name skytrac -d -p 80:80 --restart unless-stopped skytrac

# Deploy to Docker Hub
docker tag skytrac yourusername/skytrac
docker push yourusername/skytrac
```

### 3. Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skytrac
spec:
  replicas: 2
  selector:
    matchLabels:
      app: skytrac
  template:
    metadata:
      labels:
        app: skytrac
    spec:
      containers:
      - name: skytrac
        image: yourusername/skytrac:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: skytrac-service
spec:
  selector:
    app: skytrac
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## Features
- 🎨 Drag-and-drop Kafka architecture builder
- 📊 Real-time node connections
- 🔄 Producer activation/deactivation
- 📋 Schema export functionality
- 🎯 Topic duplication with "+" button
- 📱 Responsive design

## Environment Variables
No environment variables required. The application runs entirely in the browser.

## Build Output
The build process creates:
- Optimized JavaScript bundles
- Minified CSS
- Compressed assets
- Service Worker for PWA capabilities

## Support
For issues or questions, please check the project documentation.

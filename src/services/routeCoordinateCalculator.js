// Route Coordinate Calculator for geo position calculations
class RouteCoordinateCalculator {
  constructor(routeSegments) {
    this.routeSegments = routeSegments; // Array of {lat, lon} coordinates
    this.segmentDistance = 50; // 50 meters per segment
    this.totalSegments = routeSegments.length;
    
    // Pre-calculate distances between segments
    this.segmentDistances = this.calculateSegmentDistances();
    this.cumulativeDistances = this.calculateCumulativeDistances();
  }
  
  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  // Calculate distances between consecutive segments
  // calculateSegmentDistances() {
  //   const distances = [];
  //   for (let i = 1; i < this.routeSegments.length; i++) {
  //     const dist = this.calculateDistance(
  //       this.routeSegments[i-1].lat,
  //       this.routeSegments[i-1].lon,
  //       this.routeSegments[i].lat,
  //       this.routeSegments[i].lon
  //     );
  //     distances.push(dist);
  //   }
  //   return distances;
  // }
  
  // Calculate cumulative distances from start
  // calculateCumulativeDistances() {
  //   const cumulative = [0];
  //   let total = 0;
  //   for (let i = 0; i < this.segmentDistances.length; i++) {
  //     total += this.segmentDistances[i];
  //     cumulative.push(total);
  //   }
  //   return cumulative;
  // }
  
  // Get coordinates at specific distance from start
  getCoordinatesAtDistance(targetDistance) {
    if (targetDistance <= 0) {
      return this.routeSegments[0];
    }
    
    if (targetDistance >= this.cumulativeDistances[this.cumulativeDistances.length - 1]) {
      return this.routeSegments[this.routeSegments.length - 1];
    }
    
    // Find the segment containing the target distance
    let segmentIndex = 0;
    for (let i = 1; i < this.cumulativeDistances.length; i++) {
      if (this.cumulativeDistances[i] >= targetDistance) {
        segmentIndex = i - 1;
        break;
      }
    }
    
    // Calculate interpolation within the segment
    const segmentStartDistance = this.cumulativeDistances[segmentIndex];
    const segmentEndDistance = this.cumulativeDistances[segmentIndex + 1];
    const segmentProgress = (targetDistance - segmentStartDistance) / 
                           (segmentEndDistance - segmentStartDistance);
    
    // Interpolate between the two points
    const startLat = this.routeSegments[segmentIndex].lat;
    const startLon = this.routeSegments[segmentIndex].lon;
    const endLat = this.routeSegments[segmentIndex + 1].lat;
    const endLon = this.routeSegments[segmentIndex + 1].lon;
    
    const lat = startLat + (endLat - startLat) * segmentProgress;
    const lon = startLon + (endLon - startLon) * segmentProgress;
    
    return { lat, lon };
  }
  
  // Round coordinates to nearest available route segment
  roundToNearestSegment(coordinates) {
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    for (let i = 0; i < this.routeSegments.length; i++) {
      const dist = this.calculateDistance(
        coordinates.lat,
        coordinates.lon,
        this.routeSegments[i].lat,
        this.routeSegments[i].lon
      );
      
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }
    
    return {
      ...this.routeSegments[nearestIndex],
      segmentIndex: nearestIndex,
      distanceToNearest: minDistance
    };
  }
  
  // Get segment index at specific distance
  // getSegmentIndexAtDistance(targetDistance) {
  //   for (let i = 1; i < this.cumulativeDistances.length; i++) {
  //     if (this.cumulativeDistances[i] >= targetDistance) {
  //       return i - 1;
  //     }
  //   }
  //   return this.routeSegments.length - 1;
  // }
  
  // Get total route distance
  getTotalDistance() {
    return this.cumulativeDistances[this.cumulativeDistances.length - 1];
  }
  
  // Get route progress percentage
  // getProgressPercentage(currentDistance) {
  //   return (currentDistance / this.getTotalDistance()) * 100;
  // }
  
  // Get bearing between two points
  // calculateBearing(startLat, startLon, endLat, endLon) {
  //   const dLon = this.toRadians(endLon - startLon);
  //   const lat1 = this.toRadians(startLat);
  //   const lat2 = this.toRadians(endLat);
    
  //   const y = Math.sin(dLon) * Math.cos(lat2);
  //   const x = Math.cos(lat1) * Math.sin(lat2) -
  //             Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
  //   const bearing = Math.atan2(y, x);
  //   return (this.toDegrees(bearing) + 360) % 360;
  // }
  
  // Convert radians to degrees
  // toDegrees(radians) {
  //   return radians * (180 / Math.PI);
  // }
  
  // Get current bearing based on position
  getCurrentBearing(currentDistance) {
    const currentCoords = this.getCoordinatesAtDistance(currentDistance);
    const nextSegmentIndex = Math.min(
      this.getSegmentIndexAtDistance(currentDistance) + 1,
      this.routeSegments.length - 1
    );
    const nextCoords = this.routeSegments[nextSegmentIndex];
    
    return this.calculateBearing(
      currentCoords.lat,
      currentCoords.lon,
      nextCoords.lat,
      nextCoords.lon
    );
  }
}

export default RouteCoordinateCalculator;

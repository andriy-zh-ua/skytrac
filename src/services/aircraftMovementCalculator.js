// Aircraft Movement Calculator for dynamic telemetry generation
class AircraftMovementCalculator {
  constructor(totalDistanceMeters, maxSpeedKmh, maxAltitudeMeters) {
    this.totalDistance = totalDistanceMeters;
    this.maxSpeed = maxSpeedKmh;
    this.maxAltitude = maxAltitudeMeters;
    this.segmentDistance = 50; // 50 meters per segment
    
    // Movement state
    this.currentSpeed = 0; // km/h
    this.currentAltitude = 0; // meters
    this.currentPosition = 0; // meters traveled
    this.timeElapsed = 0; // seconds
    
    // Speed and altitude change rates
    this.speedAccelerationRate = 50; // km/h per second
    this.speedDecelerationRate = 50; // km/h per second
    this.altitudeChangeRate = 100; // meters per second
    
    // Calculate key points for speed management
    this.calculateSpeedPhases();
  }
  
  // Calculate when to start decelerating based on total distance and max speed
  calculateSpeedPhases() {
    // Convert speeds to meters per second for calculations
    const maxSpeedMs = this.kmhToMs(this.maxSpeed);
    const accelerationMs = this.kmhToMs(this.speedAccelerationRate);
    const decelerationMs = this.kmhToMs(this.speedDecelerationRate);
    
    // Time to reach max speed
    this.accelerationTime = this.maxSpeed / this.speedAccelerationRate;
    
    // Distance covered during acceleration
    this.accelerationDistance = 0.5 * accelerationMs * Math.pow(this.accelerationTime, 2);
    
    // Distance covered during deceleration
    this.decelerationDistance = 0.5 * decelerationMs * Math.pow(this.accelerationTime, 2);
    
    // Distance covered at max speed (cruise phase)
    this.cruiseDistance = Math.max(0, this.totalDistance - this.accelerationDistance - this.decelerationDistance);
    
    // Time for cruise phase
    this.cruiseTime = this.cruiseDistance / maxSpeedMs;
    
    // Total journey time
    this.totalTime = this.accelerationTime + this.cruiseTime + this.accelerationTime;
    
    // Distance where deceleration should start
    this.decelerationStartPoint = this.totalDistance - this.decelerationDistance;
  }
  
  // Convert km/h to m/s
  kmhToMs(kmh) {
    return kmh / 3.6;
  }
  
  // Convert m/s to km/h
  // msToKmh(ms) {
  //   return ms * 3.6;
  // }
  
  // Get current speed based on position
  getCurrentSpeed() {
    if (this.currentPosition < this.accelerationDistance) {
      // Acceleration phase
      const progress = this.currentPosition / this.accelerationDistance;
      return Math.min(this.maxSpeed, progress * this.maxSpeed);
    } else if (this.currentPosition < this.decelerationStartPoint) {
      // Cruise phase
      return this.maxSpeed;
    } else {
      // Deceleration phase
      const decelerationProgress = (this.currentPosition - this.decelerationStartPoint) / this.decelerationDistance;
      return Math.max(0, this.maxSpeed * (1 - decelerationProgress));
    }
  }
  
  // Get current altitude based on time
  getCurrentAltitude() {
    const halfJourneyTime = this.totalTime / 2;
    
    if (this.timeElapsed < halfJourneyTime) {
      // Climbing phase
      const climbProgress = this.timeElapsed / halfJourneyTime;
      return Math.min(this.maxAltitude, climbProgress * this.maxAltitude);
    } else {
      // Descending phase
      const descendProgress = (this.timeElapsed - halfJourneyTime) / halfJourneyTime;
      return Math.max(0, this.maxAltitude * (1 - descendProgress));
    }
  }
  
  // Update position based on current speed
  updatePosition(deltaTimeSeconds = 1) {
    this.timeElapsed += deltaTimeSeconds;
    this.currentSpeed = this.getCurrentSpeed();
    this.currentAltitude = this.getCurrentAltitude();
    
    // Calculate distance traveled in this time interval
    const speedMs = this.kmhToMs(this.currentSpeed);
    const distanceTraveled = speedMs * deltaTimeSeconds;
    
    // Update position
    this.currentPosition = Math.min(this.totalDistance, this.currentPosition + distanceTraveled);
    
    return {
      position: this.currentPosition,
      speed: this.currentSpeed,
      altitude: this.currentAltitude,
      timeElapsed: this.timeElapsed,
      isCompleted: this.currentPosition >= this.totalDistance
    };
  }
  
  // Get segment index based on current position
  // getCurrentSegmentIndex() {
  //   return Math.floor(this.currentPosition / this.segmentDistance);
  // }
  
  // Get progress percentage
  // getProgressPercentage() {
  //   return (this.currentPosition / this.totalDistance) * 100;
  // }
  
  // Reset calculator for new journey
  // reset() {
  //   this.currentSpeed = 0;
  //   this.currentAltitude = 0;
  //   this.currentPosition = 0;
  //   this.timeElapsed = 0;
  // }
  
  // Get movement summary
  // getMovementSummary() {
  //   return {
  //     totalDistance: this.totalDistance,
  //     maxSpeed: this.maxSpeed,
  //     maxAltitude: this.maxAltitude,
  //     totalTime: this.totalTime,
  //     accelerationTime: this.accelerationTime,
  //     cruiseTime: this.cruiseTime,
  //     accelerationDistance: this.accelerationDistance,
  //     cruiseDistance: this.cruiseDistance,
  //     decelerationDistance: this.decelerationDistance
  //   };
  // }
}

export default AircraftMovementCalculator;

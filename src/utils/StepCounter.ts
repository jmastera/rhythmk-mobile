import { Observable, interval, Subscription } from 'rxjs';
import { map, buffer, filter } from 'rxjs/operators';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

// Define accelerometer data type from Expo
type AccelerometerData = AccelerometerMeasurement;

// Constants for step detection
const STEP_THRESHOLD = 1.7;  // Increased threshold for considering a step (g-force)
const STEP_DELAY = 400;      // Increased minimum delay between steps in ms
const BUFFER_SIZE = 10;      // Size of acceleration buffer for smoothing
const CALIBRATION_SAMPLES = 50; // Number of samples to use for calibration

export interface StepCounterOptions {
  strideLength: number;      // Stride length in meters
  updateInterval?: number;   // Update interval in milliseconds
  onStep?: (steps: number, distance: number) => void;
  sensitivity?: number;      // Sensitivity for step detection (0.5-2.0)
}

export class StepCounter {
  private accelSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  private rxSubscription: Subscription | null = null;
  private steps: number = 0;
  private lastStepTime: number = 0;
  private strideLength: number;
  private sensitivity: number;
  private onStepCallback: ((steps: number, distance: number) => void) | undefined;
  
  // For gravity detection and calibration
  private isCalibrating: boolean = true;
  private calibrationSamples: AccelerometerData[] = [];
  private gravityX: number = 0;
  private gravityY: number = 0;
  private gravityZ: number = 0;
  
  // For pattern detection
  private recentMagnitudes: number[] = [];
  private stepCandidates: number = 0;
  
  constructor(options: StepCounterOptions) {
    this.strideLength = options.strideLength; // in meters
    this.onStepCallback = options.onStep;
    this.sensitivity = options.sensitivity || 1.0;
    
    // Set update interval (default is 100ms)
    const updateInterval = options.updateInterval || 100;
    
    const accelerationObservable = new Observable<AccelerometerData>(observer => {
      // Configure to receive data at lower frequency to save battery
      // Configure Accelerometer update interval
      Accelerometer.setUpdateInterval(updateInterval);
      
      // Subscribe to accelerometer data
      this.accelSubscription = Accelerometer.addListener(data => observer.next(data));
      
      // Return cleanup function
      return () => {
        if (this.accelSubscription) {
          this.accelSubscription.remove();
          this.accelSubscription = null;
        }
      };
    });
    
    // Process accelerometer data
    this.rxSubscription = accelerationObservable
      .pipe(
        // Throttle readings to save battery
        buffer<AccelerometerData>(interval(updateInterval)),
        // Handle calibration and calculate magnitude of acceleration
        map((readings: AccelerometerData[]) => {
          if (readings.length === 0) return 0;
          
          // Get the latest reading
          const latestReading: AccelerometerData = readings[readings.length - 1];
          
          // Handle calibration to detect gravity direction
          if (this.isCalibrating) {
            this.calibrationSamples.push(latestReading);
            
            if (this.calibrationSamples.length >= CALIBRATION_SAMPLES) {
              // Calculate average gravity vector
              let sumX = 0, sumY = 0, sumZ = 0;
              for (const sample of this.calibrationSamples) {
                sumX += sample.x;
                sumY += sample.y;
                sumZ += sample.z;
              }
              
              this.gravityX = sumX / CALIBRATION_SAMPLES;
              this.gravityY = sumY / CALIBRATION_SAMPLES;
              this.gravityZ = sumZ / CALIBRATION_SAMPLES;
              
              // Calculate gravity magnitude (should be close to 9.8 if properly calibrated)
              const gravMagnitude = Math.sqrt(
                Math.pow(this.gravityX, 2) + 
                Math.pow(this.gravityY, 2) + 
                Math.pow(this.gravityZ, 2)
              );
              
              console.log(`Calibration complete. Gravity vector: [${this.gravityX.toFixed(2)}, ${this.gravityY.toFixed(2)}, ${this.gravityZ.toFixed(2)}], magnitude: ${gravMagnitude.toFixed(2)}`);
              
              this.isCalibrating = false;
            }
            return 0;
          }
          
          // Calculate the magnitude by removing calibrated gravity from all axes
          const linearAccX = latestReading.x - this.gravityX;
          const linearAccY = latestReading.y - this.gravityY;
          const linearAccZ = latestReading.z - this.gravityZ;
          
          const magnitude = Math.sqrt(
            Math.pow(linearAccX, 2) + 
            Math.pow(linearAccY, 2) + 
            Math.pow(linearAccZ, 2)
          );
          
          // Store in recent magnitudes for pattern detection
          this.recentMagnitudes.push(magnitude);
          if (this.recentMagnitudes.length > 5) { // Keep a sliding window of 5 values
            this.recentMagnitudes.shift();
          }
          
          return magnitude;
        }),
        // Add additional filtering to smooth out accelerometer noise
        map((magnitude) => {
          // Simple moving average if we have enough samples
          if (this.recentMagnitudes.length >= 3) {
            return this.recentMagnitudes.reduce((sum, val) => sum + val, 0) / this.recentMagnitudes.length;
          }
          return magnitude;
        }),

        // Filter for potential steps using a more robust detection algorithm
        filter(magnitude => {
          const now = Date.now();
          
          // Skip during calibration
          if (this.isCalibrating) return false;
          
          // Check time condition first
          if (now - this.lastStepTime <= STEP_DELAY) return false;
          
          // Improved step detection algorithm
          if (magnitude > STEP_THRESHOLD * this.sensitivity) {
            // Increment step candidates - we want to make sure we see a consistent pattern
            this.stepCandidates++;
            
            // Only count as a step if we detect a consistent pattern of acceleration
            // This helps filter out random device movements
            if (this.stepCandidates >= 2) {
              this.lastStepTime = now;
              this.steps++;
              this.stepCandidates = 0;
              
              // Calculate distance in meters
              const distance = this.steps * this.strideLength;
              
              // Notify callback if provided
              if (this.onStepCallback) {
                this.onStepCallback(this.steps, distance);
              }
              
              return true;
            }
          } else {
            // If acceleration drops below threshold, update candidates
            // but don't reset completely to allow for some noise
            if (this.stepCandidates > 0) {
              this.stepCandidates = Math.max(0, this.stepCandidates - 0.2);
            }
          }
          return false;
        })
      )
      .subscribe();
  }
  
  public getSteps(): number {
    return this.steps;
  }
  
  public getDistance(): number {
    return this.steps * this.strideLength;
  }
  
  public reset(): void {
    this.steps = 0;
    this.lastStepTime = 0;
    this.stepCandidates = 0;
    this.recentMagnitudes = [];
    
    // Optionally recalibrate - uncomment if you want to force recalibration on each reset
    // this.isCalibrating = true;
    // this.calibrationSamples = [];
  }
  
  public stop(): void {
    if (this.rxSubscription) {
      this.rxSubscription.unsubscribe();
    }
    if (this.accelSubscription) {
      this.accelSubscription.remove();
    }
  }
}

// Helper function to estimate stride length based on height (in cm)
export const estimateStrideLength = (heightCm: number, isRunning: boolean): number => {
  if (isRunning) {
    // Running stride is typically longer
    return heightCm * 0.0045;  // Roughly 45% of height in meters
  } else {
    // Walking stride
    return heightCm * 0.0037;  // Roughly 37% of height in meters
  }
};

// Type declarations for useLocation.ts
declare module '../hooks/useLocation' {
  export interface UseLocationOptions {
    onLocationChange?: (location: any) => void;
    enabled?: boolean;
    trackingInterval?: number;
    distanceFilter?: number;
    trackOnBackground?: boolean;
  }

  export interface UseLocationReturn {
    location: any | null;
    errorMsg: string | null;
    startTracking: () => Promise<void>;
    stopTracking: () => Promise<void>;
    isTracking: boolean;
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
  }

  export function useLocation(options: UseLocationOptions): UseLocationReturn;
}

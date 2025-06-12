declare module 'react-native-background-timer' {
  export function setInterval(callback: () => void, delay: number): number;
  export function clearInterval(id: number): void;
  export function setTimeout(callback: () => void, delay: number): number;
  export function clearTimeout(id: number): void;
}

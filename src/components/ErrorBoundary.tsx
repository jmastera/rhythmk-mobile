import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const CRASH_LOGS_KEY = 'rhythmkAppCrashLogs';

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }; // errorInfo comes in componentDidCatch
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });

    try {
      const existingLogsString = await AsyncStorage.getItem(CRASH_LOGS_KEY);
      const existingLogs: any[] = existingLogsString ? JSON.parse(existingLogsString) : [];
      
      const newLogEntry = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };

      // Keep a reasonable number of logs, e.g., last 10
      const updatedLogs = [newLogEntry, ...existingLogs.slice(0, 9)];
      
      await AsyncStorage.setItem(CRASH_LOGS_KEY, JSON.stringify(updatedLogs));
      console.log("Crash log saved to AsyncStorage.");
    } catch (e) {
      console.error("Failed to save crash log to AsyncStorage:", e);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong.</Text>
          <Text style={styles.subtitle}>
            An error occurred in the application. Please try restarting the app.
            We've logged the details of this issue.
          </Text>
          {this.state.error && (
            <ScrollView style={styles.errorDetailsContainer}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <>
                  <Text style={styles.errorSubtitle}>Component Stack:</Text>
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6347', // Tomato color for error
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0', // Light grey
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetailsContainer: {
    maxHeight: 300, // Limit height for scrollability
    backgroundColor: '#27272a', // zinc-800
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316', // Orange accent
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e4e4e7', // zinc-200
    marginTop: 10,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#d4d4d8', // zinc-300
    fontFamily: 'monospace', // For better stack trace readability
  },
});

export default ErrorBoundary;

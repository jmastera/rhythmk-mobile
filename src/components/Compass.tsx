import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { Compass } from 'lucide-react-native';

interface CompassProps {
  bearing: number;
  nextTurn?: {
    direction: string;
    distance: number;
  } | null;
}

const CompassDisplay: React.FC<CompassProps> = ({ bearing, nextTurn }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: -bearing,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [bearing]);

  const getTurnIcon = (direction?: string) => {
    switch (direction) {
      case 'left': return '↩️';
      case 'right': return '↪️';
      case 'slight-left': return '↖️';
      case 'slight-right': return '↗️';
      case 'sharp-left': return '⬅️';
      case 'sharp-right': return '➡️';
      default: return '⬆️';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.compassContainer}>
        <Animated.View 
          style={[
            styles.compass, 
            { transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            }) }] }
          ]}
        >
          <Compass size={24} color="#3B82F6" />
        </Animated.View>
        {nextTurn && (
          <View style={styles.turnIndicator}>
            <Text style={styles.turnIcon}>{getTurnIcon(nextTurn.direction)}</Text>
            <Text style={styles.turnDistance}>
              {Math.round(nextTurn.distance * 1000)}m
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  compassContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compass: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnIndicator: {
    position: 'absolute',
    bottom: -30,
    alignItems: 'center',
  },
  turnIcon: {
    fontSize: 24,
  },
  turnDistance: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
  },
});

export default CompassDisplay;
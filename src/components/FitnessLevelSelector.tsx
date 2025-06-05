import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, Zap, Flame, ArrowRight } from 'lucide-react-native'; // Using lucide-react-native

interface FitnessLevelSelectorProps {
  onSelect: (level: string) => void;
}

const levels = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to running or returning after a break',
    icon: Activity,
    color: '#22c55e', // green-500
    details: ['0-2 runs per week', '15-30 min sessions', 'Focus on building base'],
    badge: 'Start Here',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Running regularly for 3+ months',
    icon: Zap,
    color: '#3b82f6', // blue-500
    details: ['3-4 runs per week', '30-60 min sessions', 'Some experience'],
    badge: 'Most Popular',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Experienced runner with consistent training',
    icon: Flame,
    color: '#ef4444', // red-500
    details: ['5+ runs per week', '60+ min sessions', 'Regular training'],
    badge: 'Elite Level',
  },
];

const FitnessLevelSelector: React.FC<FitnessLevelSelectorProps> = ({ onSelect }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Welcome to Rhythmk!</Text>
        <Text style={styles.headerSubtitle}>
          What's your current fitness level? This helps us personalize your experience.
        </Text>
      </View>

      {levels.map((level) => {
        const IconComponent = level.icon;
        return (
          <TouchableOpacity
            key={level.id}
            style={styles.card}
            onPress={() => onSelect(level.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconContainer, { backgroundColor: level.color }]}>
                  <IconComponent color="white" size={24} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{level.title}</Text>
                  <Text style={styles.cardDescription}>{level.description}</Text>
                </View>
              </View>
              <View style={styles.cardHeaderRight}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{level.badge}</Text>
                </View>
                <ArrowRight color="#9ca3af" size={20} />
              </View>
            </View>
            <View style={styles.cardContent}>
              {level.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailBullet} />
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9ca3af', // gray-400
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardDescription: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#374151', // gray-700, approximation for secondary badge
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  cardContent: {
    paddingTop: 0,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailBullet: {
    width: 5,
    height: 5,
    backgroundColor: '#f97316', // orange-500
    borderRadius: 2.5,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#d1d5db', // gray-300
  },
});

export default FitnessLevelSelector;


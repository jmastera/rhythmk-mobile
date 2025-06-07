import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Target, MapPin, Mountain, Trophy, ArrowRight } from 'lucide-react-native';
import { raceColors } from '../utils/raceColors';

interface RaceTypeSelectorProps {
  onSelect: (raceId: string) => void;
  currentRaceTypeId?: string | null;
}

const races = [
  {
    id: '5k',
    title: '5K Run',
    distance: '3.1 miles',
    icon: Target,
    duration: '6-8 weeks',
    difficulty: 'Beginner Friendly',
    description: 'Perfect first race goal',
    color: raceColors['5k'],
  },
  {
    id: '10k',
    title: '10K Run',
    distance: '6.2 miles',
    icon: MapPin,
    duration: '8-10 weeks',
    difficulty: 'Intermediate',
    description: 'Step up your distance',
    color: raceColors['10k'],
  },
  {
    id: 'half-marathon',
    title: 'Half Marathon',
    distance: '13.1 miles',
    icon: Mountain,
    duration: '12-16 weeks',
    difficulty: 'Challenging',
    description: 'Serious endurance goal',
    color: raceColors['half-marathon'],
  },
  {
    id: 'marathon',
    title: 'Marathon',
    distance: '26.2 miles',
    icon: Trophy,
    duration: '16-20 weeks',
    difficulty: 'Elite Challenge',
    description: 'Ultimate running achievement',
    color: raceColors['marathon'],
  },
];

const RaceTypeSelector: React.FC<RaceTypeSelectorProps> = ({ onSelect, currentRaceTypeId }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>What's your race goal?</Text>
        <Text style={styles.headerSubtitle}>Choose the distance you want to train for</Text>
      </View>

      {races.map((race) => {
        const IconComponent = race.icon;
        return (
          <TouchableOpacity
            key={race.id}
            style={[styles.card, currentRaceTypeId === race.id && styles.selectedRaceCard]}
            onPress={() => onSelect(race.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconContainer, { backgroundColor: race.color }]}>
                  <IconComponent size={28} color="white" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, currentRaceTypeId === race.id && styles.selectedRaceText]}>{race.title}</Text>
                  <Text style={[styles.cardDescription, currentRaceTypeId === race.id && styles.selectedRaceTextSecondary]}>{race.distance}</Text>
                </View>
              </View>
              <ArrowRight color="#9ca3af" size={20} />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.badgesContainer}>
                <View style={[styles.badge, { backgroundColor: `${race.color}20` }]}>
                  <Text style={[styles.badgeText, { color: race.color }]}>{race.duration}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${race.color}15` }]}>
                  <Text style={[styles.badgeText, { color: race.color }]}>{race.difficulty}</Text>
                </View>
              </View>
              <Text style={[styles.descriptionText, currentRaceTypeId === race.id && styles.selectedRaceDescription]}>{race.description}</Text>
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
  selectedRaceCard: {
    backgroundColor: '#f97316', // orange-500
    borderColor: '#f97316',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedRaceText: {
    color: 'white',
  },
  cardDescription: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
  },
  cardContent: {
    paddingTop: 0,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    marginHorizontal: 2,
    minWidth: 80,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#d1d5db', // gray-300
  },
  selectedRaceDescription: {
    color: 'rgba(255,255,255,0.85)',
  },
  selectedRaceTextSecondary: {
    color: 'rgba(255,255,255,0.9)', // A slightly lighter/whiter shade for secondary text on selected card
  },
});

export default RaceTypeSelector;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Target } from 'lucide-react-native';

interface TrainingWeek {
  week: number;
  sessions: string[];
}

interface PlanDetails {
  duration: string;
  runsPerWeek: number;
  weeks: TrainingWeek[];
}

interface FitnessLevelPlans {
  [raceType: string]: PlanDetails;
}

interface AllPlans {
  [fitnessLevel: string]: FitnessLevelPlans;
}

interface TrainingPlanProps {
  fitnessLevel: string;
  raceType: string;
  onReset: () => void;
}

const TrainingPlan: React.FC<TrainingPlanProps> = ({ fitnessLevel, raceType, onReset }) => {
  const generatePlan = () => {
    const plans: AllPlans = {
      beginner: {
        '5k': {
          duration: '6 weeks',
          runsPerWeek: 3,
          weeks: [
            { week: 1, sessions: ['15 min easy run', '20 min walk/run', '15 min easy run'] },
            { week: 2, sessions: ['20 min easy run', '25 min walk/run', '20 min easy run'] },
            { week: 3, sessions: ['25 min easy run', '30 min tempo', '25 min easy run'] },
            { week: 4, sessions: ['20 min easy run', '25 min intervals', '20 min easy run'] },
            { week: 5, sessions: ['30 min easy run', '35 min tempo', '25 min easy run'] },
            { week: 6, sessions: ['20 min easy run', '15 min shakeout', 'RACE DAY! 5K'] },
          ],
        },
        '10k': {
          duration: '8 weeks',
          runsPerWeek: 3,
          weeks: [
            { week: 1, sessions: ['20 min easy run', '25 min walk/run', '20 min easy run'] },
            { week: 2, sessions: ['25 min easy run', '30 min walk/run', '25 min easy run'] },
            { week: 3, sessions: ['30 min easy run', '35 min tempo', '25 min easy run'] },
            { week: 4, sessions: ['25 min easy run', '30 min intervals', '25 min easy run'] },
            { week: 5, sessions: ['35 min easy run', '40 min tempo', '30 min easy run'] },
            { week: 6, sessions: ['30 min easy run', '35 min intervals', '30 min easy run'] },
            { week: 7, sessions: ['40 min easy run', '45 min tempo', '35 min easy run'] },
            { week: 8, sessions: ['25 min easy run', '20 min shakeout', 'RACE DAY! 10K'] },
          ],
        },
      },
      intermediate: {
        '5k': {
          duration: '6 weeks',
          runsPerWeek: 4,
          weeks: [
            { week: 1, sessions: ['30 min easy', '25 min tempo', '35 min easy', '20 min recovery'] },
            { week: 2, sessions: ['35 min easy', '30 min intervals', '40 min easy', '25 min recovery'] },
            { week: 3, sessions: ['40 min easy', '35 min tempo', '35 min easy', '30 min recovery'] },
            { week: 4, sessions: ['35 min easy', '30 min intervals', '40 min easy', '25 min recovery'] },
            { week: 5, sessions: ['45 min easy', '40 min tempo', '35 min easy', '30 min recovery'] },
            { week: 6, sessions: ['30 min easy', '20 min shakeout', 'Rest', 'RACE DAY! 5K'] },
          ],
        },
        'half-marathon': {
          duration: '12 weeks',
          runsPerWeek: 4,
          weeks: [
            { week: 1, sessions: ['45 min easy', '35 min tempo', '60 min long', '30 min recovery'] },
            { week: 2, sessions: ['50 min easy', '40 min intervals', '75 min long', '35 min recovery'] },
            { week: 3, sessions: ['55 min easy', '45 min tempo', '90 min long', '40 min recovery'] },
          ],
        },
      },
      // Add 'advanced' plans if available
    };
    // Fallback to beginner 5k if specific plan not found
    return plans[fitnessLevel]?.[raceType] || plans.beginner?.['5k'] || { duration: 'N/A', runsPerWeek: 0, weeks: [] };
  };

  const plan = generatePlan();

  const raceNames: { [key: string]: string } = {
    '5k': '5K',
    '10k': '10K',
    'half-marathon': 'Half Marathon',
    'marathon': 'Marathon',
  };

  const levelNames: { [key: string]: string } = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  if (!plan || plan.weeks.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onReset} style={styles.backButton}>
          <ArrowLeft size={24} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.errorText}>Training plan not available for this combination.</Text>
        <Text style={styles.errorText}>Selected: {levelNames[fitnessLevel] || fitnessLevel} / {raceNames[raceType] || raceType}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onReset} style={styles.backButton}>
          <ArrowLeft size={24} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Training Plan</Text>
      </View>

      {/* Plan Overview */}
      <LinearGradient
        colors={['#f97316', '#ea580c']} // Example orange gradient
        style={[styles.card, styles.overviewCard]}
      >
        <Text style={styles.overviewCardTitle}>
          {raceNames[raceType] || raceType} Training Plan
        </Text>
        <View style={styles.overviewDetails}>
          <View style={styles.overviewDetailItem}>
            <View style={[styles.badge, styles.secondaryBadge]}><Text style={styles.badgeText}>{levelNames[fitnessLevel] || fitnessLevel}</Text></View>
            <Text style={styles.overviewDetailLabel}>Level</Text>
          </View>
          <View style={styles.overviewDetailItem}>
            <View style={[styles.badge, styles.secondaryBadge]}><Text style={styles.badgeText}>{plan.duration}</Text></View>
            <Text style={styles.overviewDetailLabel}>Duration</Text>
          </View>
          <View style={styles.overviewDetailItem}>
            <View style={[styles.badge, styles.secondaryBadge]}><Text style={styles.badgeText}>{plan.runsPerWeek}x/week</Text></View>
            <Text style={styles.overviewDetailLabel}>Frequency</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Weekly Breakdown */}
      <View style={styles.weeklyBreakdownContainer}>
        {plan.weeks.slice(0, 4).map((week: TrainingWeek, index: number) => (
          <View key={index} style={styles.card}>
            <View style={styles.weekCardHeader}>
              <Text style={styles.weekCardTitle}>Week {week.week}</Text>
              <Calendar size={20} color="#f97316" />
            </View>
            <View style={styles.cardContent}>
              {week.sessions.map((session: string, sessionIndex: number) => (
                <View key={sessionIndex} style={styles.sessionItem}>
                  <View style={styles.sessionBulletOuter}>
                    <View style={styles.sessionBulletInner} />
                  </View>
                  <Text style={styles.sessionText}>{session}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Call to Action */}
      <View style={[styles.card, styles.ctaCard]}>
        <Target size={32} color="#f97316" style={{ marginBottom: 12 }} />
        <Text style={styles.ctaTitle}>Ready to Start?</Text>
        <Text style={styles.ctaSubtitle}>
          Download this plan and start your journey to race day success!
        </Text>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download Full Plan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212', // Dark background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8, // Make it easier to tap
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  errorText: {
    color: 'yellow',
    textAlign: 'center',
    fontSize: 16,
    marginBottom:10,
  },
  // Card base style
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // white/10
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(255, 255, 255, 0.2)', // white/20
    borderWidth: 1,
  },
  // Overview Card
  overviewCard: {
    // backgroundColor was here, now handled by LinearGradient
    // Add any specific styles for the overview card if different from general card
  },
  overviewCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  overviewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  overviewDetailItem: {
    alignItems: 'center',
  },
  overviewDetailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  // Badge base style
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  secondaryBadge: { // For level, duration, frequency in overview
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Lighter badge on colored background
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Weekly Breakdown
  weeklyBreakdownContainer: {
    // No specific container style needed if cards have marginBottom
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardContent: { // Generic content padding, used in week cards
    paddingTop: 0,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionBulletOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.2)', // orange-500/20
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionBulletInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316', // orange-500
  },
  sessionText: {
    fontSize: 14,
    color: '#d1d5db', // gray-300
    flexShrink: 1, // Allow text to wrap
  },
  // Call to Action Card
  ctaCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // white/5
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
    textAlign: 'center',
    marginBottom: 16,
  },
  downloadButton: {
    backgroundColor: '#f97316', // orange-500
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TrainingPlan;

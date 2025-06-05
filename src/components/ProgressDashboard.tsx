import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Calendar, Award, Clock, MapPin } from 'lucide-react-native';

interface ProgressDashboardProps {
  currentPlan?: {
    fitnessLevel: string;
    raceType: string;
  };
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ currentPlan }) => {
  // Mock data - in a real app, this would come from stored workout history
  const weeklyStats = {
    completedRuns: 3,
    plannedRuns: 4,
    totalDistance: 15.2,
    totalTime: 78, // minutes
    avgPace: '5:08',
    weekProgress: 75,
  };

  const recentWorkouts = [
    { date: '2025-06-02', distance: 5.2, duration: 28, pace: '5:23', type: 'Easy Run' },
    { date: '2025-06-01', distance: 3.0, duration: 18, pace: '6:00', type: 'Recovery' },
    { date: '2025-05-30', distance: 7.0, duration: 32, pace: '4:34', type: 'Tempo' },
  ];

  const achievements = [
    { title: 'Week Warrior', description: 'Completed 3 runs this week', icon: Award, earned: true },
    { title: 'Distance King', description: 'Ran 15km this week', icon: MapPin, earned: true },
    { title: 'Consistency', description: '7 day streak', icon: Calendar, earned: false },
  ];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!currentPlan) {
    return (
      <View style={styles.centeredMessageContainer}>
        <View style={styles.card}>
          {/* Placeholder for logo, as local images require specific handling */}
          {/* <Image source={require('../assets/rhythmk-logo-trans.png')} style={styles.logo} /> */}
          <Text style={styles.noPlanTitle}>No Active Training Plan</Text>
          <Text style={styles.noPlanSubtitle}>
            Create a training plan to start tracking your progress and get personalized coaching.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>
          {currentPlan.raceType.toUpperCase()} Training • {currentPlan.fitnessLevel} Level
        </Text>
      </View>

      {/* Weekly Overview */}
      <LinearGradient
        colors={['#f97316', '#ea580c']} // Example orange gradient
        style={[styles.card, styles.overviewCard]}
      >
        <Text style={styles.cardTitleCentered}>This Week</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>Weekly Goal</Text>
            <Text style={styles.progressLabelText}>
              {weeklyStats.completedRuns}/{weeklyStats.plannedRuns} runs
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${weeklyStats.weekProgress}%` }]} />
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyStats.totalDistance}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(weeklyStats.totalTime)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyStats.avgPace}</Text>
            <Text style={styles.statLabel}>Avg Pace</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Recent Workouts */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Clock size={20} color="#f97316" style={styles.cardHeaderIcon} />
          <Text style={styles.cardTitle}>Recent Runs</Text>
        </View>
        {recentWorkouts.map((workout, index) => (
          <View key={index} style={styles.workoutItem}>
            <View style={styles.workoutInfoLeft}>
              <Text style={styles.workoutDistance}>{workout.distance}km</Text>
              <Text style={styles.workoutDate}>{workout.date}</Text>
            </View>
            <View style={styles.workoutInfoCenter}>
              <View style={[styles.badge, styles.outlineBadge]}>
                <Text style={[styles.badgeText, styles.outlineBadgeText]}>{workout.type}</Text>
              </View>
              <Text style={styles.workoutPace}>{workout.pace}/km</Text>
            </View>
            <View style={styles.workoutInfoRight}>
              <Text style={styles.workoutDuration}>{formatTime(workout.duration)}</Text>
              <Text style={styles.workoutDurationLabel}>Duration</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Achievements */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Award size={20} color="#f97316" style={styles.cardHeaderIcon} />
          <Text style={styles.cardTitle}>Achievements</Text>
        </View>
        {achievements.map((achievement, index) => {
          const IconComponent = achievement.icon;
          return (
            <View
              key={index}
              style={[
                styles.achievementItem,
                achievement.earned ? styles.achievementEarnedBackground : styles.achievementDefaultBackground,
              ]}
            >
              <View
                style={[
                  styles.achievementIconContainer,
                  achievement.earned ? styles.achievementIconEarned : styles.achievementIconDefault,
                ]}
              >
                <IconComponent size={20} color="white" />
              </View>
              <View style={styles.achievementTextContainer}>
                <Text style={[styles.achievementTitle, achievement.earned && styles.achievementTitleEarned]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
              {achievement.earned && (
                <View style={[styles.badge, styles.earnedBadge]}>
                  <Text style={[styles.badgeText, styles.earnedBadgeText]}>Earned</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Performance Insights */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TrendingUp size={20} color="#f97316" style={styles.cardHeaderIcon} />
          <Text style={styles.cardTitle}>Performance Insights</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Pace Improvement</Text>
          <Text style={[styles.insightValue, styles.positiveValue]}>+15s faster</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Weekly Distance</Text>
          <Text style={[styles.insightValue, styles.warningValue]}>+3.2km increase</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Consistency Score</Text>
          <Text style={[styles.insightValue, styles.infoValue]}>85%</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    padding: 16,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#121212',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a0a0a0', // Lighter gray
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Slightly more opaque white/10
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Slightly more opaque white/20
    borderWidth: 1,
  },
  overviewCard: {
    // backgroundColor was '#f97316', now handled by LinearGradient
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardTitleCentered: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  // Progress Bar
  progressContainer: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Recent Workouts
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  workoutInfoLeft: {
    alignItems: 'flex-start',
  },
  workoutDistance: {
    fontSize: 16,
    fontWeight: 'medium',
    color: 'white',
  },
  workoutDate: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  workoutInfoCenter: {
    alignItems: 'center',
  },
  workoutPace: {
    fontSize: 12,
    color: '#d1d5db', // gray-300
  },
  workoutInfoRight: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: 16,
    fontWeight: 'medium',
    color: '#f97316', // orange-400
  },
  workoutDurationLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  // Badge base style
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  outlineBadge: {
    borderColor: '#4b5563', // gray-600
    borderWidth: 1,
    marginBottom: 4,
  },
  outlineBadgeText: {
    color: '#d1d5db', // gray-300
  },
  earnedBadge: {
    backgroundColor: '#22c55e', // green-500
  },
  earnedBadgeText: {
    color: 'white',
  },
  // Achievements
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementEarnedBackground: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)', // green-500/20
  },
  achievementDefaultBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconEarned: {
    backgroundColor: '#22c55e', // green-500
  },
  achievementIconDefault: {
    backgroundColor: '#4b5563', // gray-600
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontWeight: 'medium',
    color: '#d1d5db', // gray-300
  },
  achievementTitleEarned: {
    color: '#22c55e', // green-400
  },
  achievementDescription: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  // Performance Insights
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'medium',
  },
  positiveValue: {
    color: '#22c55e', // green-400
  },
  warningValue: {
    color: '#f97316', // orange-400
  },
  infoValue: {
    color: '#3b82f6', // blue-400
  },
  // No Plan Message
  noPlanTitle: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPlanSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default ProgressDashboard;


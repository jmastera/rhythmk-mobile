import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Calendar, Award, Clock, MapPin } from 'lucide-react-native';
import { useUserSettings } from '../hooks/useUserSettings'; // Adjusted path
import { HeaderSafeArea } from '../components/HeaderSafeArea';

const ProgressScreen: React.FC = () => { 
  const { settings, isLoadingSettings } = useUserSettings();

  const currentPlan = (settings.fitnessLevel && settings.raceGoal && settings.raceGoal.type)
    ? { fitnessLevel: settings.fitnessLevel, raceType: settings.raceGoal.type }
    : undefined;

  const weeklyStats = {
    completedRuns: 3,
    plannedRuns: 4,
    totalDistance: 15.2,
    totalTime: 78, 
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

  if (isLoadingSettings) {
    return (
      <View style={styles.centeredMessageContainer}>
        <HeaderSafeArea />
        <Text style={styles.noPlanTitle}>Loading settings...</Text>
      </View>
    );
  }

  if (!currentPlan) {
    return (
      <View style={styles.centeredMessageContainer}>
        <HeaderSafeArea />
        <View style={styles.card}>
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
      <HeaderSafeArea />
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>
          {currentPlan.raceType.toUpperCase()} Training • {currentPlan.fitnessLevel} Level
        </Text>
      </View>

      <LinearGradient
        colors={['#f97316', '#ea580c']} 
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

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Clock size={20} color="#f97316" style={styles.cardHeaderIcon} />
          <Text style={styles.cardTitle}>Recent Runs</Text>
        </View>
        {recentWorkouts.map((workout, index) => (
          <View key={index} style={styles.workoutItem}>
            <View style={styles.workoutInfoLeft}>
              <Text style={styles.workoutDistance}>{workout.distance} km</Text>
              <Text style={styles.workoutDate}>{workout.date}</Text>
            </View>
            <View style={styles.workoutInfoCenter}>
              <View style={[styles.badge, styles.outlineBadge]}>
                <Text style={[styles.badgeText, styles.outlineBadgeText]}>{workout.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.workoutPace}>{workout.pace} /km</Text>
            </View>
            <View style={styles.workoutInfoRight}>
              <Text style={styles.workoutDuration}>{workout.duration}m</Text>
              <Text style={styles.workoutDurationLabel}>Duration</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Award size={20} color="#f97316" style={styles.cardHeaderIcon} />
          <Text style={styles.cardTitle}>Achievements</Text>
        </View>
        {achievements.map((achievement, index) => (
          <View
            key={index}
            style={[
              styles.achievementItem,
              achievement.earned
                ? styles.achievementEarnedBackground
                : styles.achievementDefaultBackground,
            ]}
          >
            <View
              style={[
                styles.achievementIconContainer,
                achievement.earned
                  ? styles.achievementIconEarned
                  : styles.achievementIconDefault,
              ]}
            >
              <achievement.icon size={20} color="white" />
            </View>
            <View style={styles.achievementTextContainer}>
              <Text
                style={[
                  styles.achievementTitle,
                  achievement.earned && styles.achievementTitleEarned,
                ]}
              >
                {achievement.title}
              </Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
            {achievement.earned && (
              <View style={[styles.badge, styles.earnedBadge]}>
                <Text style={[styles.badgeText, styles.earnedBadgeText]}>EARNED</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TrendingUp size={20} color="#f97316" style={styles.cardHeaderIcon} />
          <Text style={styles.cardTitle}>Performance Insights</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Pace Trend (Last 4 Weeks)</Text>
          <Text style={[styles.insightValue, styles.positiveValue]}>Improving</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Distance Trend (Last 4 Weeks)</Text>
          <Text style={[styles.insightValue, styles.positiveValue]}>Increasing</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Consistency</Text>
          <Text style={[styles.insightValue, styles.infoValue]}>Good</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', 
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32, 
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0f172a', 
  },
  headerTextContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8', 
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b', 
    borderRadius: 8, 
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewCard: {
    // Specific styles for the overview card if needed, using LinearGradient
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
    fontWeight: 'semibold',
    color: 'white',
  },
  cardTitleCentered: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
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
    fontWeight: '500',
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
    color: '#d1d5db', 
  },
  workoutInfoRight: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f97316', 
  },
  workoutDurationLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8, // Consistent border radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  outlineBadge: {
    borderColor: '#4b5563', 
    borderWidth: 1,
    marginBottom: 4,
  },
  outlineBadgeText: {
    color: '#d1d5db', 
  },
  earnedBadge: {
    backgroundColor: '#22c55e', 
  },
  earnedBadgeText: {
    color: 'white',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementEarnedBackground: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
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
    backgroundColor: '#22c55e', 
  },
  achievementIconDefault: {
    backgroundColor: '#4b5563', 
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontWeight: '500',
    color: '#d1d5db', 
  },
  achievementTitleEarned: {
    color: '#22c55e', 
  },
  achievementDescription: {
    fontSize: 12,
    color: '#a0a0a0',
  },
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
    fontWeight: '500',
  },
  positiveValue: {
    color: '#22c55e', 
  },
  warningValue: {
    color: '#f97316', 
  },
  infoValue: {
    color: '#3b82f6', 
  },
  noPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
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

export default ProgressScreen;

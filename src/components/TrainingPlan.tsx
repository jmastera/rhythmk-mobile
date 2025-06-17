import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Target, Edit3, Download, Share2 } from 'lucide-react-native';
import { getRaceColor } from '../utils/raceColors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
  const theme = useTheme();
  // Get race-specific color for consistent styling
  const raceColor = getRaceColor(raceType);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
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
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    errorText: {
      color: 'yellow',
      textAlign: 'center',
      fontSize: 16,
      marginBottom:10,
    },
    // Card base style
    card: {
      backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
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
      color: theme.colors.text.primary,
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
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 4,
    },
    badgeText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    overviewDetailLabel: {
      color: theme.colors.text.secondary,
      fontSize: 12,
    },
    // Weekly Breakdown
    weeklyBreakdownContainer: {
      marginTop: 8,
    },
    weekCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    weekCardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    cardContent: {
      paddingLeft: 8,
    },
    sessionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sessionBulletOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    sessionBulletInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    sessionText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    // CTA Card
    ctaCard: {
      alignItems: 'center',
      padding: 24,
      marginTop: 8,
    },
    ctaTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    ctaSubtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 8,
    },
    downloadButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    // Stop Goal Button - Removed as it's now handled by the parent RaceGoalScreen
  });
  const handleBackPress = () => {
    onReset();
  };

  const generateHTML = () => {
    const raceName = raceNames[raceType] || raceType;
    const levelName = levelNames[fitnessLevel] || fitnessLevel;
    
    // Generate HTML for all weeks
    const weeksHTML = plan.weeks.map(week => `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <h3 style="color: ${raceColor}; margin-bottom: 10px;">Week ${week.week}</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${week.sessions.map(session => `<li style="margin-bottom: 8px;">${session}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${raceName} Training Plan - ${levelName}</title>
        <style>
          @page { margin: 20px; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: ${raceColor}; margin-bottom: 5px; }
          .header { margin-bottom: 20px; }
          .meta { margin-bottom: 30px; }
          .meta-item { margin-bottom: 5px; }
          .week { margin-bottom: 25px; page-break-inside: avoid; }
          .week-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: ${raceColor}; }
          .sessions { margin-left: 20px; }
          .session { margin-bottom: 8px; }
          .footer { margin-top: 40px; font-size: 12px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${raceName} Training Plan</h1>
          <div class="meta">
            <div class="meta-item"><strong>Level:</strong> ${levelName}</div>
            <div class="meta-item"><strong>Duration:</strong> ${plan.duration}</div>
            <div class="meta-item"><strong>Runs per Week:</strong> ${plan.runsPerWeek}</div>
          </div>
        </div>
        
        <div class="plan">
          ${weeksHTML}
        </div>
        
        <div class="footer">
          <p>Generated by RhythMK - Your Personal Running Coach</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintPlan = async () => {
    try {
      const html = generateHTML();
      
      // Generate a PDF
      const { uri } = await Print.printToFileAsync({
        html,
        width: 612,  // 8.5in in points (72dpi)
        height: 792, // 11in in points (72dpi)
        base64: false
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Training Plan',
          UTI: 'com.adobe.pdf'
        });
      } else {
        // Fallback for web or unsupported platforms
        alert('Sharing not available on this platform');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

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
        'hyrox': {
          duration: '8 weeks',
          runsPerWeek: 3,
          weeks: [
            { week: 1, sessions: ['2km easy run', '4x400m intervals, 2 min rest', '3km easy run'] },
            { week: 2, sessions: ['2.5km easy run', '5x400m intervals, 90s rest', '3.5km easy run'] },
            { week: 3, sessions: ['3km easy run', '4x600m intervals, 2 min rest', '4km easy run'] },
            { week: 4, sessions: ['3km easy run', '20 min tempo run', '4km easy run'] },
            { week: 5, sessions: ['3.5km easy run', '6x400m intervals, 75s rest', '4.5km easy run'] },
            { week: 6, sessions: ['4km easy run', '5x600m intervals, 90s rest', '5km easy run'] },
            { week: 7, sessions: ['4km easy run', '25 min tempo run', '5km easy run'] },
            { week: 8, sessions: ['3km easy run', '3x400m easy pace', 'RACE DAY!'] },
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
            // Add more weeks for a full plan...
          ],
        },
        'hyrox': {
          duration: '10 weeks',
          runsPerWeek: 4,
          weeks: [
            { week: 1, sessions: ['4km easy', '6x500m intervals, 90s rest', '5km easy', '25 min recovery'] },
            { week: 2, sessions: ['5km easy', '4x800m intervals, 2 min rest', '6km easy', '30 min recovery'] },
            { week: 3, sessions: ['5km easy', '25 min tempo run', '7km easy', '30 min recovery'] },
            { week: 4, sessions: ['6km easy', '5x800m intervals, 90s rest', '8km long run', '35 min recovery'] },
            { week: 5, sessions: ['6km easy', '30 min tempo run', '8km easy', '35 min recovery'] },
            { week: 6, sessions: ['7km easy', '6x800m intervals, 75s rest', '10km long run', '40 min recovery'] },
            { week: 7, sessions: ['7km easy', '35 min tempo run', '8km easy', '40 min recovery'] },
            { week: 8, sessions: ['8km easy', '4x1km intervals, 2 min rest', '10km long run', '45 min recovery'] },
            { week: 9, sessions: ['6km easy', '30 min tempo', '8km easy', '30 min recovery'] },
            { week: 10, sessions: ['4km easy', '4x400m easy pace', 'Rest', 'RACE DAY!'] },
          ],
        },
      },
      advanced: {
        'hyrox': {
          duration: '12 weeks',
          runsPerWeek: 5,
          weeks: [
            { week: 1, sessions: ['6km easy', '8x500m intervals, 75s rest', '7km easy', '3km recovery', '10km long run'] },
            { week: 2, sessions: ['7km easy', '6x800m intervals, 90s rest', '8km tempo', '4km recovery', '12km long run'] },
            { week: 3, sessions: ['7km easy', '5x1km intervals, 2 min rest', '8km easy', '4km recovery', '13km long run'] },
            { week: 4, sessions: ['8km easy', '35 min tempo run', '9km easy', '5km recovery', '14km long run'] },
            { week: 5, sessions: ['8km easy', '7x800m intervals, 75s rest', '10km tempo', '5km recovery', '15km long run'] },
            { week: 6, sessions: ['9km easy', '6x1km intervals, 90s rest', '10km easy', '6km recovery', '16km long run'] },
            { week: 7, sessions: ['9km easy', '40 min tempo run', '10km easy', '6km recovery', '17km long run'] },
            { week: 8, sessions: ['10km easy', '7x1km intervals, 75s rest', '12km tempo', '7km recovery', '18km long run'] },
            { week: 9, sessions: ['10km easy', '45 min tempo run', '12km easy', '7km recovery', '19km long run'] },
            { week: 10, sessions: ['10km easy', '5x1km intervals, 60s rest', '10km easy', '5km recovery', '16km long run'] },
            { week: 11, sessions: ['8km easy', '30 min tempo', '8km easy', '4km recovery', '12km long run'] },
            { week: 12, sessions: ['5km easy', '4x400m easy pace', 'Rest', 'Rest', 'RACE DAY!'] },
          ],
        },
      },
    };
    // Fallback to beginner 5k if specific plan not found
    return plans[fitnessLevel]?.[raceType] || plans.beginner?.['5k'] || { duration: 'N/A', runsPerWeek: 0, weeks: [] };
  };

  const plan = generatePlan();

  const raceNames: { [key: string]: string } = {
    '5k': '5K',
    '10k': '10K',
    'half-marathon': 'Half Marathon',
    'hyrox': 'Hyrox Run Training',
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
        <Text style={styles.headerTitle}>Your Training Plan</Text>
      </View>
      <Text style={styles.subtitle}>Follow this personalized schedule to reach your race day goal</Text>

      {/* Plan Overview */}
      <LinearGradient
        colors={[raceColor, raceColor + 'dd']} // Use race-specific gradient
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
              <Calendar size={20} color={raceColor} />
            </View>
            <View style={styles.cardContent}>
              {week.sessions.map((session: string, sessionIndex: number) => (
                <View key={sessionIndex} style={styles.sessionItem}>
                  <View style={[styles.sessionBulletOuter, { backgroundColor: `${raceColor}20` }]}>
                    <View style={[styles.sessionBulletInner, { backgroundColor: raceColor }]} />
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
        <Target size={32} color={raceColor} style={{ marginBottom: 12 }} />
        <Text style={styles.ctaTitle}>Ready to Start?</Text>
        <Text style={styles.ctaSubtitle}>
          Download this plan and start your journey to race day success!
        </Text>
        <TouchableOpacity 
          style={[styles.downloadButton, { backgroundColor: raceColor }]}
          onPress={handlePrintPlan}
        >
          <Download size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.downloadButtonText}>Download & Share Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Stop Goal Option - Removed as it's now handled by the parent RaceGoalScreen */}
    </ScrollView>
  );
};

export default TrainingPlan;

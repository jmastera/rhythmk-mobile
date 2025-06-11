import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background for the screen
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  userStatus: {
    color: '#888',
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Debug Section Styles
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  warningButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  debugInfoContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  debugInfoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugInfoText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  contentContainer: {
    padding: 16, // Consistent padding
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 24, // More padding at the top for status bar etc.
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  // Styles for new sections and settings
  sectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#1e1e1e', // Slightly lighter than screen background
    borderRadius: 8,
  },
  sectionContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
  },
  smallLabel: {
    fontSize: 13,
    color: '#b0b0b0', // Lighter grey for sub-labels
    marginBottom: 4,
    textAlign: 'center', // Center align for feet/inches labels
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8, // Consistent with other elements
    borderWidth: 1,
    borderColor: '#FFA500', // Accent color
    marginHorizontal: 4,
  },
  unitButtonActive: {
    backgroundColor: '#FFA500', // Accent color for active button
  },
  unitButtonText: {
    fontSize: 14,
    color: '#FFA500', // Accent color
  },
  unitButtonTextActive: {
    color: '#121212', // Dark text for active button
    fontWeight: 'bold',
  },
  numericInput: {
    backgroundColor: 'rgba(80, 80, 80, 0.5)', // More opaque dark grey background
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.7)', // More visible border
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10, // Increased vertical padding
    color: '#FFFFFF', // Ensure text is white
    minWidth: 70, // Adjusted minWidth
    minHeight: 44, // Standard tap height
    textAlign: 'center',
    fontSize: 16,
  },
  settingRowDoubleInput: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Use space-around for better spacing of ft/in inputs
    alignItems: 'flex-start', // Align items to the start of the cross axis
    flex: 1, // Allow this container to take available space in the row
    // marginBottom: 16, // Removed, as settingRow will handle vertical spacing
    // paddingHorizontal: 16, // Removed, let child doubleInputContainers manage their space
  },
  doubleInputContainer: {
    width: '45%', // Adjusted width to allow for space-around
    alignItems: 'stretch', // Stretch label and input horizontally if needed
  },
  smallInput: {
    width: '100%',
  },
  textInput: {
    backgroundColor: 'rgba(80, 80, 80, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    minHeight: 44,
    fontSize: 16,
    flex: 1, // Take up available space in the row
  },
});

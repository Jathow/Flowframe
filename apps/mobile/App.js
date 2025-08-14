import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Planner Mobile — Today, Quick Capture, Timers (scaffold)</Text>
      <View style={{ height: 12 }} />
      <Button title="Request notifications permission" onPress={async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('Permission:', status);
      }} />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});



import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/auth/session';
import { RescueColors as C } from '@/constants/rescue-theme';

export default function EntryRoute() {
  const { loading, session } = useSession();
  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.mark}>SCAN2RESCUE</Text>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }
  return <Redirect href={session ? '/(main)/home' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: C.background },
  mark: { color: C.text, fontSize: 21, fontWeight: '800' },
});

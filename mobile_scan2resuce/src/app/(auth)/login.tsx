import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/auth/session';
import { ActionButton, Copy, Field, Page, StatusMessage, Surface } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!identifier.trim() || !password) {
      setError('Enter your email or phone number and password.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await signIn(identifier.trim(), password);
      router.replace('/(main)/home');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <View style={styles.brand}>
        <Text style={styles.brandMark}>SCAN2RESCUE</Text>
        <Text style={styles.tagline}>Scan. Alert. Save Lives.</Text>
      </View>
      <Surface>
        <Text style={styles.heading}>Welcome back</Text>
        <Copy muted>Sign in to access your emergency card.</Copy>
        <Field label="Email or phone" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        {error ? <StatusMessage message={error} error /> : null}
        <ActionButton label="Sign in" onPress={submit} busy={pending} />
        {pending ? <ActivityIndicator color={C.primary} /> : null}
      </Surface>
      <View style={styles.registerLine}>
        <Copy muted>New to Scan2Rescue?</Copy>
        <Link href="/(auth)/register" style={styles.link}>Create account</Link>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 6, paddingVertical: 18 },
  brandMark: { color: C.text, fontSize: 24, fontWeight: '800' },
  tagline: { color: C.muted, fontSize: 13 },
  heading: { color: C.text, fontSize: 22, fontWeight: '700' },
  registerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  link: { color: C.primary, fontSize: 15, fontWeight: '700' },
});
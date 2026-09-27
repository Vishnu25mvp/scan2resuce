import { Checkbox, Host, Picker } from '@expo/ui';
import type { KeyboardTypeOptions } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RescueColors as C, RescueSpacing as S } from '@/constants/rescue-theme';

export function Page({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const content = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.pageContent}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.pageContent, { flex: 1 }]}>{children}</View>
  );
  return <View style={styles.page}>{content}</View>;
}

export function Surface({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Copy({ children, muted = false, style }: { children: React.ReactNode; muted?: boolean; style?: object }) {
  return <Text selectable style={[styles.copy, muted && styles.muted, style]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  multiline = false,
  editable = true,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multilineInput, !editable && styles.disabledInput]}
      />
    </View>
  );
}

export function OptionField({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Label>{label}</Label>
      <View style={styles.pickerFrame}>
        <Host matchContents>
          <Picker selectedValue={value} onValueChange={(next) => onValueChange(String(next))}>
            {options.map((option) => <Picker.Item key={option} label={option || `Select ${label.toLowerCase()}`} value={option} />)}
          </Picker>
        </Host>
      </View>
    </View>
  );
}

export function ConsentField({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.consentField}>
      <Host matchContents>
        <Checkbox
          value={value}
          onValueChange={onValueChange}
          label="Enable my public emergency card"
        />
      </Host>
      <Text style={styles.muted}>
        Anyone who scans your sticker can see the owner and vehicle details, blood group, medical information, and emergency contacts. You can turn this off later.
      </Text>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        (disabled || busy) && styles.disabledButton,
        pressed && !disabled && !busy && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{busy ? 'Please wait...' : label}</Text>
    </Pressable>
  );
}

export function RowButton({ label, detail, onPress, danger = false }: {
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: C.danger }]}>{label}</Text>
        {detail ? <Text style={styles.muted}>{detail}</Text> : null}
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

export function StatusMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <Text accessibilityRole={error ? 'alert' : 'text'} style={[styles.status, error && styles.error]}>{message}</Text>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  pageContent: { width: '100%', maxWidth: 620, alignSelf: 'center', gap: S.md, padding: S.lg, paddingBottom: 48 },
  surface: { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: S.md, gap: S.md },
  title: { color: C.text, fontSize: 25, lineHeight: 31, fontWeight: '700' },
  copy: { color: C.text, fontSize: 15, lineHeight: 22 },
  muted: { color: C.muted, fontSize: 13, lineHeight: 19 },
  label: { color: C.muted, fontSize: 13, fontWeight: '600' },
  fieldGroup: { gap: S.xs },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.surface, color: C.text, fontSize: 16 },
  multilineInput: { minHeight: 88, paddingTop: 14 },
  disabledInput: { opacity: 0.65 },
  pickerFrame: { minHeight: 50, justifyContent: 'center', paddingHorizontal: S.sm, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 8 },
  consentField: { gap: S.sm, padding: S.md, borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.surfaceRaised },
  button: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.md, backgroundColor: C.primary, borderRadius: 8 },
  secondaryButton: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  disabledButton: { opacity: 0.55 },
  pressed: { opacity: 0.76 },
  buttonText: { color: C.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondaryButtonText: { color: C.text },
  rowButton: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  rowArrow: { color: C.muted, fontSize: 26 },
  status: { color: C.muted, fontSize: 14, lineHeight: 20 },
  error: { color: C.danger },
});
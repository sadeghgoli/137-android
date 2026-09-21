import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Text,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '../constants';

type TextFieldProps = TextInputProps & {
  error?: string;
};

export function TextField({ error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        {...props}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, style]}
        textAlign="right"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  error: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.error,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

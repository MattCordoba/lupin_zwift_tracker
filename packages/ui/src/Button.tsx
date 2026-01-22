import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "./theme";

type ButtonProps = {
  label: string;
  onPress?: () => void;
};

export function Button({ label, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.lupin,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.4
  }
});

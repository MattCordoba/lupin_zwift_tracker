import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, typography } from "./theme";

type ButtonProps = {
  label: string;
  onPress?: () => void;
};

export function Button({ label, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <View style={styles.glow} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glow,
    overflow: "hidden"
  },
  glow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    backgroundColor: colors.glow,
    opacity: 0.4,
    borderRadius: 30
  },
  label: {
    color: "#fff",
    fontFamily: typography.headingFont,
    textTransform: "uppercase",
    letterSpacing: 1
  }
});

import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Button, colors, typography } from "@lupin/ui";
import {
  ensureUserProfile,
  isFirebaseConfigured,
  observeAuthState,
  signOutUser,
  subscribeToUserProfile,
  updateUserPreferences
} from "@lupin/data";
import type { UserPreferences, UserProfile } from "@lupin/types";

type AuthUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

const clampMinutes = (value: number) => Math.max(10, Math.min(600, value));

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeBudgetInput, setTimeBudgetInput] = useState("60");

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;
    const unsubscribe = observeAuthState(async (nextUser) => {
      setUser(nextUser as AuthUser | null);
      setProfile(null);
      setStatus(null);
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }
      if (nextUser) {
        await ensureUserProfile(nextUser);
        profileUnsubscribe = subscribeToUserProfile(nextUser.uid, setProfile);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (profile?.preferences?.timeBudgetMinutes) {
      setTimeBudgetInput(String(profile.preferences.timeBudgetMinutes));
    }
  }, [profile?.preferences?.timeBudgetMinutes]);

  const updatePreferences = async (next: UserPreferences) => {
    if (!user) {
      return;
    }
    try {
      await updateUserPreferences(user.uid, next);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update preferences.");
    }
  };

  const handleUnitsToggle = () => {
    if (!profile) {
      return;
    }
    const nextUnits = profile.preferences.units === "metric" ? "imperial" : "metric";
    void updatePreferences({ ...profile.preferences, units: nextUnits });
  };

  const handleTimeBudgetSave = () => {
    if (!profile) {
      return;
    }
    const parsed = Number.parseInt(timeBudgetInput, 10);
    const nextMinutes = clampMinutes(Number.isNaN(parsed) ? 60 : parsed);
    void updatePreferences({ ...profile.preferences, timeBudgetMinutes: nextMinutes });
    setTimeBudgetInput(String(nextMinutes));
  };

  const footerCopy = useMemo(
    () =>
      "Zwift and Garmin are trademarks of their respective owners. This app is not affiliated with or endorsed by Zwift or Garmin.",
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Performance ready</Text>
          <Text style={styles.title}>Lupin Zwift Completion Tracker</Text>
          <Text style={styles.subtitle}>
            Personalize your training window, stay on top of badges, and keep every
            ride in sync.
          </Text>
        </View>

        <View style={styles.card}>
          {!isFirebaseConfigured && (
            <Text style={styles.notice}>
              Add Firebase env vars to enable auth and shared profiles.
            </Text>
          )}

          {loading && <Text style={styles.notice}>Loading authentication...</Text>}

          {!loading && !user && (
            <View style={styles.section}>
              <Button
                label={
                  Platform.OS === "web"
                    ? "Continue with Google"
                    : "Connect on web to sign in"
                }
                onPress={undefined}
              />
              <Text style={styles.helperText}>
                Mobile auth requires native provider setup. For now, sign in on the
                web app to create your profile.
              </Text>
            </View>
          )}

          {user && (
            <View style={styles.section}>
              <View style={styles.profileHeader}>
                {profile?.photoUrl ? (
                  <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {(profile?.displayName || user.displayName || "Rider")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.profileName}>
                    {profile?.displayName || user.displayName || "Lupin Rider"}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {profile?.email || user.email || "No email on file"}
                  </Text>
                </View>
              </View>

              <View style={styles.preferenceCard}>
                <Text style={styles.preferenceTitle}>Preferences</Text>
                <Text style={styles.preferenceLabel}>Units</Text>
                <Button
                  label={`Switch to ${
                    profile?.preferences.units === "metric" ? "imperial" : "metric"
                  }`}
                  onPress={handleUnitsToggle}
                />

                <Text style={styles.preferenceLabel}>Default time budget (minutes)</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={timeBudgetInput}
                    onChangeText={setTimeBudgetInput}
                    onBlur={handleTimeBudgetSave}
                  />
                  <Button label="Save" onPress={handleTimeBudgetSave} />
                </View>
              </View>

              <Button label="Sign out" onPress={() => signOutUser()} />
            </View>
          )}

          {status && <Text style={styles.notice}>{status}</Text>}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Lupin Zwift Completion Tracker</Text>
          <Text style={styles.footerText}>© 2026 Lupin</Text>
          <Text style={styles.footerText}>{footerCopy}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night
  },
  scrollContent: {
    padding: 24,
    gap: 24
  },
  hero: {
    gap: 12
  },
  kicker: {
    color: colors.volt,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontFamily: typography.headingFont
  },
  title: {
    color: colors.ice,
    fontSize: 28,
    fontFamily: typography.displayFont,
    textTransform: "uppercase"
  },
  subtitle: {
    color: colors.ice,
    opacity: 0.8,
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: colors.steel,
    padding: 20,
    borderRadius: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.graphite
  },
  section: {
    gap: 16
  },
  notice: {
    color: colors.ice,
    opacity: 0.75
  },
  helperText: {
    color: colors.ice,
    opacity: 0.6,
    fontSize: 12,
    lineHeight: 18
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.accent
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.night,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.accent
  },
  avatarText: {
    color: colors.ice,
    fontFamily: typography.headingFont
  },
  profileName: {
    color: colors.ice,
    fontSize: 18,
    fontFamily: typography.headingFont
  },
  profileEmail: {
    color: colors.ice,
    opacity: 0.7
  },
  preferenceCard: {
    backgroundColor: colors.night,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.graphite
  },
  preferenceTitle: {
    color: colors.ice,
    fontFamily: typography.headingFont,
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  preferenceLabel: {
    color: colors.ice,
    opacity: 0.7
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  input: {
    flex: 1,
    backgroundColor: colors.carbon,
    color: colors.ice,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.graphite
  },
  footer: {
    gap: 6
  },
  footerTitle: {
    color: colors.ice,
    fontFamily: typography.headingFont
  },
  footerText: {
    color: colors.ice,
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 18
  }
});

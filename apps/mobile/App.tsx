import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Platform,
  Image,
  ScrollView
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { Button, colors } from "@lupin/ui";
import {
  ensureUserProfile,
  observeAuthState,
  signInWithAppleCredential,
  signInWithGoogleCredential,
  signOutUser,
  subscribeToUserProfile,
  updateUserPreferences,
  isFirebaseConfigured
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
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
  });

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

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }
    const { authentication } = response;
    if (!authentication) {
      setStatus("Google auth completed without tokens.");
      return;
    }

    const idToken = authentication.idToken ?? undefined;
    const accessToken = authentication.accessToken ?? undefined;
    if (!idToken && !accessToken) {
      setStatus("Google auth did not return a token.");
      return;
    }
    signInWithGoogleCredential(idToken, accessToken).catch((error: Error) =>
      setStatus(error.message)
    );
  }, [response]);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  const handleAppleSignIn = async () => {
    try {
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });
      if (!result.identityToken) {
        setStatus("Apple auth did not return a token.");
        return;
      }
      await signInWithAppleCredential(result.identityToken, result.nonce ?? undefined);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Apple sign-in failed.");
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Lupin Zwift Completion Tracker</Text>
          <Text style={styles.subtitle}>Cross-platform rider profile + preferences</Text>

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
                  request && isFirebaseConfigured
                    ? "Continue with Google"
                    : "Google auth unavailable"
                }
                onPress={() =>
                  request && isFirebaseConfigured ? promptAsync() : undefined
                }
              />
              {Platform.OS === "ios" && appleAvailable && (
                <Button label="Continue with Apple" onPress={handleAppleSignIn} />
              )}
              <Text style={styles.helperText}>
                Your profile syncs across web + mobile once signed in.
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
                <View style={styles.profileMeta}>
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
          <Text style={styles.footerText}>© 2024 Lupin</Text>
          <Text style={styles.footerText}>
            Zwift and Garmin are trademarks of their respective owners. This app is not
            affiliated with or endorsed by Zwift or Garmin.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night,
    padding: 24
  },
  scrollContent: {
    gap: 24
  },
  card: {
    backgroundColor: colors.steel,
    padding: 24,
    borderRadius: 18,
    gap: 12
  },
  title: {
    color: colors.ice,
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.ice,
    opacity: 0.8
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
    fontSize: 12
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.night,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.ice,
    fontWeight: "700"
  },
  profileMeta: {
    gap: 4
  },
  profileName: {
    color: colors.ice,
    fontSize: 18,
    fontWeight: "700"
  },
  profileEmail: {
    color: colors.ice,
    opacity: 0.7
  },
  preferenceCard: {
    backgroundColor: colors.night,
    borderRadius: 14,
    padding: 16,
    gap: 12
  },
  preferenceTitle: {
    color: colors.ice,
    fontWeight: "700",
    fontSize: 16
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
    backgroundColor: colors.steel,
    color: colors.ice,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10
  },
  footer: {
    gap: 6
  },
  footerTitle: {
    color: colors.ice,
    fontWeight: "700"
  },
  footerText: {
    color: colors.ice,
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 18
  }
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  useWindowDimensions
} from "react-native";

const logo = require("../assets/lupin-logo.png");

const suggestions = [
  {
    id: "alpine",
    name: "Alpine Dream",
    world: "Watopia",
    distance: "27.8 km",
    time: "56 min",
    impact: ["820 XP", "410 m climb", "540 kcal"]
  },
  {
    id: "downtown",
    name: "Downtown Titans",
    world: "New York",
    distance: "18.4 km",
    time: "38 min",
    impact: ["560 XP", "140 m climb", "420 kcal"]
  },
  {
    id: "coastal",
    name: "Coastal Tempo",
    world: "Makuri Islands",
    distance: "32.1 km",
    time: "1h 04m",
    impact: ["910 XP", "280 m climb", "610 kcal"]
  }
];

const totalBadges = 120;
const totalHours = 180;

const analyticsSnapshots = [
  { date: "Aug 05", badgesCompleted: 62, hoursCompleted: 84, remainingBadges: 58 },
  { date: "Aug 06", badgesCompleted: 65, hoursCompleted: 88, remainingBadges: 55 },
  { date: "Aug 07", badgesCompleted: 69, hoursCompleted: 93, remainingBadges: 51 },
  { date: "Aug 08", badgesCompleted: 71, hoursCompleted: 96, remainingBadges: 49 },
  { date: "Aug 09", badgesCompleted: 74, hoursCompleted: 101, remainingBadges: 46 },
  { date: "Aug 10", badgesCompleted: 78, hoursCompleted: 108, remainingBadges: 42 }
];

const weeklyTrend = [
  { label: "Wk 1", badges: 6, hours: 7 },
  { label: "Wk 2", badges: 8, hours: 10 },
  { label: "Wk 3", badges: 9, hours: 11 },
  { label: "Wk 4", badges: 11, hours: 14 }
];

const monthlyTrend = [
  { label: "May", badges: 18, hours: 24 },
  { label: "Jun", badges: 22, hours: 28 },
  { label: "Jul", badges: 26, hours: 33 },
  { label: "Aug", badges: 31, hours: 38 }
];

export default function Home() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const burndownHeight = 120;
  const trendHeight = 80;
  const latestSnapshot = analyticsSnapshots[analyticsSnapshots.length - 1];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.background} pointerEvents="none">
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowRight]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Zwift performance cockpit</Text>
          <Text style={styles.title}>Lupin Daily Route Builder</Text>
          <Text style={styles.subtitle}>
            Stack impact, close badges, and chase the next world unlock with confidence.
          </Text>
        </View>
      </View>

      <View style={[styles.grid, isWide ? styles.gridWide : styles.gridStack]}>
        <View style={[styles.card, styles.cardTall]}>
          <Text style={styles.sectionLabel}>Home</Text>
          <Text style={styles.sectionTitle}>Daily suggestions</Text>
          <Text style={styles.sectionHint}>Curated by impact and remaining badges.</Text>
          <View style={styles.suggestionList}>
            {suggestions.map((item) => (
              <View key={item.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <View>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionMeta}>
                      {item.world} • {item.distance} • {item.time}
                    </Text>
                  </View>
                  <View style={styles.worldTag}>
                    <Text style={styles.worldTagText}>{item.world}</Text>
                  </View>
                </View>
                <View style={styles.metricRow}>
                  {item.impact.map((metric) => (
                    <View key={metric} style={styles.metricPill}>
                      <Text style={styles.metricText}>{metric}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Sync to Zwift calendar</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Progress</Text>
          <Text style={styles.sectionTitle}>Badge hunt status</Text>
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Badges completed</Text>
              <Text style={styles.progressValue}>68%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "68%" }]} />
            </View>
          </View>
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Hours completed</Text>
              <Text style={styles.progressValue}>54%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "54%" }]} />
            </View>
          </View>
          <View style={styles.remainingTotals}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Remaining routes</Text>
              <Text style={styles.totalValue}>42</Text>
              <Text style={styles.totalDetail}>910 km left</Text>
            </View>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Elevation to go</Text>
              <Text style={styles.totalValue}>8,320 m</Text>
              <Text style={styles.totalDetail}>18 worlds</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.analyticsCard]}>
          <Text style={styles.sectionLabel}>Analytics</Text>
          <Text style={styles.sectionTitle}>Daily snapshots</Text>
          <Text style={styles.sectionHint}>
            Track completed badges and hours while the burndown trends toward zero.
          </Text>
          <View style={styles.snapshotList}>
            {analyticsSnapshots.map((snapshot) => (
              <View key={snapshot.date} style={styles.snapshotRow}>
                <View>
                  <Text style={styles.snapshotDate}>{snapshot.date}</Text>
                  <Text style={styles.snapshotMeta}>
                    {snapshot.badgesCompleted} badges • {snapshot.hoursCompleted} hrs
                  </Text>
                </View>
                <Text style={styles.snapshotRemaining}>{snapshot.remainingBadges} left</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartBlock}>
            <Text style={styles.chartTitle}>Badge burndown</Text>
            <View style={[styles.burndownChart, { height: burndownHeight }]}>
              {analyticsSnapshots.map((snapshot) => {
                const height = Math.round(
                  (snapshot.remainingBadges / totalBadges) * burndownHeight
                );
                return (
                  <View key={snapshot.date} style={styles.chartColumn}>
                    <View style={[styles.burndownBar, { height }]} />
                    <Text style={styles.chartLabel}>{snapshot.date.slice(4)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.trendGrid}>
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>Weekly completion</Text>
              <View style={[styles.trendChart, { height: trendHeight }]}>
                {weeklyTrend.map((week) => (
                  <View key={week.label} style={styles.trendColumn}>
                    <View
                      style={[
                        styles.trendBar,
                        { height: Math.round((week.badges / 12) * trendHeight) }
                      ]}
                    />
                    <Text style={styles.trendLabel}>{week.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>Monthly completion</Text>
              <View style={[styles.trendChart, { height: trendHeight }]}>
                {monthlyTrend.map((month) => (
                  <View key={month.label} style={styles.trendColumn}>
                    <View
                      style={[
                        styles.trendBarAlt,
                        { height: Math.round((month.badges / 34) * trendHeight) }
                      ]}
                    />
                    <Text style={styles.trendLabel}>{month.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.analyticsFooter}>
            <View style={styles.footerMetric}>
              <Text style={styles.footerLabel}>Badges to goal</Text>
              <Text style={styles.footerValue}>{totalBadges - latestSnapshot.badgesCompleted}</Text>
            </View>
            <View style={styles.footerMetric}>
              <Text style={styles.footerLabel}>Hours to goal</Text>
              <Text style={styles.footerValue}>{totalHours - latestSnapshot.hoursCompleted}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.routeCard]}>
          <Text style={styles.sectionLabel}>Route detail</Text>
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.routeName}>Coast Crusher Reverse</Text>
              <Text style={styles.routeSub}>Makuri Islands • Badge unclaimed</Text>
            </View>
            <View style={styles.routeBadge}>
              <Text style={styles.routeBadgeText}>Makuri</Text>
            </View>
          </View>
          <Text style={styles.routeDescription}>
            Rolling coastal tempo with a final climb. Best ridden with 2x XP boost.
          </Text>
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time estimate</Text>
              <Text style={styles.statValue}>52 min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>World availability</Text>
              <Text style={styles.statValue}>Today, 2:00 PM</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Remaining impact</Text>
              <Text style={styles.statValue}>420 XP • 210 m</Text>
            </View>
          </View>
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <Text style={styles.impactLabel}>Distance</Text>
              <Text style={styles.impactValue}>24.5 km</Text>
            </View>
            <View style={styles.impactCard}>
              <Text style={styles.impactLabel}>Elevation</Text>
              <Text style={styles.impactValue}>410 m</Text>
            </View>
            <View style={styles.impactCard}>
              <Text style={styles.impactLabel}>Estimated effort</Text>
              <Text style={styles.impactValue}>7.3 / 10</Text>
            </View>
          </View>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Pin route to lineup</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0b1016"
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 64,
    paddingTop: 40,
    alignItems: "center"
  },
  background: {
    ...StyleSheet.absoluteFillObject
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.6
  },
  glowTop: {
    width: 420,
    height: 420,
    backgroundColor: "#ff6b3d",
    top: -180,
    left: -120
  },
  glowRight: {
    width: 520,
    height: 520,
    backgroundColor: "#2ad8ff",
    top: 120,
    right: -220
  },
  glowBottom: {
    width: 460,
    height: 460,
    backgroundColor: "#68ff8f",
    bottom: -220,
    left: 120
  },
  header: {
    maxWidth: 1120,
    width: "100%",
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    marginBottom: 32,
    flexWrap: "wrap"
  },
  logoWrap: {
    width: 74,
    height: 74,
    borderRadius: 20,
    backgroundColor: "rgba(14, 18, 24, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16
  },
  logo: {
    width: 56,
    height: 56,
    resizeMode: "contain"
  },
  headerCopy: {
    flex: 1,
    minWidth: 260,
    gap: 8
  },
  kicker: {
    color: "#ff6b3d",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontFamily: "Oswald"
  },
  title: {
    color: "#f5f8ff",
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Bebas Neue"
  },
  subtitle: {
    color: "#d9e3f5",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Barlow"
  },
  grid: {
    maxWidth: 1120,
    width: "100%",
    gap: 20
  },
  gridWide: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  gridStack: {
    flexDirection: "column"
  },
  card: {
    backgroundColor: "rgba(12, 18, 26, 0.85)",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 16,
    flexGrow: 1,
    minWidth: 280
  },
  cardTall: {
    flexBasis: 480
  },
  analyticsCard: {
    flexBasis: 460
  },
  routeCard: {
    flexBasis: 560
  },
  sectionLabel: {
    color: "#68ff8f",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontFamily: "Oswald"
  },
  sectionTitle: {
    color: "#f5f8ff",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Bebas Neue"
  },
  sectionHint: {
    color: "#a7b4cc",
    fontFamily: "Barlow",
    fontSize: 13
  },
  suggestionList: {
    gap: 14
  },
  suggestionCard: {
    backgroundColor: "rgba(17, 25, 36, 0.95)",
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap"
  },
  suggestionName: {
    color: "#f5f8ff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Oswald"
  },
  suggestionMeta: {
    color: "#a7b4cc",
    fontSize: 12,
    fontFamily: "Barlow"
  },
  worldTag: {
    backgroundColor: "rgba(104, 255, 143, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  worldTagText: {
    color: "#68ff8f",
    fontSize: 11,
    fontFamily: "Oswald",
    letterSpacing: 0.8
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metricPill: {
    backgroundColor: "rgba(45, 216, 255, 0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  metricText: {
    color: "#2ad8ff",
    fontSize: 11,
    fontFamily: "Barlow"
  },
  ctaButton: {
    backgroundColor: "#ff6b3d",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  ctaButtonText: {
    color: "#0b1016",
    fontWeight: "700",
    fontFamily: "Oswald",
    letterSpacing: 1
  },
  progressBlock: {
    gap: 8
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressLabel: {
    color: "#a7b4cc",
    fontFamily: "Barlow",
    fontSize: 13
  },
  progressValue: {
    color: "#f5f8ff",
    fontFamily: "Oswald",
    fontSize: 14
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ff6b3d",
    borderRadius: 999
  },
  remainingTotals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  totalCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "rgba(20, 30, 42, 0.9)",
    borderRadius: 16,
    padding: 14,
    gap: 6
  },
  totalLabel: {
    color: "#a7b4cc",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Oswald"
  },
  totalValue: {
    color: "#f5f8ff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Bebas Neue"
  },
  totalDetail: {
    color: "#68ff8f",
    fontSize: 12,
    fontFamily: "Barlow"
  },
  snapshotList: {
    gap: 10
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(17, 25, 36, 0.75)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  snapshotDate: {
    color: "#f5f8ff",
    fontSize: 14,
    fontFamily: "Oswald"
  },
  snapshotMeta: {
    color: "#a7b4cc",
    fontSize: 12,
    fontFamily: "Barlow"
  },
  snapshotRemaining: {
    color: "#68ff8f",
    fontSize: 13,
    fontFamily: "Oswald"
  },
  chartBlock: {
    gap: 10
  },
  chartTitle: {
    color: "#f5f8ff",
    fontSize: 16,
    fontFamily: "Oswald"
  },
  burndownChart: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    paddingHorizontal: 4
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6
  },
  burndownBar: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#ff6b3d"
  },
  chartLabel: {
    color: "#a7b4cc",
    fontSize: 10,
    fontFamily: "Barlow"
  },
  trendGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap"
  },
  trendCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "rgba(20, 30, 42, 0.85)",
    borderRadius: 14,
    padding: 12,
    gap: 10
  },
  trendTitle: {
    color: "#f5f8ff",
    fontFamily: "Oswald",
    fontSize: 14
  },
  trendChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8
  },
  trendColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6
  },
  trendBar: {
    width: "100%",
    borderRadius: 6,
    backgroundColor: "#2ad8ff"
  },
  trendBarAlt: {
    width: "100%",
    borderRadius: 6,
    backgroundColor: "#68ff8f"
  },
  trendLabel: {
    color: "#a7b4cc",
    fontSize: 10,
    fontFamily: "Barlow"
  },
  analyticsFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  footerMetric: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "rgba(17, 25, 36, 0.85)",
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  footerLabel: {
    color: "#a7b4cc",
    fontFamily: "Barlow",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  footerValue: {
    color: "#f5f8ff",
    fontFamily: "Oswald",
    fontSize: 16
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10
  },
  routeName: {
    color: "#f5f8ff",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Oswald"
  },
  routeSub: {
    color: "#a7b4cc",
    fontFamily: "Barlow",
    fontSize: 12
  },
  routeBadge: {
    backgroundColor: "rgba(255, 107, 61, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  routeBadgeText: {
    color: "#ff6b3d",
    fontFamily: "Oswald",
    fontSize: 12,
    letterSpacing: 1
  },
  routeDescription: {
    color: "#d9e3f5",
    fontFamily: "Barlow",
    lineHeight: 22
  },
  routeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  statItem: {
    minWidth: 150,
    gap: 4
  },
  statLabel: {
    color: "#a7b4cc",
    fontFamily: "Barlow",
    fontSize: 12
  },
  statValue: {
    color: "#f5f8ff",
    fontFamily: "Oswald",
    fontSize: 15
  },
  impactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  impactCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "rgba(21, 34, 48, 0.95)",
    borderRadius: 14,
    padding: 12,
    gap: 6
  },
  impactLabel: {
    color: "#a7b4cc",
    fontSize: 12,
    fontFamily: "Barlow"
  },
  impactValue: {
    color: "#2ad8ff",
    fontSize: 16,
    fontFamily: "Oswald"
  },
  secondaryButton: {
    borderColor: "#2ad8ff",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#2ad8ff",
    fontFamily: "Oswald",
    letterSpacing: 1
  }
});

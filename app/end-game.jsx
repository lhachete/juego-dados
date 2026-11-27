import { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Button from "../components/Button";
import Confetti from "../components/Confetti";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import { useBlockBack } from "../hooks/useBlockBack";

const PLACE_STYLE = {
  1: { height: 150, color: "#FACC15", medal: "🥇" },
  2: { height: 110, color: "#D1D5DB", medal: "🥈" },
  3: { height: 80, color: "#D97706", medal: "🥉" },
};

// Tiempos de la animación (ms)
const BAR_DELAY = { 3: 300, 2: 800, 1: 1300 };
const BAR_DURATION = 700;
const CROWN_DELAY = 2100;

const Crown = () => {
  const scale = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(CROWN_DELAY, withSpring(1, { damping: 8 }));
    bounce.value = withDelay(
      CROWN_DELAY + 400,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scale: scale.value }],
  }));

  return <Animated.Text style={[styles.crown, style]}>👑</Animated.Text>;
};

const PodiumColumn = ({ player }) => {
  const { height, color, medal } = PLACE_STYLE[player.place];
  const delay = BAR_DELAY[player.place];

  const barHeight = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const labelY = useSharedValue(12);

  useEffect(() => {
    barHeight.value = withDelay(
      delay,
      withTiming(height, { duration: BAR_DURATION, easing: Easing.out(Easing.back(1.4)) })
    );
    labelOpacity.value = withDelay(delay + BAR_DURATION - 200, withTiming(1, { duration: 400 }));
    labelY.value = withDelay(delay + BAR_DURATION - 200, withSpring(0, { damping: 10 }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({ height: barHeight.value }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  return (
    <View style={styles.column}>
      <Animated.View style={[styles.label, labelStyle]}>
        {player.place === 1 && <Crown />}
        <Text style={[styles.podiumName, player.place === 1 && styles.podiumNameWinner]} numberOfLines={1}>
          {player.name}
        </Text>
        <Text style={[styles.podiumPoints, { color }]}>{player.points} pts</Text>
      </Animated.View>

      <Animated.View style={[styles.bar, { backgroundColor: color }, barStyle]}>
        <Text style={styles.medal}>{medal}</Text>
        <Text style={styles.placeNumber}>{player.place}º</Text>
      </Animated.View>
    </View>
  );
};

const EndGame = () => {
  const { players, scores, resetRoundState, resetWholeGame, playType } = useGame();
  // 🔒 back totalmente bloqueado
  useBlockBack(true);

  // Ranking ordenado. Con empate, los jugadores comparten puesto (1º, 1º, 3º...).
  const sorted = players
    .map((p) => ({ name: p, points: scores[p] ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const ranking = sorted.map((p) => ({
    ...p,
    place: sorted.findIndex((q) => q.points === p.points) + 1,
  }));

  const maxScore = ranking[0]?.points ?? 0;
  const winners = ranking.filter((p) => p.points === maxScore);

  // Podio con los 3 primeros: se pinta en orden 2º - 1º - 3º
  const top = ranking.slice(0, 3).filter((p) => p.place <= 3);
  const podium = [top[1], top[0], top[2]].filter(Boolean);
  const rest = ranking.slice(top.length);

  // Entrada del título
  const titleScale = useSharedValue(0.4);
  const titleOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400 });
    titleScale.value = withSpring(1, { damping: 9 });
    footerOpacity.value = withDelay(CROWN_DELAY + 300, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, titleStyle]}>
          <Text style={styles.title}>🎉 Fin de la partida 🎉</Text>
          {winners.length === 1 ? (
            <Text style={styles.winner}>¡Gana {winners[0].name}!</Text>
          ) : (
            <Text style={styles.winner}>
              ¡Empate entre {winners.map((w) => w.name).join(" y ")}!
            </Text>
          )}
        </Animated.View>

        <View style={styles.podium}>
          {podium.map((p, i) => (
            <PodiumColumn key={`${p.name}-${i}`} player={p} />
          ))}
        </View>

        <Animated.View style={[styles.footer, footerStyle]}>
          {rest.length > 0 && (
            <View style={styles.listContainer}>
              {rest.map((p, i) => (
                <View key={`${p.name}-${i}`} style={styles.row}>
                  <Text style={styles.player}>
                    {p.place}º  {p.name}
                  </Text>
                  <Text style={styles.score}>{p.points} pts</Text>
                </View>
              ))}
            </View>
          )}

          {/* En online la revancha se hace creando otra sala. */}
          {playType !== "online" && (
            <Button
              title="Jugar otra vez"
              onPress={() => {
                resetRoundState();
                router.replace(`/${playType}-mode`);
              }}
            />
          )}

          <Button
            title="Volver al inicio"
            onPress={() => {
              resetWholeGame();
              router.dismissAll();
            }}
            variant="outline"
          />
        </Animated.View>
      </ScrollView>

      {/* Encima de todo, pero sin bloquear los botones */}
      <Confetti />
    </View>
  );
};

export default EndGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  winner: {
    color: "#FACC15",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "92%",
    minHeight: 280,
    marginBottom: 24,
  },
  column: {
    flex: 1,
    maxWidth: 120,
    alignItems: "center",
    marginHorizontal: 4,
  },
  label: {
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  crown: {
    fontSize: 34,
    marginBottom: 2,
  },
  podiumName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    maxWidth: "100%",
  },
  podiumNameWinner: {
    fontSize: 19,
  },
  podiumPoints: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
    paddingTop: 8,
    overflow: "hidden",
  },
  medal: {
    fontSize: 26,
  },
  placeNumber: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  footer: {
    width: "100%",
    alignItems: "center",
  },
  listContainer: {
    width: "80%",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomColor: "#374151",
    borderBottomWidth: 1,
  },
  player: {
    color: "white",
    fontSize: 18,
  },
  score: {
    color: "#A5B4FC",
    fontSize: 18,
  },
});

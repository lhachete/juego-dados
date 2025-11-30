import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";

const EndGame = () => {
  const { players, scores } = useGame();

  // Convertimos los datos a una lista ordenada
  const ranking = players
    .map((p) => ({ name: p, points: scores[p] }))
    .sort((a, b) => b.points - a.points);

  const maxScore = ranking[0].points;
  const winners = ranking.filter((p) => p.points === maxScore);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Fin de la partida</Text>

      {winners.length === 1 ? (
        <Text style={styles.winner}>Ganador: {winners[0].name}</Text>
      ) : (
        <Text style={styles.winner}>
          Empate entre: {winners.map(w => w.name).join(", ")}
        </Text>
      )}

      <View style={styles.listContainer}>
        {ranking.map((p) => (
          <View key={p.name} style={styles.row}>
            <Text style={styles.player}>{p.name}</Text>
            <Text style={styles.score}>{p.points} pts</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EndGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    paddingTop: 80,
    alignItems: "center"
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20
  },
  winner: {
    color: "#FACC15",
    fontSize: 22,
    marginBottom: 30
  },
  listContainer: {
    width: "80%",
    marginBottom: 40
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomColor: "#374151",
    borderBottomWidth: 1
  },
  player: {
    color: "white",
    fontSize: 18
  },
  score: {
    color: "#A5B4FC",
    fontSize: 18
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold"
  }
});

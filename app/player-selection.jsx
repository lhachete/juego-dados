import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import { validatePlayers } from "biblioteca/funcioteca";
import Button from "../components/Button";

const PlayerSelection = () => {

  const { players, setPlayers, playType } = useGame();

  const handleAddPlayer = () => {
    if (players.length >= 10) return;
    setPlayers([...players, ""]);
  };

  const handleRemovePlayer = (index) => {
    if (players.length === 2) return;
    const updated = players.filter((_, i) => i !== index);
    setPlayers(updated);
  };

  const handleChangeText = (text, index) => {
    const updated = [...players];
    updated[index] = text;
    setPlayers(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona los jugadores</Text>

      <View style={styles.playerList}>
        {players.map((player, index) => (
          <View key={index} style={styles.playerRow}>
            <TextInput
              style={styles.input}
              placeholder={`Jugador ${index + 1}`}
              placeholderTextColor="#9CA3AF"
              value={player}
              onChangeText={(text) => handleChangeText(text, index)}
            />
            {players.length > 2 && <TouchableOpacity
              onPress={() => handleRemovePlayer(index)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeText}>-</Text>
            </TouchableOpacity>
            }
          </View>
        ))}
      </View>

      {players.length < 10 && (
        <Button title="Añadir jugador" onPress={handleAddPlayer} variant="outline" />
      )}

      <Button
        title="Continuar"
        onPress={() => {
          const result = validatePlayers(players);

          if (!result.valid) {
            Alert.alert("Error", result.error);
            return;
          }

          router.replace(`/${playType}-mode`);
        }}
      />

    </View>
  );
};

export default PlayerSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    color: "white",
    fontWeight: "700",
    marginBottom: 30,
  },
  playerList: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    width: 220,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1F2937",
    borderRadius: 8,
    color: "white",
    fontSize: 16,
    marginRight: 10,
  },
  removeBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#7F1D1D", // rojo oscuro estilo tailwind "red-900"
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  removeText: {
    color: "#F87171", // rojo claro estilo "red-400"
    fontSize: 28,
    fontWeight: "900",
    marginTop: -4,
  },
});

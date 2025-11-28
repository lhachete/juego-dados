// app/game-mode.jsx
import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "../components/Button";
import { useGame } from "../contexts/GameContext";
import { router } from "expo-router";

const GameMode = () => {
  const { setMode, setPlayType } = useGame();
  const [selectedMode, setSelectedMode] = useState(null);

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    setMode(mode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona un modo de juego</Text>

      {/* Botón Modo Clásico */}
      <Button
        title="Modo Clásico"
        onPress={() => handleSelectMode("classic")}
        variant={selectedMode === "classic" ? "filled" : "outline"}
      />

      {/* Botón Modo Craziest */}
      <Button
        title="Modo Craziest"
        onPress={() => handleSelectMode("craziest")}
        variant={selectedMode === "craziest" ? "filled" : "outline"}
      />

      {/* Opciones del modo Clásico */}
      {selectedMode === "classic" && (
        <View style={styles.subMenu}>
          <Text style={styles.subtitle}>¿De qué forma vas a jugar?</Text>

          <Button
            title="Manual"
            variant="outline"
            onPress={() => {
              setPlayType("manual");
              router.push("/player-selection");
            }}
          />

          <Button
            title="Virtual"
            variant="outline"
            onPress={() => {
              setPlayType("virtual");
              // más adelante implementamos su pantalla
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 32,
  },
  subMenu: {
    marginTop: 24,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
})
export default GameMode;
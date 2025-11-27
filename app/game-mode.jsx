// app/game-mode.jsx
import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "../components/Button";

const GameMode = ({ navigation }) => {
  const [selectedMode, setSelectedMode] = useState(null);

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona un modo de juego</Text>

      {/* Botones principales */}
      <Button
        title="Modo Clásico"
        onPress={() => handleSelectMode("classic")}
        variant={selectedMode === "classic" ? "filled" : "outline"}
      />
      <Button
        title="Modo Craziest"
        onPress={() => {}}
        variant="outline"
      />

      {/* Opciones del modo clásico */}
      {selectedMode === "classic" && (
        <View style={styles.subMenu}>
          <Text style={styles.subtitle}>¿De qué forma vas a jugar?</Text>

          <Button
            title="Manual"
            onPress={() => navigation.navigate("/manual-mode")}
            variant="outline"
          />
          <Button
            title="Virtual"
            onPress={() => {}}
            variant="outline"
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
});

export default GameMode;

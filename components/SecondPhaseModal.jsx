import { Modal, View, Text, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import { getSecondPhaseChooser } from "../biblioteca/funcioteca";
 
// Modal del inicio de la segunda tanda.
// El sentido (Negras → Ases o Ases → Negras) lo decide quien va ganando.
//
// Pensado para multijugador con varios dispositivos: `canChoose` indica si
// este dispositivo es el del jugador que decide. Por ahora, con un solo móvil,
// siempre es true. Con varios, los demás verían "Esperando a que X elija".
const SecondPhaseModal = ({ visible, players, scores, onSelect, canChoose = true }) => {
  const chooser = getSecondPhaseChooser(players, scores);
 
  // Recuento ordenado de más a menos puntos (empates: orden de turno).
  const ranking = players
    .map((p, i) => ({ name: p, points: scores[p] || 0, order: i }))
    .sort((a, b) => b.points - a.points || a.order - b.order);
 
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Puntuaciones actuales</Text>
 
          <View style={styles.listContainer}>
            {ranking.map((p, i) => {
              const isChooser = p.name === chooser;
              return (
                <View key={`${p.name}-${i}`} style={styles.row}>
                  <Text style={[styles.player, isChooser && styles.leader]}>
                    {isChooser ? "👑 " : ""}{p.name}
                  </Text>
                  <Text style={[styles.score, isChooser && styles.leader]}>{p.points} pts</Text>
                </View>
              );
            })}
          </View>
 
          <Text style={styles.questionText}>
            {canChoose
              ? `${chooser}, ¿por dónde empieza la segunda tanda?`
              : `Esperando a que ${chooser} elija cómo empieza la segunda tanda…`}
          </Text>
 
          {canChoose && (
            <>
              <Touchable
                style={[styles.optionBtn, styles.negrasBtn]}
                onPress={() => onSelect("negras", chooser)}
              >
                <Text style={styles.optionText}>Empezando por Negras</Text>
              </Touchable>
 
              <Touchable
                style={[styles.optionBtn, styles.asesBtn]}
                onPress={() => onSelect("as", chooser)}
              >
                <Text style={styles.optionText}>Empezando por Ases</Text>
              </Touchable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
 
export default SecondPhaseModal;
 
const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#1F2937",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
 
  listContainer: {
    width: "100%",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  player: {
    color: "white",
    fontSize: 18,
  },
  leader: {
    color: "#FACC15",
    fontWeight: "700",
  },
  score: {
    color: "#A5B4FC",
    fontSize: 18,
    fontWeight: "600",
  },
 
  questionText: {
    color: "#FACC15",
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 24,
    textAlign: "center",
  },
  optionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 12,
  },
  negrasBtn: {
    backgroundColor: "#020202",
    marginBottom: 20,
  },
  asesBtn: {
    backgroundColor: "#FA0824",
  },
  optionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
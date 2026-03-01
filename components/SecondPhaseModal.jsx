import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";

const SecondPhaseModal = ({ visible, players, scores, onSelect }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Puntuaciones actuales</Text>

          <View style={styles.listContainer}>
            {players.map((p) => (
              <View key={p} style={styles.row}>
                <Text style={styles.player}>{p}</Text>
                <Text style={styles.score}>{scores[p] || 0} pts</Text>
              </View>
            ))}
          </View>

          <Text style={styles.questionText}>
            ¿Cómo vais a empezar la segunda tanda?
          </Text>

          <TouchableOpacity
            style={[styles.optionBtn, styles.negrasBtn]}
            onPress={() => onSelect("negras")}
          >
            <Text style={styles.optionText}>Empezando por Negras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionBtn, styles.asesBtn]}
            onPress={() => onSelect("as")}
          >
            <Text style={styles.optionText}>Empezando por Áses</Text>
          </TouchableOpacity>
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

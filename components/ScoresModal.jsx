import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

const ScoresModal = ({ visible, players, scores, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Puntuaciones totales</Text>

          <View style={styles.listContainer}>
            {players.map((player) => (
              <View key={player} style={styles.row}>
                <Text style={styles.player}>{player}</Text>
                <Text style={styles.score}>{scores[player] || 0} pts</Text>
              </View>
            ))}
          </View>


          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ScoresModal;

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
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTitle: {
    color: "#FACC15",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#FACC15",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  closeText: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "700",
  },
  // Estilos de la lista de puntuaciones
  listContainer: {
    width: "100%",
    marginBottom: 20,
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

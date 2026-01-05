import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import FiguresGrid from "./FiguresGrid";

const FiguresGridModal = ({ visible, onClose, faces, usedFaces }) => {
    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Figuras por completar</Text>

                    <FiguresGrid
                        faces={faces}
                        disabledFaces={usedFaces}
                        interactive={false}
                        variant="compact"
                    />

                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default FiguresGridModal;

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
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 20,
        textAlign: "center",
    },

    closeText: {
        color: "#FACC15",
        fontSize: 18,
        fontWeight: "600",
        marginTop: 10,
    },
});

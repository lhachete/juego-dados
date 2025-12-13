import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

const ExitGameModal = ({ visible, onExit, onFinish, onCancel }) => {
    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>¿Salir de la partida?</Text>

                    <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
                        <Text style={styles.exitText}>Salir de la partida</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
                        <Text style={styles.finishText}>Terminar partida</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onCancel}>
                        <Text style={styles.cancel}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ExitGameModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "85%",
        backgroundColor: "#1F2937",
        borderRadius: 12,
        padding: 30,
        alignItems: "center",
    },
    title: {
        color: "white",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 25,
    },
    exitBtn: {
        backgroundColor: "#DC2626",
        width: "100%",
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 12,
    },
    exitText: {
        color: "white",
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
    },
    finishBtn: {
        backgroundColor: "#16A34A",
        width: "100%",
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 20,
    },
    finishText: {
        color: "white",
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
    },
    cancel: {
        color: "#9CA3AF",
        fontSize: 16,
    },
});

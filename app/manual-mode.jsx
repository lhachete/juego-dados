import { useState } from "react";
import DADES from "./dades.jsx";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Image,
} from "react-native";

import { useGame } from "../contexts/GameContext";

const ManualMode = () => {
    const { players, scores, setScores } = useGame();

    const [turn, setTurn] = useState(0);
    const [selectedFace, setSelectedFace] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const currentPlayer = players[turn];

    const handleFacePress = (face) => {
        setSelectedFace(face);
        setModalVisible(true);
    };

    const handleSelectCount = (count) => {
        // 🔹 Guardar puntos (esto lo ajustamos luego según reglas exactas)
        const prev = scores[currentPlayer] || 0;
        const added = count; // de momento 1 punto por dado
        setScores({
            ...scores,
            [currentPlayer]: prev + added,
        });

        // 🔹 Cerrar modal
        setModalVisible(false);

        // 🔹 Pasar al siguiente jugador
        if (turn === players.length - 1) {
            // Si era el último → más adelante pasará a la puntuación
            setTurn(0);
            // aquí luego haremos navigation.navigate("/scoreboard");
        } else {
            setTurn((t) => t + 1);
        }
    };

    return (
        <View style={styles.container}>
            {/* ---- Turno del jugador ---- */}
            <Text style={styles.title}>Turno de {currentPlayer}</Text>

            <Text style={styles.subtitle}>Figuras por completar</Text>

            {/* ---- GRID DE 6 FIGURAS ---- */}
            <View style={styles.grid}>
                {DADES.map((face) => (
                    <TouchableOpacity
                        key={face.id}
                        style={styles.faceBox}
                        onPress={() => handleFacePress(face)}
                    >
                        <Image source={face.img} style={styles.faceImg} resizeMode="contain" />
                    </TouchableOpacity>
                ))}
            </View>


            {/* ---- MODAL PARA SELECCIONAR LA CANTIDAD ---- */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            ¿Cuántos dados de {selectedFace?.label} han salido?
                        </Text>

                        <View style={styles.countRow}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.countBtn}
                                    onPress={() => handleSelectCount(num)}
                                >
                                    <Text style={styles.countText}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ManualMode;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
        paddingTop: 60,
        alignItems: "center",
    },
    title: {
        color: "white",
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 20,
    },
    subtitle: {
        color: "#9CA3AF",
        fontSize: 18,
        marginBottom: 20,
    },
    grid: {
        width: "90%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    faceBox: {
        width: "40%",
        height: 100,
        backgroundColor: "#1F2937",
        margin: "5%",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    faceText: {
        color: "white",
        fontSize: 20,
        fontWeight: "600",
    },
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
        color: "white",
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20,
    },
    countRow: {
        flexDirection: "row",
        marginBottom: 20,
    },
    countBtn: {
        width: 50,
        height: 50,
        backgroundColor: "#374151",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 6,
    },
    countText: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",
    },
    cancelBtn: {
        marginTop: 10,
    },
    cancelText: {
        color: "#F87171",
        fontSize: 18,
    },
    faceImg: {
        width: "70%",
        height: "70%",
        borderRadius: 8,
    },

});

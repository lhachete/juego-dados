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
    const [round, setRound] = useState(1);
    const [selectedFace, setSelectedFace] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCount, setSelectedCount] = useState(null);
    //caras deshabilitadas
    /* 
    {
    "Jugador 1": [2, 5],
    "Jugador 2": [1],
    "Jugador 3": []
    }
    */
    const [disabledFaces, setDisabledFaces] = useState(
        players.reduce((acc, player) => {
            acc[player] = []; // cada jugador empieza sin figuras bloqueadas
            return acc;
        }, {})
    );

    const [secondPhaseChoice, setSecondPhaseChoice] = useState(null);
const [phaseModalVisible, setPhaseModalVisible] = useState(false);
// Para registrar el orden de selección en la segunda fase
const [secondPhaseOrder, setSecondPhaseOrder] = useState([]);



    const currentPlayer = players[turn];

    const TOTAL_ROUNDS = 13; // por ejemplo

    // Al pulsar una figura → solo se selecciona (NO abre modal)
    const handleFacePress = (face) => {
    setSelectedFace(face);
    setModalVisible(true);
};


    const openModal = () => {
        if (!selectedFace) return;
        setSelectedCount(null);
        setModalVisible(true);
    };

    const handleConfirmCount = () => {
        if (!selectedCount) return;

        const prev = scores[currentPlayer] || 0;
        // Calcular puntos a añadir según figura y cantidad.
        const added = selectedFace.id * selectedCount;

        setScores({
            ...scores,
            [currentPlayer]: prev + added,
        });

        // 🔹 Añadir la cara como deshabilitada SOLO al jugador actual
        setDisabledFaces({
            ...disabledFaces,
            [currentPlayer]: [...disabledFaces[currentPlayer], selectedFace.id]
        });

        // --- Si estamos en segunda tanda, actualizar figuras habilitadas por orden ---
if (round >= 7 && secondPhaseOrder.length) {
    // Encontrar el índice de la figura recién seleccionada
    const index = secondPhaseOrder.indexOf(selectedFace.id);
    // Próxima figura a habilitar (siguiente en el orden)
    const nextFaceId = secondPhaseOrder[index + 1];

    if (nextFaceId) {
        // Rehabilitar solo la siguiente figura para todos
        const updated = {};
        players.forEach(p => {
            updated[p] = DADES.map(f => f.id).filter(id => id !== nextFaceId);
        });
        setDisabledFaces(updated);
    }
}


        setModalVisible(false);

        // Cambiar turno
        if (turn === players.length - 1) {
    const nextRound = round + 1;
    setTurn(0);
    setRound(nextRound);

    // Abrir modal especial al llegar a ronda 7
    if (nextRound === 7) {
        setPhaseModalVisible(true);
    }

} else {
    setTurn((t) => t + 1);
}

        console.log('Puntos actualizados para', currentPlayer, ':', prev, '+', added, '=', prev + added);
        setSelectedFace(null);
        setSelectedCount(null);
    };

    const handleSecondPhaseSelect = (type) => {
    setSecondPhaseChoice(type);

    // Determinar orden según elección
    let order = [];
    if (type === "negras") {
        // ascendente del 1 al 6
        order = DADES.map(f => f.id).sort((a, b) => a - b);
    } else {
        // descendente del 6 al 1
        order = DADES.map(f => f.id).sort((a, b) => b - a);
    }
    setSecondPhaseOrder(order);

    // Reiniciar disabledFaces dejando todas figuras bloqueadas excepto la primera de la orden
    const firstId = order[0];
    const updated = {};
    players.forEach(p => {
        updated[p] = DADES.map(f => f.id).filter(id => id !== firstId);
    });
    setDisabledFaces(updated);

    setPhaseModalVisible(false);
};




    return (
        <View style={styles.container}>
            {/* ---- RONDA ---- */}
            <Text style={styles.roundText}>
                Ronda {round} / {TOTAL_ROUNDS}
            </Text>

            {/* ---- Turno ---- */}
            <Text style={styles.title}>Turno de {currentPlayer}</Text>
            <Text style={styles.subtitle}>Figuras por completar</Text>

            {/* GRID DE FIGURAS */}
            <View style={styles.grid}>
                {DADES.map((face) => {
                    const isSelected = selectedFace?.id === face.id;
                    const isDisabled = disabledFaces[currentPlayer].includes(face.id);

                    return (
                        <TouchableOpacity
                            key={face.id}
                            style={[
                                styles.faceBox,
                                isSelected && styles.faceSelected,
                                isDisabled && styles.faceDisabled,
                            ]}
                            onPress={() => !isDisabled && handleFacePress(face)}
                            disabled={isDisabled}
                        >
                            <Image source={face.img} style={styles.faceImg} resizeMode="contain" />
                        </TouchableOpacity>
                    );
                })}

            </View>


            {/* ---- MODAL ---- */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            ¿Cuántos dados de {selectedFace?.label} han salido?
                        </Text>

                        {/* NÚMEROS DEL 1 AL 10 */}
                        <View style={styles.countGrid}>
                            {[...Array(10)].map((_, i) => {
                                const num = i + 1;
                                const isSelected = num === selectedCount;

                                return (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.countBtn,
                                            isSelected && styles.countSelected,
                                        ]}
                                        onPress={() => setSelectedCount(num)}
                                    >
                                        <Text style={styles.countText}>{num}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* BOTÓN CONFIRMAR PUNTOS */}
                        <TouchableOpacity
                            style={[
                                styles.modalConfirmBtn,
                                !selectedCount && { opacity: 0.3 },
                            ]}
                            disabled={!selectedCount}
                            onPress={handleConfirmCount}
                        >
                            <Text style={styles.modalConfirmText}>Confirmar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

            {/* --- MODAL ESPECIAL SEGUNDA FASE (RONDA 7) --- */}
<Modal transparent visible={phaseModalVisible} animationType="fade">
    <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Puntuaciones actuales</Text>

            {players.map((p) => (
                <Text key={p} style={{ color: "white", fontSize: 18, marginBottom: 6 }}>
                    {p}: {scores[p] || 0} pts
                </Text>
            ))}

            <Text
                style={{
                    color: "#FACC15",
                    fontSize: 20,
                    fontWeight: "700",
                    marginVertical: 20,
                    textAlign: "center",
                }}
            >
                ¿Cómo vais a empezar la segunda tanda?
            </Text>

            {/* Botón negras */}
            <TouchableOpacity
                style={[styles.modalConfirmBtn, { marginBottom: 10 }]}
                onPress={() => handleSecondPhaseSelect("negras")}
            >
                <Text style={styles.modalConfirmText}>Empezando por Negras</Text>
            </TouchableOpacity>

            {/* Botón ás */}
            <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => handleSecondPhaseSelect("as")}
            >
                <Text style={styles.modalConfirmText}>Empezando por Ás</Text>
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

    /* ---- Ronda ---- */
    roundText: {
        color: "#FACC15",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10,
    },

    title: {
        color: "white",
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 10,
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
        borderWidth: 2,
        borderColor: "transparent",
    },
    faceSelected: {
        borderColor: "#FACC15",
    },

    faceImg: {
        width: "70%",
        height: "70%",
    },

    confirmBtn: {
        marginTop: 20,
        backgroundColor: "#FACC15",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    confirmText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F2937",
    },

    /* ---- Modal ---- */
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
        marginBottom: 20,
        textAlign: "center",
    },

    countGrid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 20,
    },

    countBtn: {
        width: 55,
        height: 55,
        backgroundColor: "#374151",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        margin: 6,
        borderWidth: 2,
        borderColor: "transparent",
    },
    countSelected: {
        borderColor: "#FACC15",
    },

    countText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },

    modalConfirmBtn: {
        backgroundColor: "#FACC15",
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 10,
    },
    modalConfirmText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F2937",
    },

    cancelBtn: {
        marginTop: 5,
    },
    cancelText: {
        color: "#F87171",
        fontSize: 18,
    },
    faceDisabled: {
        opacity: 0.3,
    },
});

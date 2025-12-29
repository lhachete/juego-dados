import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import ScoresModal from "../components/ScoresModal";
import ExitGameModal from "../components/ExitGameModal";
import SecondPhaseModal from "../components/SecondPhaseModal";
import FiguresGrid from "../components/FiguresGrid";
import DADES from "./dades.jsx";

const ManualMode = () => {
    const { players, scores, setScores, turn, setTurn, round, setRound, TOTAL_ROUNDS,
        secondPhaseOrder, setSecondPhaseOrder, secondPhaseStep, setSecondPhaseStep,
        scoresModalVisible, setScoresModalVisible, exitGame, finishGame, isGameStarted,
        startGame, resetGame,
    } = useGame();
    const [selectedFace, setSelectedFace] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [exitModalVisible, setExitModalVisible] = useState(false);
    const [selectedCount, setSelectedCount] = useState(null);
    const [phaseModalVisible, setPhaseModalVisible] = useState(false);
    const navigation = useNavigation();


    const [disabledFaces, setDisabledFaces] = useState(
        players.reduce((acc, player) => {
            acc[player] = []; // cada jugador empieza sin figuras bloqueadas
            return acc;
        }, {})
    );

    const currentPlayer = players[turn];

    // Al pulsar una figura, se abre el modal para seleccionar cantidad, además de marcarla como seleccionada
    const handleFacePress = (face) => {
        setSelectedFace(face);
        setModalVisible(true);
    };


    const handleConfirmCount = () => {
        if (selectedCount === null) return;

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

        setModalVisible(false);

        // Cambiar turno
        if (turn === players.length - 1) {

            if (round === TOTAL_ROUNDS) {
                resetGame();
                finishGame();
                router.replace("/end-game");
                return;
            } else {
                // Avanzar ronda
                const nextRound = round + 1;
                setRound(nextRound);
            }

            // --- SI ESTAMOS EN SEGUNDA TANDA ---
            if (round >= 7) {
                const nextStep = secondPhaseStep + 1;

                // Si quedan figuras por completar
                if (nextStep < secondPhaseOrder.length) {
                    setSecondPhaseStep(nextStep);
                    const nextFaceId = secondPhaseOrder[nextStep];
                    // habilitar SOLO ESTA figura para todos
                    const updated = {};
                    players.forEach(p => {
                        updated[p] = DADES.map(f => f.id).filter(id => id !== nextFaceId);
                    });
                    setDisabledFaces(updated);
                }

            } else {
                // --- PRIMERA TANDA NORMAL ---
                const nextRound = round + 1;
                setRound(nextRound);
                if (nextRound === 7) {
                    setPhaseModalVisible(true);
                }
            }
            setTurn(0);

        } else {
            // siguiente jugador normal
            setTurn(turn + 1);
        }

        setSelectedFace(null);
        setSelectedCount(null);
    };

    const handleSecondPhaseSelect = (type) => {
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
        setSecondPhaseStep(0); // Comenzar por la primera del orden

        // Reiniciar disabledFaces dejando todas figuras bloqueadas excepto la primera de la orden.
        const firstId = order[0];
        const updated = {};
        players.forEach(p => {
            updated[p] = DADES.map(f => f.id).filter(id => id !== firstId);
        });
        setDisabledFaces(updated);
        setPhaseModalVisible(false);
    };

    // Iniciar el juego al montar el componente
    useEffect(() => {
        if (!isGameStarted) {
            startGame();
        }
    }, []);

    // Confirmar salida si el juego ha comenzado, bloquear navegación.
    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", (e) => {
            if (!isGameStarted) return;
            e.preventDefault();
            setExitModalVisible(true);
        });

        return unsubscribe;
    }, [navigation, isGameStarted]);



    return (
        <View style={styles.container}>

            <Text style={styles.roundText}> Ronda {round} / {TOTAL_ROUNDS}</Text>
            <Text style={styles.title}>Turno de {currentPlayer}</Text>
            <Text style={styles.currentPlayerScore}> Puntos: {currentPlayer in scores ? scores[currentPlayer] : 0} </Text>
            <Text style={styles.subtitle}>Figuras por completar</Text>

            {/* GRID DE FIGURAS */}
            <FiguresGrid
  faces={DADES}
  disabledFaces={disabledFaces[currentPlayer]}
  interactive={true}
  onFacePress={handleFacePress}
  variant="manual"
/>



            <TouchableOpacity
                style={styles.viewScoresBtn}
                onPress={() => setScoresModalVisible(true)}
            >
                <Text style={styles.viewScoresText}>Ver puntuaciones</Text>
            </TouchableOpacity>



            {/* ---- MODAL ---- */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            ¿Cuántos dados de {selectedFace?.label} han salido?
                        </Text>

                        {/* NÚMEROS DEL 0 AL 10 */}
                        <View style={styles.countGrid}>
                            {[...Array(11)].map((_, i) => {
                                const num = i;
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
                                selectedCount === null && { opacity: 0.3 },
                            ]}
                            disabled={selectedCount === null}

                            onPress={handleConfirmCount}
                        >
                            <Text style={styles.modalConfirmText}>Confirmar</Text>
                        </TouchableOpacity>
                        {/* BOTÓN CANCELAR */}
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                                setModalVisible(false);
                                setSelectedFace(null);
                                setSelectedCount(null);
                            }}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </Modal>

            {/* --- MODAL ESPECIAL SEGUNDA FASE (RONDA 7) --- */}
            <SecondPhaseModal
                visible={phaseModalVisible}
                players={players}
                scores={scores}
                onSelect={handleSecondPhaseSelect}
            />

            {/* ---- MODAL PUNTUACIONES TOTALES ---- */}
            <ScoresModal
                visible={scoresModalVisible}
                players={players}
                scores={scores}
                onClose={() => setScoresModalVisible(false)}
            />
            {/* ---- MODAL SALIR DE PARTIDA ---- */}
            <ExitGameModal
                visible={exitModalVisible}
                onCancel={() => setExitModalVisible(false)}
                onExit={() => {
                    setExitModalVisible(false);
                    // Resetear estado del juego
                    setDisabledFaces(
                        players.reduce((acc, p) => {
                            acc[p] = [];
                            return acc;
                        }, {})
                    );
                    exitGame();
                    router.replace("/player-selection");
                }}
                onFinish={() => {
                    setExitModalVisible(false);
                    finishGame();
                    router.replace("/end-game");
                }}
            />
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
        height: 120,
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
        width: "65%",
        height: "65%",
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

    countGrid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 30,
    },

    countBtn: {
        width: 80,
        height: 80,
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
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 30,
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
    currentPlayerScore: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
    },
    viewScoresBtn: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    viewScoresText: {
        color: "#FACC15",
        fontSize: 18,
        fontWeight: "600",
    },

});

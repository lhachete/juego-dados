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
    const { players, scores, setScores, turn, round, TOTAL_ROUNDS,
        scoresModalVisible, setScoresModalVisible, exitGame, finishGame, isGameStarted,
        startGame, resetGame, disabledFaces, setDisabledFaces, startSecondPhase, gamePhase, advanceGame
    } = useGame();
    const [selectedFace, setSelectedFace] = useState(null); 

    const [selectedCount, setSelectedCount] = useState(null); 
    const [modalVisible, setModalVisible] = useState(false); 

    const [modalSalirOAcabarJuego, setModalSalirOAcabarJuego] = useState(false); 
    const [modalSegundaParte, setModalSegundaParte] = useState(false);
    const navigation = useNavigation();

    const currentPlayer = players[turn];

    const handleFacePress = (face) => {
        setSelectedFace(face);
        setModalVisible(true);
    };


    const handleConfirmCount = () => {
        if (selectedCount === null) return;

        const prev = scores[currentPlayer] || 0;
        const added = selectedFace.id * selectedCount;

        setScores({
            ...scores,
            [currentPlayer]: prev + added,
        });

        setDisabledFaces({ ...disabledFaces,
            [currentPlayer]: [...disabledFaces[currentPlayer], selectedFace.id]
        });

        setModalVisible(false);
        setSelectedFace(null);
        setSelectedCount(null);
        advanceGame();
    };

    useEffect(() => {
        if (!isGameStarted) {
            startGame();
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", (e) => {
            if (!isGameStarted) return;
            e.preventDefault();
            setModalSalirOAcabarJuego(true);
        });
        return unsubscribe;
    }, [navigation, isGameStarted]);

    useEffect(() => {
        if (gamePhase === "second") {
            setModalSegundaParte(true);
        } else if (gamePhase === "finished") {
            resetGame();
            finishGame();
            router.replace("/end-game");
        }
    }, [gamePhase]);


    return (
        <View style={styles.container}>

            <Text style={styles.roundText}> Ronda {round} / {TOTAL_ROUNDS}</Text>
            <Text style={styles.title}>Turno de {currentPlayer}</Text>
            <Text style={styles.currentPlayerScore}> Puntos: {currentPlayer in scores ? scores[currentPlayer] : 0} </Text>
            <Text style={styles.subtitle}>Figuras por completar</Text>

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

            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            ¿Cuántos dados de {selectedFace?.label} han salido?
                        </Text>

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

            <SecondPhaseModal
                visible={modalSegundaParte}
                players={players}
                scores={scores}
                onSelect={(type) => {
                    startSecondPhase(type);
                    setModalSegundaParte(false);
                }}
            />

            <ScoresModal
                visible={scoresModalVisible}
                players={players}
                scores={scores}
                onClose={() => setScoresModalVisible(false)}
            />

            <ExitGameModal
                visible={modalSalirOAcabarJuego}
                onCancel={() => setModalSalirOAcabarJuego(false)}
                onExit={() => {
                    setModalSalirOAcabarJuego(false);
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
                    setModalSalirOAcabarJuego(false);
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

import { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import ScoresModal from "../components/ScoresModal";
import ExitGameModal from "../components/ExitGameModal";
import FiguresGridModal from "../components/FiguresGridModal";
import DADES from "./dades.jsx";
import FiguresGrid from "components/FiguresGrid";
import SecondPhaseModal from "components/SecondPhaseModal";

const VirtualMode = () => {
    const {
        players,
        scores,
        turn,
        round,
        TOTAL_ROUNDS,
        scoresModalVisible,
        setScoresModalVisible,
        exitGame,
        finishGame,
        isGameStarted,
        startGame,
        addScore,
        nextTurn,
        usedFaces,
        addUsedFace,
        startSecondPhase,
        gamePhase
    } = useGame();

    const navigation = useNavigation();
    const currentPlayer = players[turn];

    const [exitModalVisible, setExitModalVisible] = useState(false);
    const [figuresModalVisible, setFiguresModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [phaseModalVisible, setPhaseModalVisible] = useState(false);
    const [zeroFaceSelected, setZeroFaceSelected] = useState(null);

    const [diceResults, setDiceResults] = useState([]);
    const [isRolling, setIsRolling] = useState(false);
    const [rollsLeft, setRollsLeft] = useState(3);
    const [scorePreview, setScorePreview] = useState({
        faces: [],
        total: 0,
    });

    /* 🎲 Tirar dados */
    const rollDice = async () => {
        if (isRolling || rollsLeft === 0) return;
        setIsRolling(true);

        let newDice =
            diceResults.length === 0
                ? Array.from({ length: 5 }, () => ({
                    value: null,
                    face: null,
                    locked: false,
                }))
                : [...diceResults];

        for (let i = 0; i < 5; i++) {
            if (newDice[i].locked) continue;

            const randomFace =
                DADES[Math.floor(Math.random() * DADES.length)];

            await new Promise((resolve) => setTimeout(resolve, 300));

            newDice[i] = {
                value: randomFace.id,
                face: randomFace,
                locked: false,
            };

            setDiceResults([...newDice]);
        }

        setRollsLeft((prev) => prev - 1);
        setIsRolling(false);
    };

    /* 🔒 Bloquear dados */
    const lockDices = (index) => {
        if (isRolling || !diceResults[index].face) return;

        // Si todavía quedan tiradas, se puede seleccionar libremente
        if (rollsLeft > 0) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: !die.locked } : die
                )
            );
            return;
        }

        // ⛔ A partir de aquí: rollsLeft === 0 (fase de anotación)

        const clickedDie = diceResults[index];
        const clickedFace = clickedDie.face;

        // Dados ya seleccionados (locked)
        const selectedDice = diceResults.filter(d => d.locked);

        // Si estamos deseleccionando, siempre permitimos
        if (clickedDie.locked) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: false } : die
                )
            );
            return;
        }

        // Figuras seleccionadas (sin contar Áses)
        const selectedNonAces = selectedDice
            .map(d => d.face)
            .filter(face => face.id !== 6);

        // Caso 1️⃣: no hay ninguna figura aún → permitimos
        if (selectedNonAces.length === 0) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: true } : die
                )
            );
            return;
        }

        // Caso 2️⃣: ya hay una figura y el click es Ás → permitimos
        if (clickedFace.id === 6) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: true } : die
                )
            );
            return;
        }

        // Caso 3️⃣: ya hay una figura y el click es la MISMA figura → permitimos
        if (clickedFace.id === selectedNonAces[0].id) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: true } : die
                )
            );
            return;
        }
        // ❌ Caso 4: figura distinta → No ocurre nada

    };


    /* 🧮 Calcular puntos + preparar modal */
    const handleScoreSelection = () => {
        const selected = diceResults.filter(d => d.locked);
        const used = usedFaces[currentPlayer] || [];

        // 👉 Caso: no ha seleccionado nada
        if (selected.length === 0) {
            setScorePreview({
                faces: [],
                total: 0,
            });
            setConfirmModalVisible(true);
            return;
        }

        // Caras seleccionadas
        const faces = selected.map(d => d.face);

        // Quitamos ases para detectar la figura base
        const nonAces = faces.filter(f => f.id !== 6);

        // Figura base (si solo hay ases → as)
        const baseFaceId = nonAces.length > 0 ? nonAces[0].id : 6;
        const baseValue = baseFaceId;

        // 🚫 Comprobación: figura ya usada
        if (used.includes(baseFaceId)) {
            const faceLabel =
                nonAces.length > 0 ? nonAces[0].label : faces[0].label;

            Alert.alert(
                "Figura ya usada",
                `Ya has anotado ${faceLabel}`
            );
            return;
        }

        // Cálculo de puntos
        const totalPoints = selected.length * baseValue;

        setScorePreview({
            faces,
            total: totalPoints,
        });

        setConfirmModalVisible(true);
    };



    /* 🚀 Confirmar anotación */
    const confirmScore = () => {
        // CASO 0 PUNTOS
        if (scorePreview.faces.length === 0) {
            if (!zeroFaceSelected) {
                Alert.alert("Selecciona una figura");
                return;
            }

            addUsedFace(currentPlayer, zeroFaceSelected.id);
            addScore(currentPlayer, 0);

            setZeroFaceSelected(null);
        } else {
            // flujo normal
            addScore(currentPlayer, scorePreview.total);

            const nonAces = scorePreview.faces.filter(f => f.id !== 6);
            const faceId = nonAces.length > 0 ? nonAces[0].id : 6;
            addUsedFace(currentPlayer, faceId);
        }

        setDiceResults([]);
        setRollsLeft(3);
        setConfirmModalVisible(false);
        nextTurn();
    };

    useEffect(() => {
        if (!isGameStarted) startGame();
    }, []);

    useEffect(() => {
        if (!confirmModalVisible) {
            setZeroFaceSelected(null);
        }
    }, [confirmModalVisible]);


    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", (e) => {
            if (!isGameStarted) return;
            e.preventDefault();
            setExitModalVisible(true);
        });

        return unsubscribe;
    }, [navigation, isGameStarted]);

    useEffect(() => {
        if (gamePhase === "second") {
            setPhaseModalVisible(true);
        }
    }, [gamePhase]);

    return (
        <View style={styles.container}>
            {/* INFO */}
            <Text style={styles.roundText}>
                Ronda {round} / {TOTAL_ROUNDS}
            </Text>

            <Text style={styles.title}>
                Turno de {currentPlayer}
            </Text>

            <Text style={styles.currentPlayerScore}>
                Puntos: {scores[currentPlayer] ?? 0}
            </Text>

            <TouchableOpacity
                onPress={() => setFiguresModalVisible(true)}
            >
                <Text style={styles.linkText}>
                    Figuras por completar
                </Text>
            </TouchableOpacity>

            <FiguresGridModal
                visible={figuresModalVisible}
                onClose={() => setFiguresModalVisible(false)}
                faces={DADES}
                usedFaces={usedFaces[currentPlayer] || []}
            />

            {/* ZONA JUEGO */}
            <View style={styles.virtualActionArea}>
                <View style={styles.topArea}>
                    <Text style={styles.textInfo}>
                        {rollsLeft === 0
                            ? "Selecciona los dados que te quieras anotar"
                            : "Selecciona los dados que quieras conservar"}
                    </Text>
                </View>

                <View style={styles.middleArea}>
                    <View style={styles.diceRow}>
                        {diceResults.map((die, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => lockDices(index)}
                            >
                                <View
                                    style={[
                                        styles.diceWrapper,
                                        die.locked &&
                                        styles.diceLocked,
                                    ]}
                                >
                                    {die.face && (
                                        <Image
                                            source={die.face.img}
                                            style={styles.diceImg}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomArea}>
                    <Text style={styles.rollsText}>
                        Tiradas restantes: {rollsLeft}
                    </Text>

                    <TouchableOpacity
                        style={styles.rollBtn}
                        onPress={
                            rollsLeft === 0
                                ? handleScoreSelection
                                : rollDice
                        }
                    >
                        <Text style={styles.rollBtnText}>
                            {rollsLeft === 0
                                ? "Anotar puntos"
                                : "Tirar dados"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ---- MODAL CONFIRMACIÓN ANOTACIÓN ---- */}
            <Modal transparent visible={confirmModalVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Confirmar anotación
                        </Text>

                        {scorePreview.faces.length === 0 ? (
                            <>
                                <Text style={styles.modalText}>
                                    No has seleccionado ningún dado.
                                    Elige una figura para descartar:
                                </Text>

                                <FiguresGrid
                                    faces={DADES}
                                    disabledFaces={usedFaces[currentPlayer] || []}
                                    interactive
                                    variant="compact"
                                    onFacePress={setZeroFaceSelected}
                                    selectedFaceId={zeroFaceSelected?.id}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalText}>
                                    Has seleccionado {scorePreview.faces.length} dados:
                                </Text>

                                <Text style={styles.modalFaces}>
                                    {scorePreview.faces.map(f => f.label).join(", ")}
                                </Text>
                            </>
                        )}


                        <Text style={styles.modalPoints}>
                            Total: {scorePreview.total} puntos
                        </Text>

                        {/* CONFIRMAR */}
                        <TouchableOpacity
                            style={[
                                styles.modalConfirmBtn,
                                scorePreview.faces.length === 0 &&
                                !zeroFaceSelected &&
                                styles.disabledBtn
                            ]}
                            disabled={scorePreview.faces.length === 0 && !zeroFaceSelected}
                            onPress={confirmScore}
                        >
                            <Text style={styles.modalConfirmText}>
                                Confirmar
                            </Text>
                        </TouchableOpacity>


                        {/* CANCELAR */}
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setConfirmModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


            {/* PUNTUACIONES */}
            <TouchableOpacity
                style={styles.viewScoresBtn}
                onPress={() => setScoresModalVisible(true)}
            >
                <Text style={styles.viewScoresText}>
                    Ver puntuaciones
                </Text>
            </TouchableOpacity>

            <ScoresModal
                visible={scoresModalVisible}
                players={players}
                scores={scores}
                onClose={() => setScoresModalVisible(false)}
            />

            <SecondPhaseModal
                visible={phaseModalVisible}
                players={players}
                scores={scores}
                onSelect={(type) => { //TODO POR TERMINAR!! setDisabledFaces no existe para segunda fase<<<<<<<<<<<<<<
                    startSecondPhase(type, setDisabledFaces);
                    setPhaseModalVisible(false);
                }}
            />


            <ExitGameModal
                visible={exitModalVisible}
                onCancel={() => setExitModalVisible(false)}
                onExit={() => {
                    setExitModalVisible(false);
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

export default VirtualMode;


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

    currentPlayerScore: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
    },

    /* ---- GRID COMPACTO ---- */
    grid: {
        width: "90%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 10,
    },

    faceBox: {
        width: "40%",
        aspectRatio: 1,
        backgroundColor: "#1F2937",
        margin: "2%",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },

    faceImg: {
        width: "80%",
        height: "80%",
    },

    /* ---- ZONA NUEVA FUNCIONALIDAD ---- */
    virtualActionArea: {
        width: "90%",
        flex: 1,
        marginVertical: 10,
        borderRadius: 12,
        /*         backgroundColor: "#0F172A",
                borderWidth: 1, 
                borderColor: "#1F2937",*/

    },
    topArea: {
        flex: 0.5,
        justifyContent: "center",
    },
    middleArea: {
        flex: 4, // 👈 más grande
        justifyContent: "center",
        alignItems: "center",
    },
    bottomArea: {
        flex: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },

    viewScoresBtn: {
        marginBottom: 50,
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
    },

    viewScoresText: {
        color: "#FACC15",
        fontSize: 18,
        fontWeight: "600",
    },
    // ---- ESTILOS MODAL FIGURAS ----

    linkText: {
        color: "#9CA3AF",
        fontSize: 18,
        textDecorationLine: "underline",
    },

    // ---- ESTILOS DADOS ----
    rollBtn: {
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 40,
        backgroundColor: "#FACC15",
        borderRadius: 12,

    },

    rollBtnText: {
        color: "#1F2937",
        fontSize: 18,
        fontWeight: "700",
    },

    diceRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginTop: 20,
        gap: 12,
    },

    diceImg: {
        width: 100,
        height: 100,
        margin: 12,
    },

    rollsText: {
        marginTop: 12,
        color: "#9CA3AF",
        fontSize: 16,
    },
    textInfo: {
        color: "#FACC15",
        fontSize: 16,
        alignSelf: "center",
    },
    //Dado seleccionado
    diceWrapper: {
        borderWidth: 2,
        borderColor: "transparent",
        borderRadius: 12,
    },

    diceLocked: {
        borderColor: "#FACC15",
    },
    /* ---- MODAL CONFIRMACIÓN ---- */
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
    modalText: {
        color: "#9CA3AF",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 10,
    },
    modalFaces: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 15,
    },
    modalPoints: {
        color: "#FACC15",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 25,
    },
    modalConfirmBtn: {
        backgroundColor: "#FACC15",
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 20,
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
    disabledBtn: {
        opacity: 0.4,
    }


});

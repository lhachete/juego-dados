import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, Alert, Vibration } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import ScoresModal from "../components/ScoresModal";
import ExitGameModal from "../components/ExitGameModal";
import FiguresGridModal from "../components/FiguresGridModal";
import DADES from "./dades.jsx";
import FiguresGrid from "components/FiguresGrid";
import SecondPhaseModal from "components/SecondPhaseModal";
import AnimatedDie from "../components/AnimatedDie";
import AnimatedRollButton from "../components/AnimatedRollButton";
import EventBanner from "../components/EventBanner";

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
        advanceGame,
        usedFaces,
        addUsedFace,
        disabledFaces,
        startSecondPhase,
        gamePhase,
        resetGame
    } = useGame();

    const navigation = useNavigation();
    const currentPlayer = players[turn];

    const [exitModalVisible, setExitModalVisible] = useState(false);
    const [figuresModalVisible, setFiguresModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [phaseModalVisible, setPhaseModalVisible] = useState(false);
    const [zeroFaceSelected, setZeroFaceSelected] = useState(null);
    // true desde que acaba la ronda 6 hasta que se elige Negras/Ases:
    // mientras tanto no se puede tirar.
    const [awaitingPhaseChoice, setAwaitingPhaseChoice] = useState(false);

    const [diceResults, setDiceResults] = useState([]);
    const [isRolling, setIsRolling] = useState(false);
    const [rollsLeft, setRollsLeft] = useState(3);
    const [scorePreview, setScorePreview] = useState({
        faces: [],
        total: 0,
    });

    const [bonusPoints, setBonusPoints] = useState(0);
    const [bonusFace, setBonusFace] = useState(null);
    const [isBonusMode, setIsBonusMode] = useState(false);

    const [banner, setBanner] = useState(null);
    const prevTurnRef = useRef(null);
    const lastScoreRef = useRef(null);
    const bannerTimerRef = useRef(null);


    const showBanner = useCallback((
        title,
        subtitle = "",
        color = "#FACC15",
        type = "score",
        transition = false
    ) => {
        setBanner({
            id: Date.now(),
            title,
            subtitle,
            color,
            type,
            transition,
        });
    }, []);


    const facesToDisable =
        gamePhase === "second"
            ? disabledFaces[currentPlayer] || []
            : usedFaces[currentPlayer] || [];

    const isDiceDisabled = (die) => {
        return bonusFace !== null &&
            die.face &&
            die.face.id !== bonusFace.id &&
            die.face.id !== 6;
    };


    const rollDice = async () => {
        if (isRolling || rollsLeft === 0) return;

        setIsRolling(true);

        const currentDice =
            diceResults.length === 0
                ? Array.from({ length: 5 }, () => ({
                    value: null,
                    face: null,
                    locked: false,
                }))
                : [...diceResults];

        const finalDice = currentDice.map((die) => {
            if (die.locked) return die;

            const randomFace = DADES[Math.floor(Math.random() * DADES.length)];
            return {
                value: randomFace.id,
                face: randomFace,
                locked: false,
            };
        });

        await new Promise((resolve) => setTimeout(resolve, 950));

        setDiceResults(finalDice);
        setRollsLeft((prev) => prev - 1);
        setIsRolling(false);
    };



    const lockDices = (index) => {
        if (isRolling || !diceResults[index].face) return;
        if (bonusFace !== null) {

            const clickedFace = diceResults[index].face;
            if (!clickedFace) return;

            if (diceResults[index].locked) {
                setDiceResults(prev =>
                    prev.map((die, i) =>
                        i === index ? { ...die, locked: false } : die
                    )
                );
                return;
            }

            if (clickedFace.id === bonusFace.id || clickedFace.id === 6) {
                setDiceResults(prev =>
                    prev.map((die, i) =>
                        i === index ? { ...die, locked: true } : die
                    )
                );
            }
            return;
        }

        if (rollsLeft > 0) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: !die.locked } : die
                )
            );
            return;
        }

        const clickedDie = diceResults[index];
        const clickedFace = clickedDie.face;

        const selectedDice = diceResults.filter(d => d.locked);

        if (clickedDie.locked) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: false } : die
                )
            );
            return;
        }

        const selectedNonAces = selectedDice
            .map(d => d.face)
            .filter(face => face.id !== 6);

        if (selectedNonAces.length === 0) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: true } : die
                )
            );
            return;
        }

        if (clickedFace.id === 6) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: true } : die
                )
            );
            return;
        }

        if (clickedFace.id === selectedNonAces[0].id) {
            setDiceResults(prev =>
                prev.map((die, i) =>
                    i === index ? { ...die, locked: true } : die
                )
            );
            return;
        }

    };


    const handleScoreSelection = () => {
        const selected = diceResults.filter(d => d.locked);
        const used = facesToDisable;

        if (selected.length === 0 && bonusPoints === 0) {
            setScorePreview({
                faces: [],
                total: 0,
            });
            setConfirmModalVisible(true);
            return;
        }

        const faces = selected.map(d => d.face);
        const nonAces = faces.filter(f => f?.id !== 6);

        const baseFaceId = bonusFace?.id ??
            (nonAces.length > 0 ? nonAces[0].id : 6);

        const baseValue = baseFaceId;

        if (used.includes(baseFaceId)) {
            const faceLabel =
                nonAces.length > 0 ? nonAces[0].label : faces[0].label;

            if (gamePhase === "second") {
                Alert.alert(
                    "Figura deshabilitada",
                    `Solo puedes anotar la figura activa en esta ronda`
                );
            } else {
                Alert.alert(
                    "Figura ya usada",
                    `Ya has anotado ${faceLabel}`
                );
            }
            return;
        }

        const totalPoints = bonusPoints + (selected.length * baseValue);

        setScorePreview({
            faces,
            total: totalPoints,
            bonus: bonusPoints
        });

        setConfirmModalVisible(true);
    };


    const confirmScore = () => {

        const nonAces = scorePreview.faces.filter(f => f?.id !== 6);

        const scoredFace =
            bonusFace?.label ??
            nonAces[0]?.label ??
            scorePreview.faces[0]?.label ??
            zeroFaceSelected?.label ??
            "figura";

        const baseFaceId =
            bonusFace?.id ??
            nonAces[0]?.id ??
            scorePreview.faces[0]?.id ??
            6;

        // Cada tirada extra aporta cinco figuras.
        const bonusFigureCount =
            baseFaceId > 0 ? bonusPoints / baseFaceId : 0;

        const figureCount =
            scorePreview.faces.length + bonusFigureCount;


        if (scorePreview.faces.length === 0 && bonusPoints === 0) {
            if (!zeroFaceSelected) {
                Alert.alert("Selecciona una figura");
                return;
            }

            addUsedFace(currentPlayer, zeroFaceSelected.id);
            addScore(currentPlayer, 0);

            setZeroFaceSelected(null);
        } else {
            addScore(currentPlayer, scorePreview.total);

            const nonAces = scorePreview.faces.filter(f => f?.id !== 6);
            const faceId = bonusFace?.id ??
                (nonAces.length > 0 ? nonAces[0].id : 6);

            addUsedFace(currentPlayer, faceId);
        }

        setDiceResults([]);
        setRollsLeft(3);
        setConfirmModalVisible(false);
        setBonusPoints(0);
        setBonusFace(null);
        setIsBonusMode(false);

        lastScoreRef.current = {
            player: currentPlayer,
            points: scorePreview.total ?? 0,
            face: scoredFace,
            faceCount: figureCount,
        };

        advanceGame();
    };

    const handleBonusRoll = async () => {
        if (isRolling || rollsLeft === 0 || !bonusFace) return;

        const baseValue = bonusFace.id;
        const newDice = Array.from({ length: 5 }, () => {
            const face = DADES[Math.floor(Math.random() * DADES.length)];
            return { value: face.id, face, locked: false };
        });

        // La animación solo se ejecuta en dados no bloqueados.
        setDiceResults(prev => prev.map(die => ({ ...die, locked: false })));
        setIsBonusMode(false);
        setIsRolling(true);

        await new Promise(resolve => setTimeout(resolve, 760));

        setDiceResults(newDice);
        setBonusPoints(prev => prev + 5 * baseValue);
        setRollsLeft(prev => prev - 1);
        setIsRolling(false);
    };




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
        if (rollsLeft === 0) {
            setDiceResults(prev =>
                prev.map(die => ({ ...die, locked: false }))
            );
        }
    }, [rollsLeft]);


    useEffect(() => {
        if (rollsLeft === 0) return;

        const selected = diceResults.filter(d => d.locked);
        if (selected.length !== 5) {
            setIsBonusMode(false);
            return;
        }

        const faces = selected.map(d => d.face);

        const nonAces = faces.filter(f => f.id !== 6);
        const baseId = nonAces.length > 0 ? nonAces[0].id : 6;
        const baseFace = DADES.find(f => f.id === baseId);

        const allSame = faces.every(f =>
            f.id === baseId || f.id === 6
        );

        if (allSame) {
            setIsBonusMode(true);
            setBonusFace(baseFace);
        } else {
            setIsBonusMode(false);
        }

    }, [diceResults]);


    useEffect(() => {
        if (!isGameStarted) startGame();
    }, []);


    useEffect(() => {
        // El modal de la segunda tanda se abre desde el efecto de turnos,
        // cuando termina el banner de puntos del último jugador de la ronda 6.
        if (gamePhase === "finished") {
            resetGame();
            finishGame();
            router.replace("/end-game");
        }
    }, [gamePhase]);



    useEffect(() => {
        const previous = prevTurnRef.current;

        prevTurnRef.current = {
            turn,
            round,
            player: currentPlayer,
        };

        if (previous === null) return;

        if (previous.turn === turn && previous.round === round) return;

        if (gamePhase === "finished") return;

        if (bannerTimerRef.current) {
            clearTimeout(bannerTimerRef.current);
            bannerTimerRef.current = null;
        }

        const lastScore = lastScoreRef.current;

        const hasPreviousScore =
            lastScore && lastScore.player === previous.player;


        const showRoundBanner = (transition = false) => {
            showBanner(
                `RONDA ${round}`,
                round === 7
                    ? "¡Comienza la segunda fase!"
                    : `Turno de ${currentPlayer}`,
                "#60A5FA",
                "round",
                transition
            );
        };

        const showScoreBanner = () => {
            setBanner({
                id: Date.now(),
                type: "score",
                title: "",
                points: lastScore.points,
                player: lastScore.player,
                face: lastScore.face,
                faceImage: DADES.find(
                    face => face.label === lastScore.face
                )?.img,
                faceCount: lastScore.faceCount ?? 0,
                nextPlayer: currentPlayer,
                color: "#FACC15",
            });
        };

        // Paso a la segunda tanda (ronda 6 → 7): primero el banner de puntos
        // del último jugador y, cuando se va, el modal de elegir Negras/Ases.
        // El banner de inicio de la segunda tanda se lanza al elegir opción.
        if (previous.round !== round && round === 7) {
            setAwaitingPhaseChoice(true);
            if (hasPreviousScore) {
                showScoreBanner();
                bannerTimerRef.current = setTimeout(() => {
                    setPhaseModalVisible(true);
                    bannerTimerRef.current = null;
                }, 3250); // 600 entrada + 2000 visible + 600 salida + margen
            } else {
                setBanner(null);
                setPhaseModalVisible(true);
            }
            return;
        }

        // Cambio de ronda: puntuación primero y transición directa después.
        if (previous.round !== round) {
            if (hasPreviousScore) {
                showScoreBanner();

                bannerTimerRef.current = setTimeout(() => {
                    showRoundBanner(true);
                    bannerTimerRef.current = null;
                }, 2600);
            } else {
                showRoundBanner();
            }

            return;
        }

        // Cambio normal de jugador.
        if (hasPreviousScore) {
            showScoreBanner();
        } else {
            showBanner(
                `Turno de ${currentPlayer}`,
                "",
                "#FACC15",
                "turn"
            );
        }
    }, [
        turn,
        round,
        currentPlayer,
        gamePhase,
        showBanner,
    ]);



    useEffect(() => {
        return () => {
            if (bannerTimerRef.current) {
                clearTimeout(bannerTimerRef.current);
            }
        };
    }, []);


    return (
        <View style={styles.container}>

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
                usedFaces={facesToDisable}
            />

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
                        {(diceResults.length === 0
                            ? Array.from({ length: 5 }, () => ({
                                value: null,
                                face: null,
                                locked: false,
                            }))
                            : diceResults
                        ).map((die, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => lockDices(index)}
                                disabled={isDiceDisabled(die)}
                                activeOpacity={0.85}
                            >
                                <AnimatedDie
                                    face={die.face}
                                    faces={DADES}
                                    locked={die.locked}
                                    isRolling={isRolling && !die.locked}
                                    delay={index * 70}
                                    disabled={isDiceDisabled(die)}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                </View>

                <View style={styles.bottomArea}>
                    <Text style={styles.rollsText}>
                        Tiradas restantes: {rollsLeft}
                    </Text>

                    <AnimatedRollButton
                        isRolling={isRolling}
                        rollsLeft={rollsLeft}
                        onPress={
                            awaitingPhaseChoice
                                ? () => {}
                                : isBonusMode
                                ? handleBonusRoll
                                : rollsLeft === 0
                                    ? handleScoreSelection
                                    : rollDice
                        }
                        title={
                            isBonusMode
                                ? "+ Tirar dados +"
                                : rollsLeft === 0
                                    ? "Anotar puntos"
                                    : "Tirar dados"
                        }
                    />
                </View>
            </View>

            <Modal transparent visible={confirmModalVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Confirmar anotación
                        </Text>

                        {scorePreview.faces.length === 0 && bonusPoints === 0 ? (
                            <>
                                <Text style={styles.modalText}>
                                    No has seleccionado ningún dado.
                                    Elige una figura para descartar:
                                </Text>

                                <FiguresGrid
                                    faces={DADES}
                                    disabledFaces={facesToDisable}
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

                        {bonusFace && scorePreview.faces.length === 0 && (
                            <Image
                                source={bonusFace.img}
                                style={styles.faceBonusImg}
                                resizeMode="contain"
                            />
                        )}
                        {scorePreview.bonus > 0 && (
                            <Text style={styles.modalBonus}>
                                Bonus: {scorePreview.bonus} puntos
                            </Text>
                        )}
                        <Text style={styles.modalPoints}>
                            Total: {scorePreview.total} puntos
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.modalConfirmBtn,
                                scorePreview.faces.length === 0 &&
                                !zeroFaceSelected &&
                                bonusPoints === 0 &&
                                styles.disabledBtn
                            ]}
                            disabled={
                                scorePreview.faces.length === 0 &&
                                !zeroFaceSelected &&
                                bonusPoints === 0
                            }
                            onPress={confirmScore}
                        >
                            <Text style={styles.modalConfirmText}>
                                Confirmar
                            </Text>
                        </TouchableOpacity>

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
                onSelect={(type) => {
                    startSecondPhase(type);
                    setPhaseModalVisible(false);
                    setAwaitingPhaseChoice(false);
                    setBanner({
                        id: Date.now(),
                        type: "round",
                        eyebrow: "⚔️ RONDA 7 ⚔️",
                        title: "SEGUNDA TANDA",
                        subtitle: `Empieza por ${type === "negras" ? "Negras" : "Ases"} · Turno de ${currentPlayer}`,
                        color: "#60A5FA",
                    });
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

            {/* Entre el final de la ronda 6 y la elección Negras/Ases:
                oscurece la pantalla y bloquea todos los toques. */}
            {awaitingPhaseChoice && (
                <View style={styles.blockOverlay} pointerEvents="auto" />
            )}

            <EventBanner event={banner} />
        </View>
    );
};

export default VirtualMode;


const styles = StyleSheet.create({
    blockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        zIndex: 50,
        elevation: 10, // Android: por encima de la interfaz, por debajo del banner (15)
    },
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

    virtualActionArea: {
        width: "90%",
        flex: 1,
        marginVertical: 10,
        borderRadius: 12,

    },
    topArea: {
        flex: 0.5,
        justifyContent: "center",
    },
    middleArea: {
        flex: 4,
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

    linkText: {
        color: "#9CA3AF",
        fontSize: 18,
        textDecorationLine: "underline",
    },

    diceRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginTop: 20,
        gap: 12,
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

    modalBonus: {
        color: "#34D399",
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 5,
    },
    faceBonusImg: {
        width: 50,
        height: 50,
        marginBottom: 55,
    },


});

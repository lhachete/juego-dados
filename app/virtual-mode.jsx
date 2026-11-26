import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Image, Pressable, Modal, StyleSheet, Alert, Vibration } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import ScoresModal from "../components/ScoresModal";
import ExitGameModal from "../components/ExitGameModal";
import FiguresGridModal from "../components/FiguresGridModal";
import DADES from "./dades.jsx";
import FiguresGrid from "components/FiguresGrid";
import SecondPhaseModal from "components/SecondPhaseModal";
import TouchableOpacity from "../components/Touchable";
import AnimatedDie, { DIE_ROLL_DURATION } from "../components/AnimatedDie";

// Retardo entre dado y dado al tirar (ms) y duración total de la tirada.
const DIE_DELAY_STEP = 100;
const ROLL_TOTAL_MS = DIE_ROLL_DURATION + DIE_DELAY_STEP * 4 + 80;
import AnimatedRollButton from "../components/AnimatedRollButton";
import EventBanner from "../components/EventBanner";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from "react-native-reanimated";

// Transición de cambio de ronda en la cabecera (ms)
const FADE_MS = 350;
const ROUND_BANNER_HOLD_MS = 1600;

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

    // --- Transición de ronda en la cabecera ---
    // Número de ronda que se ve: cambia a mitad de la transición, no al instante.
    const [displayedRound, setDisplayedRound] = useState(round);
    const [roundBanner, setRoundBanner] = useState(null); // { eyebrow, title, subtitle }
    const [isRoundTransition, setIsRoundTransition] = useState(false);
    const roundTransitionTimers = useRef([]);
    const infoOpacity = useSharedValue(1);
    const roundTextOpacity = useSharedValue(1);
    const roundBannerOpacity = useSharedValue(0);

    const clearRoundTransition = () => {
        roundTransitionTimers.current.forEach(clearTimeout);
        roundTransitionTimers.current = [];
    };

    const fade = (sv, to) => {
        sv.value = withTiming(to, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
    };

    // 1) Se desvanece la cabecera (ronda + turno, puntos, figuras, texto).
    // 2) Cambia el número de ronda y aparece el aviso de ronda en ese hueco.
    // 3) Se desvanece el aviso y vuelve la cabecera con el nuevo turno.
    const playRoundTransition = (newRound, content) => {
        clearRoundTransition();
        setIsRoundTransition(true);

        fade(infoOpacity, 0);
        fade(roundTextOpacity, 0);

        const later = (fn, ms) => roundTransitionTimers.current.push(setTimeout(fn, ms));

        later(() => {
            setDisplayedRound(newRound);
            setRoundBanner(content);
            fade(roundTextOpacity, 1);
            fade(roundBannerOpacity, 1);
        }, FADE_MS);

        later(() => {
            fade(roundBannerOpacity, 0);
        }, FADE_MS * 2 + ROUND_BANNER_HOLD_MS);

        later(() => {
            setRoundBanner(null);
            fade(infoOpacity, 1);
        }, FADE_MS * 3 + ROUND_BANNER_HOLD_MS);

        later(() => {
            setIsRoundTransition(false);
        }, FADE_MS * 4 + ROUND_BANNER_HOLD_MS);
    };

    const infoStyle = useAnimatedStyle(() => ({ opacity: infoOpacity.value }));
    const roundTextStyle = useAnimatedStyle(() => ({ opacity: roundTextOpacity.value }));
    const roundBannerStyle = useAnimatedStyle(() => ({ opacity: roundBannerOpacity.value }));
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

        // Los resultados se pasan ya a los dados: cada uno anima con su
        // retardo y descubre su cara al terminar (antes llegaban al final y
        // en la primera tirada los dados aparecían de golpe).
        setDiceResults(finalDice);

        await new Promise((resolve) => setTimeout(resolve, ROLL_TOTAL_MS));

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

        // Dados nuevos (desbloqueados) y bonus a la vez, en el mismo render,
        // para que el efecto de bonus no borre la figura de bonus.
        setBonusPoints(prev => prev + 5 * baseValue);
        setDiceResults(newDice);
        setIsBonusMode(false);
        setIsRolling(true);

        await new Promise(resolve => setTimeout(resolve, ROLL_TOTAL_MS));

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
            // Si aún no se ha usado la tirada extra, la figura de bonus deja
            // de valer al soltar un dado (si no, se quedaba "pegada").
            if (bonusPoints === 0) setBonusFace(null);
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
            if (bonusPoints === 0) setBonusFace(null);
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


        // El cambio de ronda ya no va en un banner en medio de la pantalla:
        // es una transición con fundido en la cabecera.
        const showRoundBanner = () => {
            playRoundTransition(round, {
                eyebrow: "⚔️ NUEVA RONDA ⚔️",
                title: `RONDA ${round}`,
                subtitle: `Empieza ${currentPlayer}`,
            });
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

                // Cuando el banner de puntos ya se está yendo.
                bannerTimerRef.current = setTimeout(() => {
                    showRoundBanner();
                    bannerTimerRef.current = null;
                }, 2700);
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
            clearRoundTransition();
        };
    }, []);

    // Partida nueva o reinicio: la ronda mostrada vuelve a 1 sin transición.
    useEffect(() => {
        if (round === 1) {
            clearRoundTransition();
            setDisplayedRound(1);
            setRoundBanner(null);
            setIsRoundTransition(false);
            infoOpacity.value = 1;
            roundTextOpacity.value = 1;
            roundBannerOpacity.value = 0;
        }
    }, [round]);


    return (
        <View style={styles.container}>

            <Animated.Text style={[styles.roundText, roundTextStyle]}>
                Ronda {displayedRound} / {TOTAL_ROUNDS}
            </Animated.Text>

            {/* Cabecera del turno. En el cambio de ronda se desvanece y en su
                lugar aparece el aviso de ronda, sin solaparse. */}
            <View style={styles.headerArea}>
                <Animated.View
                    style={[styles.headerInfo, infoStyle]}
                    pointerEvents={isRoundTransition ? "none" : "auto"}
                >
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
                </Animated.View>

                {roundBanner && (
                    <Animated.View
                        style={[styles.roundBanner, roundBannerStyle]}
                        pointerEvents="none"
                    >
                        <Text style={styles.roundBannerEyebrow}>{roundBanner.eyebrow}</Text>
                        <Text style={styles.roundBannerTitle}>{roundBanner.title}</Text>
                        {!!roundBanner.subtitle && (
                            <Text style={styles.roundBannerSubtitle}>{roundBanner.subtitle}</Text>
                        )}
                    </Animated.View>
                )}
            </View>

            <FiguresGridModal
                visible={figuresModalVisible}
                onClose={() => setFiguresModalVisible(false)}
                faces={DADES}
                usedFaces={facesToDisable}
            />

            <View style={styles.virtualActionArea}>
                <Animated.View style={[styles.topArea, infoStyle]}>
                    <Text style={styles.textInfo}>
                        {rollsLeft === 0
                            ? "Selecciona los dados que te quieras anotar"
                            : "Selecciona los dados que quieras conservar"}
                    </Text>
                </Animated.View>

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
                            // Pressable en vez de TouchableOpacity: la opacidad animada
                            // de TouchableOpacity (Animated nativo) se mezclaba con las
                            // animaciones de Reanimated del dado y provocaba el error
                            // "disconnectAnimatedNodeFromView" al cambiar `disabled`.
                            <Pressable
                                key={index}
                                onPress={() => lockDices(index)}
                                disabled={isDiceDisabled(die)}
                            >
                                <AnimatedDie
                                    face={die.face}
                                    faces={DADES}
                                    locked={die.locked}
                                    isRolling={isRolling && !die.locked}
                                    delay={index * DIE_DELAY_STEP}
                                    enterFrom={index % 2 === 0 ? "left" : "right"}
                                    disabled={isDiceDisabled(die)}
                                />
                            </Pressable>
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
                            awaitingPhaseChoice || isRoundTransition
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
                    playRoundTransition(round, {
                        eyebrow: "⚔️ SEGUNDA TANDA ⚔️",
                        title: `RONDA ${round}`,
                        subtitle: `Por ${type === "negras" ? "Negras" : "Ases"} · Empieza ${currentPlayer}`,
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
    headerArea: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    headerInfo: {
        alignItems: "center",
    },
    roundBanner: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    roundBannerEyebrow: {
        color: "#9CA3AF",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 4,
    },
    roundBannerTitle: {
        color: "#60A5FA",
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 3,
    },
    roundBannerSubtitle: {
        color: "white",
        fontSize: 17,
        fontWeight: "600",
        marginTop: 4,
    },
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

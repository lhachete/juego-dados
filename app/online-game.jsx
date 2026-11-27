
import { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    Image,
    Pressable,
    Modal,
    StyleSheet,
    Alert,
    ActivityIndicator,
    AppState,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Touchable from "../components/Touchable";
import AnimatedDie, { DIE_ROLL_DURATION } from "../components/AnimatedDie";
import AnimatedRollButton from "../components/AnimatedRollButton";
import EventBanner from "../components/EventBanner";
import FiguresGrid from "../components/FiguresGrid";
import FacesStrip from "../components/FacesStrip";
import ScoreboardModal from "../components/ScoreboardModal";
import SecondPhaseModal from "../components/SecondPhaseModal";
import DADES from "./dades.jsx";
import { useGame } from "../contexts/GameContext";
import { useBlockBack } from "../hooks/useBlockBack";
import {
    fetchRoom,
    subscribeToRoom,
    leaveRoom,
    friendlyError,
    getMyUserId,
    gameRoll,
    gameToggleDie,
    gameBonusRoll,
    gameScore,
    gameChooseDirection,
    gameTimeout,
} from "../lib/online";
import {
    TOTAL_ROUNDS,
    currentPlayer,
    isLeft,
    allowedFaces,
    bonusFaceAvailable,
    canToggleDie,
    scorePreview,
} from "../lib/onlineRules";

// Mismos tiempos que el modo virtual.
const DIE_DELAY_STEP = 100;
const ROLL_TOTAL_MS = DIE_ROLL_DURATION + DIE_DELAY_STEP * 4 + 80;
const SCORE_BANNER_MS = 2700;
const TURN_SECONDS = 60;

const faceById = (id) => DADES.find((f) => f.id === id) ?? null;
const EMPTY_DICE = Array.from({ length: 5 }, () => ({ face: null, locked: false }));

const OnlineGame = () => {
    const { roomId } = useLocalSearchParams();
    const { setPlayers, setScores, setPlayType } = useGame();

    const [room, setRoom] = useState(null);
    const [myId, setMyId] = useState(null);
    const [pending, setPending] = useState(false);
    // Dados que se pintan y cuáles están girando. Van juntos en un mismo
    // estado para que la cara nueva nunca se vea antes de la animación.
    const [view, setView] = useState({ dice: null, rolling: [] });
    const [banner, setBanner] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [zeroFace, setZeroFace] = useState(null);
    const [scoreboardVisible, setScoreboardVisible] = useState(false);
    const [phaseModalReady, setPhaseModalReady] = useState(false);

    const offsetRef = useRef(0);          // hora del servidor - hora del móvil
    const seenSeqRef = useRef(null);      // último cambio ya procesado
    const prevRoundRef = useRef(null);
    const timeoutAskedRef = useRef(null);
    const timersRef = useRef([]);
    const leavingRef = useRef(false);
    const finishedRef = useRef(false);

    const s = room?.state ?? null;
    const players = s?.players ?? [];
    const current = currentPlayer(s);
    const isMyTurn =
        !!s && current?.id === myId && (s.phase === "first" || s.phase === "second");
    const rollingIdx = view.rolling;
    const isRolling = rollingIdx.length > 0;

    const later = (fn, ms) => timersRef.current.push(setTimeout(fn, ms));

    // ---------- Recibir el estado ----------

    const applyRoom = useCallback((newRoom) => {
        if (!newRoom || leavingRef.current) return;
        if (newRoom.state?.server_ms) {
            offsetRef.current = newRoom.state.server_ms - Date.now();
        }
        setRoom(newRoom);
    }, []);

    const refresh = useCallback(async () => {
        try {
            const { room: r } = await fetchRoom(roomId);
            if (!r) {
                if (!leavingRef.current) router.replace("/");
                return;
            }
            applyRoom(r);
        } catch (error) {
            Alert.alert("Sin conexión", friendlyError(error));
        }
    }, [roomId, applyRoom]);

    useEffect(() => {
        getMyUserId().then(setMyId);
        refresh();

        const unsubscribe = subscribeToRoom(roomId, (newRow) => {
            // El aviso trae la sala entera; si faltara el estado, se recarga.
            if (newRow?.state) applyRoom(newRow);
            else refresh();
        });
        const appStateSub = AppState.addEventListener("change", (st) => {
            if (st === "active") refresh();
        });
        const tick = setInterval(() => setNow(Date.now()), 250);

        return () => {
            unsubscribe();
            appStateSub.remove();
            clearInterval(tick);
            timersRef.current.forEach(clearTimeout);
        };
    }, [roomId, refresh, applyRoom]);

    // ---------- Animaciones y avisos al cambiar la partida ----------

    useEffect(() => {
        if (!s) return;
        const firstLoad = seenSeqRef.current === null;
        if (seenSeqRef.current === s.seq) return;
        seenSeqRef.current = s.seq;

        const prevRound = prevRoundRef.current;
        prevRoundRef.current = s.round;

        // Tirada: giran los dados que se han tirado. Las caras nuevas y el
        // giro llegan a la vez a los dados.
        const isNewRoll = !firstLoad && s.last_roll?.seq === s.seq;
        if (isNewRoll) {
            setView({ dice: s.dice, rolling: s.last_roll.indices ?? [] });
            later(() => setView((v) => ({ ...v, rolling: [] })), ROLL_TOTAL_MS);
        } else {
            setView((v) => ({ ...v, dice: s.dice }));
        }
        if (firstLoad) return; // al entrar no se repiten avisos viejos

        const ev = s.last_event?.seq === s.seq ? s.last_event : null;
        if (!ev) return;

        const next = currentPlayer(s)?.nickname;
        const roundChanged = prevRound !== null && prevRound !== s.round;

        if (ev.type === "score") {
            setBanner({
                id: `score-${s.seq}`,
                type: "score",
                points: ev.points,
                player: ev.auto ? `${ev.nickname} (tiempo agotado)` : ev.nickname,
                faceImage: faceById(ev.face)?.img,
                faceCount: ev.count ?? 0,
                nextPlayer: s.phase === "first" || s.phase === "second" ? next : "",
                color: "#FACC15",
            });
            if (roundChanged && s.phase !== "choosing" && s.phase !== "finished") {
                later(() => {
                    setBanner({
                        id: `round-${s.seq}`,
                        type: "round",
                        title: `RONDA ${s.round}`,
                        subtitle: `Empieza ${next}`,
                        color: "#60A5FA",
                        transition: true,
                    });
                }, SCORE_BANNER_MS);
            }
        } else if (ev.type === "direction") {
            setBanner({
                id: `dir-${s.seq}`,
                type: "round",
                eyebrow: "⚔️ SEGUNDA TANDA ⚔️",
                title: ev.direction === "negras" ? "NEGRAS → ASES" : "ASES → NEGRAS",
                subtitle: ev.auto
                    ? "Se acabó el tiempo para elegir"
                    : `Ha elegido ${ev.nickname}`,
                color: "#60A5FA",
            });
        } else if (ev.type === "left") {
            setBanner({
                id: `left-${s.seq}`,
                type: "round",
                eyebrow: "JUGADOR FUERA",
                title: ev.nickname?.toUpperCase(),
                subtitle: "Ha salido de la partida",
                color: "#F87171",
            });
        }
    }, [s?.seq]);

    // Guardar/soltar un dado (sin tirada nueva): se pinta al momento.
    useEffect(() => {
        if (s && !isRolling) setView((v) => ({ ...v, dice: s.dice }));
    }, [s?.dice]);

    // El modal de la 2ª tanda sale cuando termina el aviso de puntos.
    useEffect(() => {
        if (s?.phase !== "choosing") {
            setPhaseModalReady(false);
            return;
        }
        const t = setTimeout(() => setPhaseModalReady(true), 3250);
        return () => clearTimeout(t);
    }, [s?.phase]);

    // Fin de la partida: se pasa el resultado al podio de siempre.
    useEffect(() => {
        if (!s || room?.status !== "finished" || finishedRef.current) return;
        finishedRef.current = true;
        const names = s.players.map((p) => p.nickname);
        const finalScores = {};
        s.players.forEach((p) => {
            finalScores[p.nickname] = s.scores?.[p.id] ?? 0;
        });
        later(() => {
            setPlayers(names);
            setScores(finalScores);
            setPlayType("online");
            router.replace("/end-game");
        }, 3300);
    }, [room?.status]);

    // ---------- Minuto por turno ----------

    // Hasta "turn_starts_ms" se están viendo los avisos: no se juega y el
    // minuto no corre (lo decide el servidor, igual para todos).
    const serverNow = now + offsetRef.current;
    const turnStartsMs = s?.turn_starts_ms ?? (s?.deadline_ms ? s.deadline_ms - 64000 : 0);
    const waitingBanners = !!s?.deadline_ms && serverNow < turnStartsMs;
    const remainingMs = s?.deadline_ms ? s.deadline_ms - serverNow : null;
    const secondsLeft =
        remainingMs === null
            ? null
            : Math.max(0, Math.min(TURN_SECONDS, Math.ceil(remainingMs / 1000)));
    const timeIsUp = remainingMs !== null && remainingMs <= 0;

    useEffect(() => {
        if (!s || !timeIsUp || room?.status !== "playing") return;
        if (timeoutAskedRef.current === s.seq) return;
        timeoutAskedRef.current = s.seq;
        // Cualquier móvil de la sala puede avisar; el servidor comprueba la hora.
        gameTimeout(roomId, s.seq).catch(() => {
            // Relojes desajustados: se vuelve a intentar en un momento.
            later(() => {
                timeoutAskedRef.current = null;
            }, 2000);
        });
    }, [timeIsUp, s?.seq]);

    // ---------- Jugadas ----------

    const run = async (action) => {
        if (pending) return;
        setPending(true);
        try {
            await action();
        } catch (error) {
            Alert.alert("Jugada no válida", friendlyError(error));
            refresh();
        } finally {
            setPending(false);
        }
    };

    const bonusBase = isMyTurn ? bonusFaceAvailable(s, myId) : null;
    const preview = s ? scorePreview(s) : null;
    const myAllowed = allowedFaces(s, myId);

    const openConfirm = () => {
        if (!preview.zero && !myAllowed.includes(preview.base)) {
            Alert.alert(
                s.phase === "second" ? "Figura deshabilitada" : "Figura ya usada",
                s.phase === "second"
                    ? "Solo puedes anotar la figura activa en esta ronda"
                    : `Ya has anotado ${faceById(preview.base)?.label ?? "esa figura"}`
            );
            return;
        }
        setZeroFace(null);
        setConfirmVisible(true);
    };

    const handleMainButton = () => {
        if (!isMyTurn || pending || isRolling || waitingBanners) return;
        if (bonusBase != null) return run(() => gameBonusRoll(roomId));
        if (s.rolls_left > 0) return run(() => gameRoll(roomId));
        openConfirm();
    };

    const handleDiePress = (index) => {
        if (!isMyTurn || isRolling || waitingBanners || !canToggleDie(s, index)) return;
        // Se marca ya en pantalla y el servidor lo confirma.
        setRoom((prev) => {
            const dice = prev.state.dice.map((d, i) =>
                i === index ? { ...d, locked: !d.locked } : d
            );
            return { ...prev, state: { ...prev.state, dice } };
        });
        gameToggleDie(roomId, index).catch(() => refresh());
    };

    const confirmScore = () => {
        if (preview.zero && !zeroFace) {
            Alert.alert("Selecciona una figura");
            return;
        }
        setConfirmVisible(false);
        run(() => gameScore(roomId, preview.zero ? zeroFace.id : null));
    };

    const chooseDirection = (type) => run(() => gameChooseDirection(roomId, type));

    // ---------- Salir ----------

    const handleLeave = useCallback(() => {
        Alert.alert(
            "Salir de la partida",
            "Si sales, los demás seguirán jugando sin ti. ¿Seguro?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        leavingRef.current = true;
                        try {
                            await leaveRoom(roomId);
                        } catch {
                            // Aunque falle, se vuelve al inicio.
                        }
                        router.replace("/");
                    },
                },
            ]
        );
    }, [roomId]);

    useBlockBack(true, handleLeave);

    // ---------- Pintar ----------

    if (!s || !myId) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color="#facc15" size="large" />
            </View>
        );
    }

    const activePlayers = players.filter((p) => !isLeft(s, p.id));
    const boardPlayers = players.map((p) => ({ ...p, left: isLeft(s, p.id) }));
    const activeScoresByName = {};
    activePlayers.forEach((p) => {
        activeScoresByName[p.nickname] = s.scores?.[p.id] ?? 0;
    });

    const shownDice = view.dice ?? s.dice;
    const dice = shownDice?.length === 5 ? shownDice : EMPTY_DICE;
    const currentAllowed = allowedFaces(s, current?.id);

    const buttonTitle = !isMyTurn
        ? s.phase === "choosing"
            ? "Eligiendo la 2ª tanda…"
            : `Turno de ${current?.nickname ?? ""}`
        : bonusBase != null
            ? "+ Tirar dados +"
            : s.rolls_left === 0
                ? "Anotar puntos"
                : "Tirar dados";

    const helpText = !isMyTurn
        ? `Mirando la jugada de ${current?.nickname ?? ""}`
        : s.rolls_left === 0
            ? "Selecciona los dados que te quieras anotar"
            : "Selecciona los dados que quieras conservar";

    const isDieDimmed = (d) =>
        s.bonus_face != null && d.face != null && d.face !== s.bonus_face && d.face !== 6;

    return (
        <View style={styles.container}>
            <Text style={styles.roundText}>
                Ronda {Math.min(s.round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
                {s.phase === "second" && s.order
                    ? `  ·  ${faceById(s.order[s.round - 7])?.label}`
                    : ""}
            </Text>

            <View style={styles.header}>
                <Text style={styles.title}>
                    {isMyTurn ? "¡Tu turno!" : `Turno de ${current?.nickname ?? ""}`}
                </Text>
                <View style={styles.infoRow}>
                    <Text style={styles.points}>
                        Puntos: {s.scores?.[current?.id] ?? 0}
                    </Text>
                    {secondsLeft !== null && s.phase !== "finished" && (
                        <Text style={[styles.timer, secondsLeft <= 10 && styles.timerUrgent]}>
                            ⏱ {secondsLeft}s
                        </Text>
                    )}
                </View>
                {/* Figuras que le quedan al jugador del turno, siempre a la vista. */}
                <FacesStrip faces={DADES} activeIds={currentAllowed} />
                <Touchable
                    style={styles.scoreboardBtn}
                    onPress={() => setScoreboardVisible(true)}
                >
                    <Text style={styles.scoreboardText}>📊 Marcador</Text>
                </Touchable>
            </View>

            <View style={styles.actionArea}>
                <Text style={styles.helpText}>{helpText}</Text>

                <View style={styles.diceRow}>
                    {dice.map((d, index) => {
                        const spinning = rollingIdx.includes(index);
                        return (
                            <Pressable
                                key={index}
                                onPress={() => handleDiePress(index)}
                                disabled={!isMyTurn}
                            >
                                <AnimatedDie
                                    face={faceById(d.face)}
                                    faces={DADES}
                                    locked={d.locked && !spinning}
                                    isRolling={spinning}
                                    delay={index * DIE_DELAY_STEP}
                                    enterFrom={index % 2 === 0 ? "left" : "right"}
                                    disabled={isDieDimmed(d)}
                                />
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.bottomArea}>
                    <Text style={styles.rollsText}>
                        Tiradas restantes: {s.rolls_left ?? 0}
                        {s.bonus_points > 0 ? `  ·  Bonus: ${s.bonus_points}` : ""}
                    </Text>
                    <AnimatedRollButton
                        isRolling={isRolling || pending}
                        rollsLeft={s.rolls_left}
                        onPress={handleMainButton}
                        title={buttonTitle}
                        disabled={!isMyTurn || waitingBanners}
                    />
                    <Touchable onPress={handleLeave} style={styles.leaveBtn}>
                        <Text style={styles.leaveText}>Salir de la partida</Text>
                    </Touchable>
                </View>
            </View>

            <EventBanner event={banner} />

            <ScoreboardModal
                visible={scoreboardVisible}
                onClose={() => setScoreboardVisible(false)}
                players={boardPlayers}
                scores={s.scores}
                sheet={s.sheet}
                faces={DADES}
                currentId={current?.id}
            />

            {/* Solo puede elegir quien va ganando; los demás ven "Esperando…". */}
            <SecondPhaseModal
                visible={s.phase === "choosing" && phaseModalReady}
                players={activePlayers.map((p) => p.nickname)}
                scores={activeScoresByName}
                canChoose={s.chooser === myId}
                onSelect={(type) => chooseDirection(type)}
            />

            <Modal transparent visible={confirmVisible} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirmar anotación</Text>

                        {preview?.zero ? (
                            <>
                                <Text style={styles.modalText}>
                                    No has seleccionado ningún dado.
                                    Elige una figura para descartar:
                                </Text>
                                <FiguresGrid
                                    faces={DADES}
                                    disabledFaces={DADES.map((f) => f.id).filter(
                                        (id) => !myAllowed.includes(id)
                                    )}
                                    interactive
                                    variant="compact"
                                    onFacePress={setZeroFace}
                                    selectedFaceId={zeroFace?.id}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalText}>
                                    Has seleccionado {preview?.count ?? 0} dados:
                                </Text>
                                <Text style={styles.modalFaces}>
                                    {(preview?.faces ?? [])
                                        .map((f) => faceById(f)?.label)
                                        .join(", ")}
                                </Text>
                                {preview?.count === 0 && preview?.base != null && (
                                    <Image
                                        source={faceById(preview.base)?.img}
                                        style={styles.faceBonusImg}
                                        resizeMode="contain"
                                    />
                                )}
                            </>
                        )}

                        {preview?.bonus > 0 && (
                            <Text style={styles.modalBonus}>
                                Bonus: {preview.bonus} puntos
                            </Text>
                        )}
                        <Text style={styles.modalPoints}>
                            Total: {preview?.total ?? 0} puntos
                        </Text>

                        <Touchable
                            style={[
                                styles.modalConfirmBtn,
                                preview?.zero && !zeroFace && styles.disabledBtn,
                            ]}
                            onPress={confirmScore}
                            disabled={preview?.zero && !zeroFace}
                        >
                            <Text style={styles.modalConfirmText}>Confirmar</Text>
                        </Touchable>

                        <Touchable onPress={() => setConfirmVisible(false)}>
                            <Text style={styles.modalCancel}>Cancelar</Text>
                        </Touchable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default OnlineGame;

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
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
    header: {
        alignItems: "center",
    },
    title: {
        color: "white",
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 6,
    },
    points: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 10,
    },
    timer: {
        color: "#9CA3AF",
        fontSize: 18,
        fontWeight: "700",
    },
    timerUrgent: {
        color: "#F87171",
    },
    scoreboardBtn: {
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#4B5563",
        backgroundColor: "#1F2937",
    },
    scoreboardText: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
    },
    actionArea: {
        width: "90%",
        flex: 1,
        marginVertical: 10,
        justifyContent: "space-evenly",
        alignItems: "center",
    },
    helpText: {
        color: "#FACC15",
        fontSize: 16,
    },
    diceRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
    },
    bottomArea: {
        alignItems: "center",
    },
    rollsText: {
        color: "#9CA3AF",
        fontSize: 16,
    },
    leaveBtn: {
        marginTop: 20,
    },
    leaveText: {
        color: "#F87171",
        fontSize: 15,
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
        padding: 24,
        borderRadius: 12,
        alignItems: "center",
    },
    modalTitle: {
        color: "white",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 12,
    },
    modalText: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 10,
    },
    modalFaces: {
        color: "#FACC15",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
    },
    faceBonusImg: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    modalBonus: {
        color: "#A5B4FC",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
    },
    modalPoints: {
        color: "#FACC15",
        fontSize: 22,
        fontWeight: "900",
        marginVertical: 12,
    },
    modalConfirmBtn: {
        backgroundColor: "#FACC15",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 12,
    },
    modalConfirmText: {
        color: "#1F2937",
        fontSize: 18,
        fontWeight: "700",
    },
    disabledBtn: {
        opacity: 0.4,
    },
    modalCancel: {
        color: "#9CA3AF",
        fontSize: 16,
    },
});

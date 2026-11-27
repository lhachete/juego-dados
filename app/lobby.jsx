// app/lobby.jsx
// Sala de espera del modo online: se ve el código para compartir y quién
// está dentro. El anfitrión (👑) pulsa "Empezar partida" cuando estén todos.
// Todos los móviles de la sala se actualizan solos al momento.
import { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Share,
    ActivityIndicator,
    AppState,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Button from "../components/Button";
import Touchable from "../components/Touchable";
import { supabase } from "../lib/supabase";
import {
    fetchRoom,
    subscribeToRoom,
    leaveRoom,
    startOnlineGame,
    friendlyError,
} from "../lib/online";
import { useBlockBack } from "../hooks/useBlockBack";

const Lobby = () => {
    const { roomId } = useLocalSearchParams();

    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [myId, setMyId] = useState(null);
    const [busy, setBusy] = useState(false);
    const leavingRef = useRef(false);

    const goHome = () => router.replace("/");

    const refresh = useCallback(async () => {
        try {
            const data = await fetchRoom(roomId);
            if (leavingRef.current) return;

            // Ya no estás en la sala (se cerró o saliste desde otro sitio).
            if (!data.room || data.room.status === "closed") {
                Alert.alert("Sala cerrada", "Esta sala ya no existe.");
                goHome();
                return;
            }
            setRoom(data.room);
            setPlayers(data.players);
        } catch (error) {
            Alert.alert("Sin conexión", friendlyError(error));
        }
    }, [roomId]);

    // Carga inicial + escuchar cambios en tiempo real.
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setMyId(data.session?.user?.id ?? null);
        });

        refresh();
        const unsubscribe = subscribeToRoom(roomId, () => refresh());

        // Al volver a la app (estaba en segundo plano) se recarga por si se
        // perdió algún aviso mientras tanto.
        const appStateSub = AppState.addEventListener("change", (state) => {
            if (state === "active") refresh();
        });

        return () => {
            unsubscribe();
            appStateSub.remove();
        };
    }, [roomId, refresh]);

    // Cuando el anfitrión empieza, todos pasan a la partida.
    useEffect(() => {
        if (room?.status === "playing") {
            router.replace({ pathname: "/online-game", params: { roomId } });
        }
    }, [room?.status, roomId]);

    const isHost = room && myId && room.host_id === myId;
    const canStart = isHost && players.length >= 2;

    const handleLeave = useCallback(() => {
        Alert.alert("Salir de la sala", "¿Seguro que quieres salir?", [
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
                    goHome();
                },
            },
        ]);
    }, [roomId]);

    // El botón "atrás" de Android pregunta antes de salir de la sala.
    useBlockBack(true, handleLeave);

    const handleStart = async () => {
        if (!canStart || busy) return;
        setBusy(true);
        try {
            await startOnlineGame(roomId);
            // La navegación la hace el efecto de room.status.
        } catch (error) {
            Alert.alert("No se pudo empezar", friendlyError(error));
        } finally {
            setBusy(false);
        }
    };

    const handleShare = () => {
        if (!room) return;
        Share.share({
            message: `¡Juega conmigo a Royal Dices! Código de sala: ${room.code}`,
        });
    };

    if (!room) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#facc15" size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.eyebrow}>CÓDIGO DE LA SALA</Text>
            <Touchable onPress={handleShare}>
                <Text style={styles.code}>{room.code}</Text>
            </Touchable>
            <Text style={styles.hint}>Toca el código para compartirlo</Text>

            <Text style={styles.subtitle}>
                Jugadores ({players.length}/6)
            </Text>

            <View style={styles.playerList}>
                {players.map((p, i) => (
                    <View key={p.user_id} style={styles.playerRow}>
                        <Text style={styles.playerOrder}>{i + 1}.</Text>
                        <Text
                            style={[
                                styles.playerName,
                                p.user_id === myId && styles.me,
                            ]}
                        >
                            {p.user_id === room.host_id ? "👑 " : ""}
                            {p.nickname}
                            {p.user_id === myId ? " (tú)" : ""}
                        </Text>
                    </View>
                ))}
            </View>

            {isHost ? (
                <>
                    <Button
                        title="Empezar partida"
                        onPress={handleStart}
                        disabled={!canStart || busy}
                    />
                    {!canStart && (
                        <Text style={styles.waiting}>
                            Esperando a que entre al menos otro jugador…
                        </Text>
                    )}
                </>
            ) : (
                <Text style={styles.waiting}>
                    Esperando a que el anfitrión empiece la partida…
                </Text>
            )}

            <Button title="Salir de la sala" variant="outline" onPress={handleLeave} />
        </View>
    );
};

export default Lobby;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    eyebrow: {
        color: "#9CA3AF",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 2,
    },
    code: {
        color: "#FBBF24",
        fontSize: 56,
        fontWeight: "900",
        letterSpacing: 10,
        marginVertical: 4,
    },
    hint: {
        color: "#6B7280",
        fontSize: 13,
        marginBottom: 32,
    },
    subtitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    playerList: {
        width: 260,
        marginBottom: 24,
    },
    playerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    playerOrder: {
        color: "#6B7280",
        fontSize: 16,
        width: 28,
    },
    playerName: {
        color: "white",
        fontSize: 18,
    },
    me: {
        color: "#FACC15",
        fontWeight: "700",
    },
    waiting: {
        color: "#FCD34D",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 16,
    },
});

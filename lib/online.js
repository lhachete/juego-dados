// lib/online.js
// Todo lo que la app pide al servidor para el modo online.
// Las pantallas solo usan estas funciones, nunca la base de datos directamente.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const NICKNAME_KEY = "royal-dices:nickname";

// Errores que lanzan las funciones SQL (supabase/01_fase1_salas.sql),
// traducidos a un mensaje para el jugador.
const ERROR_MESSAGES = {
    NOT_AUTHENTICATED: "No se ha podido iniciar sesión. Inténtalo de nuevo.",
    BAD_NICKNAME: "El nombre debe tener entre 1 y 20 caracteres.",
    ROOM_NOT_FOUND: "No hay ninguna sala con ese código.",
    GAME_ALREADY_STARTED: "Esa partida ya ha empezado.",
    ROOM_FULL: "La sala está llena (máximo 6 jugadores).",
    NICKNAME_TAKEN: "Ya hay alguien con ese nombre en la sala.",
    ONLY_HOST: "Solo el anfitrión puede empezar la partida.",
    NOT_ENOUGH_PLAYERS: "Hacen falta al menos 2 jugadores.",
    NOT_YOUR_TURN: "No es tu turno.",
    NO_ROLLS_LEFT: "No te quedan tiradas.",
    ROLL_FIRST: "Primero tienes que tirar los dados.",
    DIE_NOT_ALLOWED: "Ese dado no se puede guardar ahora.",
    NO_BONUS: "No tienes tirada extra.",
    FACE_NOT_ALLOWED: "No puedes anotar esa figura.",
    MIXED_FACES: "Solo puedes anotar una figura (más Ases).",
    NOT_CHOOSER: "Le toca elegir a quien va ganando.",
    GAME_NOT_ACTIVE: "La partida ya no está en marcha.",
    WAIT_BANNERS: "Espera a que terminen los avisos.",
};

export const friendlyError = (error) => {
    const text = error?.message ?? "";
    const key = Object.keys(ERROR_MESSAGES).find((k) => text.includes(k));
    if (key) return ERROR_MESSAGES[key];
    // Error no previsto: se añade el detalle técnico para poder investigarlo.
    return `Algo ha fallado. Comprueba tu conexión e inténtalo de nuevo.${
        text ? `\n\nDetalle: ${text}` : ""
    }`;
};

// Cada móvil entra como usuario "anónimo": no hace falta email ni
// contraseña, pero el servidor sabe quién es quién. La sesión se recuerda.
export const ensureSignedIn = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user;

    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return signIn.user;
};

const callRpc = async (name, params) => {
    await ensureSignedIn();
    const { data, error } = await supabase.rpc(name, params);
    if (error) throw error;
    return data;
};

// Devuelven { room_id, code }
export const createRoom = (nickname) =>
    callRpc("create_room", { p_nickname: nickname });

export const joinRoom = (code, nickname) =>
    callRpc("join_room", { p_code: code, p_nickname: nickname });

export const leaveRoom = (roomId) =>
    callRpc("leave_room", { p_room_id: roomId });

export const startOnlineGame = (roomId) =>
    callRpc("start_game", { p_room_id: roomId });

// --- Jugadas de la partida (fase 2) ---
// Todas las comprueba el servidor: si no es tu turno o la jugada no vale,
// lanzan un error (usa friendlyError para enseñarlo).
export const gameRoll = (roomId) => callRpc("game_roll", { p_room_id: roomId });

export const gameToggleDie = (roomId, index) =>
    callRpc("game_toggle_die", { p_room_id: roomId, p_index: index });

export const gameBonusRoll = (roomId) =>
    callRpc("game_bonus_roll", { p_room_id: roomId });

// face solo hace falta al anotar 0 (sin dados seleccionados).
export const gameScore = (roomId, face = null) =>
    callRpc("game_score", { p_room_id: roomId, p_face: face });

// direction: "negras" | "as"
export const gameChooseDirection = (roomId, direction) =>
    callRpc("game_choose_direction", { p_room_id: roomId, p_direction: direction });

// Se acabó el minuto del turno. seq es el número de cambio que vio el móvil,
// para que si varios lo piden a la vez solo cuente una vez.
export const gameTimeout = (roomId, seq) =>
    callRpc("game_timeout", { p_room_id: roomId, p_seq: seq });

export const getMyUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
};

// Sala + jugadores (ordenados por turno). room es null si la sala no existe
// o si ya no estás en ella.
export const fetchRoom = async (roomId) => {
    const [roomRes, playersRes] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
        supabase
            .from("room_players")
            .select("user_id, nickname, seat")
            .eq("room_id", roomId)
            .order("seat"),
    ]);
    if (roomRes.error) throw roomRes.error;
    if (playersRes.error) throw playersRes.error;
    return { room: roomRes.data, players: playersRes.data ?? [] };
};

// Avisa (onChange) cada vez que cambia algo en la sala. Devuelve la función
// para dejar de escuchar.
export const subscribeToRoom = (roomId, onChange) => {
    const channel = supabase
        .channel(`room-${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "rooms",
                filter: `id=eq.${roomId}`,
            },
            (payload) => onChange(payload.new)
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

// El último nombre usado se recuerda para no escribirlo cada vez.
export const loadNickname = async () => {
    try {
        return (await AsyncStorage.getItem(NICKNAME_KEY)) ?? "";
    } catch {
        return "";
    }
};

export const saveNickname = async (nickname) => {
    try {
        await AsyncStorage.setItem(NICKNAME_KEY, nickname);
    } catch {
        // No es grave: la próxima vez se vuelve a escribir.
    }
};

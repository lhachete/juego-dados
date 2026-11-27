// app/online.jsx
// Entrada al modo online en dos pasos:
//  1) Escribir tu nickname (imprescindible para jugar).
//  2) Crear una sala o unirte con el código que te pase otro jugador.
import { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { router } from "expo-router";
import Button from "../components/Button";
import TextButton from "../components/TextButton";
import Touchable from "../components/Touchable";
import { isOnlineConfigured } from "../lib/supabase";
import {
    createRoom,
    joinRoom,
    friendlyError,
    loadNickname,
    saveNickname,
} from "../lib/online";

const CODE_LENGTH = 5;

const Online = () => {
    const [nickname, setNickname] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [step, setStep] = useState("name"); // "name" | "room"

    useEffect(() => {
        loadNickname().then(setNickname);
    }, []);

    if (!isOnlineConfigured) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Jugar online</Text>
                <Text style={styles.text}>
                    Falta configurar el servidor (archivo .env con los datos de
                    Supabase).
                </Text>
                <TextButton title="Volver" onPress={() => router.back()} />
            </View>
        );
    }

    const checkNickname = () => {
        const nick = nickname.trim();
        if (nick.length === 0) {
            Alert.alert("Falta tu nombre", "Escribe cómo quieres que te vean los demás.");
            return null;
        }
        return nick;
    };

    const handleContinue = async () => {
        const nick = checkNickname();
        if (!nick) return;
        setNickname(nick);
        await saveNickname(nick);
        setStep("room");
    };

    const goToLobby = (roomId) => {
        router.replace({ pathname: "/lobby", params: { roomId } });
    };

    const handleCreate = async () => {
        const nick = checkNickname();
        if (!nick || busy) return;
        setBusy(true);
        try {
            const { room_id } = await createRoom(nick);
            await saveNickname(nick);
            goToLobby(room_id);
        } catch (error) {
            Alert.alert("No se pudo crear la sala", friendlyError(error));
        } finally {
            setBusy(false);
        }
    };

    const handleJoin = async () => {
        const nick = checkNickname();
        if (!nick || busy) return;
        if (code.trim().length !== CODE_LENGTH) {
            Alert.alert("Código incompleto", `El código tiene ${CODE_LENGTH} letras.`);
            return;
        }
        setBusy(true);
        try {
            const { room_id } = await joinRoom(code.trim(), nick);
            await saveNickname(nick);
            goToLobby(room_id);
        } catch (error) {
            Alert.alert("No se pudo entrar", friendlyError(error));
        } finally {
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Text style={styles.title}>Jugar online</Text>

            {step === "name" ? (
                <>
                    <Text style={styles.label}>Escribe tu nickname</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nickname"
                        placeholderTextColor="#9CA3AF"
                        value={nickname}
                        onChangeText={setNickname}
                        maxLength={20}
                        autoFocus={!nickname}
                        returnKeyType="next"
                        onSubmitEditing={handleContinue}
                    />
                    <Button
                        title="Continuar"
                        onPress={handleContinue}
                        disabled={nickname.trim().length === 0}
                    />
                </>
            ) : (
                <>
                    <Text style={styles.greeting}>
                        Hola, <Text style={styles.greetingName}>{nickname}</Text>
                    </Text>
                    <Touchable onPress={() => setStep("name")} disabled={busy}>
                        <Text style={styles.changeName}>Cambiar nickname</Text>
                    </Touchable>

                    <Button title="Crear sala" onPress={handleCreate} disabled={busy} />

                    <View style={styles.separator}>
                        <View style={styles.line} />
                        <Text style={styles.separatorText}>o únete con un código</Text>
                        <View style={styles.line} />
                    </View>

                    <TextInput
                        style={[styles.input, styles.codeInput]}
                        placeholder="ABCDE"
                        placeholderTextColor="#4B5563"
                        value={code}
                        onChangeText={(t) =>
                            setCode(t.toUpperCase().replace(/[^A-Z]/g, ""))
                        }
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={CODE_LENGTH}
                        editable={!busy}
                    />

                    <Button
                        title="Unirse"
                        variant="outline"
                        onPress={handleJoin}
                        disabled={busy}
                    />
                </>
            )}

            {busy && <ActivityIndicator color="#facc15" style={styles.spinner} />}

            <TextButton title="Volver" onPress={() => router.back()} />
        </KeyboardAvoidingView>
    );
};

export default Online;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        color: "#FBBF24",
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 32,
    },
    text: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 24,
    },
    label: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        width: 240,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#1F2937",
        borderRadius: 8,
        color: "white",
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center",
    },
    greeting: {
        color: "white",
        fontSize: 20,
        marginBottom: 4,
    },
    greetingName: {
        color: "#FBBF24",
        fontWeight: "800",
    },
    changeName: {
        color: "#9CA3AF",
        fontSize: 14,
        textDecorationLine: "underline",
        marginBottom: 24,
    },
    codeInput: {
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: 8,
    },
    separator: {
        flexDirection: "row",
        alignItems: "center",
        width: 260,
        marginVertical: 16,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#374151",
    },
    separatorText: {
        color: "#9CA3AF",
        marginHorizontal: 8,
        fontSize: 14,
    },
    spinner: {
        marginBottom: 16,
    },
});

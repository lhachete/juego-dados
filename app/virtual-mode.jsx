// virtual-mode.jsx
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useGame } from "../contexts/GameContext";
import ScoresModal from "../components/ScoresModal";
import ExitGameModal from "../components/ExitGameModal";
import FiguresGridModal from "../components/FiguresGridModal";
import DADES from "./dades.jsx";

const VirtualMode = () => {
    const { players, scores, turn, round, TOTAL_ROUNDS, scoresModalVisible, setScoresModalVisible,
        exitGame, finishGame, isGameStarted, startGame,
    } = useGame();

    const navigation = useNavigation();
    const currentPlayer = players[turn];
    const [exitModalVisible, setExitModalVisible] = useState(false);
    const [figuresModalVisible, setFiguresModalVisible] = useState(false);
    const [diceResults, setDiceResults] = useState([]); // resultados visibles
    /*
        [
            { value: 3, locked: false },
            { value: 6, locked: true },
            ...
        ]
    */
    const [isRolling, setIsRolling] = useState(false);
    const [rollsLeft, setRollsLeft] = useState(3);

    const rollDice = async () => {
        if (isRolling || rollsLeft === 0) return;
        setIsRolling(true);

        // Si es la primera tirada, inicializamos los 6 dados
        let newDice = diceResults.length === 0
            ? Array.from({ length: 6 }, () => ({ value: null, locked: false }))
            : [...diceResults];

        for (let i = 0; i < 5; i++) {
            if (newDice[i].locked) continue;

            const value = Math.floor(Math.random() * 6) + 1;

            await new Promise((resolve) => setTimeout(resolve, 300));

            newDice[i] = { value, locked: false };
            setDiceResults([...newDice]);
        }

        setRollsLeft((prev) => prev - 1);
        setIsRolling(false);
    };


    //Función para seleccionar/deseleccionar dados
    const lockDices = (index) => {
        if (isRolling) return;

        setDiceResults((prev) =>
            prev.map((die, i) =>
                i === index ? { ...die, locked: !die.locked } : die
            )
        );
    };



    // Iniciar juego si no está iniciado
    useEffect(() => {
        if (!isGameStarted) {
            startGame();
        }
    }, []);

    // Bloquear navegación si la partida está activa
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
            {/* ---- INFO PARTIDA ---- */}
            <Text style={styles.roundText}>
                Ronda {round} / {TOTAL_ROUNDS}
            </Text>

            <Text style={styles.title}>Turno de {currentPlayer}</Text>

            <Text style={styles.currentPlayerScore}>
                Puntos: {scores[currentPlayer] ?? 0}
            </Text>

            <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => setFiguresModalVisible(true)}
            >
                <Text style={styles.linkText}>Figuras por completar</Text>
            </TouchableOpacity>


            {/* ---- GRID INFORMATIVO ---- */}
            <FiguresGridModal
                visible={figuresModalVisible}
                onClose={() => setFiguresModalVisible(false)}
                faces={DADES}
            />



            {/* ---- NUEVA FUNCIONALIDAD ---- */}
            <View style={styles.virtualActionArea}>

                {/* ZONA SUPERIOR */}
                <View style={styles.topArea}>
                    <Text style={styles.textInfo}>
                        Selecciona los dados que quieras conservar
                    </Text>
                </View>

                {/* ZONA CENTRAL (dados / cubilete) */}
                <View style={styles.middleArea}>
                    <View style={styles.diceRow}>
                        {diceResults.map((die, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => lockDices(index)}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.diceWrapper,
                                        die.locked && styles.diceLocked
                                    ]}
                                >
                                    {die.value && (
                                        <Image
                                            source={DADES[die.value - 1].img}
                                            style={styles.diceImg}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                </View>

                {/* ZONA INFERIOR */}
                <View style={styles.bottomArea}>
                    <Text style={styles.rollsText}>
                        Tiradas restantes: {rollsLeft}
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.rollBtn,
                            (isRolling || rollsLeft === 0) && { opacity: 0.4 }
                        ]}
                        disabled={isRolling || rollsLeft === 0}
                        onPress={rollDice}
                    >
                        <Text style={styles.rollBtnText}>Tirar dados</Text>
                    </TouchableOpacity>
                </View>

            </View>



            {/* ---- VER PUNTUACIONES ---- */}
            <TouchableOpacity
                style={styles.viewScoresBtn}
                onPress={() => setScoresModalVisible(true)}
            >
                <Text style={styles.viewScoresText}>Ver puntuaciones</Text>
            </TouchableOpacity>

            {/* ---- MODAL PUNTUACIONES ---- */}
            <ScoresModal
                visible={scoresModalVisible}
                players={players}
                scores={scores}
                onClose={() => setScoresModalVisible(false)}
            />

            {/* ---- MODAL SALIR ---- */}
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

    subtitle: {
        color: "#9CA3AF",
        fontSize: 18,
        marginBottom: 15,
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
        marginBottom: 30,
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
    linkBtn: {
        marginBottom: 10,
    },

    linkText: {
        color: "#9CA3AF",
        fontSize: 18,
        textDecorationLine: "underline",
    },
    closeText: {
        color: "#FACC15",
        fontSize: 18,
        fontWeight: "600",
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
        alignSelf: "center",
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
        marginTop: 15,
        color: "#9CA3AF",
        fontSize: 16,
        alignSelf: "center",
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


});

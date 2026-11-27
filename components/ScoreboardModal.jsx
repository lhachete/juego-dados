// components/ScoreboardModal.jsx
// Marcador con pestañas: total de puntos y, por cada tanda, lo que ha
// anotado cada jugador en cada figura (como una hoja de puntos).
import { useState } from "react";
import { Modal, View, Text, Image, ScrollView, StyleSheet } from "react-native";
import Touchable from "./Touchable";

const TABS = [
    { key: "total", label: "Puntos" },
    { key: "first", label: "1ª tanda" },
    { key: "second", label: "2ª tanda" },
];

/**
 * players: [{ id, nickname, left }]
 * scores:  { [id]: puntos }
 * sheet:   { [id]: { first: { [faceId]: puntos }, second: { ... } } }
 */
const ScoreboardModal = ({ visible, onClose, players, scores, sheet = {}, faces, currentId }) => {
    const [tab, setTab] = useState("total");

    const ranking = players
        .map((p, i) => ({ ...p, points: scores?.[p.id] ?? 0, order: i }))
        .sort((a, b) => b.points - a.points || a.order - b.order);

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.content}>
                    <Text style={styles.title}>Marcador</Text>

                    <View style={styles.tabs}>
                        {TABS.map((t) => (
                            <Touchable
                                key={t.key}
                                onPress={() => setTab(t.key)}
                                style={[styles.tab, tab === t.key && styles.tabActive]}
                            >
                                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                                    {t.label}
                                </Text>
                            </Touchable>
                        ))}
                    </View>

                    {tab === "total" ? (
                        <View style={styles.list}>
                            {ranking.map((p, i) => (
                                <View key={p.id} style={styles.row}>
                                    <Text
                                        style={[
                                            styles.name,
                                            p.id === currentId && styles.current,
                                            p.left && styles.left,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {i + 1}. {p.nickname}
                                        {p.left ? " (se fue)" : ""}
                                    </Text>
                                    <Text style={styles.points}>{p.points} pts</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <ScrollView horizontal style={styles.tableScroll}>
                            <View>
                                <View style={styles.tableRow}>
                                    <View style={styles.nameCell} />
                                    {faces.map((f) => (
                                        <View key={f.id} style={styles.cell}>
                                            <Image source={f.img} style={styles.faceImg} resizeMode="contain" />
                                        </View>
                                    ))}
                                </View>
                                {players.map((p) => {
                                    const marks = sheet?.[p.id]?.[tab] ?? {};
                                    return (
                                        <View key={p.id} style={styles.tableRow}>
                                            <Text
                                                style={[
                                                    styles.nameCell,
                                                    styles.cellName,
                                                    p.id === currentId && styles.current,
                                                    p.left && styles.left,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {p.nickname}
                                            </Text>
                                            {faces.map((f) => {
                                                const v = marks[f.id];
                                                return (
                                                    <View key={f.id} style={styles.cell}>
                                                        <Text style={v == null ? styles.empty : styles.value}>
                                                            {v == null ? "·" : v}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    )}

                    <Touchable style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Cerrar</Text>
                    </Touchable>
                </View>
            </View>
        </Modal>
    );
};

export default ScoreboardModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        width: "92%",
        backgroundColor: "#1F2937",
        padding: 20,
        borderRadius: 14,
        alignItems: "center",
    },
    title: {
        color: "#FACC15",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 14,
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#111827",
        borderRadius: 10,
        padding: 3,
        marginBottom: 16,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: "#FACC15",
    },
    tabText: {
        color: "#9CA3AF",
        fontSize: 15,
        fontWeight: "700",
    },
    tabTextActive: {
        color: "#111827",
    },
    list: {
        width: "100%",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    name: {
        color: "white",
        fontSize: 18,
        flexShrink: 1,
    },
    points: {
        color: "#A5B4FC",
        fontSize: 18,
        fontWeight: "700",
    },
    current: {
        color: "#FACC15",
        fontWeight: "800",
    },
    left: {
        color: "#6B7280",
    },
    tableScroll: {
        maxWidth: "100%",
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
        paddingVertical: 6,
    },
    nameCell: {
        width: 76,
    },
    cellName: {
        color: "white",
        fontSize: 14,
    },
    cell: {
        width: 36,
        alignItems: "center",
    },
    faceImg: {
        width: 26,
        height: 26,
    },
    value: {
        color: "white",
        fontSize: 15,
        fontWeight: "700",
    },
    empty: {
        color: "#4B5563",
        fontSize: 15,
    },
    closeBtn: {
        marginTop: 18,
        backgroundColor: "#FACC15",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
    },
    closeText: {
        color: "#1F2937",
        fontSize: 18,
        fontWeight: "700",
    },
});

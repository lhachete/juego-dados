import { View, Text, StyleSheet } from "react-native";
import Button from "./Button";

const ComingSoonButton = ({ title, variant = "outline" }) => (
    <View style={styles.wrapper}>
        <Button title={title} variant={variant} disabled />
        <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>Próximamente</Text>
        </View>
    </View>
);

export default ComingSoonButton;

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: -8,
        right: -10,
        backgroundColor: "#facc15",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badgeText: {
        color: "#111827",
        fontSize: 11,
        fontWeight: "800",
    },
});

// components/FacesStrip.jsx
// Fila con las 6 figuras en pequeño. Las que el jugador aún puede anotar se
// ven encendidas; las ya anotadas (o no activas en la 2ª tanda), apagadas.
import { View, Image, StyleSheet } from "react-native";

const FacesStrip = ({ faces, activeIds = [], size = 34 }) => (
    <View style={styles.row}>
        {faces.map((face) => {
            const active = activeIds.includes(face.id);
            return (
                <View
                    key={face.id}
                    style={[
                        styles.box,
                        { width: size + 8, height: size + 8 },
                        active ? styles.boxActive : styles.boxUsed,
                    ]}
                >
                    <Image
                        source={face.img}
                        style={[{ width: size, height: size }, !active && styles.imgUsed]}
                        resizeMode="contain"
                    />
                </View>
            );
        })}
    </View>
);

export default FacesStrip;

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    box: {
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    boxActive: {
        backgroundColor: "#1F2937",
        borderColor: "#FACC15",
    },
    boxUsed: {
        backgroundColor: "#111827",
        borderColor: "#374151",
    },
    imgUsed: {
        opacity: 0.25,
    },
});

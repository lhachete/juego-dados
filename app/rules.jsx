import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import Button from "../components/Button";
import DADES from "./dades.jsx";

const Section = ({ number, title, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{number}</Text>
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {children}
    </View>
);

const P = ({ children }) => <Text style={styles.text}>{children}</Text>;
const B = ({ children }) => <Text style={styles.bold}>{children}</Text>;

const Rules = () => {
    // De menor a mayor valor: Negras → Ases
    const figuras = [...DADES].sort((a, b) => a.id - b.id);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reglas</Text>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Section number="1" title="Jugadores">
                    <P>Se eligen los jugadores que van a jugar escribiendo el nombre de cada uno.</P>
                </Section>

                <Section number="2" title="Los dados">
                    <P>Se juega con 5 dados de póker. Cada figura vale:</P>
                    <View style={styles.facesRow}>
                        {figuras.map((f) => (
                            <View key={f.id} style={styles.faceItem}>
                                <Image source={f.img} style={styles.faceImg} resizeMode="contain" />
                                <Text style={styles.faceLabel}>{f.label}</Text>
                                <Text style={styles.faceValue}>{f.id} pt{f.id > 1 ? "s" : ""}</Text>
                            </View>
                        ))}
                    </View>
                </Section>

                <Section number="3" title="El turno">
                    <P>
                        Cada jugador puede tirar los dados <B>hasta 3 veces</B>. Elige una figura e intenta
                        sacar el máximo número de ella. Entre tirada y tirada puede <B>guardar</B> los dados
                        que quiera y volver a tirar el resto.
                    </P>
                    <View style={styles.example}>
                        <Text style={styles.exampleTitle}>Ejemplo</Text>
                        <Text style={styles.exampleText}>1ª tirada: Q Q J Negra Roja → guarda las dos Q</Text>
                        <Text style={styles.exampleText}>2ª tirada: Q Q Q J A → guarda las tres Q y el A</Text>
                        <Text style={styles.exampleText}>3ª tirada: Q Q Q Q A → ¡fin!</Text>
                    </View>
                </Section>

                <Section number="★" title="El As es comodín">
                    <P>
                        El <B>A</B> cuenta como la figura que haya en la jugada. En el ejemplo anterior el A
                        vale como una Q más, así que son 5 Q.
                    </P>
                    <P>
                        Si la figura no está en la jugada, el A no puede ser esa figura. Con J J K K A, el
                        A solo puede contar como J, como K o como A.
                    </P>
                </Section>

                <Section number="+" title="Tirada extra">
                    <P>
                        Si sacas <B>5 figuras iguales</B> y aún te quedan tiradas, el botón cambia a
                        <B> "+ Tirar dados +"</B>. Puedes volver a tirar y sumar los puntos de esas 5
                        figuras a lo que saques después.
                    </P>
                </Section>

                <Section number="4" title="Anotar puntos">
                    <P>
                        Se anota <B>cantidad × valor</B> de la figura. Con 5 Q se anotan 5 × 4 = <B>20 puntos</B>.
                    </P>
                </Section>

                <Section number="5" title="Siguiente jugador">
                    <P>Después le toca al siguiente jugador, con la misma mecánica.</P>
                </Section>

                <Section number="6" title="No se repiten figuras">
                    <P>
                        En sus siguientes turnos, el jugador ya no puede ir a una figura que haya anotado.
                        Si ya tiene las Q, tendrá que ir a por N, R, J, K o A.
                    </P>
                </Section>

                <Section number="7" title="Segunda tanda">
                    <P>
                        Cuando todos han anotado todas las figuras se hace un recuento y empieza la segunda
                        tanda. Funciona igual, pero las figuras se anotan <B>en orden</B>: de Negras a Ases
                        o de Ases a Negras. Los jugadores votan el sentido.
                    </P>
                </Section>

                <Section number="8" title="Final">
                    <P>
                        Al terminar todas las tiradas se hace el recuento final y gana quien tenga más
                        puntos. Si hay jugadores con la misma puntuación, es <B>empate</B>.
                    </P>
                </Section>
            </ScrollView>

            <View style={styles.footer}>
                <Button title="Volver" onPress={() => router.back()} />
            </View>
        </View>
    );
};

export default Rules;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#facc15",
        textAlign: "center",
        letterSpacing: 3,
        marginBottom: 16,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    section: {
        backgroundColor: "#1F2937",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#facc15",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    badgeText: {
        color: "#111827",
        fontWeight: "800",
        fontSize: 15,
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
    },
    text: {
        color: "#D1D5DB",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 4,
    },
    bold: {
        color: "#ffffff",
        fontWeight: "700",
    },
    facesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 8,
    },
    faceItem: {
        width: "15%",
        alignItems: "center",
    },
    faceImg: {
        width: 40,
        height: 40,
        marginBottom: 4,
    },
    faceLabel: {
        color: "#ffffff",
        fontSize: 11,
        fontWeight: "600",
    },
    faceValue: {
        color: "#facc15",
        fontSize: 11,
        fontWeight: "700",
    },
    example: {
        marginTop: 8,
        backgroundColor: "#111827",
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: "#facc15",
    },
    exampleTitle: {
        color: "#facc15",
        fontWeight: "700",
        marginBottom: 4,
    },
    exampleText: {
        color: "#D1D5DB",
        fontSize: 14,
        lineHeight: 21,
    },
    footer: {
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 24,
    },
});

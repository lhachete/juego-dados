import { Text, StyleSheet } from "react-native";

const Title = ({ children }) => {
  return (
    <Text style={styles.title}>{children}</Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 40, // text-5xl (aprox)
    fontWeight: "800", // font-extrabold
    marginBottom: 16, // mb-4
    letterSpacing: 4, // tracking-widest
    color: "#facc15", // text-yellow-400
    textShadowColor: 'rgba(255, 215, 215, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    lineHeight: 70,
  },
});

export default Title;

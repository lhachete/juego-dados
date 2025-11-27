import { Pressable, Text, StyleSheet } from "react-native";

const TextButton = ({ title, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, // mb-4
  },
  text: {
    color: "#ffffff",
    fontSize: 18, // text-lg
    fontWeight: "600", // font-semibold
    borderBottomWidth: 2,
    borderBottomColor: "#ffffff",
  },
});

export default TextButton;

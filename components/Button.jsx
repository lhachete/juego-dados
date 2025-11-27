import { Pressable, Text, StyleSheet } from "react-native";

const Button = ({ title, onPress, variant = "filled" }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        variant === "filled" ? styles.filled : styles.outline
      ]}
    >
      <Text style={[styles.text, variant === "filled" ? styles.textFilled : styles.textOutline]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: 192, // w-48 (48*4)
    paddingVertical: 12, // py-3 (3*4)
    borderRadius: 12, // rounded-lg (approx 12)
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16, // mb-4 (4*4)
  },
  filled: {
    backgroundColor: "#facc15", // bg-yellow-500
  },
  outline: {
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  text: {
    fontSize: 18, // text-lg
    fontWeight: "600", // font-semibold
  },
  textFilled: {
    color: "#000000",
  },
  textOutline: {
    color: "#ffffff",
  },
});

export default Button;

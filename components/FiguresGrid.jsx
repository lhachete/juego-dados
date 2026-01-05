import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

const FiguresGrid = ({
  faces,
  disabledFaces = [],
  interactive = false,
  onFacePress,
  variant = "manual", // 👈 por defecto manual
}) => {
  return (
    <View style={styles.grid}>
      {faces.map((face) => {
        const isDisabled = disabledFaces?.includes(face.id);
        const Box = interactive ? TouchableOpacity : View;

        return (
          <Box
            key={face.id}
            style={[
              styles.faceBox,
              styles[variant],
              isDisabled && styles.faceDisabled,
            ]}
            onPress={
              interactive && !isDisabled
                ? () => onFacePress(face)
                : undefined
            }
            disabled={isDisabled}
          >
            <Image
              source={face.img}
              style={[
                styles.faceImg,
                styles[`${variant}Img`],
              ]}
              resizeMode="contain"
            />
          </Box>
        );
      })}
    </View>
  );
};

export default FiguresGrid;

const styles = StyleSheet.create({
  grid: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  /* ----- BASE ----- */
  faceBox: {
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  faceImg: {
    resizeMode: "contain",
  },

  faceDisabled: {
    opacity: 0.3,
  },

  /* ===== MANUAL MODE (igual que antes) ===== */
  manual: {
    width: "40%",
    height: 120,
    margin: "5%",
    borderWidth: 2,
    borderColor: "transparent",
  },

  manualImg: {
    width: "65%",
    height: "65%",
  },

  /* ===== COMPACT / VIRTUAL ===== */
  compact: {
    width: "40%",
    aspectRatio: 1,
    margin: "2%",
  },

  compactImg: {
    width: "80%",
    height: "80%",
  },
});

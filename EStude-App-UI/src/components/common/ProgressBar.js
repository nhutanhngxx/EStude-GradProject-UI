import { StyleSheet, View } from "react-native";

const ProgressBar = ({ value }) => {
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressFill, { width: `${width}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  progressWrap: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#00cc66" },
});

export default ProgressBar;

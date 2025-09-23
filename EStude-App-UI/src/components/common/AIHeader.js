import React, { useContext } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import bannerAiLight from "../../assets/images/banner-ai-light.png";

export default function AIHeader() {
  const { user } = useContext(AuthContext);

  const avatarUri = user?.avatarPath
    ? { uri: user.avatarPath }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user?.fullName || user?.username || "Unknown"
        )}&background=random&size=128`,
      };

  return (
    <View style={styles.header}>
      <View>
        <Image source={bannerAiLight} style={styles.banner} />
        <Text style={styles.subtitle}>Xin chào, {user?.fullName} 👋</Text>
      </View>
      <Image source={avatarUri} style={styles.avatar} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  subtitle: { fontSize: 15, color: "#555" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  banner: {
    width: 200,
    height: 60,
    resizeMode: "contain",
    marginBottom: 4,
    alignSelf: "flex-start",
    marginLeft: -20,
  },
});

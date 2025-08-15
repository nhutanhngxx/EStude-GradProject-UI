import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

const RoleSelectionScreen = () => {
  const navigation = useNavigation();

  const handleSelectRole = (role) => {
    navigation.navigate("Login", { role });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require("../assets/images/background-01.png")}
        style={styles.backgroundImage}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "space-between", paddingTop: 100, paddingBottom: 30 }}>
          <Image
            source={require("../assets/images/banner-light.png")}
            style={styles.logo}
          />
          <View style={styles.buttonContainer}>
            <Image
              source={require("../assets/images/who-are-you.png")}
              style={{
                height: 80,
                resizeMode: "contain",
              }}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSelectRole("student")}
            >
              <Text style={styles.buttonText}>Học sinh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSelectRole("teacher")}
            >
              <Text style={styles.buttonText}>Giáo viên</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSelectRole("parent")}
            >
              <Text style={styles.buttonText}>Phụ huynh</Text>
            </TouchableOpacity>
          </View>
          <View>
            <Text style={styles.footerText}>
              Những câu hỏi thường gặp
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default RoleSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "80%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  logo: {
    width: "100%",
    height: 100,
    resizeMode: "contain",
  },
  footerText: {
    fontSize: 16,
    color: "white",
    textAlign: "center"
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});

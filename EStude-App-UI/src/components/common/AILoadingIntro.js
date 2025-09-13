import React, { useEffect, useRef, useState } from "react";
import { View, Animated, StyleSheet, Image, Text } from "react-native";

import AI_PNG from "../../assets/logo/ai-01.png";
import ESTUDE_PNG from "../../assets/logo/ai-02.png";

const AILoadingIntro = ({ onFinish }) => {
  const aiOpacity = useRef(new Animated.Value(0)).current;
  const aiScale = useRef(new Animated.Value(0.5)).current;
  const aiTranslateX = useRef(new Animated.Value(0)).current;

  const estudeOpacity = useRef(new Animated.Value(0)).current;
  const estudeScale = useRef(new Animated.Value(0.8)).current;
  const estudeTranslateY = useRef(new Animated.Value(30)).current;

  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4); // 0 → 1 → 2 → 3 → 0
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(aiOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(aiScale, {
          toValue: 1.2,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),

      Animated.spring(aiScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),

      Animated.timing(aiTranslateX, {
        toValue: -100,
        duration: 600,
        useNativeDriver: true,
      }),

      Animated.parallel([
        Animated.timing(estudeOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(estudeScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(estudeTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => onFinish?.(), 2000);
    });
  }, []);

  return (
    <View style={styles.overlay}>
      <Animated.Image
        source={AI_PNG}
        style={[
          styles.aiWrapper,
          {
            opacity: aiOpacity,
            transform: [{ translateX: aiTranslateX }, { scale: aiScale }],
            width: 130,
            height: 130,
          },
        ]}
        resizeMode="contain"
      />
      <Animated.Image
        source={ESTUDE_PNG}
        style={{
          opacity: estudeOpacity,
          transform: [
            { scale: estudeScale },
            { translateY: estudeTranslateY },
            { translateX: 40 },
          ],
          position: "absolute",
          width: 210,
          height: 130,
        }}
        resizeMode="contain"
      />
      <Text style={styles.loadingText}>
        AI của EStude đang khởi tạo{".".repeat(dotCount)}
      </Text>
    </View>
  );
};

export default AILoadingIntro;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  aiWrapper: {
    position: "absolute",
    width: 100,
    height: 100,
    shadowColor: "#00cc66",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  loadingText: {
    position: "absolute",
    top: 220, // dưới logo, chỉnh tuỳ ý
    color: "#007f3f",
    fontSize: 16,
    fontWeight: "600",
  },
});

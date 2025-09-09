import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  Animated,
  Text,
  View,
  Platform,
  Pressable,
  PanResponder,
} from "react-native";
import { setShowToast as registerShowToast } from "../services/toastService";

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    message: "",
    visible: false,
    type: "default",
  });
  const timerRef = useRef(null);
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    registerShowToast(showToast);
    return () => {
      registerShowToast(undefined);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const animateIn = () => {
    translateY.setValue(-20);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (cb) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -30,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast((s) => ({ ...s, visible: false }));
      if (cb) cb();
    });
  };

  function showToast(messageOrOpts, opts = {}) {
    const payload =
      typeof messageOrOpts === "string"
        ? { message: messageOrOpts, ...(opts || {}) }
        : { ...(messageOrOpts || {}) };

    const { message = "", duration = 2000, type = "default" } = payload;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast({ message, visible: true, type });
    animateIn();

    timerRef.current = setTimeout(() => {
      animateOut();
      timerRef.current = null;
    }, duration);
  }

  function hideToast() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    animateOut();
  }

  // PanResponder để hỗ trợ vuốt tắt
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < -10) {
          // Vuốt lên
          hideToast();
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const backgroundColor = (() => {
    switch (toast.type) {
      case "success":
        return "#2ecc71";
      case "error":
        return "#e74c3c";
      case "warning":
        return "#f39c12";
      case "info":
        return "#3498db";
      case "primary":
        return "#007bff";
      case "secondary":
        return "#6c757d";
      default:
        return "#333";
    }
  })();

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          {...panResponder.panHandlers}
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: Platform.OS === "ios" ? 60 : 40,
            alignItems: "center",
            zIndex: 9999,
            transform: [{ translateY }],
            opacity,
          }}
        >
          <Pressable onPress={hideToast}>
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor,
                maxWidth: "95%",
                elevation: 6,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Text style={{ color: "#fff" }}>{toast.message}</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

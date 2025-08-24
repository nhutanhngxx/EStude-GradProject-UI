import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import HomeStudentScreen from "../screens/HomeScreen";
import AttendanceScreen from "../screens/Attendances/AttendanceScreen";
import AILearningScreen from "../screens/AILearningScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeStudentScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
          tabBarLabel: "Trang Chủ",
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="hand-rock-o" color={color} size={size} />
          ),
          tabBarLabel: "Điểm Danh",
        }}
      />
      <Tab.Screen
        name="AILearning"
        component={AILearningScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="laptop" color={color} size={size} />
          ),
          tabBarLabel: "Công cụ AI",
        }}
      />
      <Tab.Screen
        name="Notification"
        component={NotificationScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bell" color={color} size={size} />
          ),
          tabBarLabel: "Thông Báo",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
          tabBarLabel: "Hồ Sơ",
        }}
      />
    </Tab.Navigator>
  );
}

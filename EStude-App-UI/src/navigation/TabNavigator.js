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

const ACTIVE_COLOR = "#00994d";
const INACTIVE_COLOR = "#888";

function TabIcon({ iconName, label, focused }) {
  return (
    <View
      style={{
        borderTopWidth: focused ? 3 : 0, // chỉ hiển thị khi active
        borderTopColor: ACTIVE_COLOR,
        paddingTop: 6,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FontAwesome
        name={iconName}
        size={20}
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
      />
      <Text
        style={{
          fontSize: 12,
          color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 80 },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStudentScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" label="Trang Chủ" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="hand-rock-o"
              label="Điểm Danh"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AILearning"
        component={AILearningScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="laptop" label="Dự đoán AI" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notification"
        component={NotificationScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="bell" label="Thông Báo" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="user" label="Hồ Sơ" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

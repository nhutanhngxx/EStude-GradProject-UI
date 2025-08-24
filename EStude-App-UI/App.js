import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import LoginScreen from "./src/screens/LoginScreen";
import TabNavigator from "./src/navigation/TabNavigator";

import SettingsScreen from "./src/screens/SettingsScreen";
import FullChucNangScreen from "./src/screens/FullChucNangScreen";
import NopBaiScreen from "./src/screens/Assignment/NopBaiScreen";
import ChiTietBaiTapScreen from "./src/screens/Assignment/ChiTietBaiTapScreen";

import ScheduleListScreen from "./src/screens/Schedules/ScheduleListScreen";

import SubjectListScreen from "./src/screens/Subjects/SubjectListScreen";
import SubjectDetailScreen from "./src/screens/Subjects/SubjectDetailScreen";

import ExamDetailScreen from "./src/screens/Assignment/ExamDetailScreen";
import ExamDoingScreen from "./src/screens/Assignment/ExamDoingScreen";

import AttendanceDetailScreen from "./src/screens/Attendances/AttendanceDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: "Cài đặt",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="FullChucNang"
          component={FullChucNangScreen}
          options={{
            title: "Tất cả chức năng",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        {/* <Stack.Screen name="ScheduleDetail" component={ScheduleScreen} /> */}
        <Stack.Screen
          name="NopBai"
          component={NopBaiScreen}
          options={{
            title: "Nộp bài",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="ChiTietBaiTap"
          component={ChiTietBaiTapScreen}
          options={{
            title: "Chi tiết bài tập",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="SubjectList"
          component={SubjectListScreen}
          options={{
            title: "Danh sách môn học",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="SubjectDetail"
          component={SubjectDetailScreen}
          options={{
            title: "Chi tiết môn học",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="ExamDetail"
          component={ExamDetailScreen}
          options={{
            title: "Chi tiết bài thi",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="ExamDoing"
          component={ExamDoingScreen}
          options={{
            title: "Đang thi",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="ScheduleList"
          component={ScheduleListScreen}
          options={{
            title: "Lịch học",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
        <Stack.Screen
          name="AttendanceDetail"
          component={AttendanceDetailScreen}
          options={{
            title: "Chi tiết điểm danh",
            headerTitleAlign: "center",
            headerBackTitle: "Trở lại",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

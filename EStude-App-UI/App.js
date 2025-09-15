import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext, AuthProvider } from "./src/contexts/AuthContext";
import { ToastProvider } from "./src/contexts/ToastContext";

import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import LoginScreen from "./src/screens/LoginScreen";
import TabNavigator from "./src/navigation/TabNavigator";

import SettingsScreen from "./src/screens/SettingsScreen";
import FullChucNangScreen from "./src/screens/FullChucNangScreen";
import AssignmentListScreen from "./src/screens/Assignment/AssignmentListScreen";
import AssignmentDetailScreen from "./src/screens/Assignment/AssignmentDetailScreen";

import ScheduleListScreen from "./src/screens/Schedules/ScheduleListScreen";

import SubjectListScreen from "./src/screens/Subjects/SubjectListScreen";
import SubjectDetailScreen from "./src/screens/Subjects/SubjectDetailScreen";

import AssignmentDoingScreen from "./src/screens/Assignment/AssignmentDoingScreen";

import AttendanceDetailScreen from "./src/screens/Attendances/AttendanceDetailScreen";
import ForgotPasswordScreen from "./src/screens/Auth/ForgotPasswordScreen";
import AssignmentReviewScreen from "./src/screens/Assignment/AssignmentReviewScreen";
import DetailStudyScreen from "./src/screens/DetailStudyScreen";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: "Cài đặt",
              headerTitleAlign: "center",
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="FullChucNang"
            component={FullChucNangScreen}
            options={{ title: "Tất cả chức năng", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="NopBai"
            component={AssignmentListScreen}
            options={{ title: "Bài tập", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="ChiTietBaiTap"
            component={AssignmentDetailScreen}
            options={{ title: "Chi tiết bài tập", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="SubjectList"
            component={SubjectListScreen}
            options={{ title: "Danh sách môn học", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="SubjectDetail"
            component={SubjectDetailScreen}
            options={{ title: "Chi tiết môn học", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="ExamDoing"
            component={AssignmentDoingScreen}
            options={{
              title: "Đang làm",
              headerTitleAlign: "center",
              headerBackTitle: "",
              // headerStyle: {
              //   backgroundColor: "#2e7d32",
              // },
              // headerTintColor: "#fff",
              // headerTitleStyle: {
              //   fontWeight: "700",
              // },
            }}
          />

          <Stack.Screen
            name="ScheduleList"
            component={ScheduleListScreen}
            options={{ title: "Lịch học", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="AttendanceDetail"
            component={AttendanceDetailScreen}
            options={{
              title: "Chi tiết điểm danh",
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="ExamReview"
            component={AssignmentReviewScreen}
            options={{ title: "Xem lại bài làm", headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="DetailStudy"
            component={DetailStudyScreen}
            options={{ title: "Tổng quan học tập", headerTitleAlign: "center" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </NavigationContainer>
    </AuthProvider>
  );
}

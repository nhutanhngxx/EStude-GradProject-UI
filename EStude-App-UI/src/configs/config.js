import Constants from "expo-constants";
import * as Network from "expo-network";

// Lấy IP của thiết bị đang chạy App (điện thoại)
const getDeviceIPv4 = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (networkState?.type === Network.NetworkStateType.WIFI) {
      return await Network.getIpAddressAsync();
    }
    return null;
  } catch (error) {
    console.log("Error getting device IP:", error);
    return null;
  }
};

// Lấy IP của máy tính host đang chạy Metro Bundler
const getHostIP = () => {
  try {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      return debuggerHost.split(":")[0];
    }
    return null;
  } catch (error) {
    console.log("Error getting host IP:", error);
    return null;
  }
};

const getBaseUrl = () => {
  const DEFAULT_IP = "192.168.100.210";
  // const DEFAULT_IP = "estude-backend-spring.fly.dev";
  const PORT = 8080;

  const hostIP = getHostIP();
  return `http://${hostIP || DEFAULT_IP}:${PORT}`;
  // return `https://${DEFAULT_IP}`;
};

// Xuất config
const config = {
  BASE_URL: getBaseUrl(),
};

// console.log("BASE_URL:", config.BASE_URL);

export default config;
export { getDeviceIPv4, getHostIP, getBaseUrl };

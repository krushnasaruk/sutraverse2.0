import Constants from 'expo-constants';

const getDevBaseUrl = () => {
  // Get host IP running the expo start dev server
  const debuggerHost = Constants.expoConfig?.hostUri || '';
  const localIp = debuggerHost.split(':')[0];
  if (localIp) {
    return `http://${localIp}:3000`;
  }
  return 'http://localhost:3000';
};

export const BASE_URL = __DEV__ ? getDevBaseUrl() : 'https://sutraverse.co.in';

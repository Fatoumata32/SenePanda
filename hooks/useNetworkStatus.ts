import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
    isWifi: false,
    isCellular: false,
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? true;
      const isInternetReachable = state.isInternetReachable;

      // Track if we were offline
      if (!isConnected) {
        setWasOffline(true);
      }

      setNetworkStatus({
        isConnected,
        isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      });
    });

    // Initial fetch
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      });
    });

    return () => unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.refresh();
    setNetworkStatus({
      isConnected: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
    });
    return state.isConnected ?? true;
  }, []);

  // Reset wasOffline when back online
  useEffect(() => {
    if (networkStatus.isConnected && wasOffline) {
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [networkStatus.isConnected, wasOffline]);

  return {
    ...networkStatus,
    wasOffline,
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable !== false,
    refresh,
  };
}

export default useNetworkStatus;

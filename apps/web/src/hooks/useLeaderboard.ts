import { useState, useCallback } from 'react';
import { rpc } from '../lib/rpc';

export function useLeaderboard() {
  const [globalData, setGlobalData] = useState<any[]>([]);
  const [modeData, setModeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGlobal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rpc.api.leaderboard.global.$get();
      if (res.ok) {
        const data = await res.json();
        setGlobalData(data);
      }
    } catch {
      // Handle error implicitly
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMode = useCallback(async (modeId: string) => {
    setLoading(true);
    try {
      const res = await rpc.api.leaderboard.mode[':modeId'].$get({ param: { modeId } });
      if (res.ok) {
        const data = await res.json();
        setModeData(data);
      }
    } catch {
      // Handle error implicitly
    } finally {
      setLoading(false);
    }
  }, []);

  return { globalData, modeData, fetchGlobal, fetchMode, loading };
}

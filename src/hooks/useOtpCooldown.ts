import { useEffect, useState } from 'react';
import { getOtpCooldownRemainingMs } from '../utils/otpCooldown';

export function useOtpCooldown(phoneNumber: string, melliCode: string): number {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const ms = await getOtpCooldownRemainingMs(phoneNumber, melliCode);
      if (!cancelled) {
        setRemainingSec(Math.ceil(ms / 1000));
      }
    };

    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phoneNumber, melliCode]);

  return remainingSec;
}

import { useEffect, useState } from 'react';
import { getDeviceProfile, saveDeviceProfile, type DeviceProfile } from '@/hooks/useDevice';

interface ProfileShape {
  name: string | null;
  phone_number: string | null;
}

/**
 * Device-bound customer profile (no auth needed).
 * Stored locally so name + phone are auto-filled on every visit from the same device.
 */
export function useProfile() {
  const [profile, setProfile] = useState<ProfileShape | null>(() => {
    const p = getDeviceProfile();
    return p ? { name: p.name, phone_number: p.phone } : null;
  });
  const [isLoading] = useState(false);

  useEffect(() => {
    const onCustom = () => {
      const p = getDeviceProfile();
      setProfile(p ? { name: p.name, phone_number: p.phone } : null);
    };
    window.addEventListener('dh-device-profile-changed', onCustom);
    return () => window.removeEventListener('dh-device-profile-changed', onCustom);
  }, []);

  const upsertProfile = async (name: string, phoneNumber: string) => {
    const next: DeviceProfile = { name, phone: phoneNumber };
    saveDeviceProfile(next);
    setProfile({ name, phone_number: phoneNumber });
    window.dispatchEvent(new Event('dh-device-profile-changed'));
  };

  const fetchProfile = async () => {
    const p = getDeviceProfile();
    setProfile(p ? { name: p.name, phone_number: p.phone } : null);
  };

  return { profile, isLoading, upsertProfile, fetchProfile };
}

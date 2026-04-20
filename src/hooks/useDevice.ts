// Device-bound guest identity & profile (no auth needed).
// Each phone/laptop gets a stable device_id. Customer name/phone stored locally
// so they're auto-filled on every visit from the same device.

const DEVICE_ID_KEY = 'dh_device_id';
const DEVICE_PROFILE_KEY = 'dh_device_profile_v1';

export interface DeviceProfile {
  name: string;
  phone: string;
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

export function getDeviceProfile(): DeviceProfile | null {
  try {
    const raw = localStorage.getItem(DEVICE_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as DeviceProfile) : null;
  } catch {
    return null;
  }
}

export function saveDeviceProfile(profile: DeviceProfile) {
  try {
    localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function useDevice() {
  return {
    deviceId: getDeviceId(),
    profile: getDeviceProfile(),
    saveProfile: saveDeviceProfile,
  };
}

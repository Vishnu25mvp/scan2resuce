import * as Location from 'expo-location';
import { Linking } from 'react-native';

import { api } from '@/api/client';

const NATIONAL_EMERGENCY_LINE = {
  number: '112',
  service: 'India national emergency service',
};

function normalizeRegion(region: string) {
  return region.toLocaleLowerCase('en-IN').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function resolveEmergencyHelpline(region?: string | null) {
  const normalized = region ? normalizeRegion(region) : '';
  if (normalized.includes('tamil nadu')) {
    return { number: '108', service: 'Tamil Nadu ambulance service' };
  }
  return NATIONAL_EMERGENCY_LINE;
}

export async function callAndLogEmergencyHelpline(qrId: string, callerMode: 'owner' | 'bystander', token?: string) {
  let latitude: number | undefined;
  let longitude: number | undefined;
  let region = '';

  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.granted) {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      region = address[0]?.region || '';
    }
  } catch {
    region = '';
  }

  const helpline = resolveEmergencyHelpline(region);
  const logResult = api.createAlert({
    qrId,
    latitude,
    longitude,
    type: 'state_helpline',
    emergencyNumber: helpline.number,
    emergencyRegion: region || 'Location unavailable',
    callerMode,
  }, token).then(() => true).catch(() => false);

  let dialerOpened = false;
  try {
    await Linking.openURL(`tel:${helpline.number}`);
    dialerOpened = true;
  } catch {
    dialerOpened = false;
  }

  let reportRecorded: boolean | null;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timedResult = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), 1800);
  });
  reportRecorded = await Promise.race([logResult, timedResult]);
  if (timeoutId) clearTimeout(timeoutId);

  return { ...helpline, region, latitude, longitude, dialerOpened, reportRecorded };
}
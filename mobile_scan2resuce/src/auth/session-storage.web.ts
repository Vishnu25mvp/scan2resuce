let sessionValue: string | null = null;

export async function readSession() {
  return sessionValue;
}

export async function writeSession(value: string) {
  sessionValue = value;
}

export async function clearSession() {
  sessionValue = null;
}
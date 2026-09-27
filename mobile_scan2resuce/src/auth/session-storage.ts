import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'scan2rescue.session';

export const readSession = () => SecureStore.getItemAsync(SESSION_KEY);
export const writeSession = (value: string) => SecureStore.setItemAsync(SESSION_KEY, value);
export const clearSession = () => SecureStore.deleteItemAsync(SESSION_KEY);
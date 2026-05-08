// Test setup — mocks for React Native modules
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', textDirection: 'ltr' }],
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

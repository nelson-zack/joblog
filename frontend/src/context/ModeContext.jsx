import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { MODES } from '../storage/selectStore';

const STORAGE_KEY = 'joblog_mode_preference_v1';

const ModeContext = createContext({
  mode: MODES.DEMO,
  apiKey: null,
  hasAdmin: false,
  needsOnboarding: false,
  setMode: () => {},
  resetPreference: () => {}
});

const readStoredMode = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    if ([MODES.DEMO, MODES.LOCAL].includes(stored)) {
      return stored;
    }
    return null;
  } catch (error) {
    console.warn('Unable to read stored mode preference:', error);
    return null;
  }
};

const writeStoredMode = (mode) => {
  if (typeof window === 'undefined') return;
  try {
    if (!mode) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  } catch (error) {
    console.warn('Unable to persist mode preference:', error);
  }
};

export const ModeProvider = ({ children }) => {
  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const apiKey = params.get('key');
  const hasAdmin = Boolean(apiKey);

  const storedMode = useMemo(() => (!hasAdmin ? readStoredMode() : null), [
    hasAdmin
  ]);

  const [mode, setModeState] = useState(() => {
    if (hasAdmin) return MODES.ADMIN;
    return storedMode ?? MODES.DEMO;
  });

  const [needsOnboarding, setNeedsOnboarding] = useState(
    !hasAdmin && !storedMode
  );

  useEffect(() => {
    if (hasAdmin) {
      setModeState(MODES.ADMIN);
      setNeedsOnboarding(false);
    }
  }, [hasAdmin]);

  const setMode = useCallback(
    (nextMode) => {
      if (hasAdmin) {
        console.warn('Cannot override admin mode while API key is present.');
        return;
      }
      if (![MODES.DEMO, MODES.LOCAL].includes(nextMode)) {
        console.warn('Unsupported mode preference:', nextMode);
        return;
      }
      setModeState(nextMode);
      writeStoredMode(nextMode);
      setNeedsOnboarding(false);
    },
    [hasAdmin]
  );

  const resetPreference = useCallback(() => {
    if (hasAdmin) return;
    writeStoredMode(null);
    setNeedsOnboarding(true);
  }, [hasAdmin]);

  const value = useMemo(
    () => ({
      mode,
      apiKey,
      hasAdmin,
      needsOnboarding,
      setMode,
      resetPreference
    }),
    [apiKey, hasAdmin, mode, needsOnboarding, resetPreference, setMode]
  );

  return (
    <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
  );
};

export const useMode = () => useContext(ModeContext);

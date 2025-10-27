"use client";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ModelProvider } from '@/types/quiz';

export interface LLMSettings {
  provider: ModelProvider;
  perplexityKey?: string;
  azureKey?: string;
  hasChosen: boolean;
}

interface LLMSettingsContextValue {
  settings: LLMSettings;
  setSettings: (value: { provider: ModelProvider; perplexityKey?: string; azureKey?: string }) => void;
  isConfigured: boolean;
}

const defaultSettings: LLMSettings = { provider: 'perplexity', hasChosen: false };

const LLMSettingsContext = createContext<LLMSettingsContextValue>({
  settings: defaultSettings,
  setSettings: () => {},
  isConfigured: false,
});

const STORAGE_KEY = 'quizzaroo-llm-settings';

function loadSettings(): LLMSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as LLMSettings;
    if (!parsed?.provider) return defaultSettings;
    return { ...parsed, hasChosen: true };
  } catch {
    return defaultSettings;
  }
}

export function LLMSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<LLMSettings>(defaultSettings);

  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  const setSettings = (next: { provider: ModelProvider; perplexityKey?: string; azureKey?: string }) => {
    const { hasChosen: _ignore, ...restDefaults } = defaultSettings;
    const payload: LLMSettings = { ...restDefaults, ...next, hasChosen: true };
    setSettingsState(payload);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  };

  const isConfigured = useMemo(() => {
    if (!settings.hasChosen) return false;
    if (settings.provider === 'azure') return Boolean(settings.azureKey);
    return Boolean(settings.perplexityKey);
  }, [settings]);

  const value = useMemo<LLMSettingsContextValue>(() => ({ settings, setSettings, isConfigured }), [settings, isConfigured]);

  return <LLMSettingsContext.Provider value={value}>{children}</LLMSettingsContext.Provider>;
}

export function useLLMSettings() {
  return useContext(LLMSettingsContext);
}

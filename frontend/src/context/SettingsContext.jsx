import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingService } from '../services/api';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    restaurantName: 'BiteFlow Restaurant & Cafe',
    tagline: 'Artisan Eats & Fine Sips',
    address: '123 Gourmet Street, Downtown',
    phone: '+1 (555) 019-2834',
    email: 'info@biteflowpos.local',
    currencySymbol: '$',
    taxRate: 5.0,
    enableTax: true,
    receiptFooter: 'Thank you for dining with us! Please come again.',
    defaultLowStockAlert: 10,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await settingService.get();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.warn('Could not load remote settings, using defaults:', err.message);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    const sym = settings.currencySymbol || '$';
    return `${sym}${num.toFixed(2)}`;
  };

  const updateSettings = async (newData) => {
    const res = await settingService.update(newData);
    setSettings(res.data);
    return res.data;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        formatCurrency,
        updateSettings,
        refreshSettings: fetchSettings,
        loadingSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

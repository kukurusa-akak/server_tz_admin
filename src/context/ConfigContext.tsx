import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getServerConfig, type ServerConfig } from '../lib/api';

type ConfigContextType = {
  config: ServerConfig | null;
  isLoading: boolean;
};

const ConfigContext = createContext<ConfigContextType>({ config: null, isLoading: true });

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const serverConfig = await getServerConfig();
        setConfig(serverConfig);
      } catch (error) {
        console.error("Failed to fetch server config:", error);
        // Set a default config on failure to prevent app crash
        setConfig({ fileUploadEnabled: false, provider: 'disabled' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

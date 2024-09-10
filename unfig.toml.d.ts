import unfig from './unfig.toml';

const unfig: {
  smtp: {
    port: number;
    listen: string;
    hostname: string | undefined;
    enableAuth: boolean;
    enableStartTLS: boolean;
  };
  tls: {
    enableStartTLS: boolean;
    key: string;
    cert: string;
  };
};

export default config;

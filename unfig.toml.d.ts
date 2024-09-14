import unfig from './unfig.toml';

const unfig: {
  smtp: {
    port: number;
    listen: string;
    hostname: string | undefined;
  };
  auth: {
    enable: boolean;
    requireTLS: boolean;
  };
  tls: {
    enableStartTLS: boolean;
    key: string;
    cert: string;
  };
};

export default config;

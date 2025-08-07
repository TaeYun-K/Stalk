declare global {
  interface Window {
    TossPayments: any;
  }
}

interface ImportMetaEnv {
  readonly VITE_TOSS_CLIENT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};

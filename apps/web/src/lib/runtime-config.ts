export type RuntimeDemoAccount = {
  email?: string;
  password?: string;
};

declare global {
  interface Window {
    __CAMPUSBOOK_CONFIG__?: {
      apiBaseUrl?: string;
      demoCredentials?: {
        student?: RuntimeDemoAccount;
        admin?: RuntimeDemoAccount;
      };
    };
  }
}

function getRuntimeConfig() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__CAMPUSBOOK_CONFIG__;
}

export function getRuntimeApiBaseUrl() {
  return getRuntimeConfig()?.apiBaseUrl?.trim();
}

export function getRuntimeDemoAccount(role: "student" | "admin") {
  const account = getRuntimeConfig()?.demoCredentials?.[role];
  const email = account?.email?.trim();
  const password = account?.password?.trim();

  if (!email || !password) {
    return undefined;
  }

  return {
    email,
    password
  };
}

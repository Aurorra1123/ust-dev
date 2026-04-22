export type RuntimeDemoAccount = {
  email?: string;
};

declare global {
  interface Window {
    __CAMPUSBOOK_CONFIG__?: {
      apiBaseUrl?: string;
      demoAccounts?: {
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
  const apiBaseUrl = getRuntimeConfig()?.apiBaseUrl?.trim();

  if (!apiBaseUrl) {
    return undefined;
  }

  return apiBaseUrl;
}

export function getRuntimeDemoEmail(role: "student" | "admin") {
  const email = getRuntimeConfig()?.demoAccounts?.[role]?.email?.trim();

  if (!email) {
    return undefined;
  }

  return email;
}

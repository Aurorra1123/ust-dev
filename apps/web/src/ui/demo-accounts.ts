export type DemoAccount = {
  email: string;
  password: string;
};

export const studentDemoAccount: DemoAccount = {
  email: "demo@campusbook.top",
  password: "demo123456"
};

export const teacherDemoAccount: DemoAccount = {
  email: "admin@campusbook.top",
  password: "admin123456"
};

export const quickRoleEntries = [
  {
    role: "student",
    labelZh: "学生入口",
    labelEn: "Student Access",
    hintZh: "点击后带入学生 demo 账号",
    hintEn: "Fill the student demo account",
    account: studentDemoAccount
  },
  {
    role: "teacher",
    labelZh: "教师入口",
    labelEn: "Teacher Access",
    hintZh: "点击后带入管理员 demo 账号",
    hintEn: "Fill the admin demo account",
    account: teacherDemoAccount
  }
] as const;

export type QuickRole = (typeof quickRoleEntries)[number]["role"];

export function resolveDemoAccount(role: string | null | undefined) {
  if (role === "teacher") {
    return teacherDemoAccount;
  }

  if (role === "student") {
    return studentDemoAccount;
  }

  return null;
}

export function buildDemoLoginPath(role: QuickRole, redirectTo?: string) {
  const searchParams = new URLSearchParams({ role });

  if (redirectTo) {
    searchParams.set("redirect", redirectTo);
  }

  return `/login?${searchParams.toString()}`;
}

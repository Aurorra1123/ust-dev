import { getRuntimeDemoEmail } from "../lib/runtime-config";

export type DemoAccount = {
  email: string;
};

const defaultStudentDemoAccount: DemoAccount = {
  email: "demo@campusbook.top"
};

const defaultTeacherDemoAccount: DemoAccount = {
  email: "admin@campusbook.top"
};

export const studentDemoAccount: DemoAccount = {
  email: getRuntimeDemoEmail("student") ?? defaultStudentDemoAccount.email
};

export const teacherDemoAccount: DemoAccount = {
  email: getRuntimeDemoEmail("admin") ?? defaultTeacherDemoAccount.email
};

export const quickRoleEntries = [
  {
    role: "student",
    labelZh: "学生入口",
    labelEn: "Student Access",
    hintZh: "点击后带入学生演示邮箱",
    hintEn: "Fill the student demo email",
    account: studentDemoAccount
  },
  {
    role: "teacher",
    labelZh: "教师入口",
    labelEn: "Teacher Access",
    hintZh: "点击后带入管理员演示邮箱",
    hintEn: "Fill the admin demo email",
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

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { login } from "../../lib/api/auth-api";
import { ApiError } from "../../lib/http/errors";
import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import {
  quickRoleEntries,
  resolveDemoAccount,
  studentDemoAccount
} from "../demo-accounts";

type LoginFormState = {
  email: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locale = useLocaleStore((state) => state.locale);
  const redirectTo = useMemo(() => searchParams.get("redirect"), [searchParams]);
  const quickRole = useMemo(() => searchParams.get("role"), [searchParams]);
  const [form, setForm] = useState<LoginFormState>(
    () => resolveDemoAccount(quickRole) ?? studentDemoAccount
  );

  useEffect(() => {
    const quickAccount = resolveDemoAccount(quickRole);

    if (quickAccount) {
      setForm(quickAccount);
    }
  }, [quickRole]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      navigate(redirectTo || (session.user.role === "admin" ? "/admin" : "/"));
    }
  });

  return (
    <section className="overflow-hidden rounded-[32px] border border-navy/10 bg-white shadow-panel">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr),420px]">
        <div className="bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            {localeText(locale, "系统入口", "Portal")}
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-[3.2rem]">
            {localeText(locale, "CampusBook 智约校园", "CampusBook")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
            {localeText(
              locale,
              "校园预约平台统一入口。登录后可进入首页，选择体育、学术或活动资源并完成预约。",
              "Unified entrance of the campus booking platform. Sign in to choose sports, study, or activity resources."
            )}
          </p>
        </div>

        <div className="bg-[linear-gradient(180deg,#f7f8fb_0%,#ffffff_100%)] px-6 py-8 sm:px-8">
          <p className="text-xs uppercase tracking-[0.28em] text-moss">
            {localeText(locale, "登录注册区", "Sign In")}
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-ink">
            {localeText(locale, "进入系统", "Access")}
          </h3>

          <div className="mt-6 grid gap-3">
            <p className="text-sm font-medium text-ink">
              {localeText(locale, "快捷身份带入", "Quick Role Access")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickRoleEntries.map((entry) => {
                const isActive =
                  form.email === entry.account.email && form.password === entry.account.password;

                return (
                  <button
                    key={entry.role}
                    type="button"
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-ember bg-ember/10"
                        : "border-navy/10 bg-white hover:border-moss"
                    }`}
                    onClick={() => setForm(entry.account)}
                  >
                    <p className="text-sm font-semibold text-ink">
                      {localeText(locale, entry.labelZh, entry.labelEn)}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate">
                      {localeText(locale, entry.hintZh, entry.hintEn)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate(form);
            }}
          >
            <label className="grid gap-2 text-sm text-slate">
              {localeText(locale, "账号/邮箱", "Email")}
              <input
                className="rounded-2xl border border-navy/10 bg-white px-4 py-3 outline-none transition focus:border-moss"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm text-slate">
              {localeText(locale, "密码", "Password")}
              <input
                className="rounded-2xl border border-navy/10 bg-white px-4 py-3 outline-none transition focus:border-moss"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value
                  }))
                }
              />
            </label>

            {loginMutation.isError ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {(loginMutation.error as ApiError).message}
              </div>
            ) : null}

            <button
              type="submit"
              className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending
                ? localeText(locale, "登录中", "Signing In")
                : localeText(locale, "登录", "Sign In")}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-navy/10 bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-moss">
              {localeText(locale, "演示账号", "Demo Accounts")}
            </p>
            <p className="mt-2 text-sm text-slate">
              {localeText(
                locale,
                "上方可直接点击学生入口或教师入口完成账号带入。当前演示环境未开放注册。",
                "Use the student or teacher entry above to fill the demo credentials. Registration is not open in the demo environment."
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

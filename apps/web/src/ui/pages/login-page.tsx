import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError, login } from "../../lib/api";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

const defaultAccount = {
  label: "普通用户",
  email: "demo@campusbook.top",
  password: "demo123456"
};

const adminAccount = {
  label: "管理员",
  email: "admin@campusbook.top",
  password: "admin123456"
};

const demoAccounts = [defaultAccount, adminAccount];

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/",
    [searchParams]
  );
  const [form, setForm] = useState({
    email: defaultAccount.email,
    password: defaultAccount.password
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate(redirectTo);
    }
  });

  return (
    <>
      <PageHero
        eyebrow="Login"
        title="登录后即可体验预约、抢票与管理流程"
        description="当前站点使用演示账号驱动真实 API。登录成功后，访问令牌会自动写入前端会话，refresh token 通过 HttpOnly Cookie 保存。"
      />

      <PageSection title="选择演示身份">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),320px]">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate(form);
            }}
          >
            <label className="grid gap-2 text-sm text-ink/75">
              邮箱
              <input
                className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 outline-none transition focus:border-moss"
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
            <label className="grid gap-2 text-sm text-ink/75">
              密码
              <input
                className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 outline-none transition focus:border-moss"
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
              <div className="rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">
                {(loginMutation.error as ApiError).message}
              </div>
            ) : null}

            <button
              type="submit"
              className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "登录中" : "登录并进入站点"}
            </button>
          </form>

          <div className="rounded-[28px] bg-mist px-5 py-5">
            <p className="text-xs uppercase tracking-[0.3em] text-moss">
              Demo Accounts
            </p>
            <div className="mt-4 grid gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  className="rounded-2xl border border-white/70 bg-white px-4 py-4 text-left transition hover:border-moss"
                  onClick={() => setForm(account)}
                >
                  <p className="text-sm font-semibold text-ink">{account.label}</p>
                  <p className="mt-1 text-sm text-ink/70">{account.email}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-moss">
                    点击自动填充
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
}

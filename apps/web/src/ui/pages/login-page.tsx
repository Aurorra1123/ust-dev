import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError, login } from "../../lib/api";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import { GuidancePanel } from "../user-experience-kit";

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
  const redirectTo = useMemo(() => searchParams.get("redirect"), [searchParams]);
  const [form, setForm] = useState({
    email: defaultAccount.email,
    password: defaultAccount.password
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      navigate(redirectTo || (session.user.role === "admin" ? "/admin" : "/"));
    }
  });

  return (
    <>
      <PageHero
        eyebrow="Unified Access"
        title="从同一个身份入口进入学生端或管理员端"
        description="这里是 CampusBook 的统一身份入口。登录后可以直接进入学生服务或管理后台，不需要再切换不同站点。"
      />

      <PageSection
        title="选择身份并登录"
        description="建议先用学生示例账号体验预约和活动流程，再使用管理员示例账号查看后台工作台。"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),320px]">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate(form);
            }}
          >
            <label className="grid gap-2 text-sm text-slate">
              邮箱
              <input
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
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
              密码
              <input
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
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
              {loginMutation.isPending ? "登录中" : "登录并进入站点"}
            </button>

            <GuidancePanel
              title="登录提示"
              description="学生入口适合体验预约、抢票和订单流程；管理入口适合查看资源、活动和规则维护界面。"
            />
          </form>

          <div className="rounded-[28px] border border-navy/10 bg-gradient-to-br from-sand to-mist px-5 py-5">
            <p className="text-xs uppercase tracking-[0.3em] text-moss">
              示例账号
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
                  <p className="mt-1 text-sm text-slate">{account.email}</p>
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

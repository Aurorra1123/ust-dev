import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError, login } from "../../lib/api";
import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";

type LoginFormState = {
  email: string;
  password: string;
};

type DemoAccount = LoginFormState & {
  label: string;
  detail: string;
};

const defaultAccount: DemoAccount = {
  label: "普通用户",
  detail: "适合体验学生端首页、预约与订单流程",
  email: "demo@campusbook.top",
  password: "demo123456"
};

const adminAccount: DemoAccount = {
  label: "管理员",
  detail: "适合查看教师工作台与后台维护界面",
  email: "admin@campusbook.top",
  password: "admin123456"
};

const demoAccounts = [defaultAccount, adminAccount];

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locale = useLocaleStore((state) => state.locale);
  const redirectTo = useMemo(() => searchParams.get("redirect"), [searchParams]);
  const [form, setForm] = useState<LoginFormState>({
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
    <section className="overflow-hidden rounded-[34px] border border-navy/10 bg-white shadow-panel">
      <div className="grid lg:grid-cols-[minmax(0,1.2fr),420px]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,#002F6B_0%,#0D3F82_52%,#4B7E68_100%)] px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_62%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.34em] text-white/60">
              {localeText(locale, "统一入口", "Unified Access")}
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-[3.4rem]">
              {localeText(locale, "CampusBook 智约校园", "CampusBook Portal")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
              {localeText(
                locale,
                "左侧展示区承接系统名称、欢迎语和平台介绍；右侧登录区用于进入学生端或教师工作台。整个系统从这里开始进入资源浏览、预约提交和订单管理流程。",
                "The portal starts here. The left panel introduces the platform, while the right panel provides sign-in access to the student portal and teacher workspace."
              )}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ShowcaseCard
                title={localeText(locale, "校园预约服务", "Reservation Services")}
                description={localeText(
                  locale,
                  "覆盖体育、学术和活动三类核心资源，从首页进入后可直接浏览与预约。",
                  "Sports, study spaces, and activities stay available as the three primary service lines."
                )}
              />
              <ShowcaseCard
                title={localeText(locale, "订单状态管理", "Order Status")}
                description={localeText(
                  locale,
                  "完成预约后统一回到个人订单、状态详情和取消记录页面查看后续结果。",
                  "Bookings lead back into unified order status, detail, and cancellation history pages."
                )}
              />
            </div>

            <div className="mt-8 rounded-[26px] border border-white/18 bg-white/10 px-5 py-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                {localeText(locale, "欢迎语", "Welcome")}
              </p>
              <p className="mt-3 text-lg leading-8 text-white/92">
                {localeText(
                  locale,
                  "欢迎进入校园预约平台。登录后可查看资源、选择时段、提交预约，并在个人中心统一管理状态与历史记录。",
                  "Welcome to the campus reservation platform. Sign in to browse resources, choose time slots, submit bookings, and manage your records."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,#f7f8fb_0%,#ffffff_100%)] px-6 py-8 sm:px-8 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-moss">
            {localeText(locale, "登录注册区", "Sign In")}
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-ink">
            {localeText(locale, "进入系统", "Access the Portal")}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate">
            {localeText(
              locale,
              "请使用账号、邮箱和密码进入系统。注册入口在下方保留为清晰可见的独立区块。",
              "Use your account email and password to sign in. A visible registration entry is kept below as a separate block."
            )}
          </p>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate(form);
            }}
          >
            <label className="grid gap-2 text-sm text-slate">
              {localeText(locale, "账号邮箱", "Account Email")}
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
                : localeText(locale, "登录进入平台", "Sign In")}
            </button>
          </form>

          <div className="mt-6 rounded-[26px] border border-navy/10 bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-moss">
                  {localeText(locale, "注册入口", "Registration")}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate">
                  {localeText(
                    locale,
                    "演示环境暂未开放真实注册，注册申请由管理员统一开通。",
                    "Live self-registration is disabled in the demo environment. New accounts are provisioned by an administrator."
                  )}
                </p>
              </div>
              <Link
                to="/login"
                className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
              >
                {localeText(locale, "注册说明", "How to Register")}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                className="rounded-[24px] border border-navy/10 bg-white px-4 py-4 text-left transition hover:border-moss"
                onClick={() =>
                  setForm({
                    email: account.email,
                    password: account.password
                  })
                }
              >
                <p className="text-sm font-semibold text-ink">
                  {account.label === "普通用户"
                    ? localeText(locale, "普通用户", "Student")
                    : localeText(locale, "管理员", "Teacher/Admin")}
                </p>
                <p className="mt-1 text-sm text-slate">{account.email}</p>
                <p className="mt-2 text-sm text-ink/70">
                  {localeText(
                    locale,
                    account.detail,
                    account.label === "普通用户"
                      ? "Use this account to explore the student flow."
                      : "Use this account to open the teacher workspace."
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/18 bg-white/10 px-5 py-5 backdrop-blur">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-white/78">{description}</p>
    </div>
  );
}

# Web Demo Credentials Runtime Sync

## Date

- 2026-04-21

## Goal

- 确认网页端 demo 快捷填充使用的是运行时配置，而不是前端源码里写死的默认密码
- 确认真实站点 `web` 容器与 `api` 容器使用同一组 demo 账号凭据

## Scope

- `apps/web`
- `infra/docker-compose.yml`
- `infra/docker/40-write-runtime-config.sh`
- 线上 `infra-web-1`
- 线上 `infra-api-1`

## Root Cause

- 前端原先在 `apps/web/src/ui/demo-accounts.ts` 内写死旧 demo 密码
- `web` 容器最初重建时未显式传入 `--env-file .env`，导致 `infra/docker-compose.yml` 中的默认 demo 凭据被写入 `/config.js`
- 结果是网页端快捷填充密码与 API 实际接受的密码不一致

## Executed Commands

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
curl -ks https://127.0.0.1/ | rg -o '/assets/index-[^" ]+\\.js'
curl -ks https://127.0.0.1/config.js
docker exec infra-web-1 env | rg '^(DEMO_|CAMPUSBOOK_API_BASE_URL)'
docker exec infra-api-1 env | rg '^(DEMO_|NODE_ENV|DATABASE_URL)'
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web
docker exec infra-api-1 node -e 'fetch("http://127.0.0.1:3000/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:process.env.DEMO_USER_EMAIL,password:process.env.DEMO_USER_PASSWORD})}).then(async(r)=>console.log("student",r.status,JSON.stringify(await r.json())));fetch("http://127.0.0.1:3000/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:process.env.DEMO_ADMIN_EMAIL,password:process.env.DEMO_ADMIN_PASSWORD})}).then(async(r)=>console.log("admin",r.status,JSON.stringify(await r.json())));'
docker exec infra-api-1 node -e 'fetch("http://127.0.0.1:3000/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:process.env.DEMO_USER_EMAIL,password:"demo123456"})}).then(async(r)=>console.log("student-old",r.status,JSON.stringify(await r.json())));'
```

## Result

- 前端 demo 快捷填充已改为优先读取运行时 `window.__CAMPUSBOOK_CONFIG__.demoCredentials`
- 线上 `https://campusbook.top/config.js` 当前输出的 demo 凭据已与仓库根 `.env` 保持一致
- `infra-web-1` 与 `infra-api-1` 当前都注入了同一组 demo 账号环境变量
- API 使用当前 demo 账号登录时，学生与管理员请求都返回 `200`
- 旧默认学生密码 `demo123456` 登录返回 `401 invalid-credentials`，证明此前网页端快捷填充密码确实错误

## Notes

- 本轮没有使用浏览器自动化点击页面，但已完成源码、运行时配置、容器环境与 API 登录结果的四层交叉验证
- 后续若更换 demo 密码，只需更新根目录 `.env` 并按基线重建 `web`，无需再次改前端源码

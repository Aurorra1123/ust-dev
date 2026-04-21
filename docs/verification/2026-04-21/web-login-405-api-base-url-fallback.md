# Web Login 405 API Base URL Fallback

## Date

- 2026-04-21

## Goal

- 修复正式站点 `https://campusbook.top/login` 登录时报 `request failed 405` 的问题
- 确认前端在运行时 `apiBaseUrl` 为空字符串时，仍能正确回退到 `https://api.campusbook.top`

## Root Cause

- 前端原实现把运行时 `apiBaseUrl` 和 `VITE_API_BASE_URL` 用 `??` 直接串联
- 生产环境当前 `config.js` 中的 `apiBaseUrl` 是空字符串，根 `.env` 中的 `VITE_API_BASE_URL` 也是空字符串
- 空字符串不会被 `??` 视为缺省值，导致前端把空字符串当成有效 API 基址
- 最终登录请求被发成相对路径 `/auth/login`，落到前端站点 `campusbook.top`，由 Nginx 返回 `405`

## Executed Commands

```bash
curl -isk -X POST https://api.campusbook.top/auth/login -H 'content-type: application/json' --data '{"email":"demo@campusbook.top","password":"hr8x50NeonhIOufwsYL2"}'
curl -isk -X POST https://campusbook.top/auth/login -H 'content-type: application/json' --data '{"email":"demo@campusbook.top","password":"hr8x50NeonhIOufwsYL2"}'
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --no-deps web
curl -isk https://campusbook.top/
curl -isk https://campusbook.top/config.js
```

## Result

- 修复前：
  - `POST https://api.campusbook.top/auth/login` 返回 `200`
  - `POST https://campusbook.top/auth/login` 返回 `405`
- 修复后：
  - 前端运行时 API 基址解析已改为忽略空字符串配置
  - 线上前端 bundle 已切换到 `index-BO9TP2X5.js`
  - `https://campusbook.top/` 已加载新 bundle
- 当前正式站点即使 `config.js` 中 `apiBaseUrl` 为空字符串，也会继续回退到正式 API 域名

## Notes

- 本轮没有接入浏览器自动化录制，但已通过源码、构建产物与线上资源切换完成闭环验证
- 该问题与“访问错域名”不同，属于正式域名下的前端空配置回退 bug

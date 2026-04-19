# Bugfix Login Label Payload

日期：`2026-04-19`

## 问题现象

在登录页点击示例账号后提交登录，请求返回：

```json
{
  "message": ["property label should not exist"],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 根因

登录页中的示例账号对象包含：

- `label`
- `email`
- `password`

此前点击示例账号按钮时，前端直接执行了：

```ts
setForm(account)
```

导致登录表单状态里也混入了 `label`。  
随后提交登录时，前端把整个表单对象发给 `/auth/login`，后端 DTO 只允许 `email/password`，因此触发了校验错误。

## 修复

文件：

- `apps/web/src/ui/pages/login-page.tsx`

改动：

- 显式定义 `LoginFormState`
- 将示例账号对象类型与登录表单状态分离
- 点击示例账号时只回填：
  - `email`
  - `password`

不再把 `label` 写入登录表单状态

## 本地验证

```bash
pnpm --filter web typecheck
pnpm --filter web build
```

结果：

- `typecheck` 通过
- `build` 通过

本轮构建产物：

- `dist/assets/index-BPcO5s7o.js`
- `dist/assets/index-CJKyMaj0.css`

## 线上热刷新

```bash
docker cp apps/web/dist/. infra-web-1:/usr/share/nginx/html/
```

线上首页关键资源：

```html
<script type="module" crossorigin src="/assets/index-BPcO5s7o.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CJKyMaj0.css">
```

## 接口验证

### 合法请求

```bash
curl -s https://api.campusbook.top/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"demo@campusbook.top","password":"demo123456"}'
```

结果：成功返回 `accessToken / expiresIn / user`

### 非法请求

```bash
curl -s https://api.campusbook.top/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"demo@campusbook.top","password":"demo123456","label":"普通用户"}'
```

结果：

```json
{"message":["property label should not exist"],"error":"Bad Request","statusCode":400}
```

## 结论

问题根因已修复。  
现在登录页不再把 `label` 提交给后端，示例账号登录应恢复正常。

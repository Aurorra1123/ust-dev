# APP-004 Auth Cookie Flow Validation

## 日期

- 2026-04-17 (Asia/Shanghai)

## 验证目标

- 验证 `POST /auth/login` 能返回 access token
- 验证 refresh token 通过 `HttpOnly` Cookie 流转
- 验证 `POST /auth/refresh` 能基于 Cookie 续发会话
- 验证 `POST /auth/logout` 会清除 refresh token，并让后续 refresh 失效

## 本阶段实现边界

- 当前认证闭环使用环境变量中的演示账号：
  - `DEMO_USER_EMAIL`
  - `DEMO_USER_PASSWORD`
  - `DEMO_USER_ROLE`
- 这样可以先完成登录、刷新令牌和退出链路，而不提前把 `APP-005` 的数据库用户模型复杂化

## 验证命令

### 1. 重建并启动 API

```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d api
```

### 2. 验证容器和路由正常

```bash
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml logs --tail=80 api
```

结果摘要：

```text
infra-api-1 Up
Mapped {/auth/login, POST} route
Mapped {/auth/refresh, POST} route
Mapped {/auth/logout, POST} route
```

### 3. 登录并写入 Cookie

```bash
curl --connect-timeout 3 -sS \
  -D /tmp/app4-login-headers.txt \
  -o /tmp/app4-login-body.json \
  -c /tmp/app4-cookies.txt \
  -H 'Host: api.campusbook.top' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"email":"demo@campusbook.top","password":"demo123456"}' \
  http://127.0.0.1/auth/login
```

结果摘要：

```text
HTTP/1.1 200 OK
Set-Cookie: campusbook_refresh_token=...; Path=/auth; HttpOnly; SameSite=Lax
```

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "user": {
    "email": "demo@campusbook.top",
    "role": "student"
  }
}
```

### 4. 使用 Cookie 刷新会话

```bash
curl --connect-timeout 3 -sS \
  -D /tmp/app4-refresh-headers.txt \
  -o /tmp/app4-refresh-body.json \
  -b /tmp/app4-cookies.txt \
  -c /tmp/app4-cookies.txt \
  -H 'Host: api.campusbook.top' \
  -X POST \
  http://127.0.0.1/auth/refresh
```

结果摘要：

```text
HTTP/1.1 200 OK
Set-Cookie: campusbook_refresh_token=...; Path=/auth; HttpOnly; SameSite=Lax
```

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "user": {
    "email": "demo@campusbook.top",
    "role": "student"
  }
}
```

### 5. 退出并验证 refresh 失效

```bash
curl --connect-timeout 3 -sS \
  -D /tmp/app4-verify-logout-headers.txt \
  -o /tmp/app4-verify-logout-body.json \
  -b /tmp/app4-verify-cookies.txt \
  -c /tmp/app4-verify-cookies.txt \
  -H 'Host: api.campusbook.top' \
  -X POST \
  http://127.0.0.1/auth/logout

curl --connect-timeout 3 -sS \
  -D /tmp/app4-post-logout-refresh-headers.txt \
  -o /tmp/app4-post-logout-refresh-body.json \
  -b /tmp/app4-verify-cookies.txt \
  -H 'Host: api.campusbook.top' \
  -X POST \
  http://127.0.0.1/auth/refresh
```

结果摘要：

```text
HTTP/1.1 200 OK
Set-Cookie: campusbook_refresh_token=; Max-Age=0; Path=/auth; HttpOnly; SameSite=Lax
```

```text
HTTP/1.1 401 Unauthorized
```

```json
{
  "message": "missing-refresh-token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## 结论

- `APP-004` 已达到验收条件
- 登录接口可以签发 access token
- refresh token 已通过 `HttpOnly` Cookie 流转
- refresh 与 logout 都已具备真实验证证据
- 当前认证实现是演示账号闭环，后续 `APP-005` 再把用户模型正式接到数据库

## 备注

- 由于当前还是 HTTP 开发基线，refresh cookie 暂未启用 `Secure`
- 对 `127.0.0.1:80` 的验证仍需使用提权命令，因为普通沙箱无法访问本地监听端口

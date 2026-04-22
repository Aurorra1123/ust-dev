# ADR 0024：共享 API bootstrap 与最小 Web CSP 基线

## 状态

已接受

## 背景

`COMP-004` 需要同时补齐三个维度：

- 前端关键主路径的键盘可达与显式状态表达
- API / Nginx / Web 容器的基础安全头
- 可重复的轻量留证

本轮实现中暴露出一个实际问题：测试环境里的 Nest API 并不是通过 `main.ts` 启动，因此如果把安全头、CORS 和全局 pipe 只写在 `main.ts`，测试环境会漏掉正式环境的安全基线。

同时，Web 侧需要一份最小可落地的 CSP。当前仓库没有引入专用浏览器安全中间件，也没有复杂的第三方脚本接入需求，比赛阶段不适合为了 CSP 再引入额外运行时复杂度。

## 决策

1. 把 API 的安全头、CORS、`cookieParser` 和 `ValidationPipe` 收口到共享入口 `apps/api/src/bootstrap-api.ts`
2. `main.ts` 与测试集成 harness 都复用这份 bootstrap，避免正式环境与测试环境配置漂移
3. Web 侧采用“最小必要、默认自有源”的 CSP 基线：
   - `default-src 'self'`
   - 禁止 `object-src`
   - 禁止被嵌入 `frame-ancestors 'none'`
   - 限制 `form-action 'self'`
   - 对 `img/font/connect` 保留当前应用必需能力
   - 对 `style/script` 暂时保留 `unsafe-inline`，避免在比赛阶段为消除内联样式和运行时配置再做高风险重构
4. 基础安全头由两层共同保证：
   - API bootstrap 负责接口返回头
   - Nginx / Web 容器负责站点与代理层返回头

## 影响

- 测试环境与正式环境的 API 安全基线一致，`COMP-004` 的安全头回归可以直接验证真实启动口径
- Web 站点具备可追溯的 CSP、`nosniff`、`Referrer-Policy`、`Permissions-Policy` 等基础头
- 保持最小必要改动，没有为比赛阶段引入 `helmet`、浏览器自动化依赖或更严格但高风险的 CSP 重构

## 不采纳的方案

### 只在 `main.ts` 中配置安全头

不采纳。测试环境不会自动继承，验证结果会失真。

### 直接引入更重的安全中间件或更严格 CSP

不采纳。当前目标是补齐比赛要求中的基础安全能力和留证，不是做一轮高风险的前端安全重构。

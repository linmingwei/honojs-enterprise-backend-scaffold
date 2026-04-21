# HonoJS 企业级后端脚手架

[English](./README.md)

这是一个面向多租户后台系统的 HonoJS 后端脚手架。

项目采用模块化单体架构，基于 Bun、Hono、Drizzle ORM、Better Auth、PostgreSQL、Redis 和 BullMQ 构建，目标是为管理后台、企业内部平台和中后台系统提供一个可扩展的后端基础。

## 特性概览

- 基于 Hono + Bun 的运行时
- 集成 OpenAPI 与 Swagger
- Better Auth 接入与统一登录分发
- 多租户 RBAC、邀请、成员管理、角色管理
- 基于配置开关的模块注册机制
- PostgreSQL + Drizzle schema / migration
- Redis 缓存、分布式锁、队列与调度入口
- 默认支持 R2，对 OSS 做了适配边界抽象
- 签名上传时自动落库文件元数据
- 基于 provider 抽象的邀请通知钩子

## 已实现内容

### 基础能力

- 从 `config/app.toml` 加载配置，并支持环境变量覆盖
- `auth`、`tenant`、`rbac`、`audit`、`storage`、`cache`、`queue`、`scheduler`、`payment`、`notify` 等 feature flags
- HTTP、worker、scheduler 三类模块契约
- request security context 中间件与权限辅助函数

### 认证与管理端能力

- Better Auth 服务接线
- 统一标识登录分发，支持：
  - 邮箱 + 密码
  - 用户名 + 密码
  - 手机号 + 密码
  - 邮箱 OTP
  - 手机号 OTP
- 管理端用户列表与创建接口
- 管理端用户接口已纳入 OpenAPI 文档

### 租户与 RBAC

- 租户创建与租户列表
- 邀请创建、列表、撤销、公开查询、接受
- 成员列表与成员停用
- 角色授予、撤销、角色目录查询、成员角色查询
- RBAC 初始化 seed 脚本

### 基础设施

- PostgreSQL client 与 Drizzle schema
- Redis 缓存与锁抽象
- BullMQ 队列与 scheduler bootstrap
- R2 / OSS 对象存储抽象
- 生成签名上传地址时写入文件元数据

## 当前仍是占位或预留的部分

下面这些边界已经留好，但生产级实现还没有完全打通：

- 真实邮件服务商接入，目前只有 `stub` sender
- 真实短信服务商接入
- 微信支付实现
- 完整的邀请码激活 / 前端交互体验
- 更细的数据范围权限策略

## 技术栈

- Bun
- Hono
- TypeScript
- Better Auth
- Drizzle ORM
- PostgreSQL
- Redis
- BullMQ
- Zod
- `@hono/zod-openapi`
- `@hono/swagger-ui`

## 目录结构

```text
src/
  app/
    bootstrap/
    http/
    scheduler/
    worker/
  infrastructure/
    auth/
    cache/
    db/
    lock/
    queue/
    redis/
  modules/
    auth/
    audit/
    notify/
    payment/
    rbac/
    storage/
    tenant/
  shared/
    config/
    errors/
    http/
```

## 快速开始

### 环境要求

- Bun
- PostgreSQL
- Redis

### 安装依赖

```bash
bun install
```

### 配置

1. 参考 `.env.example` 配置环境变量
2. 检查 `config/app.toml`
3. 根据你启用的 provider 补齐对应 env

默认配置下：

- `payment` 关闭
- `notify` 关闭
- `storage` 使用 `r2`
- `queue` 使用 `bullmq`

### 执行数据库迁移

```bash
bun run db:migrate
```

### 初始化 RBAC

```bash
bun run seed:rbac
```

### 启动 API

```bash
bun run dev
```

### 启动 Worker

```bash
bun run dev:worker
```

### 启动 Scheduler Bootstrap

```bash
bun run dev:scheduler
```

## API 文档

服务启动后可访问：

- Swagger UI：`http://localhost:3000/docs`
- OpenAPI JSON：`http://localhost:3000/openapi.json`

## 示例代码

可直接参考 [`examples/`](./examples/README.md) 目录：

- [`examples/business/catalog-module.example.ts`](./examples/business/catalog-module.example.ts)
- [`examples/business/catalog-jobs.example.ts`](./examples/business/catalog-jobs.example.ts)
- [`examples/business/catalog-assets.example.ts`](./examples/business/catalog-assets.example.ts)

这些示例聚焦的是“如何基于这个脚手架写业务代码”，包括：

- 如何组织一个租户级业务模块
- 如何暴露 OpenAPI 路由
- 如何在路由边界做 RBAC 权限校验
- 如何通过 `QueueBus` 投递后台任务
- 如何把业务实体和上传后的文件关联起来

## 常用脚本

```bash
bun run dev
bun run dev:worker
bun run dev:scheduler
bun run test
bun run typecheck
bun run db:generate
bun run db:migrate
bun run seed:rbac
```

## 测试

```bash
bun test
bun run typecheck
```

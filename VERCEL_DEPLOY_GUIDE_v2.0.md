---
版本：v2.0
基于：VERCEL_DEPLOY_GUIDE.md
修改时间：2026-04-03
修改内容：
- 删除文档中的明文账号密码
- 改为只保留安全的 GitHub / Vercel 部署步骤
- 增加 ADMIN_PWD 环境变量配置说明
---

# Vercel 部署指南 v2.0

## 当前仓库信息

- GitHub 仓库：`order-verify-tool`
- 建议部署平台：Vercel
- 重要原则：账号密码不要写进仓库，也不要写进部署说明文档

## 步骤一：确认 GitHub 仓库

1. 登录 GitHub
2. 打开仓库 `order-verify-tool`
3. 确认最新代码已经同步到主分支

## 步骤二：在 Vercel 导入项目

1. 打开 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 `Add New Project`
4. 选择 `order-verify-tool`
5. 点击 `Deploy`

## 步骤三：配置环境变量

在 Vercel 项目设置中添加：

- 变量名：`ADMIN_PWD`
- 变量值：请使用你保存在本地账号信息文件中的当前后台密码

路径：`Settings` → `Environment Variables`

## 步骤四：验证部署

1. 打开前台页面
2. 打开后台页面
3. 使用当前后台密码登录
4. 确认订单验证和后台登录正常

## 步骤五：绑定域名（如需要）

1. 打开项目 `Settings` → `Domains`
2. 添加域名 `jinbb.cn`
3. 按页面提示完成 DNS 配置

## 说明

- 如果 GitHub 已同步，但后台登录失败，优先检查 `ADMIN_PWD` 是否已配置
- 账号密码统一保存在本地 `账户信息_v2.0.md`，不要再写入仓库文件

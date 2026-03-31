# Vercel 部署指南

## 账号信息

- **邮箱**: 464717765@qq.com
- **密码**: e%#Bfh*FEfdJQGx3
- **GitHub 用户名**: jimbb-order-tool (建议)

## 步骤一：注册 GitHub

1. 访问 https://github.com/signup
2. 输入邮箱: 464717765@qq.com
3. 设置密码: e%#Bfh*FEfdJQGx3
4. 用户名: jimbb-order-tool
5. 完成验证（可能需要邮箱验证）

## 步骤二：创建仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名: order-verify-tool
4. 选择 "Public" 或 "Private"
5. 点击 "Create repository"

## 步骤三：推送代码

```bash
cd /Users/jim/WorkBuddy/20260330100059
git remote add origin https://github.com/jimbb-order-tool/order-verify-tool.git
git push -u origin main
```

## 步骤四：部署到 Vercel

1. 访问 https://vercel.com
2. 点击 "Sign Up" → 选择 "Continue with GitHub"
3. 授权 Vercel 访问 GitHub
4. 点击 "Add New Project"
5. 选择 "order-verify-tool" 仓库
6. 点击 "Deploy"

## 步骤五：绑定域名

1. 在 Vercel 项目页面点击 "Settings" → "Domains"
2. 输入: jinbb.cn
3. 点击 "Add"
4. 按提示修改 DNS 解析：
   - 类型: A
   - 主机: @
   - 值: 76.76.21.21

## 自动部署脚本

运行以下命令自动完成：

```bash
cd /Users/jim/WorkBuddy/20260330100059
./deploy_to_vercel.sh
```

## 完成后的访问地址

- Vercel 默认域名: https://order-verify-tool.vercel.app
- 你的域名: https://jinbb.cn

---

**预计时间**: 10-15 分钟

#!/bin/bash
# Vercel 自动部署脚本

echo "========================================"
echo "  Vercel 部署脚本"
echo "========================================"

# 检查 git
echo ""
echo "1. 检查 Git 配置..."
git config user.email "464717765@qq.com"
git config user.name "jimbb"

# 提交所有更改
echo ""
echo "2. 提交代码..."
git add .
git commit -m "Prepare for Vercel deployment" || echo "无需提交"

echo ""
echo "========================================"
echo "  准备完成"
echo "========================================"
echo ""
echo "请手动完成以下步骤："
echo ""
echo "1. 注册 GitHub: https://github.com/signup"
echo "   邮箱: 464717765@qq.com"
echo "   密码: e%#Bfh*FEfdJQGx3"
echo ""
echo "2. 创建仓库: order-verify-tool"
echo ""
echo "3. 推送代码:"
echo "   git remote add origin https://github.com/你的用户名/order-verify-tool.git"
echo "   git push -u origin main"
echo ""
echo "4. 部署到 Vercel: https://vercel.com"
echo "   选择 GitHub 登录，导入项目"
echo ""
echo "5. 绑定域名 jinbb.cn"
echo ""
echo "详细指南: VERCEL_DEPLOY_GUIDE.md"

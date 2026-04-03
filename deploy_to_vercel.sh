#!/bin/bash
# Vercel 自动部署脚本

echo "========================================"
echo "  Vercel 部署脚本"
echo "========================================"

# 提交所有更改
echo ""
echo "1. 提交代码..."
git add .
git commit -m "Prepare for Vercel deployment" || echo "无需提交"

echo ""
echo "========================================"
echo "  准备完成"
echo "========================================"
echo ""
echo "请手动完成以下步骤："
echo ""
echo "1. 登录 GitHub 并确认仓库: order-verify-tool"
echo ""
echo "2. 推送代码:"
echo "   git push -u origin main"
echo ""
echo "3. 部署到 Vercel: https://vercel.com"
echo "   选择 GitHub 登录，导入项目"
echo ""
echo "4. 在 Vercel 设置环境变量 ADMIN_PWD"
echo ""
echo "5. 绑定域名 jinbb.cn"
echo ""
echo "详细指南: VERCEL_DEPLOY_GUIDE_v2.0.md"

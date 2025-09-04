#!/bin/bash

# AI Writer Backend Test Script
# 测试后端服务的基本功能

set -e

echo "🚀 开始测试 AI Writer 后端服务..."

# 检查服务是否运行
check_service() {
    echo "📊 检查服务健康状态..."
    if curl -s http://localhost:8000/health | grep -q "OK"; then
        echo "✅ 服务正常运行"
    else
        echo "❌ 服务未运行或健康检查失败"
        exit 1
    fi
}

# 测试API端点
test_api() {
    echo "📚 测试API文档端点..."
    curl -s http://localhost:8000/api | jq .
}

# 测试账号管理
test_accounts() {
    echo "👥 测试账号管理功能..."
    
    # 创建测试账号
    echo "  创建测试账号..."
    curl -s -X POST http://localhost:8000/api/accounts \
        -H "Content-Type: application/json" \
        -H "x-api-key: test-key" \
        -d '{"name": "测试账号", "description": "这是一个测试账号"}' | jq .
    
    # 获取账号列表
    echo "  获取账号列表..."
    curl -s http://localhost:8000/api/accounts \
        -H "x-api-key: test-key" | jq .
}

# 测试AI服务状态
test_ai_status() {
    echo "🤖 测试AI服务状态..."
    curl -s http://localhost:8000/api/ai/status \
        -H "x-api-key: test-key" | jq .
}

# 运行所有测试
run_all_tests() {
    check_service
    test_api
    test_accounts
    test_ai_status
    
    echo "🎉 所有测试完成！"
}

# 如果直接运行脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_all_tests
fi
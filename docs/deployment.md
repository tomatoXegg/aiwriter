# 部署指南

## 概述

本文档提供了 AI Writer 项目的完整部署指南，涵盖开发环境、测试环境和生产环境的部署步骤。

## 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 18.04+), macOS 10.15+, Windows 10+
- **Node.js**: 18.x 或更高版本
- **内存**: 2GB RAM
- **存储**: 1GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **操作系统**: Ubuntu 20.04 LTS
- **Node.js**: 20.x LTS
- **内存**: 4GB RAM
- **存储**: 5GB SSD
- **CPU**: 2 核或更高
- **网络**: 100Mbps+ 带宽

## 环境准备

### 1. 安装 Node.js

#### Ubuntu/Debian
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### macOS
```bash
# 使用 Homebrew
brew install node

# 验证安装
node --version
npm --version
```

#### Windows
```bash
# 下载并安装 Node.js 20.x LTS
# 从 https://nodejs.org/ 下载安装包
```

### 2. 安装 PM2 (进程管理器)
```bash
npm install -g pm2
```

### 3. 安装 Nginx (反向代理)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# macOS
brew install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 项目部署

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/aiwriter.git
cd aiwriter
```

### 2. 安装依赖
```bash
# 安装所有依赖
npm run install:all
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**生产环境变量配置示例**:
```env
# 服务器配置
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# 数据库配置
DB_PATH=/var/lib/aiwriter/aiwriter.db

# Google Gemini API 配置
GEMINI_API_KEY=your_production_gemini_api_key

# JWT 配置
JWT_SECRET=your_production_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=https://yourdomain.com

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/lib/aiwriter/uploads

# 日志配置
LOG_LEVEL=error
LOG_DIR=/var/log/aiwriter

# 安全配置
BCRYPT_ROUNDS=12
SESSION_SECRET=your_production_session_secret_here

# 监控配置
GOOGLE_ANALYTICS_ID=your_ga_id_here
SENTRY_DSN=your_sentry_dsn_here
```

### 4. 构建项目
```bash
# 构建前端和后端
npm run build
```

### 5. 创建必要目录
```bash
sudo mkdir -p /var/lib/aiwriter
sudo mkdir -p /var/lib/aiwriter/uploads
sudo mkdir -p /var/log/aiwriter
sudo chown -R $USER:$USER /var/lib/aiwriter
sudo chown -R $USER:$USER /var/log/aiwriter
```

## 进程管理配置

### 1. 创建 PM2 配置文件
```bash
# 创建 ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'aiwriter-backend',
      script: './backend/src/index.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiwriter-frontend',
      script: 'serve',
      cwd: './frontend/dist',
      args: '-s -l 3000',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
```

### 2. 安装 serve (用于前端静态文件服务)
```bash
npm install -g serve
```

### 3. 启动应用
```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

## Nginx 配置

### 1. 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/aiwriter
```

### 2. 配置内容
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API 接口
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 文件上传大小限制
        client_max_body_size 10M;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 3. 启用站点
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/aiwriter /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

## SSL 证书配置

### 1. 使用 Let's Encrypt (推荐)
```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 手动配置 SSL
1. 购买 SSL 证书
2. 上传证书文件到服务器
3. 更新 Nginx 配置中的证书路径
4. 重新加载 Nginx

## 数据库管理

### 1. 数据库备份
```bash
# 创建备份脚本
cat > backup.sh << EOF
#!/bin/bash

# 设置变量
BACKUP_DIR="/var/backups/aiwriter"
DB_PATH="/var/lib/aiwriter/aiwriter.db"
DATE=\$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p \$BACKUP_DIR

# 备份数据库
sqlite3 \$DB_PATH ".backup \$BACKUP_DIR/aiwriter_\$DATE.db"

# 压缩备份文件
gzip \$BACKUP_DIR/aiwriter_\$DATE.db

# 删除 30 天前的备份
find \$BACKUP_DIR -name "aiwriter_*.db.gz" -mtime +30 -delete

echo "Database backup completed: \$BACKUP_DIR/aiwriter_\$DATE.db.gz"
EOF

# 设置执行权限
chmod +x backup.sh

# 添加到 crontab
crontab -e
# 添加以下行（每天凌晨 2 点备份）：
0 2 * * * /path/to/aiwriter/backup.sh
```

### 2. 数据库恢复
```bash
# 停止应用
pm2 stop aiwriter-backend

# 恢复数据库
gunzip -c /var/backups/aiwriter/aiwriter_20240101_020000.db.gz > /var/lib/aiwriter/aiwriter.db

# 启动应用
pm2 start aiwriter-backend
```

## 监控和日志

### 1. 应用监控
```bash
# 安装监控面板
pm2 install pm2-web

# 启动监控面板
pm2-web
```

### 2. 日志管理
```bash
# 查看应用日志
pm2 logs

# 查看特定应用日志
pm2 logs aiwriter-backend

# 清理日志
pm2 flush

# 设置日志轮转
pm2 install pm2-logrotate
```

### 3. 系统监控
```bash
# 安装 htop
sudo apt install htop

# 安装 iotop (磁盘 I/O 监控)
sudo apt install iotop

# 安装 nethogs (网络监控)
sudo apt install nethogs
```

## 安全配置

### 1. 防火墙配置
```bash
# 安装 UFW
sudo apt install ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# 启用防火墙
sudo ufw enable
```

### 2. fail2ban 防护
```bash
# 安装 fail2ban
sudo apt install fail2ban

# 配置 fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 重启 fail2ban
sudo systemctl restart fail2ban
```

### 3. 定期更新
```bash
# 设置自动更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 性能优化

### 1. 系统优化
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 优化文件描述符限制
echo "fs.file-max = 100000" | sudo tee -a /etc/sysctl.conf
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

### 2. 应用优化
```bash
# 启用 gzip 压缩
npm install compression

# 配置缓存策略
npm install apicache
```

## 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs aiwriter-backend --err

# 重启应用
pm2 restart aiwriter-backend
```

#### 2. 数据库连接失败
```bash
# 检查数据库文件
ls -la /var/lib/aiwriter/

# 检查权限
ls -la /var/lib/aiwriter/aiwriter.db

# 修复权限
chmod 644 /var/lib/aiwriter/aiwriter.db
```

#### 3. Nginx 配置错误
```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载 Nginx
sudo systemctl reload nginx
```

#### 4. 内存不足
```bash
# 查看内存使用
free -h

# 查看 Node.js 内存使用
pm2 monit

# 增加内存限制
pm2 restart aiwriter-backend --update-env
```

## 维护任务

### 日常维护
```bash
# 检查应用状态
pm2 status

# 检查磁盘空间
df -h

# 检查系统资源
htop

# 查看日志
pm2 logs --lines 100
```

### 定期维护
```bash
# 每周：清理日志
pm2 flush

# 每月：更新依赖
npm update

# 每季度：系统更新
sudo apt update && sudo apt upgrade -y
```

## 回滚策略

### 1. 代码回滚
```bash
# 回滚到特定版本
git checkout <commit-hash>

# 重新构建
npm run build

# 重启应用
pm2 restart all
```

### 2. 数据库回滚
```bash
# 停止应用
pm2 stop aiwriter-backend

# 恢复数据库备份
sqlite3 /var/lib/aiwriter/aiwriter.db < backup.sql

# 启动应用
pm2 start aiwriter-backend
```

## 总结

AI Writer 的部署采用了现代化的部署架构，具有良好的可扩展性和维护性。通过 PM2 进行进程管理，Nginx 作为反向代理，以及完整的监控和日志系统，确保了应用的稳定运行。

建议在部署前仔细阅读本文档，并根据实际环境调整配置参数。如有问题，请参考故障排除部分或联系技术支持。
#!/bin/bash

# Exit on error
set -e

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Update system packages
log "Updating system packages..."
yum update -y

# Install Node.js 18.x
log "Installing Node.js 18.x..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install git
log "Installing git..."
yum install -y git

# Install nginx
log "Installing nginx..."
amazon-linux-extras install nginx1 -y
systemctl enable nginx
systemctl start nginx

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2

# Install Amazon CloudWatch agent
log "Installing Amazon CloudWatch agent..."
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
log "Configuring CloudWatch agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "nginx-error",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "nginx-access",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
log "Starting CloudWatch agent..."
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Clone the repository (replace with your actual repository URL)
log "Cloning repository..."
git clone https://github.com/yourusername/Bleu.js.git /opt/bleu-js
cd /opt/bleu-js

# Install dependencies
log "Installing dependencies..."
npm install

# Start the application with PM2
log "Starting application with PM2..."
pm2 start npm --name "bleu-js" -- start
pm2 save
pm2 startup

# Configure nginx
log "Configuring nginx..."
cat > /etc/nginx/conf.d/bleu-js.conf << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Test nginx configuration
log "Testing nginx configuration..."
nginx -t

# Reload nginx
log "Reloading nginx..."
systemctl reload nginx

log "Setup completed successfully!" 
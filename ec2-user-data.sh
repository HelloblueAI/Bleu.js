#!/bin/bash

# Enable logging
exec 1> >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Function to log messages with timestamps
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/user-data.log
}

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        log_message "SUCCESS: $1"
    else
        log_message "ERROR: $1"
        if [ "$2" = "exit" ]; then
            exit 1
        fi
    fi
}

# Update system packages
log_message "Updating system packages..."
yum update -y
check_status "System update"

# Install Node.js 16.x
log_message "Installing Node.js 16.x..."
# Remove old NodeSource repositories if they exist
rm -f /etc/yum.repos.d/nodesource*
check_status "Old repositories removed"

# Add NodeSource repository for Node.js 16.x
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
check_status "NodeSource repository setup"

# Install Node.js
yum install -y nodejs
check_status "Node.js installation"

# Install development tools
log_message "Installing development tools..."
yum groupinstall -y "Development Tools"
check_status "Development tools installation"

# Install PM2 globally
log_message "Installing PM2..."
npm install -g pm2
check_status "PM2 installation"

# Install CloudWatch agent
log_message "Installing CloudWatch agent..."
yum install -y amazon-cloudwatch-agent
check_status "CloudWatch agent installation"

# Create app directory
log_message "Creating app directory: /var/www/Bleu.js"
mkdir -p /var/www/Bleu.js
check_status "App directory creation"

# Clone repository
log_message "Cloning repository..."
cd /var/www/Bleu.js
if [ -d ".git" ]; then
    git pull origin main
else
    git clone https://github.com/pejmanS21/Bleu.js.git .
fi
check_status "Repository clone"

# Install application dependencies
log_message "Installing application dependencies..."
npm install
check_status "Dependencies installation"

# Start application with PM2
log_message "Starting application with PM2..."
pm2 start npm --name "bleu-js" -- start
check_status "Application start"

# Save PM2 process list
pm2 save
check_status "PM2 save"

# Configure PM2 to start on boot
pm2 startup
check_status "PM2 startup"

# Install NGINX
log_message "Installing NGINX..."
amazon-linux-extras enable nginx1
yum clean metadata
yum install -y nginx
check_status "NGINX installation"

# Configure NGINX
log_message "Configuring NGINX..."
cat > /etc/nginx/conf.d/bleu-js.conf << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOL
check_status "NGINX configuration"

# Start NGINX
log_message "Starting NGINX..."
systemctl enable nginx
systemctl start nginx
check_status "NGINX start"

log_message "Setup completed successfully"

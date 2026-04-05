#!/bin/bash
set -e

DOMAIN="meltedpictures.com"

echo "Setting up production for $DOMAIN..."

# Create nginx config
sudo tee /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name meltedpictures.com www.meltedpictures.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "Nginx config created."

# Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
echo "Site enabled."

# Test nginx config
sudo nginx -t
echo "Nginx config valid."

# Reload nginx
sudo systemctl reload nginx
echo "Nginx reloaded."

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
echo "SSL certificate installed."

echo ""
echo "Setup complete! Start the app with: npm start"

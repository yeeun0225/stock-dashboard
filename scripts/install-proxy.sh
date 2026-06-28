#!/usr/bin/env bash
#
# 토스 프록시 VPS 설치 스크립트 (Ubuntu 22.04)
#
# 사용법 (VM 의 SSH 터미널에서):
#   curl -fsSL https://raw.githubusercontent.com/yeeun0225/stock-dashboard/master/scripts/install-proxy.sh | sudo bash -s -- <PROXY_SECRET> <PUBLIC_IP>
#
# 설치 내용:
#   - Node.js 20
#   - 프록시(/opt/toss-proxy/proxy.mjs) + systemd 데몬(24시간 자동 실행)
#   - Caddy(자동 HTTPS, <ip>.nip.io 도메인)
#
set -euo pipefail

SECRET="${1:?PROXY_SECRET 인자가 필요합니다}"
PUBLIC_IP="${2:?PUBLIC_IP 인자가 필요합니다}"
DASHED_IP="${PUBLIC_IP//./-}"
DOMAIN="${DASHED_IP}.nip.io"
RAW_BASE="https://raw.githubusercontent.com/yeeun0225/stock-dashboard/master"

echo "==> [1/5] Node.js 20 설치"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "==> [2/5] 프록시 코드 배치"
mkdir -p /opt/toss-proxy
curl -fsSL "${RAW_BASE}/scripts/toss-proxy.mjs" -o /opt/toss-proxy/proxy.mjs

echo "==> [3/5] systemd 데몬 등록"
cat > /etc/systemd/system/toss-proxy.service <<SVC
[Unit]
Description=Toss Open API Proxy
After=network.target

[Service]
Environment=PROXY_SECRET=${SECRET}
Environment=PROXY_PORT=4000
ExecStart=/usr/bin/node /opt/toss-proxy/proxy.mjs
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
SVC
systemctl daemon-reload
systemctl enable --now toss-proxy

echo "==> [4/5] Caddy 설치"
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
apt-get update
apt-get install -y caddy

echo "==> [5/5] Caddy 자동 HTTPS 설정 (${DOMAIN})"
cat > /etc/caddy/Caddyfile <<CADDY
${DOMAIN} {
    reverse_proxy localhost:4000
}
CADDY
systemctl restart caddy

echo ""
echo "================================================================"
echo " 설치 완료!"
echo "  프록시 주소(HTTPS): https://${DOMAIN}"
echo "  토스에 등록할 IP   : ${PUBLIC_IP}"
echo ""
echo " 상태 확인:"
echo "   systemctl status toss-proxy --no-pager"
echo "   curl -s https://${DOMAIN}/health"
echo "================================================================"

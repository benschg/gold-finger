#!/bin/bash

# Gold-Finger Raspberry Pi Setup Script
# Tested on: Raspberry Pi 4/5 with 64-bit Raspberry Pi OS
# Minimum: 4GB RAM (8GB recommended for full stack)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[-]${NC} $1"
}

# Check if running on ARM64
check_architecture() {
    ARCH=$(uname -m)
    if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
        print_warning "This script is optimized for ARM64 (aarch64). Detected: $ARCH"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    print_success "Architecture: $ARCH"
}

# Check available memory
check_memory() {
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    print_status "Total memory: ${TOTAL_MEM}MB"

    if [ "$TOTAL_MEM" -lt 3500 ]; then
        print_error "Minimum 4GB RAM required. You have ${TOTAL_MEM}MB"
        exit 1
    elif [ "$TOTAL_MEM" -lt 7500 ]; then
        print_warning "4GB detected. Using lightweight mode (no Supabase Studio)"
        USE_LIGHTWEIGHT=true
    else
        print_success "8GB+ detected. Full stack available"
        USE_LIGHTWEIGHT=false
    fi
}

# Install system dependencies
install_dependencies() {
    print_status "Updating system packages..."
    sudo apt-get update

    print_status "Installing dependencies..."
    sudo apt-get install -y \
        curl \
        git \
        unzip \
        build-essential \
        ca-certificates \
        gnupg \
        lsb-release
}

# Install Bun
install_bun() {
    if command -v bun &> /dev/null; then
        print_success "Bun already installed: $(bun --version)"
        return
    fi

    print_status "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash

    # Add to current session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    print_success "Bun installed: $(bun --version)"
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker already installed: $(docker --version)"
        return
    fi

    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com | sh

    # Add current user to docker group
    sudo usermod -aG docker $USER

    print_success "Docker installed"
    print_warning "You may need to log out and back in for docker group permissions"
}

# Install Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose already installed"
        return
    fi

    print_status "Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin

    print_success "Docker Compose installed"
}

# Setup project
setup_project() {
    print_status "Installing Node.js dependencies..."
    bun install

    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        print_status "Creating .env.local from example..."
        cp .env.example .env.local
        print_warning "Edit .env.local with your Supabase credentials"
    fi
}

# Configure swap (helpful for low-memory Pi)
configure_swap() {
    SWAP_SIZE=$(free -m | awk '/^Swap:/{print $2}')

    if [ "$SWAP_SIZE" -lt 1000 ]; then
        print_status "Configuring 2GB swap file for better performance..."
        sudo dphys-swapfile swapoff 2>/dev/null || true
        sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
        sudo dphys-swapfile setup
        sudo dphys-swapfile swapon
        print_success "Swap configured: 2GB"
    else
        print_success "Swap already configured: ${SWAP_SIZE}MB"
    fi
}

# Create systemd service for auto-start
create_systemd_service() {
    read -p "Create systemd service for auto-start on boot? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        SYSTEMD_CREATED=false
        return
    fi

    WORKING_DIR=$(pwd)

    sudo tee /etc/systemd/system/gold-finger.service > /dev/null <<EOF
[Unit]
Description=Gold-Finger Expense Tracker
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORKING_DIR
Environment="PATH=$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin"
ExecStartPre=/usr/bin/docker compose -f docker-compose.pi.yml up -d
ExecStart=$HOME/.bun/bin/bun start
ExecStop=/usr/bin/docker compose -f docker-compose.pi.yml down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    SYSTEMD_CREATED=true
    print_success "Systemd service created: gold-finger.service"
}

# Start services
start_services() {
    if [ "$NEED_RELOGIN" = true ]; then
        print_warning "Docker group permissions require logout/login. Cannot start services now."
        return
    fi

    read -p "Start Docker containers now? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    print_status "Starting Docker containers..."
    docker compose -f docker-compose.pi.yml up -d

    print_status "Waiting for services to be ready..."
    sleep 10

    SERVICES_STARTED=true
    print_success "Docker services started!"

    read -p "Start the Gold-Finger app now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting Gold-Finger on port 3000..."
        print_status "Press Ctrl+C to stop"
        echo ""
        bun start
    fi
}

# Print final instructions
print_instructions() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Gold-Finger Pi Setup Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""

    LOCAL_IP=$(hostname -I | awk '{print $1}')

    if [ "$SERVICES_STARTED" = true ]; then
        echo -e "${GREEN}Services are running!${NC}"
        echo "  App: http://${LOCAL_IP}:3000"
        echo "  Email Testing: http://${LOCAL_IP}:54334"
        echo ""
        echo "To stop: docker compose -f docker-compose.pi.yml down"
    elif [ "$USE_LIGHTWEIGHT" = true ]; then
        echo -e "${YELLOW}Lightweight mode (4GB RAM):${NC}"
        echo "  1. Edit .env.local with hosted Supabase credentials"
        echo "     (Get free account at https://supabase.com)"
        echo "  2. Start: bun start"
        echo ""
        echo "  Or use local lightweight stack:"
        echo "  1. docker compose -f docker-compose.pi.yml up -d"
        echo "  2. bun start"
    else
        echo -e "${GREEN}Full stack mode (8GB+ RAM):${NC}"
        echo "  1. Start Supabase: docker compose -f docker-compose.pi.yml up -d"
        echo "  2. Run migrations: bun run db:migrate"
        echo "  3. Start app: bun start"
        echo ""
        echo "  Supabase Studio: http://${LOCAL_IP}:54333"
    fi

    echo ""
    echo "App will be available at: http://${LOCAL_IP}:3000"
    echo ""

    if [ "$NEED_RELOGIN" = true ]; then
        print_warning "Please log out and back in for Docker permissions to take effect"
        print_warning "Then run: docker compose -f docker-compose.pi.yml up -d && bun start"
    fi

    if [ "$SYSTEMD_CREATED" = true ]; then
        echo ""
        echo "Auto-start on boot:"
        echo "  sudo systemctl enable gold-finger"
        echo "  sudo systemctl start gold-finger"
    fi
}

# Main
main() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  Gold-Finger Raspberry Pi Setup${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""

    check_architecture
    check_memory

    # Initialize flags
    NEED_RELOGIN=false
    SYSTEMD_CREATED=false
    SERVICES_STARTED=false

    # Check if Docker group needs relogin
    if ! groups | grep -q docker; then
        NEED_RELOGIN=true
    fi

    install_dependencies
    install_bun
    install_docker
    install_docker_compose
    configure_swap
    setup_project

    # Build for production
    print_status "Building application for production..."
    bun run build

    create_systemd_service
    start_services
    print_instructions
}

# Run main function
main "$@"

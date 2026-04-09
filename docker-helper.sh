#!/bin/bash
# =============================================================================
# HondaBot - Docker Helper Script for Raspberry Pi
# =============================================================================
# Usage: ./docker-helper.sh [command] [options]
# Version: 2.0.0 - Updated with better diagnostics and error handling
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="HondaBot"
COMPOSE_FILE="docker-compose.yml"
SCRIPT_VERSION="2.3.0"

# Enable BuildKit for faster builds with better caching
export DOCKER_BUILDKIT=1

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  HondaBot Docker Helper v${SCRIPT_VERSION}${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_step() {
    echo -e "${MAGENTA}→ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        echo ""
        echo "Try: sudo systemctl start docker"
        exit 1
    fi
}

# Check if container exists
container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Check if container is running
container_running() {
    docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Verify environment file
check_env_file() {
    if [[ ! -f ".env" ]]; then
        print_warning "No .env file found!"
        if [[ -f ".env.example" ]]; then
            echo "  Create one from the example:"
            echo "    cp .env.example .env"
            echo "    nano .env"
        fi
        return 1
    fi
    
    # Check for required variables
    local missing=0
    if ! grep -q "^RPP_DISCORD_CLIENT_ID=" .env || grep -q "^RPP_DISCORD_CLIENT_ID=$" .env; then
        print_warning "RPP_DISCORD_CLIENT_ID is not set in .env"
        missing=1
    fi
    if ! grep -q "^RPP_DISCORD_TOKEN=" .env || grep -q "^RPP_DISCORD_TOKEN=$" .env; then
        print_warning "RPP_DISCORD_TOKEN is not set in .env"
        missing=1
    fi
    
    if [[ $missing -eq 1 ]]; then
        return 1
    fi
    return 0
}

# Check system resources
check_resources() {
    print_info "System Resources:"
    
    # Memory
    local total_mem=$(free -m | awk '/^Mem:/{print $2}')
    local avail_mem=$(free -m | awk '/^Mem:/{print $7}')
    echo "  Memory: ${avail_mem}MB available / ${total_mem}MB total"
    
    if [[ $avail_mem -lt 512 ]]; then
        print_warning "Low memory! Consider closing other applications or adding swap."
    fi
    
    # Disk space
    local disk_avail=$(df -h . | awk 'NR==2 {print $4}')
    echo "  Disk: ${disk_avail} available"
    
    # CPU
    local cpu_count=$(nproc)
    echo "  CPUs: ${cpu_count}"
}

# Show usage
show_help() {
    print_header
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo -e "${CYAN}Basic Commands:${NC}"
    echo "  build           Build the Docker image"
    echo "  build-verbose   Build with full output (for debugging)"
    echo "  start           Start the container"
    echo "  stop            Stop the container"
    echo "  restart         Restart the container"
    echo "  rebuild         Stop, rebuild, and start (fresh build)"
    echo ""
    echo -e "${CYAN}Monitoring Commands:${NC}"
    echo "  logs            Show container logs (follow)"
    echo "  logs-tail       Show last 100 lines of logs"
    echo "  logs-error      Show only error logs"
    echo "  status          Show container status"
    echo "  health          Check container health and resources"
    echo "  stats           Show live resource usage"
    echo ""
    echo -e "${CYAN}Maintenance Commands:${NC}"
    echo "  shell           Open a shell in the container"
    echo "  exec <cmd>      Execute a command in the container"
    echo "  backup          Backup persistent data"
    echo "  clean           Remove container, image, and build cache"
    echo "  clean-all       Remove EVERYTHING (images, volumes, cache)"
    echo "  update          Pull latest code and rebuild"
    echo "  update-packages Update system packages (apt)"
    echo ""
    echo -e "${CYAN}Troubleshooting Commands:${NC}"
    echo "  diagnose        Run full diagnostic check"
    echo "  fix-ipv6        Apply IPv6 fix for Raspberry Pi"
    echo "  fix-permissions Fix file permissions"
    echo "  validate        Validate configuration files"
    echo ""
    echo -e "${CYAN}Other:${NC}"
    echo "  help            Show this help message"
    echo "  version         Show version information"
    echo ""
}

# Build image
cmd_build() {
    print_header
    echo "Building HondaBot..."
    echo ""
    
    # Check prerequisites
    check_env_file || print_warning "Continuing anyway, but bot may fail to start..."
    echo ""
    
    # Build with BuildKit (enabled globally for better caching)
    print_step "Building with Docker BuildKit..."

    # Run build with proper terminal handling
    docker compose -f "$COMPOSE_FILE" build --no-cache --progress=plain
    local build_status=$?
    
    # Force terminal reset and newline
    printf "\n"
    stty sane 2>/dev/null || true
    
    if [[ $build_status -eq 0 ]]; then
        print_success "Build completed successfully!"
        echo ""
    else
        print_warning "BuildKit build failed (exit code: $build_status), trying without BuildKit..."
        
        DOCKER_BUILDKIT=0 docker compose -f "$COMPOSE_FILE" build --no-cache
        build_status=$?
        
        printf "\n"
        stty sane 2>/dev/null || true
        
        if [[ $build_status -eq 0 ]]; then
            print_success "Build completed successfully!"
            echo ""
        else
            print_error "Build failed! Check the error messages above."
            echo ""
            echo "Common fixes:"
            echo "  - Run: $0 diagnose"
            echo "  - Run: $0 fix-ipv6"
            echo "  - Check Docker logs: journalctl -u docker -n 50"
            exit 1
        fi
    fi
}

# Build with verbose output
cmd_build_verbose() {
    print_header
    echo "Building HondaBot (verbose mode)..."
    echo ""
    
    check_env_file || print_warning "Continuing anyway..."
    echo ""

    # Build with full progress output (BuildKit enabled globally)
    docker compose -f "$COMPOSE_FILE" build --no-cache --progress=plain
    local build_status=$?
    
    # Force terminal reset and newline
    printf "\n"
    stty sane 2>/dev/null || true
    
    if [[ $build_status -eq 0 ]]; then
        print_success "Build completed successfully!"
        echo ""
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Start container
cmd_start() {
    print_header
    echo "Starting HondaBot..."
    
    # Validate before starting
    if ! check_env_file; then
        print_error "Cannot start without proper configuration."
        exit 1
    fi
    
    docker compose -f "$COMPOSE_FILE" up -d
    
    echo ""
    print_success "HondaBot started!"
    echo ""
    
    # Wait a moment and check if it's still running
    sleep 3
    if container_running; then
        print_info "Container is running. Checking initial logs..."
        echo ""
        docker compose -f "$COMPOSE_FILE" logs --tail=20
        echo ""
        echo "View full logs with: $0 logs"
    else
        print_error "Container stopped unexpectedly!"
        echo ""
        echo "Recent logs:"
        docker compose -f "$COMPOSE_FILE" logs --tail=50
        echo ""
        echo "Run '$0 diagnose' for troubleshooting."
        exit 1
    fi
}

# Stop container
cmd_stop() {
    print_header
    echo "Stopping HondaBot..."
    
    docker compose -f "$COMPOSE_FILE" down
    print_success "HondaBot stopped!"
}

# Restart container
cmd_restart() {
    print_header
    echo "Restarting HondaBot..."
    
    docker compose -f "$COMPOSE_FILE" restart
    
    sleep 3
    if container_running; then
        print_success "HondaBot restarted!"
        echo ""
        echo "View logs with: $0 logs"
    else
        print_error "Container failed to restart!"
        docker compose -f "$COMPOSE_FILE" logs --tail=30
        exit 1
    fi
}

# Rebuild from scratch
cmd_rebuild() {
    print_header
    echo "Rebuilding HondaBot from scratch..."
    echo ""
    
    print_step "Stopping container..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    print_step "Removing old image..."
    docker rmi hondabot:latest 2>/dev/null || true
    
    print_step "Cleaning build cache..."
    docker builder prune -f --filter "until=1h" 2>/dev/null || true
    
    echo ""
    cmd_build
    echo ""
    cmd_start
}

# Show logs
cmd_logs() {
    docker compose -f "$COMPOSE_FILE" logs -f
}

# Show last 100 lines
cmd_logs_tail() {
    docker compose -f "$COMPOSE_FILE" logs --tail=100
}

# Show only error logs
cmd_logs_error() {
    print_header
    echo "Showing error logs..."
    echo ""
    docker compose -f "$COMPOSE_FILE" logs --tail=500 2>&1 | grep -iE "(error|exception|fatal|fail|crash|undefined|null)" || echo "No error logs found in last 500 lines."
}

# Show status
cmd_status() {
    print_header
    echo "Container Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    
    if container_running; then
        echo "Health Status:"
        docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "  Health check not available"
        echo ""
        echo "Uptime:"
        docker inspect --format='  Started: {{.State.StartedAt}}' "$CONTAINER_NAME" 2>/dev/null || true
    else
        print_warning "Container is not running"
    fi
}

# Open shell
cmd_shell() {
    if ! container_running; then
        print_error "Container is not running. Start it first with: $0 start"
        exit 1
    fi
    docker exec -it "$CONTAINER_NAME" /bin/bash
}

# Execute command in container
cmd_exec() {
    if ! container_running; then
        print_error "Container is not running. Start it first with: $0 start"
        exit 1
    fi
    
    if [[ -z "$1" ]]; then
        print_error "No command specified."
        echo "Usage: $0 exec <command>"
        exit 1
    fi
    
    docker exec -it "$CONTAINER_NAME" "$@"
}

# Clean up
cmd_clean() {
    print_header
    print_warning "This will remove the HondaBot container, image, and related Docker artifacts."
    echo ""
    echo "What will be removed:"
    echo "  - HondaBot container"
    echo "  - HondaBot image (hondabot:latest)"
    echo "  - Dangling images (untagged)"
    echo "  - Build cache older than 24h"
    echo "  - Unused networks"
    echo ""
    read -p "Are you sure? (y/N): " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo ""

        # Stop and remove container
        print_step "Stopping and removing container..."
        docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

        # Remove HondaBot image specifically
        print_step "Removing HondaBot image..."
        docker rmi hondabot:latest 2>/dev/null || true
        docker rmi "${CONTAINER_NAME,,}:latest" 2>/dev/null || true

        # Remove dangling images
        print_step "Removing dangling images..."
        docker image prune -f 2>/dev/null || true

        # Prune build cache older than 24h
        print_step "Cleaning build cache..."
        docker builder prune -f --filter "until=24h" 2>/dev/null || true

        # Clean unused networks
        print_step "Removing unused networks..."
        docker network prune -f 2>/dev/null || true

        echo ""
        print_success "Cleaned up container and image!"
        echo ""
        print_info "Note: Volumes and base images (node:18) preserved."
        echo "      Use 'clean-all' to remove everything."
    else
        echo "Cancelled."
    fi
}

# Clean everything including volumes
cmd_clean_all() {
    print_header
    print_error "WARNING: This will perform a COMPLETE Docker cleanup!"
    echo ""
    echo "What will be removed:"
    echo "  - HondaBot container and ALL related containers"
    echo "  - HondaBot image AND base images (node:18, etc.)"
    echo "  - ALL dangling and unused images"
    echo "  - ALL Docker volumes (including persistent data)"
    echo "  - ALL build cache"
    echo "  - ALL unused networks"
    echo ""
    print_error "This CANNOT be undone! Data in volumes will be LOST!"
    echo ""
    read -p "Are you REALLY sure? (type 'yes' to confirm): " confirm

    if [[ "$confirm" == "yes" ]]; then
        echo ""

        # Stop and remove container with volumes
        print_step "Stopping and removing container with volumes..."
        docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true

        # Remove HondaBot image specifically
        print_step "Removing HondaBot image..."
        docker rmi hondabot:latest 2>/dev/null || true
        docker rmi "${CONTAINER_NAME,,}:latest" 2>/dev/null || true

        # Remove ALL unused images (including base images)
        print_step "Removing all unused images..."
        docker image prune -af 2>/dev/null || true

        # Remove all dangling volumes
        print_step "Removing dangling volumes..."
        docker volume prune -f 2>/dev/null || true

        # Prune ALL build cache
        print_step "Cleaning all build cache..."
        docker builder prune -af 2>/dev/null || true

        # Clean ALL unused networks
        print_step "Removing all unused networks..."
        docker network prune -f 2>/dev/null || true

        # Show what's left
        echo ""
        print_success "Complete Docker cleanup finished!"
        echo ""
        print_info "Remaining Docker resources:"
        echo "  Images:     $(docker images -q 2>/dev/null | wc -l)"
        echo "  Containers: $(docker ps -aq 2>/dev/null | wc -l)"
        echo "  Volumes:    $(docker volume ls -q 2>/dev/null | wc -l)"
        echo "  Networks:   $(docker network ls -q 2>/dev/null | wc -l)"
    else
        echo "Cancelled."
    fi
}

# Update and rebuild
cmd_update() {
    print_header
    echo "Updating HondaBot..."
    
    # Stop container
    print_step "Stopping container..."
    docker compose -f "$COMPOSE_FILE" down || true
    
    # Stash local changes
    print_step "Saving local changes..."
    git stash 2>/dev/null || true
    
    # Pull latest changes
    print_step "Pulling latest code..."
    if ! git pull --rebase origin master; then
        print_warning "Git pull failed. Trying to resolve..."
        git fetch origin
        git reset --hard origin/master
    fi
    
    # Restore local changes
    git stash pop 2>/dev/null || true
    
    # Rebuild
    echo ""
    cmd_build
    
    # Start
    echo ""
    cmd_start
    
    print_success "Update completed!"
}

# Check health
cmd_health() {
    print_header
    echo "Health Check:"
    echo ""
    
    # Container status
    if container_running; then
        print_success "Container is running"
        
        status=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
        echo "  Status: $status"
        
        health=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "not available")
        echo "  Health: $health"
        
        # Show last health check result
        last_check=$(docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$CONTAINER_NAME" 2>/dev/null | tail -1)
        if [[ -n "$last_check" ]]; then
            echo "  Last check: $last_check"
        fi
    else
        print_error "Container is not running"
    fi
    
    echo ""
    echo "Resource Usage:"
    if container_running; then
        docker stats "$CONTAINER_NAME" --no-stream --format "  Memory: {{.MemUsage}}\n  CPU: {{.CPUPerc}}\n  Network: {{.NetIO}}" 2>/dev/null || echo "  Stats not available"
    else
        echo "  Container not running"
    fi
    
    echo ""
    check_resources
}

# Show stats
cmd_stats() {
    docker stats "$CONTAINER_NAME"
}

# Backup persistent data
cmd_backup() {
    print_header
    backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    backup_dir="${backup_name}"
    
    echo "Creating backup: ${backup_name}.tar.gz"
    mkdir -p "$backup_dir"
    
    # Copy data directories
    [[ -d "credentials" ]] && cp -r credentials "$backup_dir/" && print_success "Backed up credentials"
    [[ -d "instances" ]] && cp -r instances "$backup_dir/" && print_success "Backed up instances"
    [[ -d "logs" ]] && cp -r logs "$backup_dir/" && print_success "Backed up logs"
    [[ -d "maps" ]] && cp -r maps "$backup_dir/" && print_success "Backed up maps"
    [[ -f ".env" ]] && cp .env "$backup_dir/" && print_success "Backed up .env"
    
    # Create tarball
    tar -czf "${backup_name}.tar.gz" "$backup_dir"
    rm -rf "$backup_dir"
    
    local size=$(du -h "${backup_name}.tar.gz" | cut -f1)
    print_success "Backup created: ${backup_name}.tar.gz (${size})"
}

# Run diagnostics
cmd_diagnose() {
    print_header
    echo "Running Diagnostics..."
    echo ""
    
    local issues=0
    
    # Check Docker
    print_step "Checking Docker..."
    if docker info > /dev/null 2>&1; then
        print_success "Docker is running"
        docker_version=$(docker --version)
        echo "  $docker_version"
    else
        print_error "Docker is not running"
        ((issues++))
    fi
    echo ""
    
    # Check Docker Compose
    print_step "Checking Docker Compose..."
    if docker compose version > /dev/null 2>&1; then
        print_success "Docker Compose is available"
        compose_version=$(docker compose version --short)
        echo "  Version: $compose_version"
    else
        print_error "Docker Compose is not available"
        ((issues++))
    fi
    echo ""

    # Check BuildKit
    print_step "Checking Docker BuildKit..."
    if docker buildx version > /dev/null 2>&1; then
        print_success "Docker BuildKit is available"
        buildx_version=$(docker buildx version 2>/dev/null | head -1)
        echo "  $buildx_version"
        echo "  DOCKER_BUILDKIT=$DOCKER_BUILDKIT"
    else
        print_warning "Docker BuildKit not available (builds may be slower)"
    fi
    echo ""

    # Check environment file
    print_step "Checking environment file..."
    if check_env_file; then
        print_success ".env file is configured"
    else
        print_error ".env file has issues"
        ((issues++))
    fi
    echo ""
    
    # Check compose file
    print_step "Checking docker-compose.yml..."
    if [[ -f "$COMPOSE_FILE" ]]; then
        if docker compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
            print_success "docker-compose.yml is valid"
        else
            print_error "docker-compose.yml has syntax errors"
            docker compose -f "$COMPOSE_FILE" config 2>&1 | head -10
            ((issues++))
        fi
    else
        print_error "docker-compose.yml not found"
        ((issues++))
    fi
    echo ""
    
    # Check Dockerfile
    print_step "Checking Dockerfile..."
    if [[ -f "Dockerfile" ]]; then
        print_success "Dockerfile exists"
    else
        print_error "Dockerfile not found"
        ((issues++))
    fi
    echo ""
    
    # Check data directories
    print_step "Checking data directories..."
    for dir in credentials instances logs maps; do
        if [[ -d "$dir" ]]; then
            echo "  ✓ $dir/ exists"
        else
            echo "  ⚠ $dir/ missing (will be created on start)"
        fi
    done
    echo ""
    
    # Check system resources
    print_step "Checking system resources..."
    check_resources
    echo ""
    
    # Check network connectivity
    print_step "Checking network connectivity..."
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_success "Internet connectivity OK"
    else
        print_warning "Cannot reach internet (may affect npm install)"
    fi
    
    if ping -c 1 registry.npmjs.org > /dev/null 2>&1; then
        print_success "NPM registry reachable"
    else
        print_warning "Cannot reach NPM registry"
    fi
    echo ""
    
    # Check container status
    print_step "Checking container status..."
    if container_exists; then
        if container_running; then
            print_success "Container is running"
            
            # Check for recent errors in logs
            error_count=$(docker compose -f "$COMPOSE_FILE" logs --tail=100 2>&1 | grep -ciE "(error|exception|fatal)" || true)
            if [[ $error_count -gt 0 ]]; then
                print_warning "Found $error_count error(s) in recent logs"
                echo "  Run '$0 logs-error' to see error logs"
            fi
        else
            print_warning "Container exists but is not running"
        fi
    else
        print_info "Container does not exist (not built yet)"
    fi
    echo ""
    
    # Summary
    echo "========================================"
    if [[ $issues -eq 0 ]]; then
        print_success "No critical issues found!"
    else
        print_error "Found $issues issue(s) that need attention"
    fi
    echo ""
}

# Fix IPv6 issues
cmd_fix_ipv6() {
    print_header
    print_warning "This will modify system settings to disable IPv6."
    read -p "Continue? (y/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    echo ""
    print_step "Disabling IPv6..."
    
    # Check if already configured
    if grep -q "net.ipv6.conf.all.disable_ipv6 = 1" /etc/sysctl.conf 2>/dev/null; then
        print_info "IPv6 already disabled in sysctl.conf"
    else
        # Add sysctl settings
        sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'

# Disable IPv6 for Docker compatibility (added by HondaBot helper)
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
EOF
        print_success "Added IPv6 disable settings to sysctl.conf"
    fi
    
    # Apply settings
    sudo sysctl -p 2>/dev/null || true
    print_success "Applied sysctl settings"
    
    # Configure Docker daemon
    print_step "Configuring Docker daemon..."
    sudo mkdir -p /etc/docker
    
    if [[ -f /etc/docker/daemon.json ]]; then
        print_warning "Docker daemon.json already exists, backing up..."
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
    fi
    
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
    "ipv6": false,
    "ip6tables": false,
    "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF
    print_success "Configured Docker daemon"
    
    # Restart Docker
    print_step "Restarting Docker..."
    sudo systemctl restart docker
    
    sleep 2
    if docker info > /dev/null 2>&1; then
        print_success "Docker restarted successfully"
    else
        print_error "Docker failed to restart. Check: sudo journalctl -u docker -n 50"
        exit 1
    fi
    
    echo ""
    print_success "IPv6 disabled. You may need to rebuild the container."
}

# Fix permissions
cmd_fix_permissions() {
    print_header
    echo "Fixing file permissions..."
    
    # Make scripts executable
    chmod +x docker-helper.sh 2>/dev/null && print_success "Made docker-helper.sh executable"
    chmod +x *.sh 2>/dev/null || true
    
    # Fix data directory permissions
    for dir in credentials instances logs maps; do
        if [[ -d "$dir" ]]; then
            chmod -R 755 "$dir" 2>/dev/null && print_success "Fixed permissions for $dir/"
        fi
    done
    
    print_success "Permissions fixed!"
}

# Validate configuration
cmd_validate() {
    print_header
    echo "Validating configuration..."
    echo ""
    
    local valid=1
    
    # Validate docker-compose.yml
    print_step "Validating docker-compose.yml..."
    if docker compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
        print_success "docker-compose.yml is valid"
    else
        print_error "docker-compose.yml validation failed:"
        docker compose -f "$COMPOSE_FILE" config 2>&1
        valid=0
    fi
    echo ""
    
    # Validate .env
    print_step "Validating .env..."
    if check_env_file; then
        print_success ".env is configured"
    else
        valid=0
    fi
    echo ""
    
    # Check package.json
    print_step "Checking package.json..."
    if [[ -f "package.json" ]]; then
        if node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
            print_success "package.json is valid JSON"
        else
            print_error "package.json is invalid"
            valid=0
        fi
    else
        print_error "package.json not found"
        valid=0
    fi
    echo ""
    
    # Check tsconfig.json
    print_step "Checking tsconfig.json..."
    if [[ -f "tsconfig.json" ]]; then
        if node -e "JSON.parse(require('fs').readFileSync('tsconfig.json'))" 2>/dev/null; then
            print_success "tsconfig.json is valid JSON"
        else
            print_error "tsconfig.json is invalid (may have comments - that's OK for TypeScript)"
        fi
    fi
    echo ""
    
    if [[ $valid -eq 1 ]]; then
        print_success "All configurations are valid!"
    else
        print_error "Some configurations need attention"
        exit 1
    fi
}

# Update system packages
cmd_update_packages() {
    print_header
    echo "Update System Packages"
    echo ""
    print_info "This will update system packages on your Raspberry Pi."
    echo ""
    echo "Options:"
    echo "  1) Update package lists only (apt update)"
    echo "  2) Update and upgrade all packages (apt update && apt upgrade)"
    echo "  3) Full upgrade with Docker updates (apt update && apt full-upgrade)"
    echo "  4) Cancel"
    echo ""
    read -p "Select option (1-4): " choice

    case "$choice" in
        1)
            print_step "Updating package lists..."
            sudo apt update
            echo ""
            print_success "Package lists updated!"
            echo ""
            print_info "Upgradable packages:"
            apt list --upgradable 2>/dev/null | head -20 || true
            ;;
        2)
            print_step "Updating package lists..."
            sudo apt update
            echo ""
            print_step "Upgrading packages..."
            sudo apt upgrade -y
            echo ""
            print_success "Packages upgraded!"
            ;;
        3)
            print_step "Updating package lists..."
            sudo apt update
            echo ""
            print_step "Performing full upgrade..."
            sudo apt full-upgrade -y
            echo ""
            print_step "Cleaning up old packages..."
            sudo apt autoremove -y
            sudo apt autoclean
            echo ""
            print_success "Full upgrade completed!"
            echo ""
            print_warning "A reboot may be required for kernel updates."
            echo "  Check with: sudo needrestart 2>/dev/null || echo 'Install needrestart for reboot check'"
            ;;
        4|*)
            echo "Cancelled."
            return 0
            ;;
    esac

    # Show Docker version after update
    echo ""
    print_info "Current Docker version:"
    docker --version 2>/dev/null || echo "  Docker not installed"
}

# Show version
cmd_version() {
    print_header
    echo ""
    echo "Script Version: $SCRIPT_VERSION"
    echo ""

    if [[ -f "package.json" ]]; then
        app_version=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
        echo "HondaBot Version: $app_version"
    fi

    echo ""
    docker --version 2>/dev/null || echo "Docker: not installed"
    docker compose version 2>/dev/null || echo "Docker Compose: not installed"
}

# Main script
check_docker

case "${1:-help}" in
    build)
        cmd_build
        ;;
    build-verbose)
        cmd_build_verbose
        ;;
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    rebuild)
        cmd_rebuild
        ;;
    logs)
        cmd_logs
        ;;
    logs-tail)
        cmd_logs_tail
        ;;
    logs-error)
        cmd_logs_error
        ;;
    status)
        cmd_status
        ;;
    shell)
        cmd_shell
        ;;
    exec)
        shift
        cmd_exec "$@"
        ;;
    clean)
        cmd_clean
        ;;
    clean-all)
        cmd_clean_all
        ;;
    update)
        cmd_update
        ;;
    health)
        cmd_health
        ;;
    stats)
        cmd_stats
        ;;
    backup)
        cmd_backup
        ;;
    diagnose)
        cmd_diagnose
        ;;
    fix-ipv6)
        cmd_fix_ipv6
        ;;
    fix-permissions)
        cmd_fix_permissions
        ;;
    validate)
        cmd_validate
        ;;
    update-packages)
        cmd_update_packages
        ;;
    version)
        cmd_version
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

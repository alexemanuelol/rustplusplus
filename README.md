# HondaBot v2.1

A NodeJS Discord Bot that uses the [rustplus.js](https://github.com/liamcottle/rustplus.js) library to utilize the power of the Rust+ Companion App with additional Quality-of-Life features. Modified from [rustplusplus](https://github.com/alexemanuelol/rustplusplus).

## Features

- Receive notifications for in-game events (Patrol Helicopter, Cargo Ship, Chinook 47, Oil Rigs triggered)
- Control Smart Switches or Groups of Smart Switches via Discord or In-Game Team Chat
- Setup Smart Alarms to notify in Discord or In-Game Team Chat whenever they are triggered
- Use Storage Monitors to keep track of Tool Cupboard Upkeep or Large Wooden Box/Vending Machine content
- View server information, ongoing events, and team member status in the Information Text Channel
- Communicate with teammates from Discord to In-Game and vice versa
- Keep track of other teams on the server with the Battlemetrics Player Tracker
- Many QoL commands that can be used In-Game or from Discord

For detailed documentation, see the [full documentation](docs/documentation.md).

## Prerequisites

- Raspberry Pi 4 (2GB+ RAM recommended)
- Raspberry Pi OS (64-bit)
- Docker and Docker Compose
- Git
- Node.js 22+ (handled by Docker)
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Rust+ Credentials ([rustplusplus credential application](https://github.com/alexemanuelol/rustplusplus-credential-application))

## Installation

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Log out and back in for group changes to take effect.

### 2. Clone the Repository

```bash
git clone https://github.com/ghempy53/HondaBot.git
cd HondaBot
```

### 3. Create Environment File

```bash
cp .env.example .env
nano .env
```

Add your Discord credentials:

```env
RPP_DISCORD_CLIENT_ID=your_client_id_here
RPP_DISCORD_TOKEN=your_bot_token_here
RPP_DISCORD_USERNAME=your_discord_username
TZ=America/New_York
```

### 4. Fix IPv6 Issues (Recommended)

Raspberry Pi often has IPv6 connectivity issues with Docker. Run the helper script to fix this:

```bash
chmod +x docker-helper.sh
./docker-helper.sh fix-ipv6
```

Or manually disable IPv6:

```bash
# Add to /etc/sysctl.conf
sudo nano /etc/sysctl.conf
```

```
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
```

```bash
# Apply changes
sudo sysctl -p

# Configure Docker daemon
sudo nano /etc/docker/daemon.json
```

```json
{
    "ipv6": false,
    "ip6tables": false,
    "dns": ["8.8.8.8", "8.8.4.4"]
}
```

```bash
sudo systemctl restart docker
```

### 5. Build and Start

```bash
./docker-helper.sh build
./docker-helper.sh start
```

## Docker Helper Commands

| Command | Description |
|---------|-------------|
| `./docker-helper.sh build` | Build the Docker image |
| `./docker-helper.sh build-verbose` | Build with full output (for debugging) |
| `./docker-helper.sh start` | Start the container |
| `./docker-helper.sh stop` | Stop the container |
| `./docker-helper.sh restart` | Restart the container |
| `./docker-helper.sh rebuild` | Stop, rebuild, and start (fresh build) |
| `./docker-helper.sh logs` | View logs (follow mode) |
| `./docker-helper.sh logs-tail` | View last 100 log lines |
| `./docker-helper.sh logs-error` | Show only error logs |
| `./docker-helper.sh status` | Show container status |
| `./docker-helper.sh health` | Check health and resource usage |
| `./docker-helper.sh stats` | Show live resource usage |
| `./docker-helper.sh shell` | Open shell in container |
| `./docker-helper.sh exec <cmd>` | Execute a command in the container |
| `./docker-helper.sh backup` | Backup persistent data |
| `./docker-helper.sh update` | Pull latest code and rebuild |
| `./docker-helper.sh clean` | Remove container and image |
| `./docker-helper.sh clean-all` | Remove everything including volumes |
| `./docker-helper.sh diagnose` | Run full diagnostic check |
| `./docker-helper.sh fix-ipv6` | Apply IPv6 fix for Raspberry Pi |
| `./docker-helper.sh fix-permissions` | Fix file permissions |
| `./docker-helper.sh validate` | Validate configuration files |
| `./docker-helper.sh version` | Show version information |

## Manual Docker Commands

If you prefer not to use the helper script:

```bash
# Build
docker compose build --no-cache

# Start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Restart
docker compose restart
```

## Resource Configuration

The default configuration is optimized for Raspberry Pi 4 with 4GB RAM. Adjust the memory limits in `docker-compose.yml` based on your Pi model:

| Pi 4 Model | Memory Limit | CPU Limit |
|------------|--------------|-----------|
| 1GB | 768m | 2.0 |
| 2GB | 1024m | 3.0 |
| 4GB | 1536m | 3.0 |
| 8GB | 2048m | 4.0 |

## Updating

To update HondaBot to the latest version:

```bash
./docker-helper.sh update
```

Or manually:

```bash
./docker-helper.sh stop
git pull origin master
./docker-helper.sh build
./docker-helper.sh start
```

## Persistent Data

The following directories are mounted as volumes and persist across container restarts:

| Directory | Purpose |
|-----------|---------|
| `./credentials` | FCM credentials for Rust+ |
| `./instances` | Server and guild configurations |
| `./logs` | Application logs |
| `./maps` | Generated map images |

## Backup

Create a backup of all persistent data:

```bash
./docker-helper.sh backup
```

This creates a timestamped tarball (e.g., `backup_20250126_120000.tar.gz`) containing credentials, instances, logs, maps, and your `.env` file.

## Troubleshooting

### Container won't start

Check the logs for errors:

```bash
./docker-helper.sh logs-tail
```

### Build fails with network errors

Run the IPv6 fix:

```bash
./docker-helper.sh fix-ipv6
```

### Out of memory errors

Reduce the memory limit in `docker-compose.yml` or add swap space:

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Container keeps restarting

Check health status and logs:

```bash
./docker-helper.sh health
./docker-helper.sh logs-tail
```

### Run diagnostics

For comprehensive troubleshooting:

```bash
./docker-helper.sh diagnose
```

## Discord Slash Commands

| Command | Description |
|---------|-------------|
| `/alarm` | Operations on Smart Alarms |
| `/alias` | Create an alias for a command/sequence of characters |
| `/blacklist` | Blacklist a user from using the bot |
| `/cctv` | Get CCTV camera codes for monuments |
| `/craft` | Display the cost to craft an item |
| `/credentials` | Setup Credentials |
| `/decay` | Display the decay time of an item |
| `/help` | Get help message |
| `/item` | Get the details of an item |
| `/leader` | Transfer leadership |
| `/map` | Display the In-Game Map |
| `/market` | Search for or subscribe to items in vending machines |
| `/players` | Get Battlemetrics data on all connected players |
| `/recycle` | Display the output of recycling an item |
| `/research` | Display the cost to research an item |
| `/reset` | Reset Discord Channels |
| `/role` | Setup a specific role to use the bot |
| `/storagemonitor` | Operations on Storage Monitors |
| `/switch` | Operations on Smart Switches |
| `/upkeep` | Get the upkeep cost of an item |
| `/uptime` | Get the current uptime |
| `/voice` | Voice channel operations |

## In-Game Commands

| Command | Description |
|---------|-------------|
| `!afk` | Display AFK teammates |
| `!alive` | Display who has been alive longest |
| `!cargo` | Display Cargoship information |
| `!chinook` | Display Chinook 47 information |
| `!connections` | Display latest team connections |
| `!craft` | Display the cost to craft an item |
| `!deaths` | Display latest deaths |
| `!decay` | Display the decay time of an item |
| `!events` | Get recent events |
| `!heli` | Get Patrol Helicopter information |
| `!large` | Get Large Oil Rig information |
| `!leader` | Transfer leadership |
| `!marker` | Set markers to navigate to |
| `!market` | Search for items in vending machines |
| `!mute` | Mute bot In-Game |
| `!notes` | Add notes |
| `!offline` | Display offline teammates |
| `!online` | Display online teammates |
| `!players` | Get Battlemetrics player information |
| `!pop` | Get server population |
| `!prox` | Display nearby teammates |
| `!recycle` | Display recycling output |
| `!research` | Display research cost |
| `!send` | Send a message to Discord |
| `!small` | Get Small Oil Rig information |
| `!steamid` | Get teammate steamid |
| `!team` | Get team information |
| `!time` | Get In-Game time |
| `!timer` | Setup timers |
| `!tr` | Translate text |
| `!tts` | Text-To-Speech |
| `!unmute` | Unmute bot In-Game |
| `!upkeep` | Check Tool Cupboard upkeep |
| `!uptime` | Display uptime |
| `!vendor` | Get Traveling Vendor information |
| `!wipe` | Display time since wipe |

## Credentials

Get your Rust+ credentials by running the [rustplusplus credential application](https://github.com/alexemanuelol/rustplusplus-credential-application) on Windows.

## Version Information

- **HondaBot**: v2.1
- **Node.js**: 22 (via Docker)
- **Docker Helper Script**: v2.1

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Credits

- Original project: [rustplusplus](https://github.com/alexemanuelol/rustplusplus) by [alexemanuelol](https://github.com/alexemanuelol)
- Rust+ library: [rustplus.js](https://github.com/liamcottle/rustplus.js) by [liamcottle](https://github.com/liamcottle)

#!/bin/bash
# ubuntu_install.sh
# Automatically clones repository and starts the bot using pm2 interactively

set -e

REPO_URL="https://github.com/alexemanuelol/rustplusplus.git"
INSTALL_DIR="$HOME/rustplusplus"

echo "=== Rustplusplus Ubuntu Installer ==="

echo "Checking for required dependencies..."
sudo apt-get update
sudo apt-get install -y git curl build-essential

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
    echo "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
fi

if [ -d "$INSTALL_DIR" ]; then
    echo "Directory $INSTALL_DIR already exists."
else
    echo "Cloning rustplusplus..."
    git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

echo "Installing NPM dependencies..."
npm install

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "--- Discord Credentials Setup ---"
    read -p "Enter your RPP_DISCORD_CLIENT_ID: " DISCORD_CLIENT_ID
    read -p "Enter your RPP_DISCORD_TOKEN: " DISCORD_TOKEN

    cat <<ENV > "$ENV_FILE"
RPP_DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
RPP_DISCORD_TOKEN=$DISCORD_TOKEN
ENV
    echo "Credentials saved to $ENV_FILE"
else
    echo "Credentials already exist in $ENV_FILE"
fi

UPDATE_SCRIPT="$INSTALL_DIR/ubuntu_update.sh"
cat << 'UPSCRIPT' > "$UPDATE_SCRIPT"
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Fetch latest changes
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Updates found. Sending restart notification..."

    if [ -f "notify_restart.js" ]; then
        node notify_restart.js
        sleep 5
    fi

    git reset --hard origin/master
    npm install

    pm2 restart rustplusplus
    echo "Update complete."
fi
UPSCRIPT

chmod +x "$UPDATE_SCRIPT"

NOTIFY_SCRIPT="$INSTALL_DIR/notify_restart.js"
cat << 'NJSCRIPT' > "$NOTIFY_SCRIPT"
require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.on('ready', async () => {
    try {
        const guilds = client.guilds.cache;
        for (const [id, guild] of guilds) {
            const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
            const infoChannel = channels.find(c => c.name === 'information' && c.parent && c.parent.name === 'rustplusplus');
            if (infoChannel) {
                await infoChannel.send('⚠️ **Notice:** The bot is restarting to apply a new update. It will be back shortly!').catch(() => {});
            }
        }
    } catch (e) {
        console.error("Error sending restart notifications:", e);
    }
    client.destroy();
});
client.login(process.env.RPP_DISCORD_TOKEN).catch(()=>console.log("Could not login to notify"));
NJSCRIPT

CRON_JOB="*/5 * * * * $UPDATE_SCRIPT >> $INSTALL_DIR/logs/auto_update.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "ubuntu_update.sh"; echo "$CRON_JOB") | crontab -
echo "Cron job added to check for updates every 5 minutes."

mkdir -p "$INSTALL_DIR/logs"

echo "Starting bot with PM2..."
npm install dotenv --no-save
pm2 start npm --name "rustplusplus" -- run start
pm2 save
pm2 startup | grep "sudo" | bash || true

echo "=== Installation Complete ==="
echo "Bot is now running in the background via PM2."
echo "Use 'pm2 logs rustplusplus' to view logs."

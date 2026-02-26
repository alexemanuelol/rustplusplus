module.exports = {
    apps: [
        {
            name: 'rustplusplus',
            script: './index.ts',
            interpreter: './node_modules/.bin/ts-node',
            instances: 1,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/app/logs/pm2-error.log',
            out_file: '/app/logs/pm2-out.log',
            merge_logs: true,
        },
    ],
};

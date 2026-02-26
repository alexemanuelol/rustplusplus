const amqp = require("amqplib")

const EVENTS_ENABLED = process.env.RPP_EVENTS_ENABLED === "true";

/**
 * @type {import('amqplib').Channel}
 */
let channel = null

async function requiresRabbit() {
    if (!EVENTS_ENABLED) return null
    if (channel) return channel

    const conn = await amqp.connect({
        protocol: "amqp",
        hostname: process.env.RABBITMQ_HOST || "rabbitmq",
        port: parseInt(process.env.RABBITMQ_PORT || "5672"),
        username: process.env.RABBITMQ_USER || "guest",
        password: process.env.RABBITMQ_PASSWORD || "guest",
        clientProperties: {
            connection_name: process.env.RABBITMQ_CONNECTION_NAME || "rpp-service",
        }
    })

    channel = await conn.createChannel()

    await channel.assertQueue("rustplus_alarms", { durable: true })

    console.log("Connected to RabbitMQ")

    return channel
}

async function sendAlarmToBackend(alarm) {
    try {
        if (!EVENTS_ENABLED) return

        const ch = await requiresRabbit()
        
        ch.sendToQueue("rustplus_alarms", Buffer.from(JSON.stringify(alarm)), {
            persistent: true,
            timestamp: Date.now(),
        })

        console.log(`Alarm sent to backend: \n${JSON.stringify(alarm, null, 2)}`)
    } catch (err) {
        console.error("Failed to send alarm:", err)
        channel = null
    }
}

module.exports = {
    sendAlarmToBackend,
}

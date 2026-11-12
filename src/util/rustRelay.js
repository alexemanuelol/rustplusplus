/*
    Copyright (C) 2026 rustplusplus contributors

    Rust+ relay connection.

    Since the 2026-11-05 Rust update ("RustRelay - use Fleck instead of websocket-sharp") game
    servers drop direct ws://<ip>:<app.port> connections. Clients connect through the
    Facepunch relay instead:

        wss://companion-rust.facepunch.com/socket/<relayServerId>?v=<ms>
        subprotocols: ["rustplus.auth.v1", base64url(<Rust+ auth token>)]
        origin:       https://app.playrust.com

    - relayServerId is the "id" field of the in-game pairing notification. It is stored on the
      server entry when pairing and stays the same across wipes.
    - The auth token is the Rust+ (Steam login) token from the credentials app. It is stored per
      steamId in the credentials file and is valid for ~14 days.

    connect() mirrors @liamcottle/rustplus.js connect() (same events and seq callback handling),
    only the address and handshake differ.
*/

const Fs = require('fs');
const Path = require('path');

const InstanceUtils = require('./instanceUtils.js');

/* Resolve ws/protobufjs from the library's own location so versions always match it. */
const LIB_DIR = Path.dirname(require.resolve('@liamcottle/rustplus.js'));
const WebSocket = require(require.resolve('ws', { paths: [LIB_DIR] }));
const protobuf = require(require.resolve('protobufjs', { paths: [LIB_DIR] }));
const PROTO_PATH = Path.join(LIB_DIR, 'rustplus.proto');

const RELAY_HOST = 'companion-rust.facepunch.com';
const RELAY_ORIGIN = 'https://app.playrust.com';
const RELAY_SUBPROTOCOL = 'rustplus.auth.v1';

/*
    Entity ids are 64-bit network ids on the game server, but the bundled rustplus.proto declares
    entityId as uint32 in AppRequest and AppEntityChanged. On servers where ids exceed 4294967295 the
    id is truncated when encoded, so every smart device is reported as not_found (issue #544).
    The proto text is widened to uint64 in memory when it is loaded, so the library's own file is
    left untouched and the patch adapts if the library's proto changes (no-op if nothing matches).
    Only AppRequest/AppEntityChanged are changed; AppCameraRays.Entity.entityId is left as is.
*/
async function loadProtoRoot() {
    let source = await Fs.promises.readFile(PROTO_PATH, 'utf8');
    source = source.replace(/message\s+(?:AppRequest|AppEntityChanged)\s*\{[^}]*\}/g,
        block => block.replace(/\buint32(\s+entityId\s*=)/, 'uint64$1'));

    const root = new protobuf.Root();
    protobuf.parse(source, root);
    root.resolveAll();
    return root;
}

/* uint64 fields decode to Long objects; the rest of the bot expects plain numbers for entity ids. */
function longToNumber(value) {
    return (value && typeof value === 'object' && typeof value.toNumber === 'function') ? value.toNumber() : value;
}

function normaliseMessage(message) {
    const entityChanged = message.broadcast ? message.broadcast.entityChanged : null;
    if (entityChanged) entityChanged.entityId = longToNumber(entityChanged.entityId);
    return message;
}

function b64url(str) {
    return Buffer.from(str, 'utf8').toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* Accept the token as pasted from the credentials callback URL (it may still be URL-encoded). */
function normaliseAuthToken(token) {
    if (typeof token !== 'string') return null;
    let normalised = token.trim();
    if (normalised.includes('%')) {
        try { normalised = decodeURIComponent(normalised); } catch (e) { /* keep as is */ }
    }
    return normalised.length > 0 ? normalised : null;
}

/* Token format: base64(json payload).signature, payload = { steamId, version, iss, exp } */
function parseAuthToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString('utf8'));
        return {
            steamId: payload.steamId ? `${payload.steamId}` : null,
            issuedAt: Number(payload.iss) || null,
            expiresAt: Number(payload.exp) || null
        };
    }
    catch (e) {
        return null;
    }
}

/* Relay details for a server/player, or null when the server has no relay id or the player has
   no auth token (caller then falls back to a direct connection). */
function resolve(guildId, serverIp, appPort, steamId) {
    const Client = require('../../index.ts');
    const instance = Client.client.getInstance(guildId);
    if (!instance) return null;

    const serverKey = `${serverIp}-${appPort}`;
    let relayServerId = null;

    const server = instance.serverList ? instance.serverList[serverKey] : null;
    if (server && server.relayServerId) relayServerId = server.relayServerId;

    if (!relayServerId && instance.serverListLite && instance.serverListLite[serverKey]) {
        for (const lite of Object.values(instance.serverListLite[serverKey])) {
            if (lite && lite.relayServerId) {
                relayServerId = lite.relayServerId;
                break;
            }
        }
    }
    if (!relayServerId) return null;

    const credentials = InstanceUtils.readCredentialsFile(guildId);
    const credential = credentials ? credentials[`${steamId}`] : null;
    const authToken = credential ? normaliseAuthToken(credential.rustplus_auth_token) : null;
    if (!authToken) return null;

    const parsed = parseAuthToken(authToken);
    return {
        relayServerId: relayServerId,
        authToken: authToken,
        expiresAt: parsed ? parsed.expiresAt : null
    };
}

function connect(rustplus, relay) {
    loadProtoRoot().then((root) => {
        /* make sure existing connection is disconnected before connecting again */
        if (rustplus.websocket) rustplus.disconnect();

        rustplus.AppRequest = root.lookupType('rustplus.AppRequest');
        rustplus.AppMessage = root.lookupType('rustplus.AppMessage');

        rustplus.emit('connecting');

        const address = `wss://${RELAY_HOST}/socket/${relay.relayServerId}?v=${Date.now()}`;
        rustplus.websocket = new WebSocket(address, [RELAY_SUBPROTOCOL, b64url(relay.authToken)], {
            origin: RELAY_ORIGIN
        });

        rustplus.websocket.on('open', () => {
            rustplus.emit('connected');
        });

        rustplus.websocket.on('error', (e) => {
            rustplus.emit('error', e);
        });

        rustplus.websocket.on('message', (data, isBinary) => {
            /* The relay may send text frames; only binary frames are protobuf AppMessages. */
            if (!isBinary) return;

            const message = rustplus.AppMessage.decode(data);

            if (message.response && message.response.seq && rustplus.seqCallbacks[message.response.seq]) {
                const callback = rustplus.seqCallbacks[message.response.seq];
                const result = callback(message);
                delete rustplus.seqCallbacks[message.response.seq];
                if (result) return;
            }

            rustplus.emit('message', normaliseMessage(rustplus.AppMessage.decode(data)));
        });

        rustplus.websocket.on('close', () => {
            rustplus.emit('disconnected');
        });
    }).catch((e) => {
        rustplus.emit('error', e);
    });
}

/*
    Since the relay change, pairing notifications may no longer carry ip/port, only the relay
    server id ("id"). ip/port are only used as the server's key in the instance file, so when they
    are missing we reuse the entry already paired with the same relay id, or key it by the relay id.
*/
function pairingAddress(instance, body) {
    if (body.ip && body.port) {
        return { serverIp: `${body.ip}`, appPort: `${body.port}`, serverId: `${body.ip}-${body.port}` };
    }
    if (!body.id) return null;

    for (const [serverId, server] of Object.entries(instance.serverList || {})) {
        if (server && server.serverIp && server.relayServerId === body.id) {
            return { serverIp: server.serverIp, appPort: server.appPort, serverId: serverId };
        }
    }
    for (const [serverId, lites] of Object.entries(instance.serverListLite || {})) {
        for (const lite of Object.values(lites || {})) {
            if (lite && lite.serverIp && lite.relayServerId === body.id) {
                return { serverIp: lite.serverIp, appPort: lite.appPort, serverId: serverId };
            }
        }
    }
    return { serverIp: 'relay', appPort: `${body.id}`, serverId: `relay-${body.id}` };
}

module.exports = { resolve, connect, pairingAddress, normaliseAuthToken, parseAuthToken };

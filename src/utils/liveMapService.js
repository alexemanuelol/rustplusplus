/**
 * Utility service to post RustPlus player data to the live map server.
 * Usage:
 * const { sendPlayerDataToMap } = require('./liveMapService');
 *
 * // Inside your rustplus update loop or command:
 * await sendPlayerDataToMap(rustplus.team.players);
 */

// If you have axios installed use it, otherwise native fetch (Node 18+)
// Assuming node 18+ for native fetch. If not, use 'node-fetch' or require('axios');

async function sendPlayerDataToMap(players) {
  // The default URL of the live map server we just created
  const MAP_SERVER_URL = process.env.MAP_SERVER_URL;
  if (!MAP_SERVER_URL) {
    console.error(
      "[LiveMapService] MAP_SERVER_URL environment variable is not set. Skipping live map update.",
    );
    return;
  }

  if (!players || !Array.isArray(players)) {
    console.error(
      "[LiveMapService] Invalid player data provided. Expected an array.",
    );
    return;
  }

  try {
    const response = await fetch(MAP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(players),
    });

    if (response.ok) {
      const result = await response.json();
      // Optional debug log:
      // console.log(`[LiveMapService] Successfully updated ${result.count} markers on the live map.`);
    } else {
      console.error(
        `[LiveMapService] Error posting to map server: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error(
      `[LiveMapService] Failed to reach live map server: ${error.message}`,
    );
  }
}

module.exports = {
  sendPlayerDataToMap,
};

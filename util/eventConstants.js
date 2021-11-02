module.exports = {
    /* Default 50 minutes before Cargo Ship Egress start */
    CARGO_SHIP_EGRESS_TIME_MS: 50 * 60 * 1000,

    /* Default 50 minutes before Bradley APC respawns */
    BRADLEY_APC_RESPAWN_TIME_MS: 60 * 60 * 1000,

    /* Default 120 minutes before locked crate at monument decay away */
    LOCKED_CRATE_DESPAWN_TIME_MS: 120 * 60 * 1000,

    /* Warn 20 minutes before locked crate at monument despawn */
    LOCKED_CRATE_DESPAWN_WARNING_TIME_MS: 20 * 60 * 1000,
}
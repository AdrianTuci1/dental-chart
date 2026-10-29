/**
 * Parses durations like '90d', '15m', '12h' into milliseconds; 0 when unparseable.
 */
function parseDurationMs(value) {
    const match = String(value || '').trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d|w|y)$/i);
    if (!match) {
        return 0;
    }

    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31536000000 };
    return parseFloat(match[1]) * units[match[2].toLowerCase()];
}

module.exports = { parseDurationMs };

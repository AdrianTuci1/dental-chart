import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

const unquote = (value) => {
    const trimmed = value.trim();

    if (trimmed.length >= 2 && (trimmed[0] === '"' || trimmed[0] === "'") && trimmed.at(-1) === trimmed[0]) {
        return trimmed.slice(1, -1);
    }

    return trimmed;
};

/**
 * Reads a KEY=VALUE file into an object. process.env is left alone, so a deploy script
 * can decide which entries it needs instead of exporting everything it reads.
 *
 * A missing file is not an error: .env.deploy is gitignored, and the CI workflows
 * generate theirs from repository secrets.
 */
export const readEnvFile = (file) => {
    if (!existsSync(file)) {
        return {};
    }

    const values = {};

    for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!line.trim() || line.trimStart().startsWith('#')) {
            continue;
        }

        const match = ASSIGNMENT.exec(line);
        if (match) {
            values[match[1]] = unquote(match[2]);
        }
    }

    return values;
};

/** Appends generated values to the end of an env file, one assignment per line. */
export const appendEnvFile = (file, values) => {
    const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);

    appendFileSync(file, `\n${lines.join('\n')}\n`);
};

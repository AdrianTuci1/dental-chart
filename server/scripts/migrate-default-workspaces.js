#!/usr/bin/env node

/**
 * Backfills the default workspace for accounts created before the workspace
 * structure existed, and attaches their pre-workspace patients to it.
 *
 * The migration is idempotent: an account is stamped with
 * MedicService.WORKSPACE_MIGRATION_VERSION once it has been processed.
 *
 * Usage:
 *   node scripts/migrate-default-workspaces.js            # apply
 *   node scripts/migrate-default-workspaces.js --dry-run  # report only
 */

require('dotenv').config();

const MedicRepository = require('../src/models/repositories/MedicRepository');
const MedicService = require('../src/services/MedicService');

const MIGRATION_VERSION = MedicService.WORKSPACE_MIGRATION_VERSION;
const dryRun = process.argv.includes('--dry-run');

const needsMigration = (medic) => !(medic.defaultClinicId && medic.workspaceMigrationVersion === MIGRATION_VERSION);

const run = async () => {
    const medicRepository = new MedicRepository();
    const medicService = new MedicService();

    const medics = await medicRepository.listMedics();
    const pending = medics.filter(needsMigration);

    console.log(`[migrate-default-workspaces] ${medics.length} account(s) scanned, ${pending.length} to process${dryRun ? ' (dry run)' : ''}`);

    let migrated = 0;
    let failed = 0;

    for (const medic of pending) {
        if (dryRun) {
            console.log(`  - would migrate ${medic.id} (${medic.email || 'no email'})`);
            migrated += 1;
            continue;
        }

        try {
            // eslint-disable-next-line no-await-in-loop
            const updated = await medicService.ensureDefaultWorkspace(medic.id);
            console.log(`  - migrated ${medic.id} (${medic.email || 'no email'}) -> default workspace ${updated?.defaultClinicId || 'none'}`);
            migrated += 1;
        } catch (error) {
            failed += 1;
            console.error(`  - FAILED ${medic.id}: ${error.message}`);
        }
    }

    console.log(`[migrate-default-workspaces] done: ${migrated} migrated, ${failed} failed, ${medics.length - pending.length} already up to date`);

    if (failed) {
        process.exitCode = 1;
    }
};

run().catch((error) => {
    console.error('[migrate-default-workspaces] aborted:', error.message);
    process.exitCode = 1;
});

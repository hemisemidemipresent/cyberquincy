// commands/roundStats.js — Discord slash command
// /roundstats [mode:r|ar]
//
// Generates the full per-round stats JSON (RBE, cash, bloon count, cumulative totals)
// and sends it as a file attachment.

'use strict';

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const {
    Enemy,
    ENEMIES,
    ENEMIES_THAT_CAN_BE_SUPER,
    formatName,
    getSpeedRamping,
    getHealthRamping,
} = require('../helpers/enemies');

const roundHelper   = require('../helpers/rounds');
const roundContents = require('../jsons/round_sets/round_contents.json');
const regularJson   = require('../jsons/round_sets/regular.json');

// Build a round -> roundLength lookup from the existing regular.json
const roundLengths = Object.fromEntries(
    regularJson.map(entry => [entry.round, entry.roundLength])
);

// ─── Parser helpers ───────────────────────────────────────────────────────────

const KNOWN_NAMES = [
    'red', 'blue', 'green', 'yellow', 'pink',
    'purple', 'white', 'black', 'zebra', 'lead', 'rainbow', 'ceramic',
    'moab', 'bfb', 'zomg', 'ddt', 'bad',
].sort((a, b) => b.length - a.length); // longest-first avoids shadowing

/**
 * Parse a round-contents string like "50 Fortified Camo Regrow Leads, 3 DDTs"
 * into an array of { enemy: Enemy, count: number }.
 */
function parseRoundString(roundStr, roundNum) {
    const entries = [];

    for (const part of roundStr.split(',').map(s => s.trim()).filter(Boolean)) {
        const m = part.match(/^(\d+)\s+(.+)$/);
        if (!m) continue;

        const count = parseInt(m[1], 10);
        let   desc  = m[2].toLowerCase();

        let fortified = false, camo = false, regrow = false;

        // Strip modifier flags left-to-right (JSON order is always Fortified > Camo > Regrow > Name)
        for (const mod of ['fortified', 'camo', 'regrow']) {
            const idx = desc.indexOf(mod + ' ');
            if (idx !== -1) {
                if (mod === 'fortified') fortified = true;
                if (mod === 'camo')      camo      = true;
                if (mod === 'regrow')    regrow    = true;
                desc = (desc.slice(0, idx) + desc.slice(idx + mod.length + 1)).trim();
            }
        }

        // Match remaining text to a known enemy name (singular or plural)
        let matched = null;
        for (const name of KNOWN_NAMES) {
            if (desc === name || desc === name + 's') { matched = name; break; }
        }
        if (!matched) continue;

        entries.push({ enemy: new Enemy(matched, roundNum, fortified, camo, regrow), count });
    }

    return entries;
}

// ─── Core stats builder ───────────────────────────────────────────────────────

/**
 * Build the full round-stats array for the given game mode.
 * @param {'r'|'ar'} mode
 * @returns {object[]}
 */
function buildRoundStats(mode = 'r') {
    const STARTING_CASH = 650;

    // Collect all round numbers for this mode, sorted ascending
    const roundNums = Object.keys(roundContents)
        .filter(k => k.startsWith(mode) && /^\d+$/.test(k.slice(mode.length)))
        .map(k => parseInt(k.slice(mode.length), 10))
        .sort((a, b) => a - b);

    let cumRBE  = 0;
    let cumCash = STARTING_CASH;

    const stats = [{
        round:          'Start',
        rbe:            0,
        cashThisRound:  STARTING_CASH,
        bloons:         0,
        roundLength:    0,
        cumulativeRBE:  0,
        cumulativeCash: STARTING_CASH,
    }];

    for (const r of roundNums) {
        const roundStr = roundContents[`${mode}${r}`];
        if (!roundStr) continue;

        let rbe    = 0;
        let cash   = 0;
        let bloons = 0;

        for (const { enemy, count } of parseRoundString(roundStr, r)) {
            const clump = enemy.clump(count);
            rbe    += clump.totalRBE();
            cash   += clump.cash();
            bloons += count;
        }

        cash    += 100 + r; // add end-of-round bonus; keep as float
        cumRBE  += rbe;
        cumCash += cash;

        stats.push({
            round:          String(r),
            rbe,
            cashThisRound:  Math.round(cash * 100) / 100,
            bloons,
            roundLength:    roundLengths[String(r)] ?? 0,
            cumulativeRBE:  cumRBE,
            cumulativeCash: Math.round(cumCash * 100) / 100,
        });
    }

    return stats;
}

// ─── Discord slash command ────────────────────────────────────────────────────

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roundstats')
        .setDescription('Get BTD6 round-by-round RBE and cash stats as a JSON file')
        .addStringOption(opt =>
            opt.setName('mode')
                .setDescription('Game mode — normal (r) or Alternate Bloon Rounds (ar)')
                .setRequired(false)
                .addChoices(
                    { name: 'Normal (r)',                  value: 'r'  },
                    { name: 'Alternate Bloon Rounds (ar)', value: 'ar' },
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const mode  = interaction.options.getString('mode') ?? 'r';
        const stats = buildRoundStats(mode);

        const json       = JSON.stringify(stats, null, 4);
        const buffer     = Buffer.from(json, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
            name: `round_stats_${mode}.json`,
        });

        const last  = stats[stats.length - 1];
        const embed = new EmbedBuilder()
            .setTitle(`📊 Round Stats — ${mode === 'ar' ? 'Alternate Bloon Rounds' : 'Normal'} mode`)
            .setColor(0x00b0f4)
            .addFields(
                { name: 'Rounds',          value: String(stats.length - 1),                  inline: true },
                { name: 'Cumulative RBE',  value: last.cumulativeRBE.toLocaleString(),        inline: true },
                { name: 'Cumulative Cash', value: `$${last.cumulativeCash.toLocaleString()}`, inline: true },
            )
            .setFooter({ text: 'Full data in the attached JSON' });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    },

    // Also exported for programmatic use, e.g. pre-generating JSON on startup:
    //   const { generateRoundStatsJson } = require('./commands/roundStats');
    //   fs.writeFileSync('stats_r.json',  generateRoundStatsJson('r'));
    //   fs.writeFileSync('stats_ar.json', generateRoundStatsJson('ar'));
    generateRoundStatsJson(mode = 'r') {
        return JSON.stringify(buildRoundStats(mode), null, 4);
    },
};
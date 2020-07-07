module.exports = {
    name: 'whois',
    aliases: ['who'],
    execute(message, args, client) {
        let random = Math.floor(Math.random() * 2);
        if (random === 0) {
            message.channel.send(
                '010 — **Long Range Tacks** — $100\n+4r (27)\n020 — **Super Range Tacks** — $225\n+4r (31), +1p (2)\n030 — **Blade Shooter** — $550\n_tacks_ replaced by _blades_ (1d, 6p, 1.19s, 31r, sharp type)\n040 — **Blade Maelstrom** — $2700\n**activated ability** (20s cooldown): emits _blades_ (1d, ∞p, 0.0333s, 2j, sharp type) for 3s\n050 — **Super Maelstrom** — $15000\n+1d (2), normal type\n**activated ability** (20s cooldown): emits _blades_ (2d, ∞p, 0.0333s, 4j, normal type) for 9s'
            );
        } else {
            message.channel.send('too many characters to send in 1 message', {
                files: [
                    'https://cdn.discordapp.com/attachments/615017143028809728/725939084597395466/Screenshot_734.png',
                ],
            });
        }
    },
};

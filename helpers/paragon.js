// conventions: topper conventions, x = deg
const { round } = require('../helpers/general');
module.exports = {
    /**
     * returns the new damage for specified degree
     * @param {int} d damage at degree 1
     * @param {int} x degree
     * @returns damage for that degree
     */
    getDmg(d, x) {
        if (x === 100) return d * 2 + 10;
        x--;
        let d_x = d * (1 + x * 0.01) + Math.floor(x / 10);
        return d_x;
    },
    /**
     * returns the new additional damage modifier for specified degree
     * @param {int} d additional damage at degree 1
     * @param {int} x degree
     * @returns additional damage modifier for that degree
     * works for stuff like addtional cd, md and fd
     */
    getDmgMod(d, x) {
        x--;
        let d_x = d * (1 + x * 0.01);
        return d_x;
    },
    /**
     * @param {int} d damage at degree 1
     * @param {int} md ADDITIONAL moab damage at degree 1
     * @param {int} bd ADDITIONAL boss damage at degree 1
     * @param {int} x degree
     */
    getDamages(d, md = 0, bd = 0, x) {
        const d_x = this.getDmg(d, x);
        const md_x = md ? this.getDmgMod(md, x) : 0;
        const bd_x = this.getDmgMod(bd, x);

        const mult = 1 + Math.floor(x / 20) * 0.25;

        const cum_d = d_x + md_x + bd_x; // cumulative damage to boss bloons

        const bd_tot = cum_d * mult;
        const ed_tot = 2 * bd_tot;

        return {
            d: round(d_x, 1),
            md: round(d_x + md_x, 1),
            bd: round(bd_tot, 1),
            ed: round(ed_tot, 1)
        };
    },
    getPiece(p, x) {
        x--;
        let p_x = p * (1 + x * 0.01) + x;
        return p_x;
    },
    getSpeed(s, x) {
        x--;
        let s_x = s / (1 + Math.sqrt(x * 50) * 0.01);
        return s_x;
    },
    /**
     *
     * @param {Object} obj The original object for damages
     * @param {int} x degree
     * @returns
     */
    getLevelledObj(obj, x) {
        let res = this.getDamages(obj.damage, obj.md, obj.bd, x);

        // ceramic damage is total, while fortified damage is handled as an additive.
        // this is because fortified can stack with normal bloons (lead), ceramics, and moab-class bloons
        // same applies to camo damage
        if (obj.cd) res.cd = round(this.getDmgMod(obj.cd, x) + res.d, 1);
        if (obj.fd) res.fd = round(this.getDmgMod(obj.fd, x), 1); // (additional) fortified damage
        if (obj.cad) res.cad = round(this.getDmgMod(obj.cad, x), 1); // (additional) camo damage

        if (obj.pierce) res.p = round(this.getPiece(obj.pierce, x), 1);
        if (obj.rate) res.s = round(this.getSpeed(obj.rate, x), 4); // secomds between attack needs more precision
        // coodown uses the same scaling formula as seconds between attacks
        if (obj.cooldown) res.cooldown = round(this.getSpeed(obj.cooldown, x), 1);
        return res;
    }
};

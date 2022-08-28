// conventions: topper conventions, x = deg

module.exports = {
    /**
     * returns the new damage for specified degree
     * @param {int} d damage at degree 1
     * @param {int} x degree
     * @returns damage for that degree
     * also works for addtional cd and fd
     */
    getDmg(d, x) {
        x--;
        let d_x = d * (1 + x * 0.01) + Math.floor(x / 10);
        return Math.floor(d_x * 100) / 100;
    },
    /**
     * @param {int} d damage at degree 1
     * @param {int} md ADDITIONAL moab damage at degree 1
     * @param {int} bd ADDITIONAL boss damage at degree 1
     * @param {int} x degree
     * @param {boolean} isDot whether attack does damage over time
     */
    getDamages(d, md = 0, bd = 0, x, isDot = false) {
        const d_x = this.getDmg(d, x);
        const md_x = md ? this.getDmg(md, x) : 0;
        const bd_x = this.getDmg(bd, x);

        const mult = 1 + Math.floor(x / 20) * 0.2;

        const cum_d = d_x + md_x + bd_x; // cumulative damage to boss bloons
        const cum_d2 = d_x + md_x + 2 * bd_x; // some elite / DoT dmg stats use this instead for some reason, then minusing the boss dmg

        const bd_tot = isDot ? cum_d * mult : cum_d2 * mult - bd_x;
        const ed_tot = x < 20 ? 2 * cum_d : 2 * cum_d2 * mult - bd_x;

        return {
            d: Math.round(d_x * 100) / 100,
            md: d_x + md_x,
            bd: Math.round(bd_tot * 100) / 100,
            ed: Math.round(ed_tot * 100) / 100
        };
    },
    getDamagesObj(obj, x, isDot = false) {
        let res;
        if (obj.damage) res = this.getDamages(obj.damage, obj.md, obj.bd, x, isDot);
        if (obj.pierce) res.p = this.getPiece(obj.pierce, x);

        if (obj.rate) res.s = this.getSpeed(obj.rate, x);
        return res;
    },
    getPiece(p, x) {
        x--;
        let p_x = p * (1 + x * 0.01) + x;
        return Math.round(p_x * 100) / 100;
    },
    getSpeed(s, x) {
        x--;
        let s_x = s / (1 + Math.sqrt(x * 50) * 0.01);
        return Math.round(s_x * 100) / 100;
    }
};

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
     * @param {boolean} isDot whether projectile is a Damage over Time projectile
     */
    getDamages(d, md = 0, bd = 0, x, isDot = false) {
        let d_x = this.getDmg(d, x);
        let md_x;
        if (md) md_x = this.getDmg(md, x);
        else md_x = 0;
        let bd_x = this.getDmg(bd, x);

        let bd_tot;
        if (isDot) bd_tot = (d_x + md_x + bd_x) * (1 + Math.floor(x / 20) * 0.2);
        else bd_tot = (d_x + md_x + 2 * bd_x) * (1 + Math.floor(x / 20) * 0.2) - bd_x;

        let ed_tot;
        if (x < 20) ed_tot = 2 * (d_x + md_x + bd_x);
        // for x < 20 Math.floor(x/20)*0.2 goes to 0 so the * (1 + Math.floor(x / 20) * 0.2) is basically just a *1
        else ed_tot = 2 * (d_x + md_x + 2 * bd_x) * (1 + Math.floor(x / 20) * 0.2) - bd_x;

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

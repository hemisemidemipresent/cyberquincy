// conventions: topper conventions, x = deg
const { round } = require('./general');
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
     * works for stuff like additional cd, md, fd, bd
     */
    getDmgMod(d, x) {
        if (x === 100) return d * 2;
        x--;
        let d_x = d * (1 + x * 0.01);
        return d_x;
    },
    /**
     * returns the new boss damage multiplier for specified degree
     * @param {int} x degree
     * @returns boss damage multiplier for that degree
     */
    getBossDmgMult(x) {
        return 1 + Math.floor(x / 20) * 0.25;
    },
    /**
     * @param {int} p pierce at degree 1
     * @param {int} x degree
     */
    getPierce(p, x) {
        if (x === 100) return p * 2 + 100;
        x--;
        let p_x = p * (1 + x * 0.01) + x;
        return p_x;
    },
    /**
     * @param {int} s attack speed (seconds per attack) at degree 1
     * @param {int} x degree
     */
    getSpeed(s, x) {
        x--;
        let s_x = s / (1 + round(Math.sqrt(x * 50), 1) * 0.01);
        return s_x;
    },
    /**
     *
     * @param {Object} obj The original object for damages
     * @param {int} x degree
     * @returns
     */
    getLevelledObj(obj, x) {
        let res = {};

        if ("damage" in obj) res.d = round(this.getDmg(obj.damage, x), 1); // damage
        if ("cd" in obj) {
            res.cd = round(this.getDmgMod(obj.cd, x), 1); // additional ceram damage
            res.tcd = round(res.d + res.cd); // total ceram damage
        }
        if ("fd" in obj) {
            res.fd = round(this.getDmgMod(obj.fd, x), 1); // additional fortified damage
            res.tfd = round(res.d + res.fd); // total fortified damage
        }
        if ("cad" in obj) {
            res.cad = round(this.getDmgMod(obj.cad, x), 1); // additional camo damage
            res.tcad = round(res.d + res.cad); // total camo damage
        }
        if ("sd" in obj) {
            res.sd = round(this.getDmgMod(obj.sd, x), 1); // additional stunned damage
            res.tsd = round(res.d + res.sd); // total stunned damage
        }
        if ("std" in obj) {
            res.std = round(this.getDmgMod(obj.std, x), 1); // additional sticky damage
            res.tstd = round(res.d + res.std); // total sticky damage
        }
        if ("md" in obj) {
            res.md = round(this.getDmgMod(obj.md, x), 1); // additional moab damage
            res.tmd = round(res.d + res.md); // total moab damage
        }
        if ("bd" in obj) {
            res.bd = round(this.getDmgMod(obj.bd, x), 1); // additional boss damage
            res.bdm = this.getBossDmgMult(x); // boss damage multiplier
            res.tbd = round((res.d + (res.md ? res.md : 0) + res.bd) * res.bdm); // total untraited boss damage
        }
        if ("edm" in obj) {
            res.edm = obj.edm; // elite boss damage multiplier
            res.ted = round((res.d + (res.md ? res.md : 0) + (res.bd ? res.bd : 0)) * (res.bdm ? res.bdm : 1) * res.edm); // total untraited elite boss damage
        }

        if ("pierce" in obj) res.p = round(this.getPierce(obj.pierce, x), 1);
        if ("rate" in obj) res.s = round(this.getSpeed(obj.rate, x), 4); // seconds between attack needs more precision
        if ("cooldown" in obj) res.cooldown = round(this.getSpeed(obj.cooldown, x), 1); // cooldown uses the same scaling formula as seconds between attacks

        return res;
    }
};

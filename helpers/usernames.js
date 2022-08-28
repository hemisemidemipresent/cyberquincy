const nodefetch = require('node-fetch');
const { chunk } = require('./general.js');
const appID = 11;
const skuID = 35;
const skuSignature = 'A26308E242742374';
const sessionID = null;

const deviceID = null;

const { UserAgent } = require('../1/config.json');
module.exports = {
    /**
     * @param {string[]} unknownUsers array of userIDs (string)
     */
    async getUsernames(unknownUsers) {
        let chunks = chunk(unknownUsers, 150);
        let promises = [];
        for (let arr of chunks) {
            let newPromise = new Promise(async (res, rej) => {
                let body = {
                    method: 'nkapiID',
                    keys: arr,
                    includeOnlineStatus: false
                };
                res(await module.exports.request(body));
            });
            promises.push(newPromise);
        }

        let results = await Promise.all(promises);
        let userObjects = [];
        for (let res of results) {
            if (!res) continue;
            let data = JSON.parse(res.data);
            console.log(data);
            for (let j in data.users) {
                let user = data.users[j];
                // ensure all objects have correct userName string
                let username = user.displayName;
                if (username == 'default') username = user.safeName;
                user.username = username;
                userObjects.push(user);
            }
        }
        let usernames = [];

        for (let i = 0; i < unknownUsers.length; i++) {
            let userObj = userObjects.find((user) => {
                return user.nkapiID == unknownUsers[i];
            });
            if (userObj) usernames.push(userObj.username);
        }
        return usernames;
    },
    async request(body) {
        let nonce = Math.random() * Math.pow(2, 63) + ''; // or any hentai code, but there are much less hentai than 64-bit integers

        let bodyString = JSON.stringify(body);
        if (bodyString.length > 1024 * 1024) {
            let length = 1024 * 1024;

            md5 = 'W/' + length + '/' + hex_md5(sessionID + skuSignature + bodyString.substr(0, length) + nonce);
        } else if (sessionID != null) {
            md5 = hex_md5(sessionID + skuSignature + bodyString + nonce);
        } else {
            md5 = hex_md5(skuSignature + bodyString + nonce);
        }
        try {
            let k = await nodefetch('https://api.ninjakiwi.com/user/search', {
                method: 'POST',
                body: JSON.stringify({
                    data: bodyString,
                    auth: {
                        session: sessionID,
                        appID: appID,
                        skuID: skuID,
                        device: deviceID
                    },
                    sig: md5,
                    nonce: nonce
                }),
                headers: { 'User-Agent': UserAgent, 'Content-Type': 'application/json' }
            });
            return await k.json();
        } catch (error) {
            // console.log(error.response.data);
            // console.log(error.response.status);
            // console.log(error.response.headers);
            return undefined;
        }

        /**
         * CODE IS RIPPED FROM: https://gist.github.com/Xarrow/e8d14b982c2763954230
         */

        /*
         * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
         * Digest Algorithm, as defined in RFC 1321.
         * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
         * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
         * Distributed under the BSD License
         * See http://pajhome.org.uk/crypt/md5 for more info.
         */

        /*
         * Configurable variables. You may need to tweak these to be compatible with
         * the server-side, but the defaults work in most cases.
         */ var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase        */
        var b64pad = ''; /* base-64 pad character. "=" for strict RFC compliance   */

        /*
         * These are the functions you'll usually want to call
         * They take string arguments and return either hex or base-64 encoded strings
         */
        function hex_md5(s) {
            return rstr2hex(rstr_md5(str2rstr_utf8(s)));
        }

        /*
         * Calculate the MD5 of a raw string
         */
        function rstr_md5(s) {
            return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
        }

        /*
         * Convert a raw string to a hex string
         */
        function rstr2hex(input) {
            try {
                hexcase;
            } catch (e) {
                hexcase = 0;
            }
            var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
            var output = '';
            var x;
            for (var i = 0; i < input.length; i++) {
                x = input.charCodeAt(i);
                output += hex_tab.charAt((x >>> 4) & 0x0f) + hex_tab.charAt(x & 0x0f);
            }
            return output;
        }

        /*
         * Encode a string as utf-8.
         * For efficiency, this assumes the input is valid utf-16.
         */
        function str2rstr_utf8(input) {
            var output = '';
            var i = -1;
            var x, y;

            while (++i < input.length) {
                /* Decode utf-16 surrogate pairs */
                x = input.charCodeAt(i);
                y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
                if (0xd800 <= x && x <= 0xdbff && 0xdc00 <= y && y <= 0xdfff) {
                    x = 0x10000 + ((x & 0x03ff) << 10) + (y & 0x03ff);
                    i++;
                }

                /* Encode output as utf-8 */
                if (x <= 0x7f) output += String.fromCharCode(x);
                else if (x <= 0x7ff) output += String.fromCharCode(0xc0 | ((x >>> 6) & 0x1f), 0x80 | (x & 0x3f));
                else if (x <= 0xffff)
                    output += String.fromCharCode(0xe0 | ((x >>> 12) & 0x0f), 0x80 | ((x >>> 6) & 0x3f), 0x80 | (x & 0x3f));
                else if (x <= 0x1fffff)
                    output += String.fromCharCode(
                        0xf0 | ((x >>> 18) & 0x07),
                        0x80 | ((x >>> 12) & 0x3f),
                        0x80 | ((x >>> 6) & 0x3f),
                        0x80 | (x & 0x3f)
                    );
            }
            return output;
        }

        /*
         * Convert a raw string to an array of little-endian words
         * Characters >255 have their high-byte silently ignored.
         */
        function rstr2binl(input) {
            var output = Array(input.length >> 2);
            for (var i = 0; i < output.length; i++) output[i] = 0;
            for (var i = 0; i < input.length * 8; i += 8) output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32;
            return output;
        }

        /*
         * Convert an array of little-endian words to a string
         */
        function binl2rstr(input) {
            var output = '';
            for (var i = 0; i < input.length * 32; i += 8) output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff);
            return output;
        }

        /*
         * Calculate the MD5 of an array of little-endian words, and a bit length.
         */
        function binl_md5(x, len) {
            /* append padding */
            x[len >> 5] |= 0x80 << len % 32;
            x[(((len + 64) >>> 9) << 4) + 14] = len;

            var a = 1732584193;
            var b = -271733879;
            var c = -1732584194;
            var d = 271733878;

            for (var i = 0; i < x.length; i += 16) {
                var olda = a;
                var oldb = b;
                var oldc = c;
                var oldd = d;

                a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
                d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
                d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
                c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
                b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
                a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
                d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
                c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
                b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
                a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
                d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
                c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
                b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

                a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
                d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
                c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
                b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
                a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
                d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
                c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
                b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
                a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
                d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
                c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
                b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
                a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
                d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
                c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
                b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

                a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
                d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
                c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
                b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
                a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
                d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
                c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
                b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
                a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
                d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
                c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
                b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
                a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
                d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
                c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
                b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

                a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
                d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
                c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
                b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
                a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
                d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
                c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
                b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
                a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
                d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
                c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
                b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
                a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
                d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
                c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
                b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

                a = safe_add(a, olda);
                b = safe_add(b, oldb);
                c = safe_add(c, oldc);
                d = safe_add(d, oldd);
            }
            return Array(a, b, c, d);
        }

        /*
         * These functions implement the four basic operations the algorithm uses.
         */
        function md5_cmn(q, a, b, x, s, t) {
            return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
        }
        function md5_ff(a, b, c, d, x, s, t) {
            return md5_cmn((b & c) | (~b & d), a, b, x, s, t);
        }
        function md5_gg(a, b, c, d, x, s, t) {
            return md5_cmn((b & d) | (c & ~d), a, b, x, s, t);
        }
        function md5_hh(a, b, c, d, x, s, t) {
            return md5_cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function md5_ii(a, b, c, d, x, s, t) {
            return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
        }

        /*
         * Add integers, wrapping at 2^32. This uses 16-bit operations internally
         * to work around bugs in some JS interpreters.
         */
        function safe_add(x, y) {
            var lsw = (x & 0xffff) + (y & 0xffff);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xffff);
        }

        /*
         * Bitwise rotate a 32-bit number to the left.
         */
        function bit_rol(num, cnt) {
            return (num << cnt) | (num >>> (32 - cnt));
        }
    }
};

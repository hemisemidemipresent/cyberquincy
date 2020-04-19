const r = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');
module.exports = {
    name: 'income',
    execute(message, args) {
        if (args[0] == undefined) {
            return message.channel.send('use ``q!income help``');
        }
        if (args[0] == 'help') {
            return message.channel.send(
                '1. q!income <startround> <endround>\n(if startround = 0, that means starting cash is included)\n2. q!income <difficulty> <endround>\n(<difficulty> includes starting cash; deflation, half cash, abr, apop is random)',
                { code: 'md' }
            );
        }
        if (!args[1]) {
            let endround = parseInt(args[0]);
            if (endround < 0 || endround > 100) {
                return message.channel.send(
                    'please specify a round from 1 to 100'
                );
            }
            let end = r[endround];
            let income = end.cch;
            return message.channel.send(
                `${income} total cash from round 1 to round ${endround} (including starting cash and all the bloons popped on round ${endround})`
            );
        }
        if (isNaN(args[1])) {
            return message.channel.send(
                'please specify a number for a round from 1 to 100'
            );
        }
        let endround = parseInt(args[1]);
        if (endround < 0 || endround > 100) {
            return message.channel.send(
                'please specify a round from 1 to 100. ``!income`` ``help`` for help'
            );
        }
        if (args[0] == 'easy') {
            var startround = 0;
        } else if (args[0] == 'medium') {
            var startround = 3;
        } else if (args[0] == 'hard') {
            var startround = 3;
        } else if (args[0].includes('imp') || args[0].includes('ch')) {
            var startround = 6;
        } else if (args[0].includes('def')) {
            return message.channel.send('$20000 start cash. You dont earn any');
        } else if (args[0].includes('alt') || args[0].includes('abr')) {
            if (!args[2]) {
                var abr_start = 3;
                var abr_end = args[1];
            } else {
                var abr_start = args[1];
                var abr_end = args[2];
            }
            let s_arr = abr[abr_start - 2];
            let e_arr = abr[abr_end - 2];
            let diff = e_arr[1] - s_arr[1];
            if (!args[2]) {
                return message.channel.send(
                    `earns $${e_arr[1]} from popping bloons in round 3 to popping bloons in round ${abr_end} (including starting cash)`
                );
            } else {
                return message.channel.send(
                    `earns $${diff} from popping bloons in round ${
                        parseInt(abr_start) + 1
                    } to popping bloons in round ${abr_end} (not including starting cash)`
                );
            }
        } else if (!isNaN(args[0])) {
            var startround = parseInt(args[0]);
            if (startround < 0 || startround > 100) {
                return message.channel.send(
                    'please specify a round from 1 to 100. ``!income`` ``help`` for help'
                );
            }
        } else {
            return message.channel.send('please use a valid word/number!');
        }
        let start = r[startround];
        let end = r[endround];
        let income = end.cch - start.cch;
        var startround = startround + 1;
        message.channel.send(
            `earns $${income} from popping bloons in round ${startround} to popping bloons in ${endround} (not including starting cash)`
        );
    },
};

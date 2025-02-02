VERSION_COLUMN = 'C';
TOWER_HEADER_ROW = 23;
HERO_HEADER_ROW = 18;

const EMOJI_MAPPINGS = {
    'buff': '✅',
    'nerf': '❌',
    'bugfix': '🛠️',
    'miscellaneous': '🔄'
};

async function scrapeAllBalanceChanges() {
    let res = await fetch('https://btd6index.win/fetch-balance-changes');
    let new_balances = (await res.json())?.results;

    let balances = {
        "dart_monkey": {
            "versionAdded": "1.0"
        },
        "boomerang_monkey": {
            "versionAdded": "1.0"
        },
        "bomb_shooter": {
            "versionAdded": "1.0"
        },
        "tack_shooter": {
            "versionAdded": "1.0"
        },
        "ice_monkey": {
            "versionAdded": "1.0"
        },
        "glue_gunner": {
            "versionAdded": "1.0"
        },
        "sniper_monkey": {
            "versionAdded": "1.0"
        },
        "monkey_sub": {
            "versionAdded": "1.0"
        },
        "monkey_buccaneer": {
            "versionAdded": "1.0"
        },
        "monkey_ace": {
            "versionAdded": "1.0"
        },
        "heli_pilot": {
            "versionAdded": "1.0"
        },
        "mortar_monkey": {
            "versionAdded": "6.0"
        },
        "dartling_gunner": {
            "versionAdded": "22.0"
        },
        "wizard_monkey": {
            "versionAdded": "1.0"
        },
        "super_monkey": {
            "versionAdded": "1.0"
        },
        "ninja_monkey": {
            "versionAdded": "1.0"
        },
        "alchemist": {
            "versionAdded": "1.0"
        },
        "druid": {
            "versionAdded": "1.0"
        },
        "banana_farm": {
            "versionAdded": "1.0"
        },
        "spike_factory": {
            "versionAdded": "1.0"
        },
        "monkey_village": {
            "versionAdded": "1.0"
        },
        "engineer_monkey": {
            "versionAdded": "12.0"
        },
        "beast_handler": {
            "versionAdded": "36.0"
        },
        "quincy": {
            "versionAdded": "1.0"
        },
        "gwen": {
            "versionAdded": "1.0"
        },
        "jones": {
            "versionAdded": "1.0"
        },
        "obyn": {
            "versionAdded": "1.0"
        },
        "churchill": {
            "versionAdded": "1.0"
        },
        "benjamin": {
            "versionAdded": "3.0"
        },
        "ezili": {
            "versionAdded": "7.0"
        },
        "pat": {
            "versionAdded": "9.0"
        },
        "adora": {
            "versionAdded": "14.0"
        },
        "brickell": {
            "versionAdded": "18.0"
        },
        "etienne": {
            "versionAdded": "20.0"
        },
        "sauda": {
            "versionAdded": "24.0"
        },
        "psi": {
            "versionAdded": "26.0"
        },
        "geraldo": {
            "versionAdded": "31.0"
        },
        "corvus": {
            "versionAdded": "40.0"
        },
        "rosalia": {
            "versionAdded": "43.0"
        }
    };
    
    new_balances.forEach(b => {

        let tower = Aliases.toAliasNormalForm(b.tower);

        let version = parseInt(b.version);
        let nature = b.nature;

        if(!balances[tower].balances) 
            balances[tower].balances = {};
        
        if(!balances[tower].balances[version]) {
            balances[tower].balances[version] = {
                buff: [],
                nerf: [],
                bugfix: [],
                miscellaneous: []
            };
        }

        balances[tower].balances[version][nature].push(EMOJI_MAPPINGS[nature] + ' ' + b.change);
    });

    return balances;
}

module.exports = { 
    scrapeAllBalanceChanges,
};
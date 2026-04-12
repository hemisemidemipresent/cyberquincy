const fs = require('fs');

async function scrapeCosts() {
    // NOTE: currently as of writing there are "only" 412 upgrade, but if NK keeps adding more and more towers we may need to make 2 requests
    const URL = "https://www.bloonswiki.com/api.php?action=cargoquery&tables=btd6_upgrades&fields=tower,path,tier,cost&format=json&limit=500";
    let response = await fetch(URL, { headers: { Cookie:"bloonswikiUserName=Hemidemisemipresent" } });
    const rawJson = await response.json();
    const upgrades = rawJson.cargoquery;

    // for whatever reason it operates at the base on our directory
    let costs = JSON.parse(fs.readFileSync("./jsons/costs.json"));
    const paths = {
        "1": "top_path",
        "2": "middle_path",
        "3": "bottom_path",
    };
    upgrades.forEach((upgrade) => {
        const obj = upgrade.title;
        const towerName = Aliases.toAliasNormalForm(obj.tower);
        const path = paths[parseInt(obj.path)];
        if(costs[towerName])
            costs[towerName].upgrades[path][obj.tier] = parseInt(obj.cost);
    });
    fs.writeFileSync("./jsons/costs.json", JSON.stringify(costs, null, 4));
}

module.exports = {
    scrapeCosts
};
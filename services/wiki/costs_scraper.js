const fs = require("fs");

async function scrapeCosts() {
    // NOTE: currently as of writing there are "only" 412 upgrades, but if NK keeps adding more and more towers we may need to make 2 requests
    const URL = "https://www.bloonswiki.com/api.php?action=cargoquery&tables=btd6_upgrades&fields=tower,path,tier,cost&format=json&limit=500";
    let response = await fetch(URL);

    if (!response.ok) return console.warn("tower upgrade cost scraping failed");

    const rawJson = await response.json();
    const upgrades = rawJson.cargoquery;

    // for whatever reason fs operates at the base on our directory
    let costs = JSON.parse(fs.readFileSync("./jsons/costs.json"));
    const paths = {
        1: "top_path",
        2: "middle_path",
        3: "bottom_path",
    };
    upgrades.forEach((upgrade) => {
        const obj = upgrade.title;
        const towerName = Aliases.toAliasNormalForm(obj.tower);
        const path = paths[parseInt(obj.path)];
        if (costs[towerName]) costs[towerName].upgrades[path][obj.tier] = parseInt(obj.cost);
    });
    fs.writeFileSync("./jsons/costs.json", JSON.stringify(costs, null, 4));
}

async function scrapeParagonCosts() {
    // const response = await fetch("https://www.bloonswiki.com/api.php?action=cargoquery&tables=btd6_paragons&fields=tower,name,cost,icon&format=json");
    const response = await fetch(
        "https://www.bloonswiki.com/api.php?action=cargoquery&tables=btd6_paragons&fields=tower,cost&format=json",
    );
    if (!response.ok) return console.warn("paragon cost scraping failed");
    const rawJson = await response.json();
    const paragons = rawJson?.cargoquery;
    let paragonCosts = JSON.parse(fs.readFileSync("./jsons/paragon_costs.json"));
    paragons.forEach((paragon) => {
        paragonCosts[Aliases.toAliasNormalForm(paragon.tower)] = paragon.cost;
    });
    fs.writeFileSync("./jsons/paragon_costs.json", JSON.stringify(paragonCosts, null, 4));

    // https://www.bloonswiki.com/api.php?action=query&prop=imageinfo&format=json&titles=File:BTD6%20BombShooter%20BombParagonIcon.png&iiprop=url
}

module.exports = {
    scrapeCosts,
    scrapeParagonCosts,
};

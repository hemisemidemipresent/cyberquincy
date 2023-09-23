const { ShardingManager } = require('discord.js');
const configHelper = require('./helpers/config');
const activeToken = configHelper.activeToken();

const manager = new ShardingManager('./server.js', { token: activeToken });

manager.on('shardCreate', (shard) => console.log(`Launched shard ${shard.id}`));

manager.spawn();

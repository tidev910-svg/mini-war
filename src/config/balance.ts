// @ts-nocheck
// Balance tables: units, buildings, farms, mines, incomes, capture and AI tuning (docs/features/economy.md, units.md, territory.md). Data only.

export const specs={
 scout:{name:'Trinh sát',hp:60,damage:7,range:18,speed:72,cooldown:1.1,cost:{food:25},upkeep:.3,train:4,r:8,color:'#8ce6a0'},
 infantry:{name:'Lính',hp:100,damage:14,range:22,speed:45,cooldown:.8,cost:{food:40},upkeep:.8,train:5,r:10,color:'#58b5ff'},
 archer:{name:'Cung thủ',hp:65,damage:16,range:125,speed:34,cooldown:1.05,cost:{food:55,wood:25,gold:10},upkeep:1.2,train:8,r:9,color:'#78d6ff'},
 spearman:{name:'Lính giáo',hp:145,damage:12,range:26,speed:38,cooldown:.82,cost:{food:45,wood:15},upkeep:.8,train:6,r:11,color:'#d7d6a4'},
 cavalry:{name:'Lính kỵ binh',hp:210,damage:24,range:27,speed:58,cooldown:.9,cost:{food:80,gold:35},upkeep:2.5,train:12,r:13,color:'#f2d5a0'}
};
// Scout sight in world units (~7 tiles; raised from 145 on 2026-10-18). Used for the player's fog and the AI's own map.
export const SCOUT_VISION=260;
// train = seconds in a fortress training lane (paid when queued). Economy & queue V2 (2026-10-18):
// each side starts with TRAIN_LANES_START lanes that train in parallel (one unit each); up to TRAIN_QUEUE_WAITING more
// paid units wait behind them. Lanes from the 5th on are bought: QUEUE_LANE_UPGRADES[i] opens lane TRAIN_LANES_START+1+i
// (cost paid once when ordered, lane added when the time runs out). PROVISIONAL prices from the V2 proposal, not final;
// the list can be extended — there is no permanent cap at 8. No cap on living units.
export const TRAIN_LANES_START=4,TRAIN_QUEUE_WAITING=4;
export const QUEUE_LANE_UPGRADES=[
 {cost:{wood:200,stone:100},seconds:15},
 {cost:{wood:350,stone:150,gold:50},seconds:20},
 {cost:{wood:500,stone:250,gold:100},seconds:25},
 {cost:{wood:750,stone:350,gold:150},seconds:30},
];
// upkeep = food per minute per living unit. Running out of food starts a grace period, then slows the army.
export const SUPPLY_GRACE_SECONDS=30,SUPPLY_SPEED_FACTOR=.85,SUPPLY_ATTACK_SPEED_FACTOR=.9;
// Four-resource economy (docs/features/resource-system.md). Income rates are per second.
export const RESOURCE_NAMES={food:'lúa',wood:'gỗ',stone:'đá',gold:'vàng'};
// Balance V3.1 (2026-10-19, playtest proposal): starting stock, incomes, unit costs/upkeep and building costs below.
export const STARTING_RESOURCES={food:200,wood:250,stone:75,gold:75};
// Buildings are placed instantly but take buildTime seconds to finish; halfW/halfH is the logical footprint.
// where: 'explored' (any explored ground), 'territory' (near own fortress or in an owned region), 'flag' (next to the flag of an owned region).
export const BUILDING_TYPES={
 farm:{name:'Nông trại',button:'farm',cost:{wood:120},buildTime:3,hp:180,halfW:31,halfH:34,vision:90,where:'explored'},
 // Outpost: defensive post beside a captured flag (no placement button; built with "Xây tiền đồn" via startOutpost).
 outpost:{name:'Tiền đồn',cost:{wood:150,stone:80},buildTime:35,hp:1500,halfW:26,halfH:24,visionTiles:14,where:'flag',gun:{range:160,damage:12,cooldown:1.2}},
 tower:{name:'Tháp phòng thủ',button:'buildTower',cost:{wood:120,stone:120,gold:30},buildTime:30,hp:520,halfW:22,halfH:24,vision:200,where:'territory',gun:{range:190,damage:30,cooldown:1}}
};
// Farm output per level is the total at that level (V3.1: 35 / 50 / 70 lúa/phút), not cumulative.
export const FARM_LEVELS=[null,{food:35},{food:50,cost:{wood:100,stone:40}},{food:70,cost:{wood:160,stone:80}}],FARM_UPGRADE_SECONDS=15;
// Outposts only build while a friendly unit stands within BUILDER_RADIUS_TILES.
export const BUILDER_RADIUS_TILES=4;
// Every neutral region has a flag near its centre (never this close to a fortress). Units within FLAG_CAPTURE_RADIUS_TILES capture it:
// seconds = FLAG_CAPTURE_BASE_SECONDS / min(units, FLAG_CAPTURE_MAX_UNITS)^FLAG_CAPTURE_EXPONENT (1 unit 60 s, 5 ≈ 23 s, 10+ ≈ 15 s).
// Scouts neither capture nor contest (FLAG_SCOUTS_CAPTURE). With nobody in range for FLAG_DECAY_DELAY_SECONDS, progress falls
// back toward 0 (a full bar empties in FLAG_DECAY_SECONDS) and never changes the owner. Decided 2026-10-17 (territory.md).
export const FLAG_ENEMY_BASE_MIN_TILES=20,FLAG_CAPTURE_RADIUS_TILES=4,FLAG_CAPTURE_BASE_SECONDS=60,FLAG_CAPTURE_EXPONENT=.6,FLAG_CAPTURE_MAX_UNITS=10,FLAG_SCOUTS_CAPTURE=false;
export const FLAG_DECAY_DELAY_SECONDS=5,FLAG_DECAY_SECONDS=60;
// AI capture squads: units per flag (doubled for enemy or contested flags), flags at once grows every interval up to the max.
export const AI_CAPTURE_SQUAD=2,AI_MAX_CAPTURE_TARGETS=4,AI_CAPTURE_TARGET_INTERVAL=120;
export const FORTRESS_GUN_COST={stone:150};
// Combat V3.1 (2026-10-19, damage only): damage per shot of the fortress's built-in guns — [0] the main gun, [1] the
// second gun bought with FORTRESS_GUN_COST. (Range, cooldown and bullet speed unchanged.)
export const FORTRESS_GUN_DAMAGE=[18,45];
// Damage multipliers (Combat V3.1). Unit against unit: COUNTER_MULTIPLIERS[attacker][target type], default ×1.
// Against a structure (fortress, farm, outpost, tower) only STRUCTURE_DAMAGE_MULTIPLIERS[attacker] applies (no stacking).
// Gun shots (fortress, tower, outpost) and guards have no multiplier.
export const COUNTER_MULTIPLIERS={spearman:{cavalry:2.2},cavalry:{archer:1.5},archer:{spearman:1.3},infantry:{spearman:1.2}};
export const STRUCTURE_DAMAGE_MULTIPLIERS={scout:.5,infantry:1.1,spearman:1,archer:.6,cavalry:.8};
// Food regions: the mine gives 45 lúa/phút (V3.1) and farms standing in a food region their owner holds produce FOOD_REGION_FARM_BONUS more.
export const FOOD_REGION_FARM_BONUS=.25;
// Every standing fortress pays this much per minute from the first second, with or without territory (no growth over time).
// V3.1 (2026-10-19): 40 lúa, 30 gỗ, 10 đá, 10 vàng.
export const FORTRESS_INCOME_PER_MINUTE={food:40,wood:30,stone:10,gold:10};
export const MINE_TYPES={food:{label:'MỎ LÚA',perSecond:45/60,crystal:'#f2d36b'},wood:{label:'MỎ GỖ',perSecond:45/60,crystal:'#9ccf6a'},stone:{label:'MỎ ĐÁ',perSecond:35/60,crystal:'#d9dee3'},gold:{label:'MỎ VÀNG',perSecond:35/60,crystal:'#ffca5e'}};

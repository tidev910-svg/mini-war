// @ts-nocheck
// Balance tables: units, buildings, farms, mines, incomes, capture and AI tuning (docs/features/economy.md, units.md, territory.md). Data only.

// Plan D (2026-10-22, from equal-budget fights, units.md): infantry 40 → 55 lúa; archer 55 lúa 25 gỗ 10 vàng → 45 lúa
// 25 gỗ 5 vàng and damage 16 → 18; cavalry 80 lúa 35 vàng → 75 lúa 25 vàng and hp 210 → 230.
export const specs={
 scout:{name:'Trinh sát',hp:60,damage:7,range:18,speed:72,cooldown:1.1,cost:{food:25},upkeep:.3,train:4,r:8,color:'#8ce6a0'},
 infantry:{name:'Lính',hp:100,damage:14,range:22,speed:45,cooldown:.8,cost:{food:55},upkeep:.8,train:5,r:10,color:'#58b5ff'},
 archer:{name:'Cung thủ',hp:65,damage:18,range:125,speed:34,cooldown:1.05,cost:{food:45,wood:25,gold:5},upkeep:1.2,train:8,r:9,color:'#78d6ff'},
 spearman:{name:'Lính giáo',hp:145,damage:12,range:26,speed:38,cooldown:.82,cost:{food:45,wood:15},upkeep:.8,train:6,r:11,color:'#d7d6a4'},
 cavalry:{name:'Lính kỵ binh',hp:230,damage:24,range:27,speed:58,cooldown:.9,cost:{food:75,gold:25},upkeep:2.5,train:12,r:13,color:'#f2d5a0'}
};
// Fog of war V3.1 (2026-10-20, fog-of-war.md): sight radius in world units, the same for the player and the AI.
// Units by type; the side's fortress and every building it owns; each held region, around its flag.
export const UNIT_VISION={scout:500,infantry:320,spearman:320,archer:360,cavalry:420};
export const BUILDING_VISION=350,TERRITORY_VISION=450;
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
 farm:{name:'Nông trại',button:'farm',cost:{wood:120},buildTime:3,hp:180,halfW:31,halfH:34,where:'explored'},
 // Outpost: defensive post beside a captured flag (no placement button; built with "Xây tiền đồn" via startOutpost).
 outpost:{name:'Tiền đồn',cost:{wood:150,stone:80},buildTime:35,hp:1500,halfW:26,halfH:24,where:'flag',gun:{range:160,damage:12,cooldown:1.2}},
 tower:{name:'Tháp phòng thủ',button:'buildTower',cost:{wood:120,stone:120,gold:30},buildTime:30,hp:520,halfW:22,halfH:24,where:'territory',gun:{range:190,damage:30,cooldown:1}}
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
// Flag defence V3.1 (2026-10-20, flag-defense.md). Every flag a side holds shoots one enemy unit within FLAG_GUN.range,
// FLAG_GUN.damage per shot every FLAG_GUN.cooldown seconds (neutral flags do not). Garrisons: unlimited, hidden from
// the enemy; all of them sortie as soon as an enemy unit comes within FLAG_DEFENSE.radius of the flag, fight within
// FLAG_DEFENSE.leash of it, and walk back in after FLAG_DEFENSE.calmSeconds without an enemy there (entering within
// FLAG_DEFENSE.enterRadius). While a garrison is inside, the flag cannot be captured.
export const FLAG_GUN={damage:10,cooldown:2,range:180};
export const FLAG_DEFENSE={radius:180,calmSeconds:3,leash:320,enterRadius:45};
// AI capture squads: units per flag (doubled for enemy or contested flags), flags at once grows every interval up to the max.
export const AI_CAPTURE_SQUAD=2,AI_MAX_CAPTURE_TARGETS=4,AI_CAPTURE_TARGET_INTERVAL=120;
// AI difficulty (ai-opponent.md), chosen in the lobby / Settings (settings.aiDifficulty); 'normal' keeps the original
// economic pace. tick: seconds between AI turns; maxTraining: units the AI keeps in its training queue; firstAttack: earliest
// second the first wave gathers; waveSize + wave·waveGrowth: fighters a wave waits for at the rally point (it leaves anyway
// with ≥ 60% after gatherSeconds); retreatAt: the wave falls back when this share of it is left; regroup: seconds before the
// next wave gathers; fortressAfterWave: from this wave on the known enemy fortress is the preferred target;
// defendRadius: enemy units seen this close to the AI fortress pull the free army back to defend.
// Economy and tactics (2026-10-21): farmsMax / farmEvery: farms it aims for (2 at start, one more every farmEvery seconds,
// 0 = only when food runs short); lanesMax: training lanes it buys up to; smartMix: picks units that counter the enemy
// types it has seen and spends the resources it has piled up (off = the old fixed random order); reinforce: units made
// during an attack join the wave, homeGuard of them stay home; harass: enemy farms count as nearer targets.
// camps (2026-10-22, neutral-camps.md): the neutral camp kinds it clears between waves (ai/camps.ts).
// None of these give the AI resources, sight or knowledge the player does not have.
export const AI_DIFFICULTY={
 easy:  {label:'Dễ',    tick:7,maxTraining:1,firstAttack:420,waveSize:6, waveGrowth:2,gatherSeconds:90,retreatAt:.4,regroup:180,fortressAfterWave:3,defendRadius:520,farmsMax:2,farmEvery:0,  lanesMax:4,smartMix:false,reinforce:false,homeGuard:0,harass:false,camps:[]},
 normal:{label:'Thường',tick:5,maxTraining:3,firstAttack:270,waveSize:8, waveGrowth:3,gatherSeconds:90,retreatAt:.3,regroup:120,fortressAfterWave:2,defendRadius:620,farmsMax:6,farmEvery:110,lanesMax:5,smartMix:true, reinforce:true, homeGuard:3,harass:false,camps:['wolves','boars']},
 hard:  {label:'Khó',   tick:4,maxTraining:6,firstAttack:180,waveSize:10,waveGrowth:4,gatherSeconds:75,retreatAt:.2,regroup:75, fortressAfterWave:1,defendRadius:720,farmsMax:9,farmEvery:75, lanesMax:6,smartMix:true, reinforce:true, homeGuard:4,harass:true,camps:['wolves','bandits','troll','golem','tomb','boars','spiders','bears','dragon']},
};
export const FORTRESS_GUN_COST={stone:150};
// Combat V3.1 (2026-10-19, damage only): damage per shot of the fortress's built-in guns — [0] the main gun, [1] the
// second gun bought with FORTRESS_GUN_COST. (Range, cooldown and bullet speed unchanged.)
export const FORTRESS_GUN_DAMAGE=[18,45];
// Damage multipliers (Combat V3.1). Unit against unit: COUNTER_MULTIPLIERS[attacker][target type], default ×1.
// Against a structure (fortress, farm, outpost, tower) only STRUCTURE_DAMAGE_MULTIPLIERS[attacker] applies (no stacking).
// Gun shots (fortress, tower, outpost) have no multiplier; monsters use the row of their counterAs type (config/creeps.ts).
export const COUNTER_MULTIPLIERS={spearman:{cavalry:2.2},cavalry:{archer:1.5},archer:{spearman:1.3},infantry:{spearman:1.2}};
export const STRUCTURE_DAMAGE_MULTIPLIERS={scout:.5,infantry:1.1,spearman:1,archer:.6,cavalry:.8};
// Food regions: the mine gives 45 lúa/phút (V3.1) and farms standing in a food region their owner holds produce FOOD_REGION_FARM_BONUS more.
export const FOOD_REGION_FARM_BONUS=.25;
// Every standing fortress pays this much per minute from the first second, with or without territory (no growth over time).
// V3.1 (2026-10-19): 40 lúa, 30 gỗ, 10 đá, 10 vàng.
export const FORTRESS_INCOME_PER_MINUTE={food:40,wood:30,stone:10,gold:10};
// "Ngũ Vực" map (config/maps.ts): the gold mines of the abyss at the centre yield this many times a normal gold mine
// (PROVISIONAL, 2026-10-30: 35 → 70 vàng/phút; the strongest camp, the tomb, guards them).
export const RICH_GOLD_MULTIPLIER=2;
export const MINE_TYPES={food:{label:'MỎ LÚA',perSecond:45/60,crystal:'#f2d36b'},wood:{label:'MỎ GỖ',perSecond:45/60,crystal:'#9ccf6a'},stone:{label:'MỎ ĐÁ',perSecond:35/60,crystal:'#d9dee3'},gold:{label:'MỎ VÀNG',perSecond:35/60,crystal:'#ffca5e'}};

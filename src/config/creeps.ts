// @ts-nocheck
// Neutral camps (docs/features/neutral-camps.md): monster types, camp kinds, rewards, respawn and map layout. Data only.
// PROVISIONAL numbers (2026-10-22, tuned the same day from simulated fights: a farmed camp yields about what a mine does,
// see neutral-camps.md), to be tuned in playtests.

// Monster types. hp/damage/range/speed/cooldown like specs (config/balance.ts); r = body radius.
// counterAs: the unit type whose row and column of COUNTER_MULTIPLIERS the monster uses, both when it is hit and when it
// hits (wolves are hit ×2.2 by spearmen and bite archers ×1.5, like cavalry). splash: melee hits also strike every unit
// within this radius of the target (the troll and the boss punish units standing in a heap). ranged: shoots arrows.
export const CREEP_TYPES={
 wolf:        {name:'Sói',        hp:80,  damage:11,range:20, speed:62,cooldown:.9, r:9, counterAs:'cavalry'},
 bandit:      {name:'Cướp',       hp:110, damage:12,range:22, speed:42,cooldown:.9, r:10,counterAs:'infantry'},
 banditArcher:{name:'Cướp cung',  hp:60,  damage:11,range:110,speed:36,cooldown:1.2,r:9, counterAs:'archer',ranged:true},
 troll:       {name:'Quỷ đá',     hp:800, damage:34,range:34, speed:30,cooldown:1.6,r:20,counterAs:'spearman',splash:40},
 golem:       {name:'Golem vàng', hp:900, damage:22,range:34, speed:28,cooldown:1.5,r:21,counterAs:'spearman',splash:30},
 // "Ngũ Vực" realm monsters (2026-10-30, PROVISIONAL): each realm needs a different counter. Boars charge like cavalry
 // (spearmen ×2.2); the spider queen spits venom like an archer (cavalry ×1.5) behind fast spiderlings; rock bears hit
 // like spearmen (archers ×1.3, infantry ×1.2; they maul cavalry ×2.2) and swipe around them; the golden dragon breathes
 // fire over a wide area.
 boar:        {name:'Heo rừng',   hp:130, damage:14,range:20, speed:60,cooldown:.9, r:10,counterAs:'cavalry'},
 spiderQueen: {name:'Nhện chúa',  hp:380, damage:16,range:100,speed:34,cooldown:1.3,r:16,counterAs:'archer',ranged:true},
 spiderling:  {name:'Nhện con',   hp:60,  damage:9, range:18, speed:66,cooldown:.8, r:8, counterAs:'infantry'},
 rockBear:    {name:'Gấu đá',     hp:520, damage:30,range:28, speed:40,cooldown:1.4,r:17,counterAs:'spearman',splash:30},
 dragon:      {name:'Rồng Vàng',  hp:2100,damage:45,range:70, speed:34,cooldown:1.6,r:30,splash:60},
 skeleton:    {name:'Lính xương', hp:120, damage:13,range:22, speed:40,cooldown:1,  r:10,counterAs:'infantry'},
 boss:        {name:'Vua Xương',  hp:1500,damage:40,range:40, speed:32,cooldown:1.5,r:24,splash:50},
};
// Camp kinds. creeps: how many of each type; reward: resources for the side that dealt most of the camp's damage;
// respawn: seconds after it is cleared until it fills again (not while a unit stands within leash of it); aggro: a unit
// this close to any monster wakes the whole camp; leash: monsters never fight farther than this from the camp centre and
// walk home (healing) once nobody is within it.
// tomb: one per map, opens at opensAt seconds (announced to both sides) and also gives `buff` to the
// whole side for buff.seconds: +damage share to every hit, +speed share to walking.
export const CAMP_TYPES={
 wolves: {name:'Ổ sói',          creeps:{wolf:5},                     reward:{food:120},          respawn:240,aggro:130,leash:330},
 bandits:{name:'Trại cướp',      creeps:{bandit:3,banditArcher:2},    reward:{wood:100,gold:60},  respawn:240,aggro:150,leash:360},
 troll:  {name:'Hang quỷ đá',    creeps:{troll:1},                    reward:{stone:120,gold:60}, respawn:300,aggro:130,leash:300},
 // Only on the "Ngũ Vực" map (config/maps.ts): guards the gold hills, between the troll and the tomb.
 golem:  {name:'Hầm golem vàng', creeps:{golem:2},                    reward:{gold:140},          respawn:300,aggro:140,leash:320},
 // Realm camps of the "Ngũ Vực" map (REALMS in config/maps.ts), one kind per realm, stronger the richer the realm.
 boars:  {name:'Bãi heo rừng',   creeps:{boar:4},                     reward:{food:130},          respawn:240,aggro:130,leash:330},
 spiders:{name:'Tổ nhện',        creeps:{spiderQueen:1,spiderling:4}, reward:{wood:120,gold:40},  respawn:240,aggro:150,leash:360},
 bears:  {name:'Hang gấu đá',    creeps:{rockBear:2},                 reward:{stone:140,gold:40}, respawn:300,aggro:130,leash:320},
 // Like the tomb: sealed until opensAt (announced to both sides); slaying bossName gives the whole side `buff`.
 dragon: {name:'Hang Rồng Vàng', creeps:{dragon:1},                   reward:{gold:200},          respawn:300,aggro:190,leash:440,opensAt:480,bossName:'Rồng Vàng',buff:{seconds:90,damage:.15,speed:.10}},
 tomb:   {name:'Lăng cổ',        creeps:{boss:1,skeleton:4},          reward:{gold:150},          respawn:300,aggro:180,leash:420,opensAt:480,bossName:'Vua Xương',buff:{seconds:90,damage:.15,speed:.10}},
};
// Monsters walk home and heal CREEP_REGEN of their max hp per second once nobody is within the camp's leash.
export const CREEP_REGEN=.12;
// Splash hits deal this share of the damage. A unit fights back a monster of an awake camp within its own range plus
// CREEP_ENGAGE_MARGIN; farther ones only when it was ordered to clear that camp.
export const CREEP_SPLASH_SHARE=.35,CREEP_ENGAGE_MARGIN=40;
// An awake camp chases units within aggro + CREEP_CHASE_PAD of its centre (archers: anywhere within the leash).
export const CREEP_CHASE_PAD=60;
// AI (ai/camps.ts): fighters it sends at least to each camp kind; which kinds each difficulty clears is AI_DIFFICULTY.camps.
export const AI_CAMP_SQUAD={wolves:5,bandits:6,troll:8,golem:10,tomb:12,boars:5,spiders:6,bears:7,dragon:14};
// Map layout (map/camps.ts): pairs of camps, one nearer each fortress at mirrored walking distances, so both sides have the
// same camps equally far away. band: walking distance from the nearer fortress as a share of the distance between the
// fortresses. the tomb is a single camp about halfway.
export const CAMP_LAYOUT=[
 {kind:'wolves', pairs:2,band:[.16,.3]},
 {kind:'bandits',pairs:1,band:[.26,.4]},
 {kind:'troll',  pairs:1,band:[.32,.46]},
 {kind:'tomb',   pairs:0},
];
// Camps stay this many tiles from fortresses, flags, mines and each other; the pair's walking
// distances may differ by CAMP_PAIR_TOLERANCE of the fortress distance.
export const CAMP_SPACING={base:20,flag:11,mine:8,camp:14},CAMP_PAIR_TOLERANCE=.06;

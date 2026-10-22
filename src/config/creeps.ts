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
 skeleton:    {name:'Lính xương', hp:120, damage:13,range:22, speed:40,cooldown:1,  r:10,counterAs:'infantry'},
 boss:        {name:'Vua Xương',  hp:1500,damage:40,range:40, speed:32,cooldown:1.5,r:24,splash:50},
};
// Camp kinds. creeps: how many of each type; reward: resources for the side that dealt most of the camp's damage;
// respawn: seconds after it is cleared until it fills again (not while a unit stands within leash of it); aggro: a unit
// this close to any monster wakes the whole camp; leash: monsters never fight farther than this from the camp centre and
// walk home (healing) once nobody is within it.
// guard: stands at a neutral flag, which cannot be captured while a monster of it lives; it only comes back while the
// region is neutral. tomb: one per map, opens at opensAt seconds (announced to both sides) and also gives `buff` to the
// whole side for buff.seconds: +damage share to every hit, +speed share to walking.
export const CAMP_TYPES={
 wolves: {name:'Ổ sói',          creeps:{wolf:5},                     reward:{food:120},          respawn:240,aggro:130,leash:330},
 bandits:{name:'Trại cướp',      creeps:{bandit:3,banditArcher:2},    reward:{wood:100,gold:60},  respawn:240,aggro:150,leash:360},
 troll:  {name:'Hang quỷ đá',    creeps:{troll:1},                    reward:{stone:120,gold:60}, respawn:300,aggro:130,leash:300},
 guard:  {name:'Đồn cướp canh cờ',creeps:{bandit:3,banditArcher:2},   reward:{wood:80,gold:60},   respawn:240,aggro:150,leash:340},
 tomb:   {name:'Lăng cổ',        creeps:{boss:1,skeleton:4},          reward:{gold:150},          respawn:300,aggro:180,leash:420,opensAt:480,buff:{seconds:90,damage:.15,speed:.10}},
};
// Monsters walk home and heal CREEP_REGEN of their max hp per second once nobody is within the camp's leash.
export const CREEP_REGEN=.12;
// Splash hits deal this share of the damage. A unit fights back a monster of an awake camp within its own range plus
// CREEP_ENGAGE_MARGIN; farther ones only when it was ordered to clear that camp.
export const CREEP_SPLASH_SHARE=.35,CREEP_ENGAGE_MARGIN=40;
// An awake camp chases units within aggro + CREEP_CHASE_PAD of its centre (archers: anywhere within the leash).
export const CREEP_CHASE_PAD=60;
// AI (ai/camps.ts): fighters it sends at least to each camp kind; which kinds each difficulty clears is AI_DIFFICULTY.camps.
export const AI_CAMP_SQUAD={wolves:5,bandits:6,troll:8,guard:6,tomb:12};
// Map layout (map/camps.ts): pairs of camps, one nearer each fortress at mirrored walking distances, so both sides have the
// same camps equally far away. band: walking distance from the nearer fortress as a share of the distance between the
// fortresses. guard pairs stand at flags; the tomb is a single camp about halfway.
export const CAMP_LAYOUT=[
 {kind:'wolves', pairs:2,band:[.16,.3]},
 {kind:'bandits',pairs:1,band:[.26,.4]},
 {kind:'troll',  pairs:1,band:[.32,.46]},
 {kind:'guard',  pairs:1,band:[.22,.45]},
 {kind:'tomb',   pairs:0},
];
// Camps stay this many tiles from fortresses, flags (except guard camps; 11 keeps units standing at a flag out of a
// camp's aggro), mines and each other; the pair's walking
// distances may differ by CAMP_PAIR_TOLERANCE of the fortress distance.
export const CAMP_SPACING={base:20,flag:11,mine:8,camp:14},CAMP_PAIR_TOLERANCE=.06;

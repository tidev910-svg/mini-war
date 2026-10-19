// @ts-nocheck
// Army formations (docs/features/formations.md, spec "MINI WAR V3.1 — Hệ thống đội hình"). Layout and movement tuning
// only — formations never change a unit's own speed, damage, range or health.
export const FORMATION_KINDS = {
  defense: { name: 'Phòng thủ', hint: 'Giáo và lính bộ tuyến trước, cung phía sau, kỵ binh giữ hai cánh. Giữ cầu, giữ cờ.' },
  wedge: { name: 'Mũi nhọn', hint: 'Lính bộ làm mũi nhọn, giáo che hai cạnh, cung theo sau, kỵ binh hai bên. Đột phá một hướng.' },
  flank: { name: 'Bao vây hai cánh', hint: 'Lính bộ và giáo giữ trung tâm, cung phía sau, kỵ binh chia hai cánh đánh vòng. Địa hình rộng.' },
};
export const FORMATION_MODES = { hold: 'Giữ đội hình', free: 'Di chuyển tự do' };
// Distance between neighbouring slots (px); a front line is FORMATION_WIDTH_FACTOR·√(fighters) slots wide, within limits.
export const FORMATION_SPACING = 30, FORMATION_WIDTH_FACTOR = 1.4, FORMATION_MIN_WIDTH = 3, FORMATION_MAX_WIDTH = 14;
// Fighting: a member may leave its slot for an enemy within FORMATION_LEASH px of the slot (any distance after an attack order).
export const FORMATION_LEASH = 180;
// Marching ("Giữ đội hình"): the anchor waits while fewer than half the members are within FORMATION_CATCHUP px of
// their slot, for at most FORMATION_WAIT_MAX seconds; the formation turns towards its heading at FORMATION_TURN_RATE rad/s.
export const FORMATION_CATCHUP = 80, FORMATION_WAIT_MAX = 4, FORMATION_TURN_RATE = 1.6;
// Narrow ground: when this share of slots lands on water, rock or a building the formation marches as a 2-wide column,
// and spreads out again after the share stays at or below FORMATION_COLUMN_EXIT for FORMATION_COLUMN_SECONDS.
export const FORMATION_COLUMN_ENTER = .2, FORMATION_COLUMN_EXIT = .05, FORMATION_COLUMN_SECONDS = 1.2;

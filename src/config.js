// =====================================================================
//  Hawker Heroes - global config & tuning constants
//  Everything attaches to the window.HC namespace (no ES modules, so the
//  game runs by double-clicking index.html over file://).
// =====================================================================
window.HC = window.HC || {};

HC.Config = {
  WIDTH: 1280,
  HEIGHT: 720,
  HUD_HEIGHT: 64,

  // Inner play-field bounds (walls live just outside these).
  PLAY: { x1: 36, y1: 96, x2: 1244, y2: 690 },

  // Movement
  PLAYER_SPEED: 250,
  DASH_SPEED: 560,
  DASH_TIME: 150,        // ms of dash burst
  DASH_COOLDOWN: 900,    // ms before next dash
  DASH_BUFFER: 350,      // ms a dash press is remembered until you start moving

  // Carrying / cooking
  TRAY_CAPACITY: 2,      // dishes a player can hold at once
  PREP_TIME: 850,        // ms to cook one dish (hold action at a stall)
  STALL_COOLDOWN: 300,   // ms a stall is busy after producing a dish
  INTERACT_RANGE: 82,    // px radius to interact with a stall/table/bin

  // Round
  ROUND_TIME: 120000,    // ms (2 minutes)

  CUSTOMER: {
    PATIENCE_BASE: 33000,        // ms at the easy start (more steps now: cook, wash, mix kopi)
    PATIENCE_MIN: 21000,         // ms once fully ramped
    SPAWN_INTERVAL_START: 4600,  // ms between arrivals at the start
    SPAWN_INTERVAL_MIN: 2900,    // ms between arrivals once ramped
    FIRST_SPAWN_DELAY: 900       // ms before the very first customer
  },

  // Dish washing: cooking needs a clean plate; served/tossed plates pile up
  // dirty and must be washed at the sink. Plates are conserved
  // (clean + carried + dirty = PLATES).
  KITCHEN: {
    PLATES: 7,          // total plates in circulation
    WASH_TIME: 300      // ms to wash one dirty plate (hold action at the sink)
  },

  ORDER_KOPI_CHANCE: 0.45,   // chance an order includes (exactly) one kopi

  // Deadline-crunch students: a big meal, then they stay and keep ordering.
  DEADLINE: {
    CHANCE_START: 0.10,   // probability a new customer is on a deadline (early)
    CHANCE_MAX: 0.40,     // ...ramps up over the round
    MIN_WAVES: 2,         // total orders they'll request before submitting
    MAX_WAVES: 4,
    BIG_ORDER_MIN: 3,     // dishes in a "big meal"
    BIG_ORDER_MAX: 4,
    WAVE_BONUS: 45,       // per intermediate wave served
    FINISH_BONUS: 130,    // when they finally submit and leave
    PATIENCE_MULT: 1.6,   // they're patient (they're staying to grind)
    REORDER_DELAY: 650    // ms between finishing one order and wanting the next
  },

  SCORE: {
    PER_DISH: 25,        // per dish delivered
    ORDER_BONUS: 55,     // bonus for completing a whole order
    TIP_MAX: 60,         // extra, scaled by remaining patience
    ANGRY_PENALTY: 35,   // lost when a customer storms off
    COMBO_STEP: 0.25,    // each happy customer adds 25% to the multiplier
    COMBO_MAX: 3.0       // cap on the multiplier
  },

  COLORS: {
    floor: 0xe9d9b8,
    floorLine: 0xd8c39a,
    wall: 0x6b4a35,
    wallTop: 0x8a6446,
    hud: 0x241a12,
    hudText: '#fff4dd',
    accent: 0xe8a33d,
    good: 0x57c777,
    bad: 0xe05a4a,
    skin: 0xf3c79a,
    skinDark: 0xd99e6a,
    shadow: 0x000000
  }
};

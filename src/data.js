// =====================================================================
//  Static game data: stalls / dishes, grad-student customers, heroes.
// =====================================================================
window.HC = window.HC || {};

HC.Data = {
  // Each stall produces one signature dish. `id` is used everywhere as the
  // dish key; `tex` is the generated texture key for the little plate icon.
  stalls: [
    { id: 'chickenrice', name: 'Chicken Rice',   tex: 'dish_chickenrice', awning: 0xd64545, food: 0xf4e6bf },
    { id: 'ckt',         name: 'Char Kway Teow', tex: 'dish_ckt',         awning: 0x3c2f22, food: 0x5a4632 },
    { id: 'laksa',       name: 'Laksa',          tex: 'dish_laksa',       awning: 0xe8743b, food: 0xf08a4b },
    { id: 'satay',       name: 'Satay',          tex: 'dish_satay',       awning: 0x9c5a2e, food: 0x8a4b2a },
    { id: 'prata',       name: 'Roti Prata',     tex: 'dish_prata',       awning: 0xc99a4a, food: 0xe0b566 }
  ],

  // Kopi the customer can request. Each is mixed at the Kopi Bar from a cup of
  // coffee plus the right add-ins (milk = evaporated/condensed, sugar).
  kopi: {
    types: [
      { id: 'kopiO', name: 'Kopi O', tex: 'kopi_o', milk: false, sugar: true },   // black + sugar
      { id: 'kopi',  name: 'Kopi',   tex: 'kopi',   milk: true,  sugar: false },  // condensed milk
      { id: 'kopiC', name: 'Kopi C', tex: 'kopi_c', milk: true,  sugar: true }    // evap milk + sugar
    ],
    byId: function (id) {
      for (var i = 0; i < this.types.length; i++) if (this.types[i].id === id) return this.types[i];
      return null;
    },
    // which order id a finished cup (milk/sugar flags) satisfies, or null if not ready
    cupToType: function (milk, sugar) {
      if (!milk && sugar) return 'kopiO';
      if (milk && !sugar) return 'kopi';
      if (milk && sugar) return 'kopiC';
      return null;   // coffee only - incomplete
    }
  },

  // ---- held-item helpers (work for food dishes, kopi orders, and cups) ----
  // A cup-in-progress is encoded as 'cup_' + 'c'[+'m'][+'s'] (coffee always).
  isCup: function (id) { return typeof id === 'string' && id.indexOf('cup_') === 0; },
  cupState: function (id) {
    var suf = id.slice(4);
    return { milk: suf.indexOf('m') >= 0, sugar: suf.indexOf('s') >= 0 };
  },
  cupAdd: function (id, ingredient) {
    var st = this.cupState(id);
    st[ingredient] = true;
    return 'cup_c' + (st.milk ? 'm' : '') + (st.sugar ? 's' : '');
  },
  cupKopiType: function (id) {
    var st = this.cupState(id);
    return this.kopi.cupToType(st.milk, st.sugar);
  },
  itemTex: function (id) {
    var s = this.stallById(id);
    if (s) return s.tex;
    var k = this.kopi.byId(id);
    if (k) return k.tex;
    if (this.isCup(id)) {
      var kt = this.cupKopiType(id);
      return kt ? this.kopi.byId(kt).tex : 'cup_plain';
    }
    return 'cup_plain';
  },
  itemName: function (id) {
    var s = this.stallById(id);
    if (s) return s.name;
    var k = this.kopi.byId(id);
    if (k) return k.name;
    if (this.isCup(id)) {
      var kt = this.cupKopiType(id);
      return kt ? this.kopi.byId(kt).name : 'Empty cup';
    }
    return id;
  },

  // Hungry grad students. Each gets a distinct shirt colour + texture.
  gradStudents: [
    { name: 'Wei Ming', color: 0x4f8fc0 },
    { name: 'Priya',    color: 0xc94f8f },
    { name: 'Hiroshi',  color: 0x57a05a },
    { name: 'Sofia',    color: 0xe0913a },
    { name: 'Kwame',    color: 0x8e6cc0 },
    { name: 'Mei Ling', color: 0xd64f6a },
    { name: 'Diego',    color: 0x3fb0a8 },
    { name: 'Aisha',    color: 0xc7a83a },
    { name: 'Lars',     color: 0x6f7bd6 },
    { name: 'Nadia',    color: 0xd66f3f }
  ],

  // The two playable heroes.
  heroes: {
    p1: { key: 'tony',     name: 'Tony',     subtitle: 'The Professor', tint: 0x3f6fb0 },
    p2: { key: 'terrance', name: 'Terrance', subtitle: 'The Protégé', tint: 0x4aa05a }
  },

  // HCI/CS paper deadlines a stressed grad student might be crunching for.
  deadlines: ['CHI', 'CSCW', 'DIS', 'UIST', 'ASSETS', 'TEI', 'MobileHCI', 'GROUP'],

  // Helper: look up a stall/dish definition by id.
  stallById: function (id) {
    for (var i = 0; i < this.stalls.length; i++) {
      if (this.stalls[i].id === id) return this.stalls[i];
    }
    return null;
  }
};

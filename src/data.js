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

  // Hungry grad students. Appearances and names are decoupled: there are
  // studentTexCount sprite looks (student_0..N-1, one shirt colour each), while
  // the name pool can be much larger - a customer picks a look AND a name.
  studentTexCount: 10,
  studentShirts: [
    0x4f8fc0, 0xc94f8f, 0x57a05a, 0xe0913a, 0x8e6cc0,
    0xd64f6a, 0x3fb0a8, 0xc7a83a, 0x6f7bd6, 0xd66f3f
  ],
  // Real RICELab folks (Prof. Tony Tang's students / lab members). Terrance is
  // a playable hero, not in this pool.
  gradStudents: [
    'Kody', 'Shanna', 'Tianyi', 'Emily', 'Colin', 'Neal', 'Setareh', 'Bon',
    'Elias', 'Warren', 'Alex', 'Pei-Hua', 'Keiichi', 'Yuki', 'Martin', 'Sasha',
    'Wei Bin', 'Allyne', 'Whey Yinn', 'Justin', 'Hai Dang', 'Amy', 'Leo', 'Ava',
    'Karthik', 'Sydney', 'Andrey', 'Brennan', 'Jessi', 'Flavia', 'William',
    'Teddy', 'Hesam', 'Omid', 'Anna', 'Lisa', 'Richard', 'Waliur', 'Rojin',
    'Matthew', 'Maayan', 'Haley', 'Frederico', 'Kartikaeya', 'Ruijia',
    'Taamannae', 'Audrey', 'Kirk', 'Jessica', 'Tran', 'Ore', 'Tina',
    'Christopher', 'Hannah', 'Kevin', 'Peter', 'Josh', 'Michael', 'Constantine',
    'Nolan', 'Ksenia', 'Riane', 'Stephen', 'Anthony', 'Shaheed', 'Lamess',
    'Laurensia'
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

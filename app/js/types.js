/* Monroe Lab – Unified Type System
   Single source of truth for all object types, their visual appearance,
   field schemas, and category groupings.

   Every module that needs to know "what does a reagent look like?" or
   "what fields does a person have?" reads from here. Change it once,
   it changes everywhere: pills, popups, editor forms, table columns,
   insert-link modal, inventory filters.
*/
(function() {
  'use strict';

  // ── Type Definitions ──
  // Each type has: color, icon (emoji), label, fields (schema), group
  var TYPES = {
    reagent: {
      color: '#009688',
      icon: '\uD83E\uDDEA',
      label: 'Reagent',
      group: 'resources',
      fields: [
        { key: 'title',               label: 'Name',                type: 'text',   required: true },
        { key: 'type',                label: 'Type',                type: 'select',  options: ['reagent','buffer','consumable','equipment','kit','chemical','enzyme','solution'] },
        { key: 'location',            label: 'Location',            type: 'select',  options: ['Chemical Cabinet','Corrosive Cabinet','Flammable Cabinet','Hazardous Cabinet','Refrigerator','Freezer -20C','Freezer -80C','Bench','Other'] },
        { key: 'quantity',            label: 'Quantity',            type: 'number',  row: 'qty' },
        { key: 'unit',                label: 'Unit',                type: 'select',  options: ['g','mL','L','kg','each','box','pack'], row: 'qty' },
        { key: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number',  row: 'qty' },
      ],
      // Which fields to show in popup card (read-only view)
      displayFields: ['quantity', 'unit', 'location', 'cas', 'notes'],
      // Which fields to show as table columns
      tableColumns: ['name', 'type', 'quantity', 'location', 'notes'],
    },
    buffer: {
      color: '#e65100',
      icon: '\uD83E\uDDEA',
      label: 'Buffer/Solution',
      group: 'resources',
      fields: null, // inherits from reagent
      displayFields: null,
      tableColumns: null,
    },
    consumable: {
      color: '#1565c0',
      icon: '\uD83D\uDCE6',
      label: 'Consumable',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    equipment: {
      color: '#455a64',
      icon: '\u2699\uFE0F',
      label: 'Equipment',
      group: 'resources',
      fields: [
        { key: 'title',    label: 'Name',     type: 'text', required: true },
        { key: 'type',     label: 'Type',     type: 'hidden', value: 'equipment' },
        { key: 'location', label: 'Location', type: 'text' },
      ],
      displayFields: ['location', 'notes'],
      tableColumns: ['name', 'type', 'location', 'notes'],
    },
    kit: {
      color: '#00838f',
      icon: '\uD83E\uDDF0',
      label: 'Kit',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    chemical: {
      color: '#009688',
      icon: '\uD83E\uDDEA',
      label: 'Chemical',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    enzyme: {
      color: '#2e7d32',
      icon: '\uD83E\uDDEC',
      label: 'Enzyme',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    solution: {
      color: '#e65100',
      icon: '\uD83E\uDDEA',
      label: 'Solution',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    seed: {
      color: '#558b2f',
      icon: '\uD83C\uDF31',
      label: 'Seed Stock',
      group: 'stocks',
      fields: [
        { key: 'title',      label: 'Name',     type: 'text', required: true },
        { key: 'type',       label: 'Type',     type: 'hidden', value: 'seed' },
        { key: 'organism',   label: 'Organism',  type: 'text' },
        { key: 'stock_type', label: 'Stock Type', type: 'hidden', value: 'seed' },
        { key: 'location',   label: 'Location', type: 'text' },
        { key: 'source',     label: 'Source',    type: 'text' },
      ],
      displayFields: ['organism', 'location', 'source', 'notes'],
      tableColumns: ['name', 'type', 'location', 'notes'],
    },
    glycerol_stock: {
      color: '#4527a0',
      icon: '\u2744\uFE0F',
      label: 'Glycerol Stock',
      group: 'stocks',
      fields: [
        { key: 'title',      label: 'Name',     type: 'text', required: true },
        { key: 'type',       label: 'Type',     type: 'hidden', value: 'glycerol_stock' },
        { key: 'organism',   label: 'Organism',  type: 'text' },
        { key: 'stock_type', label: 'Stock Type', type: 'hidden', value: 'glycerol_stock' },
        { key: 'location',   label: 'Location', type: 'text' },
        { key: 'source',     label: 'Source',    type: 'text' },
      ],
      displayFields: ['organism', 'location', 'source', 'notes'],
      tableColumns: ['name', 'type', 'location', 'notes'],
    },
    plasmid: {
      color: '#ad1457',
      icon: '\uD83E\uDDEC',
      label: 'Plasmid',
      group: 'stocks',
      fields: null, // inherits from seed
      displayFields: null,
      tableColumns: null,
    },
    agro_strain: {
      color: '#558b2f',
      icon: '\uD83E\uDDA0',
      label: 'Agro Strain',
      group: 'stocks',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    dna_prep: {
      color: '#0277bd',
      icon: '\uD83E\uDDEC',
      label: 'DNA Prep',
      group: 'stocks',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    person: {
      color: '#1565c0',
      icon: '\uD83D\uDC64',
      label: 'Person',
      group: 'people',
      fields: [
        { key: 'title', label: 'Name',  type: 'text', required: true },
        { key: 'type',  label: 'Type',  type: 'hidden', value: 'person' },
        { key: 'role',  label: 'Role',  type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
      ],
      displayFields: ['role', 'email', 'notes'],
      tableColumns: ['name', 'role', 'email'],
    },
    project: {
      color: '#e65100',
      icon: '\uD83D\uDCC1',
      label: 'Project',
      group: 'projects',
      fields: [
        { key: 'title',  label: 'Title',  type: 'text', required: true },
        { key: 'type',   label: 'Type',   type: 'hidden', value: 'project' },
        { key: 'status', label: 'Status', type: 'select', options: ['active','completed','paused'] },
        { key: 'pi',     label: 'PI',     type: 'text' },
      ],
      displayFields: ['status', 'pi', 'notes'],
      tableColumns: ['name', 'status', 'pi'],
    },
    protocol: {
      color: '#6a1b9a',
      icon: '\uD83D\uDCD6',
      label: 'Protocol',
      group: 'protocols',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'type',  label: 'Type',  type: 'hidden', value: 'protocol' },
      ],
      displayFields: ['notes'],
      tableColumns: ['name'],
    },
    notebook: {
      color: '#795548',
      icon: '\uD83D\uDCD3',
      label: 'Notebook',
      group: 'notebooks',
      fields: [],
      displayFields: [],
      tableColumns: [],
    },
  };

  var DEFAULT_TYPE = { color: '#616161', icon: '\uD83D\uDD17', label: 'Link', group: 'other', fields: [], displayFields: [], tableColumns: [] };

  // ── Category Groupings ──
  // Used by insert-link modal, inventory filters, dashboard stats
  var GROUPS = {
    resources: {
      label: 'Resources',
      icon: 'science',
      color: '#009688',
      types: ['reagent', 'buffer', 'consumable', 'equipment', 'kit', 'chemical', 'enzyme', 'solution'],
      dir: 'resources',
      defaultType: 'reagent',
    },
    stocks: {
      label: 'Stocks',
      icon: 'eco',
      color: '#4caf50',
      types: ['seed', 'glycerol_stock', 'plasmid', 'agro_strain', 'dna_prep'],
      dir: 'stocks',
      defaultType: 'seed',
    },
    people: {
      label: 'People',
      icon: 'person',
      color: '#1565c0',
      types: ['person'],
      dir: 'people',
      defaultType: 'person',
    },
    protocols: {
      label: 'Protocols',
      icon: 'menu_book',
      color: '#6a1b9a',
      types: ['protocol'],
      dir: null, // protocols span multiple dirs
      defaultType: 'protocol',
    },
    projects: {
      label: 'Projects',
      icon: 'folder_special',
      color: '#e65100',
      types: ['project'],
      dir: 'projects',
      defaultType: 'project',
    },
  };

  // ── Helpers ──

  // Get type config, resolving inheritance (null fields → inherit from reagent)
  function getType(typeName) {
    var t = TYPES[typeName];
    if (!t) return DEFAULT_TYPE;
    return t;
  }

  // Get fields for a type, resolving null inheritance
  function getFields(typeName) {
    var t = TYPES[typeName];
    if (!t) return [];
    if (t.fields) return t.fields;
    // Inherit from reagent for resource types, seed for stock types
    if (t.group === 'resources') return TYPES.reagent.fields;
    if (t.group === 'stocks') return TYPES.seed.fields;
    return [];
  }

  // Get display fields for popup cards
  function getDisplayFields(typeName) {
    var t = TYPES[typeName];
    if (!t) return [];
    if (t.displayFields) return t.displayFields;
    if (t.group === 'resources') return TYPES.reagent.displayFields;
    if (t.group === 'stocks') return TYPES.seed.displayFields;
    return [];
  }

  // Get the group a type belongs to
  function getGroup(typeName) {
    var t = TYPES[typeName];
    if (!t) return null;
    return GROUPS[t.group] || null;
  }

  // Get all type names in a group
  function getTypesInGroup(groupName) {
    var g = GROUPS[groupName];
    return g ? g.types : [];
  }

  // Check if a type is in the "inventory" (resources + stocks)
  function isInventoryType(typeName) {
    var t = TYPES[typeName];
    if (!t) return false;
    return t.group === 'resources' || t.group === 'stocks';
  }

  // Build a flat TYPE_CONFIG-style map for quick color/icon lookups
  var _configCache = null;
  function getTypeConfig() {
    if (_configCache) return _configCache;
    _configCache = {};
    Object.keys(TYPES).forEach(function(key) {
      _configCache[key] = { color: TYPES[key].color, icon: TYPES[key].icon, label: TYPES[key].label };
    });
    return _configCache;
  }

  // ── Pill Styling (single source of truth) ──
  // Change this ONE function to change how pills look everywhere:
  // wikilinks, popups, editor, rich-input, calendar, inventory badges.
  //
  // Returns a CSS string for inline style.
  // mode: 'inline' (default, for inline text pills) or 'badge' (for table badges)
  function pillStyle(typeName, mode) {
    var t = TYPES[typeName] || DEFAULT_TYPE;
    var color = t.color;

    // ── THE pill design — border style ──
    // Change these lines to change every pill in the entire app.
    if (mode === 'badge') {
      return 'display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;' +
        'background:' + color + '12;color:' + color + ';border:1.5px solid ' + color + '40;';
    }
    return 'display:inline-flex;align-items:center;gap:4px;' +
      'background:' + color + '12;color:' + color + ';' +
      'border:1.5px solid ' + color + '50;' +
      'padding:1px 10px 1px 6px;border-radius:16px;font-size:13px;font-weight:500;' +
      'text-decoration:none;cursor:pointer;vertical-align:middle;white-space:nowrap;';
  }

  // Returns the icon + title HTML for a pill
  function pillContent(typeName, title) {
    var t = TYPES[typeName] || DEFAULT_TYPE;
    return t.icon + ' ' + title;
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.types = {
    TYPES: TYPES,
    GROUPS: GROUPS,
    DEFAULT: DEFAULT_TYPE,
    get: getType,
    getFields: getFields,
    getDisplayFields: getDisplayFields,
    getGroup: getGroup,
    getTypesInGroup: getTypesInGroup,
    isInventoryType: isInventoryType,
    getTypeConfig: getTypeConfig,
    pillStyle: pillStyle,
    pillContent: pillContent,
  };
})();

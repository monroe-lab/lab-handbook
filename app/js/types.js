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
      icon: 'fa:fa-solid fa-flask',
      label: 'Reagent',
      group: 'resources',
      fields: [
        { key: 'title',               label: 'Name',                type: 'text',   required: true },
        { key: 'type',                label: 'Type',                type: 'select',  options: ['reagent','buffer','consumable','equipment','kit','chemical','enzyme','solution'] },
        { key: 'location',            label: 'Default Location',    type: 'select',  options: ['Chemical Cabinet','Corrosive Cabinet','Flammable Cabinet','Hazardous Cabinet','Refrigerator','Freezer -20C','Freezer -80C','Bench','Other'] },
        { key: 'location_detail',     label: 'Location Detail',     type: 'text' },
        // R5: `containers:` is dead — physical instances are now standalone
        // `bottle` objects under docs/stocks/ that point at this concept via
        // `of:`. Col 3 backlinks pane lists them automatically.
        { key: 'status',              label: 'Status',              type: 'select',  options: ['in_stock','needs_more','out_of_stock','external'], default: 'in_stock' },
        { key: 'created_at',          label: 'Created',             type: 'meta_readonly' },
        { key: 'created_by',          label: 'Created by',          type: 'meta_readonly' },
        { key: 'updated_at',          label: 'Updated',             type: 'meta_readonly' },
      ],
      // Which fields to show in popup card (read-only view)
      displayFields: ['status', 'location', 'cas', 'notes', 'updated_at'],
      // Which fields to show as table columns
      tableColumns: ['name', 'type', 'status', 'quantity', 'location', 'updated_at'],
    },
    buffer: {
      color: '#e65100',
      icon: 'fa:fa-solid fa-flask-vial',
      label: 'Buffer/Solution',
      group: 'resources',
      fields: null, // inherits from reagent
      displayFields: null,
      tableColumns: null,
    },
    consumable: {
      color: '#1565c0',
      icon: 'fa:fa-solid fa-boxes-stacked',
      label: 'Consumable',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    equipment: {
      color: '#455a64',
      icon: 'fa:fa-solid fa-screwdriver-wrench',
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
      icon: 'fa:fa-solid fa-kit-medical',
      label: 'Kit',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    chemical: {
      color: '#009688',
      icon: 'fa:fa-solid fa-atom',
      label: 'Chemical',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    enzyme: {
      color: '#2e7d32',
      icon: 'fa:fa-solid fa-dna',
      label: 'Enzyme',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    solution: {
      color: '#e65100',
      icon: 'fa:fa-solid fa-bottle-droplet',
      label: 'Solution',
      group: 'resources',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    seed: {
      color: '#558b2f',
      icon: 'fa:fa-solid fa-seedling',
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
      icon: 'fa:fa-solid fa-snowflake',
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
      icon: 'fa:fa-solid fa-circle-nodes',
      label: 'Plasmid',
      group: 'stocks',
      fields: null, // inherits from seed
      displayFields: null,
      tableColumns: null,
    },
    agro_strain: {
      color: '#558b2f',
      icon: 'fa:fa-solid fa-bacterium',
      label: 'Agro Strain',
      group: 'stocks',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    dna_prep: {
      color: '#0277bd',
      icon: 'fa:fa-solid fa-dna',
      label: 'DNA Prep',
      group: 'stocks',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    bottle: {
      // R5: physical instance of a reagent/stock concept.
      // Concept lives at docs/resources/<slug>.md (or docs/stocks/<slug>.md).
      // Each bottle is its own object with parent + position + lot + expiration.
      // The `of:` frontmatter points at the concept slug; the body should also
      // contain a [[wikilink]] to the concept for prose readability.
      color: '#ef6c00',
      icon: 'fa:fa-solid fa-wine-bottle',
      label: 'Bottle',
      group: 'stocks',
      fields: [
        { key: 'title',      label: 'Name',                type: 'text', required: true },
        { key: 'type',       label: 'Type',                type: 'hidden', value: 'bottle' },
        { key: 'of',         label: 'Of (concept slug)',   type: 'text', placeholder: 'e.g. resources/ethanol-absolute' },
        { key: 'parent',     label: 'Parent',              type: 'text', placeholder: 'slug of parent location' },
        { key: 'position',   label: 'Position in parent',  type: 'text', placeholder: 'e.g. A1 (if parent has grid)' },
        { key: 'quantity',   label: 'Quantity',            type: 'text', placeholder: 'amount in the bottle' },
        { key: 'unit',       label: 'Unit',                type: 'text', placeholder: 'g, mL, L, each' },
        { key: 'lot',        label: 'Lot',                 type: 'text' },
        { key: 'expiration', label: 'Expiration',          type: 'text', placeholder: 'YYYY-MM-DD' },
        { key: 'acquired',   label: 'Acquired',            type: 'text', placeholder: 'YYYY-MM-DD' },
        { key: 'level',      label: 'Level',               type: 'text', placeholder: 'e.g. full, 3/4, empty' },
      ],
      displayFields: ['of', 'parent', 'position', 'quantity', 'unit', 'lot', 'expiration', 'acquired', 'level'],
      tableColumns: ['name', 'of', 'parent', 'quantity', 'unit', 'expiration'],
    },
    person: {
      color: '#1565c0',
      icon: 'fa:fa-solid fa-user',
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
      icon: 'fa:fa-solid fa-diagram-project',
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
      icon: 'fa:fa-solid fa-book-open',
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
      icon: 'fa:fa-solid fa-book',
      label: 'Notebook',
      group: 'notebooks',
      fields: [],
      displayFields: [],
      tableColumns: [],
    },
    waste_container: {
      color: '#c62828',
      icon: 'fa:fa-solid fa-biohazard',
      label: 'Waste Container',
      group: 'waste',
      fields: [
        { key: 'title',          label: 'Name',           type: 'text', required: true },
        { key: 'type',           label: 'Type',           type: 'hidden', value: 'waste_container' },
        { key: 'contents',       label: 'Contents',       type: 'text' },
        { key: 'physical_state', label: 'Physical State', type: 'select', options: ['Liquid','Solid','Sludge','Gas'] },
        { key: 'container',      label: 'Container',      type: 'text' },
        { key: 'location',       label: 'Location',       type: 'text' },
        { key: 'hazard_class',   label: 'Hazard Class',   type: 'text' },
        { key: 'status',         label: 'Status',         type: 'select', options: ['in_accumulation','ready_for_pickup','picked_up'] },
        { key: 'started',        label: 'Started',        type: 'text' },
        { key: 'waste_tag',      label: 'WASTe Tag #',    type: 'text' },
      ],
      displayFields: ['contents', 'physical_state', 'location', 'hazard_class', 'status', 'started', 'waste_tag'],
      tableColumns: ['name', 'contents', 'location', 'status', 'started'],
    },
    sample: {
      color: '#7c3aed',
      icon: 'fa:fa-solid fa-vial',
      label: 'Sample',
      group: 'lab',
      fields: [
        { key: 'title',           label: 'Name',            type: 'text', required: true },
        { key: 'type',            label: 'Type',            type: 'hidden', value: 'sample' },
        { key: 'sample_id',       label: 'Sample ID',       type: 'text' },
        { key: 'species',         label: 'Species',         type: 'text' },
        { key: 'project',         label: 'Project',         type: 'text' },
        { key: 'lead',            label: 'Lead',            type: 'text' },
        { key: 'sequencing_type', label: 'Sequencing Type', type: 'select', options: ['HiFi','Illumina','Nanopore','Other'] },
        { key: 'status',          label: 'Status',          type: 'select', options: ['active','sequenced','extracted','archived'] },
        // Notes removed (R3 feedback) — markdown body is the freeform area.
      ],
      displayFields: ['sample_id', 'species', 'project', 'lead', 'sequencing_type', 'status'],
      tableColumns: ['name', 'sample_id', 'species', 'status', 'project'],
    },
    guide: {
      color: '#0277bd',
      icon: 'fa:fa-solid fa-graduation-cap',
      label: 'Guide',
      group: 'guides',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'type',  label: 'Type',  type: 'hidden', value: 'guide' },
      ],
      displayFields: [],
      tableColumns: ['name'],
    },

    // ── Location hierarchy types ──
    // All location types share the same schema (title, parent, position, grid, labels).
    // Different types get different colors/icons but behave identically in the index
    // and breadcrumb renderer. Containers with a `grid` field render as grid views.
    room: {
      color: '#37474f',
      icon: 'fa:fa-solid fa-door-open',
      label: 'Room',
      group: 'locations',
      fields: [
        { key: 'title',    label: 'Name',                        type: 'text', required: true },
        { key: 'type',     label: 'Type',                        type: 'hidden', value: 'room' },
        { key: 'parent',   label: 'Parent',                      type: 'text', placeholder: 'slug of parent (optional)' },
        { key: 'label_1',  label: 'Label 1 (full)',              type: 'textarea' },
        { key: 'label_2',  label: 'Label 2 (grid cell)',         type: 'textarea' },
      ],
      displayFields: ['parent'],
      tableColumns: ['name', 'type', 'parent'],
    },
    freezer: {
      color: '#0277bd',
      icon: 'fa:fa-solid fa-temperature-low',
      label: 'Freezer',
      group: 'locations',
      fields: [
        { key: 'title',    label: 'Name',                        type: 'text', required: true },
        { key: 'type',     label: 'Type',                        type: 'hidden', value: 'freezer' },
        { key: 'parent',   label: 'Parent',                      type: 'text' },
        { key: 'position', label: 'Position in parent',          type: 'text', placeholder: 'e.g. A1 (if parent has grid)' },
        { key: 'grid',     label: 'Grid (e.g. 5x1)',             type: 'text', placeholder: 'rowsxcols, optional' },
        { key: 'label_1',  label: 'Label 1 (full)',              type: 'textarea' },
        { key: 'label_2',  label: 'Label 2 (grid cell)',         type: 'textarea' },
        // Notes removed (R3 feedback) — the markdown body is the canonical
        // freeform text area for every object. A separate `notes:` field
        // was redundant and visually cluttered col 1.
      ],
      displayFields: ['parent', 'grid'],
      tableColumns: ['name', 'type', 'parent'],
    },
    fridge: {
      color: '#0288d1',
      icon: 'fa:fa-regular fa-snowflake',
      label: 'Fridge',
      group: 'locations',
      fields: null, // inherits from freezer
      displayFields: null,
      tableColumns: null,
    },
    shelf: {
      color: '#546e7a',
      icon: 'fa:fa-solid fa-layer-group',
      label: 'Shelf',
      group: 'locations',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    box: {
      color: '#8d6e63',
      icon: 'fa:fa-solid fa-box',
      label: 'Box',
      group: 'locations',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    tube: {
      color: '#00897b',
      icon: 'fa:fa-solid fa-vial',
      label: 'Tube',
      group: 'locations',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },
    container: {
      color: '#616161',
      icon: 'fa:fa-solid fa-cube',
      label: 'Container',
      group: 'locations',
      fields: null,
      displayFields: null,
      tableColumns: null,
    },

    // Calendar events — markdown files under docs/events/ that replace
    // the old schedule.json approach. Each event is a first-class object
    // with frontmatter fields for date/time/member and a markdown body
    // for notes, wikilinks, instructions, etc.
    event: {
      color: '#0288d1',
      icon: 'fa:fa-regular fa-calendar',
      label: 'Event',
      group: 'calendar',
      fields: [
        { key: 'title',      label: 'Title',      type: 'text',   required: true },
        { key: 'type',       label: 'Type',        type: 'hidden', value: 'event' },
        { key: 'date',       label: 'Date',        type: 'text',   required: true },
        { key: 'start_time', label: 'Start Time',  type: 'text',   required: true },
        { key: 'end_time',   label: 'End Time',    type: 'text',   required: true },
        { key: 'member',     label: 'Member(s)',   type: 'text' },
        { key: 'created_by', label: 'Created By',  type: 'meta_readonly' },
        { key: 'created_at', label: 'Created',     type: 'meta_readonly' },
      ],
      displayFields: ['date', 'start_time', 'end_time', 'member', 'created_by'],
      tableColumns: ['name', 'date', 'start_time', 'end_time', 'member'],
    },
  };

  var DEFAULT_TYPE = { color: '#616161', icon: 'fa:fa-solid fa-link', label: 'Link', group: 'other', fields: [], displayFields: [], tableColumns: [] };

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
      types: ['seed', 'glycerol_stock', 'plasmid', 'agro_strain', 'dna_prep', 'bottle'],
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
    lab: {
      label: 'Samples',
      icon: 'biotech',
      color: '#7c3aed',
      types: ['sample'],
      dir: 'samples',
      defaultType: 'sample',
    },
    waste: {
      label: 'Waste',
      icon: 'delete',
      color: '#c62828',
      types: ['waste_container'],
      dir: 'waste',
      defaultType: 'waste_container',
    },
    calendar: {
      label: 'Calendar',
      icon: 'event',
      color: '#0288d1',
      types: ['event'],
      dir: 'events',
      defaultType: 'event',
    },
    locations: {
      label: 'Lab Map',
      icon: 'map',
      color: '#546e7a',
      types: ['room', 'freezer', 'fridge', 'shelf', 'box', 'tube', 'container'],
      dir: 'locations',
      defaultType: 'box',
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
    // Inherit from reagent for resource types, seed for stock types,
    // freezer for location types (all location types share the same schema).
    if (t.group === 'resources') return TYPES.reagent.fields;
    if (t.group === 'stocks') return TYPES.seed.fields;
    if (t.group === 'locations') return TYPES.freezer.fields;
    return [];
  }

  // Get display fields for popup cards
  function getDisplayFields(typeName) {
    var t = TYPES[typeName];
    if (!t) return [];
    if (t.displayFields) return t.displayFields;
    if (t.group === 'resources') return TYPES.reagent.displayFields;
    if (t.group === 'stocks') return TYPES.seed.displayFields;
    if (t.group === 'locations') return TYPES.freezer.displayFields;
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

  // R6.5: A "concept type" is one whose cards represent abstract entities,
  // not physical instances. Concept types enforce title uniqueness within
  // their type at save time — you should never have two `reagent` cards
  // both titled "Ethanol Absolute" or two `protocol` cards both titled "PCR".
  //
  // Instance types (bottle, the locations group) are EXEMPT — multiple
  // bottles of the same concept legitimately share their concept's title,
  // and multiple tubes of "Pistachio Leaf 1" can live in different boxes.
  // Legacy stock types (seed, plasmid, etc.) are also exempt because each
  // file historically represented one physical stock.
  //
  // The check is by `type` field, not by group, because the `stocks` group
  // mixes concept-ish (seed) and instance-ish (bottle) types.
  function isConceptType(typeName) {
    var t = TYPES[typeName];
    if (!t) return false;
    // Locations group: structural, not conceptual.
    if (t.group === 'locations') return false;
    // R5 bottles are explicit instances.
    if (typeName === 'bottle') return false;
    // Stock types (seed, plasmid, etc.) historically represented physical
    // instances; do not enforce concept uniqueness on them. (When/if we
    // promote them to a concept/instance split like R5 did for reagents,
    // revisit this.)
    if (t.group === 'stocks') return false;
    return true;
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

  // Render an icon — Font Awesome icons start with 'fa:', emoji are plain strings
  function renderIcon(iconStr) {
    if (!iconStr) return '';
    if (iconStr.startsWith('fa:')) {
      return '<i class="' + iconStr.slice(3) + '" style="font-size:inherit;width:1em;text-align:center"></i>';
    }
    return iconStr;
  }

  // Returns the icon + title HTML for a pill
  function pillContent(typeName, title) {
    var t = TYPES[typeName] || DEFAULT_TYPE;
    return renderIcon(t.icon) + ' ' + title;
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
    isConceptType: isConceptType,
    getTypeConfig: getTypeConfig,
    pillStyle: pillStyle,
    renderIcon: renderIcon,
    pillContent: pillContent,
  };
})();

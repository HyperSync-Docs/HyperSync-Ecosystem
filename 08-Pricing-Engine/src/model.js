/*
 * HyperSync Enterprise Pricing Engine
 * model.js — INPUT DATA + PRICING ASSUMPTIONS.
 *
 * This file is the single source of truth for every variable the engine reads.
 * The UI is generated from this registry and the assumption-transparency panel
 * is generated from the same records, so a rate can never appear in a
 * calculation without also appearing — with its source type — on screen.
 *
 * To change a HyperSync rate, edit the `def` here. No UI work is required.
 */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
   * Source types. Governs how an assumption is presented to stakeholders.
   * Nothing estimated may be displayed as a verified vendor price.
   * ------------------------------------------------------------------- */
  var SOURCE = {
    CUSTOMER: 'Customer Input',
    VENDOR_PUBLISHED: 'Vendor Published Price',
    VENDOR_NEGOTIATED: 'Negotiated Vendor Price',
    HYPERSYNC: 'HyperSync Commercial Assumption',
    ESTIMATED: 'Estimated',
    TBD: 'TBD'
  };

  /* Source types that must be visually flagged as not-yet-established. */
  var UNVERIFIED_SOURCES = [SOURCE.ESTIMATED, SOURCE.TBD];

  var SECTIONS = [
    { id: 'profile',        num: 1,  title: 'Enterprise Profile',                 blurb: 'Scale of the organization being modeled. These values drive infrastructure demand and implementation effort.' },
    { id: 'automation',     num: 2,  title: 'Zapier / Automation Infrastructure', blurb: 'Third-party automation platform demand and vendor cost assumptions. Not every operation consumes the same number of tasks — weights are configurable.' },
    { id: 'integrations',   num: 3,  title: 'App & System Integrations',          blurb: 'Integration counts and the setup / maintenance rates applied to them. Examples: SAP, SharePoint, Microsoft Teams, Power BI, Excel, CRM, ERP, quality systems, manufacturing systems, custom APIs.' },
    { id: 'implementation', num: 4,  title: 'HyperSync Implementation',           blurb: 'One-time delivery cost basis. Each line item is priced either as a flat fee or as quantity × unit rate, where quantity may be driven by an enterprise-profile value.' },
    { id: 'recurring',      num: 5,  title: 'Ongoing HyperSync Services',         blurb: 'Recurring delivery cost basis. Each service may be modeled on an annual, monthly, per-user, per-workflow, per-operating-system, or percent-of-implementation basis.' },
    { id: 'commercial',     num: 6,  title: 'Commercial Model',                   blurb: 'Converts cost basis into customer price. Markup and gross margin are distinct methodologies with separate rate sets.' },
    { id: 'projection',     num: 10, title: 'Multi-Year Assumptions',             blurb: 'Growth, inflation and price-adjustment assumptions applied across the five-year projection.' }
  ];

  var FIELDS = [];

  function f(def) {
    if (!def.sections) def.sections = [def.section];
    FIELDS.push(def);
    return def;
  }

  /* =====================================================================
   * SECTION 1 — ENTERPRISE PROFILE
   * =================================================================== */
  var COMPLEXITY_LEVELS = ['Low', 'Moderate', 'High', 'Enterprise Critical'];

  f({ key: 'orgName', section: 'profile', label: 'Organization Name', kind: 'text', def: 'Enterprise Organization', source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'employees', section: 'profile', label: 'Number of Employees', kind: 'int', unit: 'employees', def: 2400, source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'users', section: 'profile', label: 'Number of HyperSync Users', kind: 'int', unit: 'users', def: 250, source: SOURCE.CUSTOMER, exec: true, help: 'Licensed HyperSync users. Drives platform licensing, training and support cost.' });
  f({ key: 'facilities', section: 'profile', label: 'Number of Facilities', kind: 'int', unit: 'sites', def: 2, source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'departments', section: 'profile', label: 'Number of Departments', kind: 'int', unit: 'departments', def: 6, source: SOURCE.CUSTOMER });
  f({ key: 'businessUnits', section: 'profile', label: 'Number of Business Units', kind: 'int', unit: 'business units', def: 1, source: SOURCE.CUSTOMER });
  f({ key: 'operatingSystems', section: 'profile', label: 'Number of HyperSync Operating Systems', kind: 'int', unit: 'operating systems', def: 2, source: SOURCE.CUSTOMER, exec: true, help: 'IPOS operating systems deployed (for example License OS, Lead OS, Gate OS).' });
  f({ key: 'workflows', section: 'profile', label: 'Number of Automated Workflows / Zaps', kind: 'int', unit: 'workflows', def: 40, source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'annualTransactions', section: 'profile', label: 'Expected Annual Transaction Volume', kind: 'int', unit: 'transactions / yr', def: 250000, source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'complexity', section: 'profile', label: 'Deployment Complexity', kind: 'select', options: COMPLEXITY_LEVELS, def: 'Moderate', source: SOURCE.CUSTOMER, exec: true, help: 'Applies a configurable effort multiplier to implementation and integration work.' });

  f({ key: 'cxLow', section: 'profile', group: 'Complexity Multipliers', label: 'Complexity Multiplier — Low', kind: 'number', unit: '×', def: 0.85, source: SOURCE.HYPERSYNC, min: 0.1, max: 5 });
  f({ key: 'cxModerate', section: 'profile', group: 'Complexity Multipliers', label: 'Complexity Multiplier — Moderate', kind: 'number', unit: '×', def: 1.00, source: SOURCE.HYPERSYNC, min: 0.1, max: 5 });
  f({ key: 'cxHigh', section: 'profile', group: 'Complexity Multipliers', label: 'Complexity Multiplier — High', kind: 'number', unit: '×', def: 1.25, source: SOURCE.HYPERSYNC, min: 0.1, max: 5 });
  f({ key: 'cxCritical', section: 'profile', group: 'Complexity Multipliers', label: 'Complexity Multiplier — Enterprise Critical', kind: 'number', unit: '×', def: 1.55, source: SOURCE.HYPERSYNC, min: 0.1, max: 5 });

  /* =====================================================================
   * SECTION 2 — ZAPIER / AUTOMATION INFRASTRUCTURE
   * =================================================================== */
  var TASK_BASIS = [
    'Greater of declared or transaction-derived',
    'Declared task volume only',
    'Transaction-derived volume only'
  ];
  var ANNUAL_BASIS = ['Derive from monthly (× 12)', 'Enter annual volume directly'];

  f({ key: 'zapTasksMonthly', section: 'automation', group: 'Demand', label: 'Monthly Zapier Task Volume', kind: 'int', unit: 'tasks / mo', def: 90000, source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'zapAnnualBasis', section: 'automation', group: 'Demand', label: 'Annual Task Volume Basis', kind: 'select', options: ANNUAL_BASIS, def: ANNUAL_BASIS[0], source: SOURCE.CUSTOMER });
  f({ key: 'zapTasksAnnualDirect', section: 'automation', group: 'Demand', label: 'Annual Zapier Task Volume (direct entry)', kind: 'int', unit: 'tasks / yr', def: 1080000, source: SOURCE.CUSTOMER, help: 'Used only when the basis above is set to direct entry.' });
  f({ key: 'taskDemandBasis', section: 'automation', group: 'Demand', label: 'Core Task Demand Basis', kind: 'select', options: TASK_BASIS, def: TASK_BASIS[0], source: SOURCE.HYPERSYNC, help: 'Declared volume and transaction-derived volume are two independent estimates of the same demand. This selects which one governs.' });
  f({ key: 'avgTasksPerTransaction', section: 'automation', group: 'Demand', label: 'Average Tasks per Transaction', kind: 'number', unit: 'tasks / transaction', def: 3.5, source: SOURCE.ESTIMATED, min: 0, max: 1000, exec: true });
  f({ key: 'zapUsers', section: 'automation', group: 'Demand', label: 'Number of Zapier Users', kind: 'int', unit: 'seats', def: 8, source: SOURCE.CUSTOMER });
  f({ key: 'activeZaps', section: 'automation', group: 'Demand', label: 'Number of Active Zaps', kind: 'int', unit: 'zaps', def: 60, source: SOURCE.CUSTOMER });
  f({ key: 'taskGrowthPct', section: 'automation', sections: ['automation', 'projection'], group: 'Demand', label: 'Expected Annual Task Growth', kind: 'percent', unit: '% / yr', def: 0.15, source: SOURCE.CUSTOMER, min: -0.9, max: 5, exec: true, help: 'Shared with the multi-year projection — a single growth assumption drives both.' });

  f({ key: 'premiumAppOpsAnnual', section: 'automation', group: 'Operation Mix', label: 'Premium App Usage', kind: 'int', unit: 'operations / yr', def: 140000, source: SOURCE.CUSTOMER });
  f({ key: 'aiOpsAnnual', section: 'automation', group: 'Operation Mix', label: 'Premium AI Operation Volume', kind: 'int', unit: 'AI operations / yr', def: 30000, source: SOURCE.CUSTOMER });
  f({ key: 'codeStepsAnnual', section: 'automation', group: 'Operation Mix', label: 'Code-Step Usage', kind: 'int', unit: 'code steps / yr', def: 55000, source: SOURCE.CUSTOMER });
  f({ key: 'apiCallsAnnual', section: 'automation', group: 'Operation Mix', label: 'API Call Volume', kind: 'int', unit: 'calls / yr', def: 1500000, source: SOURCE.CUSTOMER, exec: true });
  f({ key: 'webhookCallsAnnual', section: 'automation', group: 'Operation Mix', label: 'Webhook Volume', kind: 'int', unit: 'webhooks / yr', def: 480000, source: SOURCE.CUSTOMER });
  f({ key: 'storageRecords', section: 'automation', group: 'Operation Mix', label: 'Data Storage / Table Usage', kind: 'int', unit: 'records', def: 90000, source: SOURCE.CUSTOMER });

  f({ key: 'wPremiumApp', section: 'automation', group: 'Task Consumption Weights', label: 'Tasks per Premium App Operation', kind: 'number', unit: 'tasks / op', def: 1.0, source: SOURCE.ESTIMATED, min: 0, max: 100 });
  f({ key: 'wAiOp', section: 'automation', group: 'Task Consumption Weights', label: 'Tasks per AI Operation', kind: 'number', unit: 'tasks / op', def: 1.0, source: SOURCE.ESTIMATED, min: 0, max: 100 });
  f({ key: 'wCodeStep', section: 'automation', group: 'Task Consumption Weights', label: 'Tasks per Code Step', kind: 'number', unit: 'tasks / step', def: 1.0, source: SOURCE.ESTIMATED, min: 0, max: 100 });
  f({ key: 'wWebhook', section: 'automation', group: 'Task Consumption Weights', label: 'Tasks per Webhook', kind: 'number', unit: 'tasks / webhook', def: 0, source: SOURCE.ESTIMATED, min: 0, max: 100, help: 'Default 0 — inbound webhook triggers are assumed not to consume tasks under the modeled plan. Adjust if the negotiated plan bills them.' });
  f({ key: 'wApiCall', section: 'automation', group: 'Task Consumption Weights', label: 'Tasks per API Call', kind: 'number', unit: 'tasks / call', def: 0.25, source: SOURCE.ESTIMATED, min: 0, max: 100, help: 'Only a share of API traffic passes through a billable automation step.' });

  f({ key: 'zapBasePlatformAnnual', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Base Zapier Platform Cost', kind: 'currency', unit: '$ / yr', def: 96000, source: SOURCE.TBD, exec: true, help: 'Enterprise platform pricing is negotiated and not published. Replace with the negotiated figure before any commercial commitment.' });
  f({ key: 'zapIncludedTasksAnnual', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Tasks Included in Base Platform Cost', kind: 'int', unit: 'tasks / yr', def: 12000000, source: SOURCE.TBD });
  f({ key: 'zapIncrementalTaskCost', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Incremental Task Cost', kind: 'currency', unit: '$ / task', def: 0.0032, source: SOURCE.TBD, step: 0.0001, exec: true });
  f({ key: 'zapPerUserAnnual', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Zapier Cost per User', kind: 'currency', unit: '$ / seat / yr', def: 780, source: SOURCE.TBD });
  f({ key: 'premiumServiceAnnual', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Premium Service Cost (fixed)', kind: 'currency', unit: '$ / yr', def: 60000, source: SOURCE.TBD });
  f({ key: 'premiumAppCostPerOp', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Premium App Cost per Operation', kind: 'currency', unit: '$ / op', def: 0.0009, source: SOURCE.ESTIMATED, step: 0.0001 });
  f({ key: 'aiServiceAnnualFlat', section: 'automation', group: 'Vendor Cost Assumptions', label: 'AI Service Cost (fixed)', kind: 'currency', unit: '$ / yr', def: 24000, source: SOURCE.TBD });
  f({ key: 'aiCostPerOp', section: 'automation', group: 'Vendor Cost Assumptions', label: 'AI Service Cost per Operation', kind: 'currency', unit: '$ / op', def: 0.012, source: SOURCE.ESTIMATED, step: 0.0001 });
  f({ key: 'apiCostPer1k', section: 'automation', group: 'Vendor Cost Assumptions', label: 'API Call Cost', kind: 'currency', unit: '$ / 1,000 calls', def: 0.85, source: SOURCE.ESTIMATED, step: 0.01 });
  f({ key: 'webhookCostPer1k', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Webhook Cost', kind: 'currency', unit: '$ / 1,000 webhooks', def: 0.35, source: SOURCE.ESTIMATED, step: 0.01 });
  f({ key: 'storageCostPer1kMonthly', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Data Storage / Table Cost', kind: 'currency', unit: '$ / 1,000 records / mo', def: 1.20, source: SOURCE.ESTIMATED, step: 0.01 });
  f({ key: 'otherAutomationInfraAnnual', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Other Automation Infrastructure Cost', kind: 'currency', unit: '$ / yr', def: 48000, source: SOURCE.ESTIMATED });
  f({ key: 'otherInfraAnnual', section: 'automation', group: 'Vendor Cost Assumptions', label: 'Other Enterprise Infrastructure Cost', kind: 'currency', unit: '$ / yr', def: 36000, source: SOURCE.ESTIMATED, help: 'Hosting, networking, monitoring and any other infrastructure carried on the HyperSync cost basis.' });

  /* =====================================================================
   * SECTION 3 — APP & SYSTEM INTEGRATIONS
   * =================================================================== */
  var INTEGRATION_TYPES = [
    { key: 'stdIntegrations',        rateKey: 'stdIntegrationSetup',        label: 'Standard Integrations',        rateLabel: 'Standard Integration Setup',        countDef: 6,  rateDef: 6500,  exec: true },
    { key: 'premiumIntegrations',    rateKey: 'premiumIntegrationSetup',    label: 'Premium Integrations',         rateLabel: 'Premium Integration Setup',         countDef: 3,  rateDef: 14000, exec: true },
    { key: 'customApiIntegrations',  rateKey: 'customApiIntegrationSetup',  label: 'Custom API Integrations',      rateLabel: 'Custom API Integration',            countDef: 2,  rateDef: 28500, exec: true },
    { key: 'enterpriseSystems',      rateKey: 'enterpriseSystemSetup',      label: 'Enterprise Systems',           rateLabel: 'Enterprise System Integration',     countDef: 2,  rateDef: 46000, exec: true },
    { key: 'dataSources',            rateKey: 'dataSourceSetup',            label: 'Data Sources',                 rateLabel: 'Data Source Integration',           countDef: 5,  rateDef: 5200 },
    { key: 'reportingIntegrations',  rateKey: 'reportingIntegrationSetup',  label: 'Reporting Integrations',       rateLabel: 'Reporting Integration',             countDef: 2,  rateDef: 7800 }
  ];

  INTEGRATION_TYPES.forEach(function (t) {
    f({ key: t.key, section: 'integrations', group: 'Integration Counts', label: 'Number of ' + t.label, kind: 'int', unit: 'integrations', def: t.countDef, source: SOURCE.CUSTOMER, exec: !!t.exec });
    f({ key: t.rateKey, section: 'integrations', group: 'Integration Rates', label: t.rateLabel, kind: 'currency', unit: '$ each', def: t.rateDef, source: SOURCE.HYPERSYNC });
  });

  f({ key: 'integrationMaintenanceAnnualPer', section: 'integrations', group: 'Integration Rates', label: 'Integration Maintenance', kind: 'currency', unit: '$ / integration / yr', def: 2400, source: SOURCE.HYPERSYNC });
  f({ key: 'applyComplexityToIntegrations', section: 'integrations', group: 'Integration Rates', label: 'Apply Complexity Multiplier to Integration Setup', kind: 'toggle', def: true, source: SOURCE.HYPERSYNC });

  /* =====================================================================
   * SECTION 4 — HYPERSYNC IMPLEMENTATION
   *
   * Each line item is priced as a flat fee or as quantity × unit rate.
   * A quantity may be driven by an enterprise-profile value, so a change in
   * enterprise scale flows straight through to implementation cost.
   * =================================================================== */
  var DRIVERS = [
    { id: 'manual',           label: 'Manual quantity' },
    { id: 'users',            label: 'HyperSync Users' },
    { id: 'facilities',       label: 'Facilities' },
    { id: 'departments',      label: 'Departments' },
    { id: 'businessUnits',    label: 'Business Units' },
    { id: 'operatingSystems', label: 'Operating Systems' },
    { id: 'workflows',        label: 'Workflows' },
    { id: 'integrations',     label: 'Total Integrations' }
  ];
  var IMPL_METHODS = ['Flat fee', 'Quantity × rate'];

  var IMPLEMENTATION_ITEMS = [
    { key: 'baseInstall',       label: 'HyperSync Base Installation Fee', method: 'Flat fee',        driver: 'manual',           qty: 1,  rate: 0,     flat: 45000,  complexity: false, exec: true },
    { key: 'discovery',         label: 'Discovery / Process Mapping',     method: 'Quantity × rate', driver: 'departments',      qty: 6,  rate: 4200,  flat: 38000,  complexity: true },
    { key: 'architecture',      label: 'Architecture Design',             method: 'Quantity × rate', driver: 'operatingSystems', qty: 2,  rate: 9500,  flat: 42000,  complexity: true },
    { key: 'osConfig',          label: 'Operating System Configuration',  method: 'Quantity × rate', driver: 'operatingSystems', qty: 2,  rate: 18500, flat: 90000,  complexity: true, exec: true },
    { key: 'workflowDev',       label: 'Workflow Development',            method: 'Quantity × rate', driver: 'workflows',        qty: 40, rate: 1250,  flat: 150000, complexity: true, exec: true },
    { key: 'dataModel',         label: 'Data Model Configuration',        method: 'Quantity × rate', driver: 'operatingSystems', qty: 2,  rate: 7800,  flat: 35000,  complexity: true },
    { key: 'integrationConfig', label: 'Integration Configuration',       method: 'Quantity × rate', driver: 'integrations',     qty: 20, rate: 3200,  flat: 60000,  complexity: true },
    { key: 'governance',        label: 'Governance Configuration',        method: 'Quantity × rate', driver: 'businessUnits',    qty: 1,  rate: 6500,  flat: 30000,  complexity: true },
    { key: 'security',          label: 'Security / Access Configuration', method: 'Quantity × rate', driver: 'businessUnits',    qty: 1,  rate: 5400,  flat: 28000,  complexity: true },
    { key: 'testing',           label: 'Testing',                         method: 'Quantity × rate', driver: 'workflows',        qty: 40, rate: 380,   flat: 45000,  complexity: true },
    { key: 'validation',        label: 'Validation',                      method: 'Quantity × rate', driver: 'operatingSystems', qty: 2,  rate: 6200,  flat: 32000,  complexity: true },
    { key: 'documentation',     label: 'Documentation',                   method: 'Quantity × rate', driver: 'operatingSystems', qty: 2,  rate: 4800,  flat: 24000,  complexity: true },
    { key: 'training',          label: 'Training',                        method: 'Quantity × rate', driver: 'users',            qty: 250, rate: 145,  flat: 35000,  complexity: false, exec: true },
    { key: 'deployment',        label: 'Deployment',                      method: 'Quantity × rate', driver: 'facilities',       qty: 2,  rate: 7500,  flat: 40000,  complexity: true },
    { key: 'hypercare',         label: 'Hypercare',                       method: 'Quantity × rate', driver: 'manual',           qty: 8,  rate: 9500,  flat: 30000,  complexity: true, qtyUnit: 'weeks' }
  ];

  IMPLEMENTATION_ITEMS.forEach(function (item) {
    var g = 'Implementation Line Items';
    f({ key: 'impl.' + item.key + '.method', section: 'implementation', group: g, label: item.label + ' — Method', kind: 'select', options: IMPL_METHODS, def: item.method, source: SOURCE.HYPERSYNC, hideFromAssumptions: true });
    f({ key: 'impl.' + item.key + '.flat', section: 'implementation', group: g, label: item.label + ' — Flat Fee', kind: 'currency', unit: '$', def: item.flat, source: SOURCE.HYPERSYNC });
    f({ key: 'impl.' + item.key + '.driver', section: 'implementation', group: g, label: item.label + ' — Quantity Driver', kind: 'select', options: DRIVERS.map(function (d) { return d.label; }), def: driverLabel(item.driver), source: SOURCE.HYPERSYNC, hideFromAssumptions: true });
    f({ key: 'impl.' + item.key + '.qty', section: 'implementation', group: g, label: item.label + ' — Manual Quantity', kind: 'number', unit: item.qtyUnit || 'units', def: item.qty, source: SOURCE.CUSTOMER, hideFromAssumptions: true });
    f({ key: 'impl.' + item.key + '.rate', section: 'implementation', group: g, label: item.label + ' — Unit Rate', kind: 'currency', unit: '$ / unit', def: item.rate, source: SOURCE.HYPERSYNC });
    f({ key: 'impl.' + item.key + '.complexity', section: 'implementation', group: g, label: item.label + ' — Complexity Scaled', kind: 'toggle', def: item.complexity, source: SOURCE.HYPERSYNC, hideFromAssumptions: true });
  });

  function driverLabel(id) {
    for (var i = 0; i < DRIVERS.length; i++) if (DRIVERS[i].id === id) return DRIVERS[i].label;
    return DRIVERS[0].label;
  }
  function driverId(label) {
    for (var i = 0; i < DRIVERS.length; i++) if (DRIVERS[i].label === label) return DRIVERS[i].id;
    return 'manual';
  }

  /* =====================================================================
   * SECTION 5 — ONGOING HYPERSYNC SERVICES
   * =================================================================== */
  var RECURRING_BASES = [
    { id: 'annual',           label: 'Annual flat',              unit: '$ / yr' },
    { id: 'monthly',          label: 'Monthly flat',             unit: '$ / mo' },
    { id: 'perUserMonth',     label: 'Per user / month',         unit: '$ / user / mo' },
    { id: 'perWorkflowMonth', label: 'Per workflow / month',     unit: '$ / workflow / mo' },
    { id: 'perOsMonth',       label: 'Per operating system / mo', unit: '$ / OS / mo' },
    { id: 'pctImplementation', label: '% of implementation cost', unit: '% / yr' }
  ];

  /* costClass drives the Section 8 cost breakdown: 'service' vs 'support'. */
  var RECURRING_ITEMS = [
    { key: 'platform',           label: 'Annual HyperSync Platform / License Fee', basis: 'perUserMonth',      rate: 38,    costClass: 'service', enabled: true, exec: true },
    { key: 'maintenance',        label: 'Maintenance',                             basis: 'pctImplementation', rate: 0.09,  costClass: 'support', enabled: true },
    { key: 'techSupport',        label: 'Technical Support',                       basis: 'annual',            rate: 48000, costClass: 'support', enabled: true },
    { key: 'workflowMonitoring', label: 'Workflow Monitoring',                     basis: 'perWorkflowMonth',  rate: 22,    costClass: 'service', enabled: true },
    { key: 'governanceSupport',  label: 'Governance Support',                      basis: 'annual',            rate: 54000, costClass: 'service', enabled: true },
    { key: 'versionMgmt',        label: 'Version Management',                      basis: 'perOsMonth',        rate: 650,   costClass: 'service', enabled: true },
    { key: 'optimization',       label: 'System Optimization',                     basis: 'annual',            rate: 42000, costClass: 'service', enabled: true },
    { key: 'analytics',          label: 'Analytics / Reporting Support',           basis: 'annual',            rate: 36000, costClass: 'service', enabled: true },
    { key: 'enterpriseSupport',  label: 'Enterprise Support (24×7)',               basis: 'annual',            rate: 96000, costClass: 'support', enabled: true, exec: true },
    { key: 'managedServices',    label: 'Optional Managed Services',               basis: 'monthly',           rate: 14000, costClass: 'service', enabled: false, exec: true }
  ];

  RECURRING_ITEMS.forEach(function (item) {
    var g = 'Recurring Service Items';
    var basisDef = recurringBasisLabel(item.basis);
    f({ key: 'rec.' + item.key + '.enabled', section: 'recurring', group: g, label: item.label + ' — Included', kind: 'toggle', def: item.enabled, source: SOURCE.HYPERSYNC, hideFromAssumptions: true });
    f({ key: 'rec.' + item.key + '.basis', section: 'recurring', group: g, label: item.label + ' — Basis', kind: 'select', options: RECURRING_BASES.map(function (b) { return b.label; }), def: basisDef, source: SOURCE.HYPERSYNC, hideFromAssumptions: true });
    f({
      key: 'rec.' + item.key + '.rate', section: 'recurring', group: g, label: item.label + ' — Rate',
      kind: item.basis === 'pctImplementation' ? 'percent' : 'currency',
      unit: recurringBasisUnit(item.basis), def: item.rate, source: SOURCE.HYPERSYNC
    });
  });

  function recurringBasisLabel(id) {
    for (var i = 0; i < RECURRING_BASES.length; i++) if (RECURRING_BASES[i].id === id) return RECURRING_BASES[i].label;
    return RECURRING_BASES[0].label;
  }
  function recurringBasisId(label) {
    for (var i = 0; i < RECURRING_BASES.length; i++) if (RECURRING_BASES[i].label === label) return RECURRING_BASES[i].id;
    return 'annual';
  }
  function recurringBasisUnit(id) {
    for (var i = 0; i < RECURRING_BASES.length; i++) if (RECURRING_BASES[i].id === id) return RECURRING_BASES[i].unit;
    return '$ / yr';
  }

  /* =====================================================================
   * SECTION 6 — COMMERCIAL MODEL
   *
   * Markup and gross margin are NOT interchangeable and are stored as two
   * independent rate sets. Switching methodology never silently reinterprets
   * a rate entered under the other methodology.
   * =================================================================== */
  var PRICING_METHODS = ['Target Gross Margin', 'Markup'];

  var MARGIN_BUCKETS = [
    { id: 'implementation',    label: 'Implementation Services',   markup: 0.82, margin: 0.45 },
    { id: 'customIntegrations', label: 'Custom Integrations',      markup: 1.00, margin: 0.50 },
    { id: 'recurring',         label: 'Recurring HyperSync Services', markup: 0.72, margin: 0.42 },
    { id: 'thirdParty',        label: 'Third-Party Infrastructure', markup: 0.22, margin: 0.18 },
    { id: 'premium',           label: 'Premium Services',          markup: 0.33, margin: 0.25 }
  ];

  f({ key: 'pricingMethod', section: 'commercial', group: 'Methodology', label: 'Active Pricing Methodology', kind: 'select', options: PRICING_METHODS, def: PRICING_METHODS[0], source: SOURCE.HYPERSYNC, exec: true, help: 'Markup: Price = Cost × (1 + Markup Rate).  Gross margin: Price = Cost ÷ (1 − Target Gross Margin).' });

  MARGIN_BUCKETS.forEach(function (b) {
    f({ key: 'margin.' + b.id, section: 'commercial', group: 'Target Gross Margin Rates', label: b.label + ' — Target Gross Margin', kind: 'percent', unit: '% of price', def: b.margin, source: SOURCE.HYPERSYNC, min: 0, max: 0.95, exec: true });
    f({ key: 'markup.' + b.id, section: 'commercial', group: 'Markup Rates', label: b.label + ' — Markup', kind: 'percent', unit: '% of cost', def: b.markup, source: SOURCE.HYPERSYNC, min: 0, max: 10 });
  });

  /* =====================================================================
   * SECTION 10 — MULTI-YEAR ASSUMPTIONS
   * =================================================================== */
  f({ key: 'userGrowthPct', section: 'projection', label: 'Annual User Growth', kind: 'percent', unit: '% / yr', def: 0.08, source: SOURCE.CUSTOMER, min: -0.9, max: 5, exec: true });
  f({ key: 'apiGrowthPct', section: 'projection', label: 'Annual API Growth', kind: 'percent', unit: '% / yr', def: 0.12, source: SOURCE.CUSTOMER, min: -0.9, max: 5 });
  f({ key: 'infraInflationPct', section: 'projection', label: 'Annual Infrastructure Inflation', kind: 'percent', unit: '% / yr', def: 0.05, source: SOURCE.ESTIMATED, min: -0.9, max: 5, exec: true });
  f({ key: 'hsPriceAdjPct', section: 'projection', label: 'Annual HyperSync Price Adjustment', kind: 'percent', unit: '% / yr', def: 0.03, source: SOURCE.HYPERSYNC, min: -0.9, max: 5, exec: true, help: 'Applied to HyperSync-originated price only. It does not change the underlying cost basis.' });

  /* =====================================================================
   * Defaults + illustrative sample
   * =================================================================== */
  var FIELD_MAP = {};
  FIELDS.forEach(function (fd) { FIELD_MAP[fd.key] = fd; });

  function defaults() {
    var v = {};
    FIELDS.forEach(function (fd) { v[fd.key] = fd.def; });
    return v;
  }

  /*
   * ILLUSTRATIVE SAMPLE — NOT A CUSTOMER QUOTE.
   * A fictional large manufacturing enterprise used to demonstrate the model.
   * It overrides customer-supplied scale only; every rate stays at its default
   * so the sample never implies negotiated vendor or commercial pricing.
   */
  var SAMPLE_OVERRIDES = {
    orgName: 'Illustrative Global Manufacturer',
    employees: 25000,
    users: 1800,
    facilities: 12,
    departments: 34,
    businessUnits: 5,
    operatingSystems: 6,
    workflows: 420,
    annualTransactions: 4200000,
    complexity: 'High',
    zapTasksMonthly: 1250000,
    zapTasksAnnualDirect: 15000000,
    avgTasksPerTransaction: 3.5,
    zapUsers: 45,
    activeZaps: 620,
    premiumAppOpsAnnual: 2400000,
    aiOpsAnnual: 480000,
    codeStepsAnnual: 900000,
    apiCallsAnnual: 26000000,
    webhookCallsAnnual: 8000000,
    storageRecords: 1200000,
    stdIntegrations: 18,
    premiumIntegrations: 9,
    customApiIntegrations: 7,
    enterpriseSystems: 5,
    dataSources: 14,
    reportingIntegrations: 6,
    'impl.hypercare.qty': 12
  };

  function sample() {
    var v = defaults();
    Object.keys(SAMPLE_OVERRIDES).forEach(function (k) { v[k] = SAMPLE_OVERRIDES[k]; });
    return v;
  }

  global.HSPE = global.HSPE || {};
  global.HSPE.model = {
    SOURCE: SOURCE,
    UNVERIFIED_SOURCES: UNVERIFIED_SOURCES,
    SECTIONS: SECTIONS,
    FIELDS: FIELDS,
    FIELD_MAP: FIELD_MAP,
    COMPLEXITY_LEVELS: COMPLEXITY_LEVELS,
    TASK_BASIS: TASK_BASIS,
    ANNUAL_BASIS: ANNUAL_BASIS,
    INTEGRATION_TYPES: INTEGRATION_TYPES,
    IMPLEMENTATION_ITEMS: IMPLEMENTATION_ITEMS,
    IMPL_METHODS: IMPL_METHODS,
    DRIVERS: DRIVERS,
    driverId: driverId,
    driverLabel: driverLabel,
    RECURRING_ITEMS: RECURRING_ITEMS,
    RECURRING_BASES: RECURRING_BASES,
    recurringBasisId: recurringBasisId,
    recurringBasisLabel: recurringBasisLabel,
    recurringBasisUnit: recurringBasisUnit,
    PRICING_METHODS: PRICING_METHODS,
    MARGIN_BUCKETS: MARGIN_BUCKETS,
    defaults: defaults,
    sample: sample
  };
})(window);

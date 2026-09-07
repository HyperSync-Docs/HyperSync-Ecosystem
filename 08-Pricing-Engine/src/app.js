/*
 * HyperSync Enterprise Pricing Engine
 * app.js — UI ORCHESTRATION.
 *
 * This layer generates inputs from the model registry, pushes edits into the
 * values object, asks the engine to recompute, and paints the results. It
 * contains no pricing formulas: every number it displays came from engine.js.
 */
(function (global) {
  'use strict';

  var F = global.HSPE.format;
  var M = global.HSPE.model;
  var E = global.HSPE.engine;
  var C = global.HSPE.charts;
  var esc = C.escapeHtml;

  var STORAGE_KEY = 'hspe.v1.state';

  var state = {
    values: M.sample(),
    mode: 'exec',
    presenting: false,
    theme: 'system',
    activeTab: 'profile',
    sampleLoaded: true,
    scenarios: { conservative: null, expected: null, highScale: null },
    assumptionFilter: '',
    showCustomerInputs: false,
    showStructural: false
  };

  var SCENARIOS = [
    { id: 'conservative', label: 'Conservative' },
    { id: 'expected', label: 'Expected' },
    { id: 'highScale', label: 'High-Scale' }
  ];

  /* Section 8 cost categories, in a fixed presentation order. */
  var COST_CATEGORIES = [
    { key: 'automation', label: 'Zapier / Automation Infrastructure' },
    { key: 'apiIntegration', label: 'API / Integration' },
    { key: 'premiumServices', label: 'Premium Services' },
    { key: 'implementation', label: 'HyperSync Implementation' },
    { key: 'recurringServices', label: 'HyperSync Recurring Services' },
    { key: 'maintenanceSupport', label: 'Maintenance & Support' },
    { key: 'otherInfrastructure', label: 'Other Infrastructure' }
  ];

  /* Section 9 price strata. Slots are assigned in fixed categorical order. */
  var PRICE_STRATA = [
    { key: 'thirdPartyCost', label: 'Underlying Third-Party Costs', slot: 1 },
    { key: 'implementationCost', label: 'HyperSync Implementation', slot: 2 },
    { key: 'recurringServicesCost', label: 'HyperSync Recurring Services', slot: 3 },
    { key: 'supportMaintenanceCost', label: 'Support / Maintenance', slot: 4 },
    { key: 'commercialMargin', label: 'Commercial Margin', slot: 5 }
  ];

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* =====================================================================
   * Persistence
   * =================================================================== */
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        values: state.values,
        mode: state.mode,
        theme: state.theme,
        activeTab: state.activeTab,
        sampleLoaded: state.sampleLoaded,
        scenarios: state.scenarios
      }));
    } catch (err) { /* storage unavailable — the model still works in-session */ }
  }

  function restore() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (err) { return; }
    if (!raw) return;
    try {
      var saved = JSON.parse(raw);
      if (saved && saved.values) {
        /* Merge over defaults so a registry addition never leaves a hole. */
        var merged = M.defaults();
        Object.keys(saved.values).forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(merged, k)) merged[k] = saved.values[k];
        });
        state.values = merged;
      }
      if (saved.mode) state.mode = saved.mode;
      if (saved.theme) state.theme = saved.theme;
      if (saved.activeTab) state.activeTab = saved.activeTab;
      if (typeof saved.sampleLoaded === 'boolean') state.sampleLoaded = saved.sampleLoaded;
      if (saved.scenarios) {
        SCENARIOS.forEach(function (s) {
          if (saved.scenarios[s.id]) state.scenarios[s.id] = saved.scenarios[s.id];
        });
      }
    } catch (err) { /* corrupt payload — fall back to the sample model */ }
  }

  /* =====================================================================
   * Field rendering
   * =================================================================== */
  function visibleInMode(field) {
    return state.mode === 'advanced' || field.exec === true;
  }

  function sourceChip(field) {
    var unverified = M.UNVERIFIED_SOURCES.indexOf(field.source) !== -1;
    return '<span class="src-chip' + (unverified ? ' unverified' : '') + '" title="Source type: ' +
      esc(field.source) + '">' + esc(field.source) + '</span>';
  }

  function inputMarkup(field) {
    var key = esc(field.key);
    var value = state.values[field.key];
    switch (field.kind) {
      case 'select':
        return '<select data-key="' + key + '">' + field.options.map(function (o) {
          return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
      case 'toggle':
        return '<input type="checkbox" data-key="' + key + '"' + (value === true ? ' checked' : '') + '>';
      case 'text':
        return '<input type="text" data-key="' + key + '" value="' + esc(value == null ? '' : value) + '">';
      case 'percent':
        return '<input type="number" data-key="' + key + '" step="0.1"' +
          ' min="' + (typeof field.min === 'number' ? field.min * 100 : -90) + '"' +
          ' max="' + (typeof field.max === 'number' ? field.max * 100 : 1000) + '"' +
          ' value="' + F.toPercentInput(value) + '">';
      case 'int':
        return '<input type="number" data-key="' + key + '" step="1" min="0" value="' + F.count(value) + '">';
      case 'currency':
        return '<input type="number" data-key="' + key + '" step="' + (field.step || 1) + '" min="0" value="' + F.money(value) + '">';
      default:
        return '<input type="number" data-key="' + key + '" step="' + (field.step || 0.01) + '"' +
          ' min="' + (typeof field.min === 'number' ? field.min : 0) + '"' +
          ' value="' + F.num(value) + '">';
    }
  }

  function fieldMarkup(field) {
    var wrapCls = 'field' + (field.kind === 'toggle' ? ' toggle' : '');
    var unitBits = [];
    if (field.unit) unitBits.push(esc(field.unit));
    var header = '<label for="">' +
      '<span>' + esc(field.label) + '</span>' +
      '<span class="unit">' + unitBits.join(' ') + '</span>' +
      '</label>';
    var echo = (field.kind === 'int' || field.kind === 'currency')
      ? '<span class="help" data-echo="' + esc(field.key) + '"></span>' : '';
    var help = field.help ? '<span class="help">' + esc(field.help) + '</span>' : '';
    var chip = field.source === M.SOURCE.CUSTOMER ? '' : '<span class="help">' + sourceChip(field) + '</span>';
    return '<div class="' + wrapCls + '">' + header + inputMarkup(field) + echo + help + chip + '</div>';
  }

  function renderFieldSection(sectionId) {
    var fields = M.FIELDS.filter(function (f) {
      return f.sections.indexOf(sectionId) !== -1 && visibleInMode(f);
    });
    if (!fields.length) {
      return '<p class="viz-empty">All variables in this section are advanced. Switch to Advanced Configuration to edit them.</p>';
    }
    var groups = [];
    var byGroup = {};
    fields.forEach(function (f) {
      var g = f.group || '';
      if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
      byGroup[g].push(f);
    });
    return groups.map(function (g) {
      return '<div class="field-group">' +
        (g ? '<h3>' + esc(g) + '</h3>' : '') +
        '<div class="fields">' + byGroup[g].map(fieldMarkup).join('') + '</div>' +
        '</div>';
    }).join('');
  }

  /* ---- Section 3: integration table -------------------------------- */
  function renderIntegrationPanel() {
    var advanced = state.mode === 'advanced';
    var rows = M.INTEGRATION_TYPES.filter(function (t) { return advanced || t.exec; }).map(function (t) {
      var countField = M.FIELD_MAP[t.key];
      var rateField = M.FIELD_MAP[t.rateKey];
      return '<tr>' +
        '<td class="wrap">' + esc(t.label) + '</td>' +
        '<td class="num">' + inputMarkup(countField) + '</td>' +
        '<td class="num">' + inputMarkup(rateField) + '</td>' +
        '<td class="num derived" data-integ-ext="' + esc(t.key) + '">—</td>' +
        '</tr>';
    }).join('');

    var hidden = advanced ? '' :
      '<tr><td class="wrap derived">Additional integration types (Advanced Configuration)</td>' +
      '<td class="num derived" data-integ-hidden-count>—</td><td class="num derived">—</td>' +
      '<td class="num derived" data-integ-hidden-ext>—</td></tr>';

    var maintenance = '<div class="field-group"><h3>Recurring Integration Maintenance</h3><div class="fields">' +
      fieldMarkup(M.FIELD_MAP['integrationMaintenanceAnnualPer']) +
      (advanced ? fieldMarkup(M.FIELD_MAP['applyComplexityToIntegrations']) : '') +
      '</div></div>';

    return '<div class="table-wrap"><table class="data">' +
      '<thead><tr><th>Integration Type</th><th class="num">Count</th><th class="num">Setup Rate</th><th class="num">Extended Setup Cost</th></tr></thead>' +
      '<tbody>' + rows + hidden + '</tbody>' +
      '<tfoot><tr><td>Total integration setup (complexity applied)</td>' +
      '<td class="num" data-integ-total-count>—</td><td class="num">—</td>' +
      '<td class="num" data-integ-total-ext>—</td></tr>' +
      '<tr><td>Annual integration maintenance</td><td class="num">—</td><td class="num">—</td>' +
      '<td class="num" data-integ-maint>—</td></tr></tfoot>' +
      '</table></div>' + maintenance;
  }

  /* ---- Section 4: implementation table ----------------------------- */
  function renderImplementationPanel() {
    var advanced = state.mode === 'advanced';
    var items = M.IMPLEMENTATION_ITEMS.filter(function (i) { return advanced || i.exec; });

    var head = advanced
      ? '<tr><th>Line Item</th><th>Method</th><th class="num">Flat Fee</th><th>Quantity Driver</th><th class="num">Quantity</th><th class="num">Unit Rate</th><th>Cx</th><th class="num">Extended Cost</th></tr>'
      : '<tr><th>Line Item</th><th class="num">Quantity</th><th class="num">Unit Rate</th><th class="num">Extended Cost</th></tr>';

    var rows = items.map(function (item) {
      var p = 'impl.' + item.key + '.';
      var ext = '<td class="num" data-impl-ext="' + esc(item.key) + '">—</td>';
      var qtyCell = '<td class="num" data-impl-qty="' + esc(item.key) + '">—</td>';
      if (!advanced) {
        return '<tr><td class="wrap">' + esc(item.label) + '</td>' + qtyCell +
          '<td class="num">' + inputMarkup(M.FIELD_MAP[p + 'rate']) + '</td>' + ext + '</tr>';
      }
      return '<tr>' +
        '<td class="wrap">' + esc(item.label) + '</td>' +
        '<td>' + inputMarkup(M.FIELD_MAP[p + 'method']) + '</td>' +
        '<td class="num">' + inputMarkup(M.FIELD_MAP[p + 'flat']) + '</td>' +
        '<td>' + inputMarkup(M.FIELD_MAP[p + 'driver']) + '</td>' +
        '<td class="num" data-impl-qty="' + esc(item.key) + '">' + inputMarkup(M.FIELD_MAP[p + 'qty']) + '</td>' +
        '<td class="num">' + inputMarkup(M.FIELD_MAP[p + 'rate']) + '</td>' +
        '<td title="Apply deployment-complexity multiplier">' + inputMarkup(M.FIELD_MAP[p + 'complexity']) + '</td>' +
        ext + '</tr>';
    }).join('');

    var span = advanced ? 7 : 3;
    var hidden = advanced ? '' :
      '<tr><td class="wrap derived">Additional implementation line items (Advanced Configuration)</td>' +
      '<td class="num derived">—</td><td class="num derived">—</td>' +
      '<td class="num derived" data-impl-hidden>—</td></tr>';

    return '<p class="legend-note">Each line item is either a flat fee or quantity × unit rate. ' +
      'When a quantity driver other than “Manual quantity” is selected the quantity follows the Enterprise Profile, ' +
      'so a change in enterprise scale flows directly into implementation cost.</p>' +
      '<div class="table-wrap"><table class="data">' +
      '<thead>' + head + '</thead><tbody>' + rows + hidden + '</tbody>' +
      '<tfoot><tr><td colspan="' + span + '">Total HyperSync implementation cost basis</td>' +
      '<td class="num" data-impl-total>—</td></tr></tfoot>' +
      '</table></div>';
  }

  /* ---- Section 5: recurring services table -------------------------- */
  function renderRecurringPanel() {
    var advanced = state.mode === 'advanced';
    var items = M.RECURRING_ITEMS.filter(function (i) { return advanced || i.exec; });

    var head = advanced
      ? '<tr><th>Service</th><th>Included</th><th>Basis</th><th class="num">Rate</th><th class="num">Driver Qty</th><th class="num">Annual Cost</th></tr>'
      : '<tr><th>Service</th><th>Included</th><th class="num">Rate</th><th class="num">Annual Cost</th></tr>';

    var rows = items.map(function (item) {
      var p = 'rec.' + item.key + '.';
      var annual = '<td class="num" data-rec-annual="' + esc(item.key) + '">—</td>';
      if (!advanced) {
        return '<tr><td class="wrap">' + esc(item.label) + '</td>' +
          '<td>' + inputMarkup(M.FIELD_MAP[p + 'enabled']) + '</td>' +
          '<td class="num">' + inputMarkup(M.FIELD_MAP[p + 'rate']) + '</td>' + annual + '</tr>';
      }
      return '<tr>' +
        '<td class="wrap">' + esc(item.label) + '</td>' +
        '<td>' + inputMarkup(M.FIELD_MAP[p + 'enabled']) + '</td>' +
        '<td>' + inputMarkup(M.FIELD_MAP[p + 'basis']) + '</td>' +
        '<td class="num">' + inputMarkup(M.FIELD_MAP[p + 'rate']) + '</td>' +
        '<td class="num derived" data-rec-qty="' + esc(item.key) + '">—</td>' +
        annual + '</tr>';
    }).join('');

    var span = advanced ? 5 : 3;
    var hidden = advanced ? '' :
      '<tr><td class="wrap derived">Additional recurring services (Advanced Configuration)</td>' +
      '<td class="derived">—</td><td class="num derived">—</td>' +
      '<td class="num derived" data-rec-hidden>—</td></tr>';

    return '<p class="legend-note">Rates may be expressed annually, monthly, per user, per workflow, ' +
      'per operating system, or as a percentage of implementation cost. Every basis is normalised to an annual cost basis.</p>' +
      '<div class="table-wrap"><table class="data">' +
      '<thead>' + head + '</thead><tbody>' + rows + hidden + '</tbody>' +
      '<tfoot><tr><td colspan="' + span + '">Total recurring HyperSync services cost basis</td>' +
      '<td class="num" data-rec-total>—</td></tr>' +
      '<tr><td colspan="' + span + '">Integration maintenance (Section 3)</td>' +
      '<td class="num" data-rec-integ-maint>—</td></tr></tfoot>' +
      '</table></div>';
  }

  /* ---- Section 6: commercial model --------------------------------- */
  function renderCommercialPanel() {
    var usingMargin = state.values.pricingMethod !== 'Markup';
    var methodField = M.FIELD_MAP['pricingMethod'];
    var activeGroup = usingMargin ? 'Target Gross Margin Rates' : 'Markup Rates';
    var inactiveGroup = usingMargin ? 'Markup Rates' : 'Target Gross Margin Rates';

    function rateFields(groupName) {
      return M.FIELDS.filter(function (f) { return f.section === 'commercial' && f.group === groupName; })
        .map(fieldMarkup).join('');
    }

    var banner = '<p class="legend-note"><strong>Active methodology: ' + esc(state.values.pricingMethod) + '</strong> — ' +
      (usingMargin
        ? 'Price = Cost ÷ (1 − Target Gross Margin). Target gross margin is expressed as a percentage of <em>price</em>.'
        : 'Price = Cost × (1 + Markup Rate). Markup is expressed as a percentage of <em>cost</em>.') +
      ' Markup and gross margin are stored as separate rate sets; switching methodology never reinterprets a rate entered under the other one.</p>';

    var inactive = state.mode === 'advanced'
      ? '<div class="field-group"><h3>' + esc(inactiveGroup) + ' — not currently applied</h3>' +
        '<div class="fields">' + rateFields(inactiveGroup) + '</div></div>'
      : '';

    return '<div class="field-group"><div class="fields">' + fieldMarkup(methodField) + '</div></div>' +
      banner +
      '<div class="field-group"><h3>' + esc(activeGroup) + ' — applied</h3>' +
      '<div class="fields">' + rateFields(activeGroup) + '</div></div>' +
      inactive;
  }

  /* ---- tab assembly ------------------------------------------------- */
  function renderInputs() {
    var tabsHost = $('#tabs');
    var panelHost = $('#tabPanels');

    tabsHost.innerHTML = M.SECTIONS.map(function (s) {
      var selected = s.id === state.activeTab;
      return '<button role="tab" id="tab-' + s.id + '" aria-controls="panel-' + s.id + '" ' +
        'aria-selected="' + selected + '" data-tab="' + s.id + '">' +
        esc(s.num + '. ' + s.title) + '</button>';
    }).join('');

    var section = null;
    M.SECTIONS.forEach(function (s) { if (s.id === state.activeTab) section = s; });
    if (!section) { section = M.SECTIONS[0]; state.activeTab = section.id; }

    var body;
    switch (section.id) {
      case 'integrations': body = renderIntegrationPanel(); break;
      case 'implementation': body = renderImplementationPanel(); break;
      case 'recurring': body = renderRecurringPanel(); break;
      case 'commercial': body = renderCommercialPanel(); break;
      default: body = renderFieldSection(section.id);
    }

    panelHost.innerHTML =
      '<div role="tabpanel" id="panel-' + section.id + '" aria-labelledby="tab-' + section.id + '">' +
      '<p class="legend-note">' + esc(section.blurb) + '</p>' + body + '</div>';
  }

  /* =====================================================================
   * Output rendering
   * =================================================================== */
  function renderExecutive(res) {
    var R = res.results;
    var p = res.profile;

    $('#execStrip').innerHTML = [
      metricTile('Year-1 Enterprise Price', F.fmtCurrency(R.year1Price), 'Includes one-time implementation and integration setup', true),
      metricTile('Annual Recurring Price', F.fmtCurrency(R.recurringAnnualPrice), 'Year 2 run-rate · ' + F.fmtCurrency(R.estimatedMonthlyPrice) + ' per month'),
      metricTile('5-Year Contract Value', F.fmtCurrency(R.contract5), 'Sum of Years 1–5 customer price'),
      metricTile('Estimated Gross Margin', F.fmtPercent(R.grossMarginYear1), 'Year 1 · ' + F.fmtPercent(R.grossMargin5) + ' across 5 years')
    ].join('');

    $('#execSummary').innerHTML =
      'Based on the current enterprise assumptions, HyperSync is modeled for <strong>' +
      F.fmtNumber(p.users) + '</strong> users across <strong>' + F.fmtNumber(p.facilities) +
      '</strong> facilities and <strong>' + F.fmtNumber(p.operatingSystems) +
      '</strong> operating systems, producing an estimated Year-1 enterprise price of <strong>' +
      F.fmtCurrency(R.year1Price) + '</strong> and a recurring annual price of <strong>' +
      F.fmtCurrency(R.recurringAnnualPrice) + '</strong>. ' +
      'The Year-1 cost basis is <strong>' + F.fmtCurrency(R.year1CostBasis) +
      '</strong>, priced using the <strong>' + esc(res.pricing.method) +
      '</strong> methodology at a blended Year-1 gross margin of <strong>' +
      F.fmtPercent(R.grossMarginYear1) + '</strong>. ' +
      'Deployment complexity is set to <strong>' + esc(p.complexity) +
      '</strong>, applying a ' + F.fmtDecimal(res.complexityMultiplier) +
      '× effort multiplier to scaled implementation and integration work.';

    $('#orgNameOut').textContent = p.orgName;

    $('#profileSummary').innerHTML = [
      ['Organization', esc(p.orgName)],
      ['Employees', F.fmtNumber(p.employees)],
      ['HyperSync Users', F.fmtNumber(p.users)],
      ['Facilities', F.fmtNumber(p.facilities)],
      ['Departments', F.fmtNumber(p.departments)],
      ['Business Units', F.fmtNumber(p.businessUnits)],
      ['Operating Systems', F.fmtNumber(p.operatingSystems)],
      ['Workflows / Zaps', F.fmtNumber(p.workflows)],
      ['Annual Transactions', F.fmtNumber(p.annualTransactions)],
      ['Total Integrations', F.fmtNumber(res.integration.counts.total)],
      ['Deployment Complexity', esc(p.complexity)],
      ['Billable Tasks (Yr 1)', F.fmtCompactNumber(res.year1.volumes.billableTasks)]
    ].map(function (r) {
      return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('');
  }

  function metricTile(label, value, sub, lead) {
    return '<div class="metric' + (lead ? ' lead' : '') + '">' +
      '<div class="label">' + esc(label) + '</div>' +
      '<div class="value">' + esc(value) + '</div>' +
      '<div class="sub">' + esc(sub) + '</div></div>';
  }

  function renderResults(res) {
    var R = res.results;
    var rows = [
      ['Estimated Monthly Infrastructure Cost', F.fmtCurrency(R.infraMonthly), 'cost', 'Third-party, Year 1'],
      ['Estimated Annual Infrastructure Cost', F.fmtCurrency(R.infraAnnual), 'cost', 'Third-party, Year 1'],
      ['HyperSync Implementation Cost', F.fmtCurrency(R.implementationCost), 'cost', 'One-time cost basis'],
      ['HyperSync Recurring Monthly Cost', F.fmtCurrency(R.recurringMonthlyCost), 'cost', 'Cost basis, not price'],
      ['HyperSync Recurring Annual Cost', F.fmtCurrency(R.recurringAnnualCost), 'cost', 'Cost basis, not price'],
      ['Third-Party Platform Cost', F.fmtCurrency(R.thirdPartyPlatformCost), 'cost', 'Automation, API and other infrastructure'],
      ['Premium Services Cost', F.fmtCurrency(R.premiumServicesCost), 'cost', 'Premium apps and AI operations'],
      ['Integration Cost', F.fmtCurrency(R.integrationCost), 'cost', 'Setup plus first-year maintenance'],
      ['Support / Maintenance Cost', F.fmtCurrency(R.supportMaintenanceCost), 'cost', 'Annual cost basis'],
      ['Total Year-1 Cost Basis', F.fmtCurrency(R.year1CostBasis), 'cost-basis', 'Cost to operate — not the customer price'],
      ['HyperSync Year-1 Customer Price', F.fmtCurrency(R.year1Price), 'emphasis', 'Price charged'],
      ['Recurring Annual Customer Price', F.fmtCurrency(R.recurringAnnualPrice), 'emphasis', 'Year 2 run-rate'],
      ['Estimated Monthly Customer Price', F.fmtCurrency(R.estimatedMonthlyPrice), 'emphasis', 'Recurring annual ÷ 12'],
      ['3-Year Contract Value', F.fmtCurrency(R.contract3), 'emphasis', 'Years 1–3 customer price'],
      ['5-Year Contract Value', F.fmtCurrency(R.contract5), 'emphasis', 'Years 1–5 customer price'],
      ['Estimated Gross Profit', F.fmtCurrency(R.grossProfitYear1), 'emphasis', 'Year 1'],
      ['Estimated Gross Margin', F.fmtPercent(R.grossMarginYear1), 'emphasis', 'Year 1']
    ];
    $('#resultsGrid').innerHTML = rows.map(function (r) {
      return '<div class="result ' + r[2] + '">' +
        '<div class="label">' + esc(r[0]) + '</div>' +
        '<div class="value">' + esc(r[1]) + '</div>' +
        '<div class="note">' + esc(r[3]) + '</div></div>';
    }).join('');
  }

  function renderCostBreakdown(res) {
    var cats = res.year1.categories;
    var items = COST_CATEGORIES.map(function (c) {
      return { label: c.label, value: cats[c.key] };
    });
    var total = items.reduce(function (a, d) { return a + d.value; }, 0);

    C.draw($('#costChart'), 'bar', {
      items: items,
      keepZero: true,
      totalLabel: 'Year-1 cost basis',
      ariaLabel: 'Year-1 cost basis by category',
      fmt: F.fmtCurrency
    });

    $('#costTotal').textContent = F.fmtCurrency(total);
    $('#costTable').innerHTML = simpleTable(
      ['Cost Category', 'Year-1 Cost', 'Share'],
      items.map(function (d) {
        return [d.label, F.fmtCurrency(d.value), F.fmtPercent(F.div(d.value, total))];
      }),
      ['Total Year-1 cost basis', F.fmtCurrency(total), '100.0%']
    );
  }

  function renderPriceBreakdown(res) {
    var strata = res.year1.strata;
    var segments = PRICE_STRATA.map(function (s) {
      return { label: s.label, value: strata[s.key], slot: s.slot };
    });
    var total = segments.reduce(function (a, s) { return a + s.value; }, 0);

    C.draw($('#priceChart'), 'stacked', {
      segments: segments,
      totalLabel: 'Year-1 customer price',
      ariaLabel: 'Composition of the Year-1 customer price',
      axisLeft: 'Cost strata shown at cost',
      axisRight: 'Year-1 customer price ' + F.fmtCurrency(total)
    });

    $('#priceLegend').innerHTML = segments.map(function (s) {
      return '<div class="legend-item">' +
        '<span class="swatch" style="background: var(--series-' + s.slot + ')"></span>' +
        '<span class="k">' + esc(s.label) + '</span>' +
        '<span class="v">' + F.fmtCurrency(s.value) + '</span>' +
        '<span class="p">' + F.fmtPercent(F.div(s.value, total)) + '</span>' +
        '</div>';
    }).join('');

    $('#priceTable').innerHTML = simpleTable(
      ['Price Component', 'Year-1 Amount', 'Share of Price'],
      segments.map(function (s) {
        return [s.label, F.fmtCurrency(s.value), F.fmtPercent(F.div(s.value, total))];
      }),
      ['Year-1 customer price', F.fmtCurrency(total), '100.0%']
    );
  }

  function renderProjection(res) {
    var years = res.years;
    var labels = years.map(function (y) { return 'Year ' + y.year; });

    C.draw($('#projChart'), 'line', {
      xLabels: labels,
      height: 300,
      series: [
        { label: 'Underlying Cost', slot: 1, values: years.map(function (y) { return y.costTotal; }) },
        { label: 'Customer Price', slot: 2, values: years.map(function (y) { return y.priceTotal; }) }
      ],
      ariaLabel: 'Annual underlying cost and customer price, Years 1 to 5'
    });

    $('#projLegend').innerHTML = [
      { label: 'Underlying Cost', slot: 1, value: years[4].costTotal },
      { label: 'Customer Price', slot: 2, value: years[4].priceTotal }
    ].map(function (s) {
      return '<div class="legend-item">' +
        '<span class="swatch" style="background: var(--series-' + s.slot + ')"></span>' +
        '<span class="k">' + esc(s.label) + '</span>' +
        '<span class="p">Year 5: </span><span class="v">' + F.fmtCurrency(s.value) + '</span></div>';
    }).join('');

    C.draw($('#cumChart'), 'column', {
      items: years.map(function (y) { return { label: 'Year ' + y.year, value: y.cumulativePrice }; }),
      height: 230,
      slot: 3,
      ariaLabel: 'Cumulative contract value, Years 1 to 5'
    });

    $('#projTable').innerHTML = simpleTable(
      ['Year', 'Users', 'Billable Tasks', 'API Calls', 'Underlying Cost', 'Customer Price', 'Gross Margin', 'Cumulative Contract Value'],
      years.map(function (y) {
        return [
          'Year ' + y.year,
          F.fmtNumber(y.volumes.users),
          F.fmtCompactNumber(y.volumes.billableTasks),
          F.fmtCompactNumber(y.volumes.apiCalls),
          F.fmtCurrency(y.costTotal),
          F.fmtCurrency(y.priceTotal),
          F.fmtPercent(y.grossMargin),
          F.fmtCurrency(y.cumulativePrice)
        ];
      }),
      ['Years 1–5', '—', '—', '—', F.fmtCurrency(res.results.cost5), F.fmtCurrency(res.results.contract5),
        F.fmtPercent(res.results.grossMargin5), F.fmtCurrency(res.results.contract5)]
    );
  }

  function simpleTable(headers, rows, footer) {
    var head = '<thead><tr>' + headers.map(function (h, i) {
      return '<th' + (i ? ' class="num"' : '') + '>' + esc(h) + '</th>';
    }).join('') + '</tr></thead>';
    var body = '<tbody>' + rows.map(function (r) {
      return '<tr>' + r.map(function (c, i) {
        return '<td' + (i ? ' class="num"' : ' class="wrap"') + '>' + esc(c) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    var foot = footer ? '<tfoot><tr>' + footer.map(function (c, i) {
      return '<td' + (i ? ' class="num"' : '') + '>' + esc(c) + '</td>';
    }).join('') + '</tr></tfoot>' : '';
    return '<div class="table-wrap"><table class="data">' + head + body + foot + '</table></div>';
  }

  /* ---- derived cells inside the input tables ------------------------ */
  function renderDerivedCells(res) {
    /* Integration table */
    var advanced = state.mode === 'advanced';
    var shownKeys = {};
    M.INTEGRATION_TYPES.forEach(function (t) { if (advanced || t.exec) shownKeys[t.key] = true; });

    var hiddenCount = 0, hiddenExt = 0;
    res.integration.lines.forEach(function (line) {
      var cell = document.querySelector('[data-integ-ext="' + line.key + '"]');
      if (cell) cell.textContent = F.fmtCurrency(line.extended);
      if (!shownKeys[line.key]) { hiddenCount += line.count; hiddenExt += line.extended; }
    });
    setText('[data-integ-hidden-count]', F.fmtNumber(hiddenCount));
    setText('[data-integ-hidden-ext]', F.fmtCurrency(hiddenExt));
    setText('[data-integ-total-count]', F.fmtNumber(res.integration.counts.total));
    setText('[data-integ-total-ext]', F.fmtCurrency(res.integration.setup));
    setText('[data-integ-maint]', F.fmtCurrency(res.integration.maintenanceAnnual));

    /* Implementation table */
    var implShown = {};
    M.IMPLEMENTATION_ITEMS.forEach(function (i) { if (advanced || i.exec) implShown[i.key] = true; });
    var implHidden = 0;
    res.implementation.lines.forEach(function (line) {
      var extCell = document.querySelector('[data-impl-ext="' + line.key + '"]');
      if (extCell) extCell.textContent = F.fmtCurrency(line.extended);
      var qtyCell = document.querySelector('[data-impl-qty="' + line.key + '"]');
      if (qtyCell) {
        var manualInput = qtyCell.querySelector('input');
        if (manualInput) {
          /* Advanced view: the manual box only applies when its driver is manual. */
          var usable = !line.isFlat && line.driver === 'manual';
          manualInput.disabled = !usable;
          manualInput.title = usable ? '' : 'Quantity is derived from: ' + line.driverLabel;
        } else {
          qtyCell.textContent = line.isFlat ? 'Flat fee' : F.fmtNumber(line.quantity) + ' ' + line.qtyUnit;
          qtyCell.title = line.isFlat ? 'Priced as a flat fee' : 'Driver: ' + line.driverLabel;
        }
      }
      if (!implShown[line.key]) implHidden += line.extended;
    });
    setText('[data-impl-hidden]', F.fmtCurrency(implHidden));
    setText('[data-impl-total]', F.fmtCurrency(res.implementation.total));

    /* Recurring table */
    var recShown = {};
    M.RECURRING_ITEMS.forEach(function (i) { if (advanced || i.exec) recShown[i.key] = true; });
    var recHidden = 0;
    res.year1.recurring.lines.forEach(function (line) {
      var cell = document.querySelector('[data-rec-annual="' + line.key + '"]');
      if (cell) cell.textContent = line.enabled ? F.fmtCurrency(line.annual) : 'Excluded';
      var qtyCell = document.querySelector('[data-rec-qty="' + line.key + '"]');
      if (qtyCell) {
        qtyCell.textContent = (line.basis === 'annual' || line.basis === 'monthly') ? '—'
          : (line.basis === 'pctImplementation' ? '% of implementation' : F.fmtNumber(line.driverQty));
      }
      if (!recShown[line.key]) recHidden += line.annual;
    });
    setText('[data-rec-hidden]', F.fmtCurrency(recHidden));
    setText('[data-rec-total]', F.fmtCurrency(res.year1.recurring.total));
    setText('[data-rec-integ-maint]', F.fmtCurrency(res.integration.maintenanceAnnual));

    /* Formatted echo under large numeric inputs */
    $$('[data-echo]').forEach(function (span) {
      var key = span.getAttribute('data-echo');
      var field = M.FIELD_MAP[key];
      if (!field) return;
      var v = F.num(state.values[key], 0);
      if (Math.abs(v) < 1000) { span.textContent = ''; return; }
      span.textContent = field.kind === 'currency' ? F.fmtCurrency(v) : F.fmtNumber(v);
    });
  }

  function setText(sel, value) {
    var node = document.querySelector(sel);
    if (node) node.textContent = value;
  }

  /* ---- Section 11: scenarios ---------------------------------------- */
  var scenarioCardSignature = null;

  function renderScenarios(res) {
    /*
     * The cards carry buttons, so they are rebuilt only when what they say has
     * actually changed. Repainting them on every keystroke would destroy the
     * button a user is in the middle of pressing.
     */
    var signature = SCENARIOS.map(function (s) {
      var saved = state.scenarios[s.id];
      return s.id + ':' + (saved ? saved.savedAt + '|' + saved.orgName : 'empty');
    }).join('~');

    if (signature !== scenarioCardSignature) {
      scenarioCardSignature = signature;
      $('#scenarioActions').innerHTML = SCENARIOS.map(function (s) {
        var saved = state.scenarios[s.id];
        var stateLine = saved
          ? 'Saved ' + esc(new Date(saved.savedAt).toLocaleString()) + ' · ' + esc(saved.orgName || '—')
          : 'No assumptions saved yet.';
        return '<div class="scenario-card">' +
          '<h4>' + esc(s.label) + '</h4>' +
          '<p class="state' + (saved ? ' saved' : '') + '">' + stateLine + '</p>' +
          '<div class="btn-row">' +
          '<button type="button" class="btn" data-scenario-save="' + s.id + '">Save current</button>' +
          '<button type="button" class="btn" data-scenario-load="' + s.id + '"' + (saved ? '' : ' disabled') + '>Load</button>' +
          '<button type="button" class="btn danger" data-scenario-clear="' + s.id + '"' + (saved ? '' : ' disabled') + '>Clear</button>' +
          '</div></div>';
      }).join('');
    }

    var columns = [{ id: 'current', label: 'Current Model', res: res }];
    SCENARIOS.forEach(function (s) {
      var saved = state.scenarios[s.id];
      columns.push({ id: s.id, label: s.label, res: saved ? E.compute(saved.values) : null });
    });

    var rows = [
      ['Users', function (r) { return F.fmtNumber(r.profile.users); }],
      ['Task Volume (billable, Yr 1)', function (r) { return F.fmtCompactNumber(r.year1.volumes.billableTasks); }],
      ['API Volume (Yr 1)', function (r) { return F.fmtCompactNumber(r.year1.volumes.apiCalls); }],
      ['Infrastructure Cost (annual)', function (r) { return F.fmtCurrency(r.results.infraAnnual); }],
      ['Implementation Cost', function (r) { return F.fmtCurrency(r.results.implementationCost); }],
      ['Recurring Cost (annual)', function (r) { return F.fmtCurrency(r.results.recurringAnnualCost); }],
      ['Year-1 Price', function (r) { return F.fmtCurrency(r.results.year1Price); }],
      ['Annual Recurring Price', function (r) { return F.fmtCurrency(r.results.recurringAnnualPrice); }],
      ['3-Year Value', function (r) { return F.fmtCurrency(r.results.contract3); }],
      ['5-Year Value', function (r) { return F.fmtCurrency(r.results.contract5); }],
      ['Gross Margin (Yr 1)', function (r) { return F.fmtPercent(r.results.grossMarginYear1); }]
    ];

    var head = '<thead><tr><th>Metric</th>' + columns.map(function (c) {
      return '<th class="num">' + esc(c.label) + '</th>';
    }).join('') + '</tr></thead>';

    var body = '<tbody>' + rows.map(function (row) {
      return '<tr><td class="wrap">' + esc(row[0]) + '</td>' + columns.map(function (c) {
        return '<td class="num">' + (c.res ? esc(row[1](c.res)) : '<span class="derived">—</span>') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';

    $('#scenarioTable').innerHTML = '<div class="table-wrap"><table class="data">' + head + body + '</table></div>';
  }

  /* ---- Section 13: assumption transparency --------------------------- */
  function assumptionValue(field) {
    var v = state.values[field.key];
    switch (field.kind) {
      case 'percent': return F.fmtPercent(v, 2);
      case 'currency': return Math.abs(F.num(v)) < 100 ? F.fmtRate(v) : F.fmtCurrency(v);
      case 'int': return F.fmtNumber(v);
      case 'number': return F.fmtDecimal(v);
      case 'toggle': return v === true ? 'Yes' : 'No';
      default: return String(v == null ? '—' : v);
    }
  }

  function assumptionRow(field, sectionTitle) {
    var unverified = M.UNVERIFIED_SOURCES.indexOf(field.source) !== -1;
    return '<tr>' +
      '<td class="wrap">' + esc(field.label) + '</td>' +
      '<td class="num">' + esc(assumptionValue(field)) + '</td>' +
      '<td>' + esc(field.unit || '—') + '</td>' +
      '<td><span class="src-chip' + (unverified ? ' unverified' : '') + '">' + esc(field.source) + '</span></td>' +
      '<td class="wrap derived">' + esc(sectionTitle[field.section] || '—') + '</td>' +
      '</tr>';
  }

  var ASSUMPTION_HEAD = '<thead><tr><th>Assumption Name</th><th class="num">Current Value</th>' +
    '<th>Unit</th><th>Source Type</th><th>Section</th></tr></thead>';

  function renderAssumptions(res) {
    var filter = state.assumptionFilter.trim().toLowerCase();
    var sectionTitle = {};
    M.SECTIONS.forEach(function (s) { sectionTitle[s.id] = s.num + '. ' + s.title; });

    /* Source-type census across every rate the engine reads. */
    var census = {};
    var rateFields = M.FIELDS.filter(function (f) { return !f.hideFromAssumptions; });
    rateFields.forEach(function (f) { census[f.source] = (census[f.source] || 0) + 1; });

    var ORDER = [M.SOURCE.CUSTOMER, M.SOURCE.VENDOR_PUBLISHED, M.SOURCE.VENDOR_NEGOTIATED,
      M.SOURCE.HYPERSYNC, M.SOURCE.ESTIMATED, M.SOURCE.TBD];
    $('#assumptionSummary').innerHTML = ORDER.map(function (src) {
      var n = census[src] || 0;
      var unverified = M.UNVERIFIED_SOURCES.indexOf(src) !== -1;
      return '<div><dt>' + esc(src) + '</dt><dd' + (unverified && n ? ' class="flagged"' : '') + '>' +
        F.fmtNumber(n) + '</dd></div>';
    }).join('');

    var fields = M.FIELDS.filter(function (f) {
      if (f.hideFromAssumptions && !state.showStructural) return false;
      if (f.source === M.SOURCE.CUSTOMER && !state.showCustomerInputs) return false;
      if (filter && f.label.toLowerCase().indexOf(filter) === -1 && f.source.toLowerCase().indexOf(filter) === -1) return false;
      return true;
    });

    /*
     * Presentation mode leads with the assumptions a stakeholder should
     * scrutinise — everything not yet established as a real price — and keeps
     * the complete register one click away rather than on screen.
     */
    var flagged = rateFields.filter(function (f) { return M.UNVERIFIED_SOURCES.indexOf(f.source) !== -1; });
    $('#assumptionFlagged').innerHTML =
      '<h3 class="legend-note" style="margin-bottom:10px">Assumptions not established as vendor or committed prices (' +
      F.fmtNumber(flagged.length) + ')</h3>' +
      '<div class="table-wrap"><table class="data">' + ASSUMPTION_HEAD +
      '<tbody>' + flagged.map(function (f) { return assumptionRow(f, sectionTitle); }).join('') +
      '</tbody></table></div>';

    var rows = fields.map(function (f) { return assumptionRow(f, sectionTitle); }).join('');

    /* Values the engine derives rather than reads — shown so no figure in the
     * model is unaccounted for. They honour the same filter as the rest. */
    var derivedRows = [
      ['Active complexity multiplier', F.fmtDecimal(res.complexityMultiplier) + '×', '×'],
      ['Total integrations', F.fmtNumber(res.integration.counts.total), 'integrations'],
      ['Core task demand (Yr 1)', F.fmtNumber(res.year1.volumes.coreTasks), 'tasks / yr'],
      ['Incremental task consumption (Yr 1)', F.fmtNumber(res.year1.volumes.incrementalTasks), 'tasks / yr'],
      ['Billable tasks (Yr 1)', F.fmtNumber(res.year1.volumes.billableTasks), 'tasks / yr'],
      ['Task overage above included volume (Yr 1)', F.fmtNumber(res.year1.volumes.overageTasks), 'tasks / yr'],
      ['Active pricing formula', res.pricing.formula, '—']
    ].filter(function (d) {
      return !filter || d[0].toLowerCase().indexOf(filter) !== -1 || 'derived'.indexOf(filter) !== -1;
    });

    var derived = derivedRows.map(function (d) {
      return '<tr><td class="wrap">' + esc(d[0]) + '</td><td class="num">' + esc(d[1]) + '</td>' +
        '<td>' + esc(d[2]) + '</td><td><span class="src-chip">Derived</span></td>' +
        '<td class="wrap derived">Calculation engine</td></tr>';
    }).join('');

    var total = fields.length + derivedRows.length;
    $('#assumptionsTable').innerHTML = total
      ? '<div class="table-wrap"><table class="data">' + ASSUMPTION_HEAD +
        '<tbody>' + rows + derived + '</tbody></table></div>'
      : '<p class="viz-empty">No assumptions match this filter.</p>';
    $('#assumptionFullCount').textContent = F.fmtNumber(total);

    var unverifiedCount = M.FIELDS.filter(function (f) {
      return !f.hideFromAssumptions && M.UNVERIFIED_SOURCES.indexOf(f.source) !== -1;
    }).length;
    var tbdCount = M.FIELDS.filter(function (f) {
      return !f.hideFromAssumptions && f.source === M.SOURCE.TBD;
    }).length;

    $('#assumptionWarning').innerHTML =
      '<span class="icon" aria-hidden="true">!</span>' +
      '<strong>Unverified assumptions in use</strong>' +
      '<span>' + unverifiedCount + ' assumptions are marked Estimated or TBD, of which ' + tbdCount +
      ' are TBD vendor or commercial rates carrying illustrative default values. ' +
      'No value in this model is presented as a verified or negotiated vendor price until its source type says so.</span>';
  }

  /* =====================================================================
   * Recalculate + repaint everything downstream of the inputs
   * =================================================================== */
  var lastResult = null;

  function recalc() {
    var res = E.compute(state.values);
    lastResult = res;
    renderExecutive(res);
    renderResults(res);
    renderCostBreakdown(res);
    renderPriceBreakdown(res);
    renderProjection(res);
    renderDerivedCells(res);
    renderScenarios(res);
    renderAssumptions(res);
    persist();
  }

  function fullRender() {
    renderInputs();
    recalc();
  }

  /* =====================================================================
   * Input handling
   * =================================================================== */
  function readValue(input, field) {
    switch (field.kind) {
      case 'toggle': return input.checked === true;
      case 'select': return input.value;
      case 'text': return input.value;
      case 'percent': return F.fromPercentInput(input.value);
      case 'int': return F.count(input.value);
      case 'currency': return F.money(input.value);
      default: return F.clamp(input.value, typeof field.min === 'number' ? field.min : 0,
        typeof field.max === 'number' ? field.max : Number.MAX_SAFE_INTEGER);
    }
  }

  function onInputChange(ev) {
    var input = ev.target.closest('[data-key]');
    if (!input) return;
    var key = input.getAttribute('data-key');
    var field = M.FIELD_MAP[key];
    if (!field) return;

    var next = readValue(input, field);

    /*
     * Text and number controls fire `input` while typing and `change` again on
     * blur. Repainting on that second, identical event would replace DOM the
     * user is mid-click on — the mousedown target disappears and the click is
     * never delivered. Values that did not actually change stop here.
     */
    if (next === state.values[key]) return;
    state.values[key] = next;

    /* Mirrored fields (a key rendered in more than one section) stay in step. */
    $$('[data-key="' + key + '"]').forEach(function (other) {
      if (other === input) return;
      if (field.kind === 'toggle') other.checked = state.values[key] === true;
      else if (field.kind === 'percent') other.value = F.toPercentInput(state.values[key]);
      else other.value = state.values[key];
    });

    /* Changing the methodology or a structural switch alters which controls
     * are relevant, so those get a full input re-render. */
    if (key === 'pricingMethod' || /\.(method|driver|basis)$/.test(key)) {
      var focusKey = key;
      fullRender();
      var restored = document.querySelector('[data-key="' + focusKey + '"]');
      if (restored) restored.focus();
      return;
    }

    recalc();
  }

  /* =====================================================================
   * Toolbar
   * =================================================================== */
  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.theme);
    $$('[data-theme-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === state.theme));
    });
  }

  function applyMode() {
    $$('[data-mode-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode-set') === state.mode));
    });
  }

  function applyPresentation() {
    document.body.classList.toggle('presenting', state.presenting);
    var btn = $('#presentToggle');
    btn.setAttribute('aria-pressed', String(state.presenting));
    btn.textContent = state.presenting ? 'Exit Presentation Mode' : 'Presentation Mode';
    /* Layout width changes when the input panel hides — charts must re-fit. */
    setTimeout(C.redrawAll, 0);
  }

  function applyBanner() {
    $('#sampleBanner').hidden = !state.sampleLoaded;
  }

  function bindToolbar() {
    $$('[data-mode-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mode = btn.getAttribute('data-mode-set');
        applyMode();
        fullRender();   /* values object is untouched, so nothing is lost */
      });
    });

    $$('[data-theme-set]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.theme = btn.getAttribute('data-theme-set');
        applyTheme();
        persist();
      });
    });

    $('#presentToggle').addEventListener('click', function () {
      state.presenting = !state.presenting;
      applyPresentation();
    });

    $('#resetBtn').addEventListener('click', function () {
      if (!window.confirm('Reset every input and assumption to its default value? Saved scenarios are kept.')) return;
      state.values = M.defaults();
      state.sampleLoaded = false;
      applyBanner();
      fullRender();
    });

    $('#sampleBtn').addEventListener('click', function () {
      state.values = M.sample();
      state.sampleLoaded = true;
      applyBanner();
      fullRender();
    });

    $('#tabs').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-tab]');
      if (!btn) return;
      state.activeTab = btn.getAttribute('data-tab');
      renderInputs();
      renderDerivedCells(lastResult || E.compute(state.values));
      persist();
    });

    $('#tabPanels').addEventListener('input', onInputChange);
    $('#tabPanels').addEventListener('change', onInputChange);

    $('#scenarioActions').addEventListener('click', function (ev) {
      var save = ev.target.closest('[data-scenario-save]');
      var load = ev.target.closest('[data-scenario-load]');
      var clear = ev.target.closest('[data-scenario-clear]');
      if (save) {
        var id = save.getAttribute('data-scenario-save');
        state.scenarios[id] = {
          values: JSON.parse(JSON.stringify(state.values)),
          orgName: String(state.values.orgName || '').trim() || 'Unnamed Organization',
          savedAt: new Date().toISOString()
        };
        recalc();
      } else if (load) {
        var lid = load.getAttribute('data-scenario-load');
        var saved = state.scenarios[lid];
        if (!saved) return;
        var merged = M.defaults();
        Object.keys(saved.values).forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(merged, k)) merged[k] = saved.values[k];
        });
        state.values = merged;
        fullRender();
      } else if (clear) {
        var cid = clear.getAttribute('data-scenario-clear');
        state.scenarios[cid] = null;
        recalc();
      }
    });

    $('#assumptionSearch').addEventListener('input', function (ev) {
      state.assumptionFilter = ev.target.value;
      renderAssumptions(lastResult || E.compute(state.values));
    });
    $('#showCustomerInputs').addEventListener('change', function (ev) {
      state.showCustomerInputs = ev.target.checked;
      renderAssumptions(lastResult || E.compute(state.values));
    });
    $('#showStructural').addEventListener('change', function (ev) {
      state.showStructural = ev.target.checked;
      renderAssumptions(lastResult || E.compute(state.values));
    });
  }

  /* =====================================================================
   * Boot
   * =================================================================== */
  function init() {
    restore();
    applyTheme();
    applyMode();
    applyBanner();
    bindToolbar();
    fullRender();
    applyPresentation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);

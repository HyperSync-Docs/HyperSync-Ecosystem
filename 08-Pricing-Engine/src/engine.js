/*
 * HyperSync Enterprise Pricing Engine
 * engine.js — THE CALCULATION ENGINE.
 *
 * Pure functions only. No DOM access, no formatting, no globals other than the
 * exported namespace. Given a values object from the model registry it returns
 * a results object. Everything the UI displays is computed here.
 *
 * The three concepts the model keeps strictly separate:
 *
 *   1. COST TO OPERATE     — what it costs HyperSync to deliver (cost basis).
 *   2. PRICE CHARGED       — cost basis transformed by the commercial model.
 *   3. ENTERPRISE SCALE    — customer inputs that drive cost, never price directly.
 *
 * Changing a margin moves (2) only. Changing enterprise scale moves (1), and
 * (2) follows from it. The pipeline below runs strictly in that order.
 */
(function (global) {
  'use strict';

  var F = global.HSPE.format;
  var M = global.HSPE.model;
  var num = F.num, qty = F.qty, count = F.count, money = F.money, div = F.div;

  /* ------------------------------------------------------------------
   * Helpers for reading the flat values object
   * ---------------------------------------------------------------- */
  function readers(values) {
    function raw(key) {
      var v = values[key];
      if (v === undefined) {
        var fd = M.FIELD_MAP[key];
        return fd ? fd.def : 0;
      }
      return v;
    }
    return {
      raw: raw,
      n: function (key) { return num(raw(key), 0); },
      q: function (key) { return qty(raw(key)); },
      c: function (key) { return count(raw(key)); },
      m: function (key) { return money(raw(key)); },
      /* Margin rates are bounded below 1 so Price = Cost / (1 - GM) can never
       * divide by zero or invert. */
      gm: function (key) { return F.clamp(raw(key), 0, 0.95); },
      mk: function (key) { return F.clamp(raw(key), 0, 10); },
      g: function (key) { return F.clamp(raw(key), -0.9, 5); },
      s: function (key) { return String(raw(key) === undefined || raw(key) === null ? '' : raw(key)); },
      b: function (key) { return raw(key) === true || raw(key) === 'true'; }
    };
  }

  /* ------------------------------------------------------------------
   * Enterprise profile + complexity
   * ---------------------------------------------------------------- */
  function profileOf(r) {
    return {
      orgName: r.s('orgName').trim() || 'Unnamed Organization',
      employees: r.c('employees'),
      users: r.c('users'),
      facilities: r.c('facilities'),
      departments: r.c('departments'),
      businessUnits: r.c('businessUnits'),
      operatingSystems: r.c('operatingSystems'),
      workflows: r.c('workflows'),
      annualTransactions: r.c('annualTransactions'),
      complexity: r.s('complexity')
    };
  }

  function complexityMultiplier(r) {
    switch (r.s('complexity')) {
      case 'Low': return F.clamp(r.n('cxLow'), 0.1, 5);
      case 'High': return F.clamp(r.n('cxHigh'), 0.1, 5);
      case 'Enterprise Critical': return F.clamp(r.n('cxCritical'), 0.1, 5);
      default: return F.clamp(r.n('cxModerate'), 0.1, 5);
    }
  }

  function integrationCounts(r) {
    var byType = {};
    var total = 0;
    M.INTEGRATION_TYPES.forEach(function (t) {
      byType[t.key] = r.c(t.key);
      total += byType[t.key];
    });
    return { byType: byType, total: total };
  }

  /* ------------------------------------------------------------------
   * Volume model for a given projection year.
   * Year 1 uses the entered volumes; later years apply the growth rates.
   * ---------------------------------------------------------------- */
  function volumesForYear(r, year) {
    var y = Math.max(1, count(year) || 1);
    var e = y - 1;
    var gUsers = Math.pow(1 + r.g('userGrowthPct'), e);
    var gTasks = Math.pow(1 + r.g('taskGrowthPct'), e);
    var gApi = Math.pow(1 + r.g('apiGrowthPct'), e);

    var profile = profileOf(r);
    var users = Math.max(0, Math.round(profile.users * gUsers));

    /* Two independent estimates of the same core task demand. */
    var declaredAnnual = r.s('zapAnnualBasis') === M.ANNUAL_BASIS[1]
      ? r.q('zapTasksAnnualDirect')
      : r.q('zapTasksMonthly') * 12;
    var derivedAnnual = r.q('annualTransactions') * r.q('avgTasksPerTransaction');

    var coreTasks;
    switch (r.s('taskDemandBasis')) {
      case M.TASK_BASIS[1]: coreTasks = declaredAnnual; break;
      case M.TASK_BASIS[2]: coreTasks = derivedAnnual; break;
      default: coreTasks = Math.max(declaredAnnual, derivedAnnual);
    }
    coreTasks = coreTasks * gTasks;

    var premiumOps = r.q('premiumAppOpsAnnual') * gTasks;
    var aiOps = r.q('aiOpsAnnual') * gTasks;
    var codeSteps = r.q('codeStepsAnnual') * gTasks;
    var apiCalls = r.q('apiCallsAnnual') * gApi;
    var webhooks = r.q('webhookCallsAnnual') * gApi;
    var storageRecords = r.q('storageRecords') * gTasks;

    /* Operations do not consume tasks uniformly — each carries its own weight. */
    var incrementalTasks =
      premiumOps * r.q('wPremiumApp') +
      aiOps * r.q('wAiOp') +
      codeSteps * r.q('wCodeStep') +
      webhooks * r.q('wWebhook') +
      apiCalls * r.q('wApiCall');

    var billableTasks = coreTasks + incrementalTasks;
    var includedTasks = r.q('zapIncludedTasksAnnual');

    return {
      year: y,
      users: users,
      workflows: profile.workflows,
      operatingSystems: profile.operatingSystems,
      declaredTasksAnnual: declaredAnnual,
      derivedTasksAnnual: derivedAnnual,
      coreTasks: coreTasks,
      incrementalTasks: incrementalTasks,
      billableTasks: billableTasks,
      includedTasks: includedTasks,
      overageTasks: Math.max(0, billableTasks - includedTasks),
      premiumOps: premiumOps,
      aiOps: aiOps,
      codeSteps: codeSteps,
      apiCalls: apiCalls,
      webhooks: webhooks,
      storageRecords: storageRecords
    };
  }

  /* ------------------------------------------------------------------
   * Third-party infrastructure cost (annual, for a given year's volumes).
   * `inflation` multiplies vendor rates in years 2+.
   * ---------------------------------------------------------------- */
  function infrastructureCost(r, vol, inflation) {
    var infl = num(inflation, 1);

    var zapBase = r.m('zapBasePlatformAnnual') * infl;
    var zapSeats = r.c('zapUsers') * r.m('zapPerUserAnnual') * infl;
    var zapOverage = vol.overageTasks * r.m('zapIncrementalTaskCost') * infl;

    var premiumFixed = r.m('premiumServiceAnnual') * infl;
    var premiumVariable = vol.premiumOps * r.m('premiumAppCostPerOp') * infl;
    var aiFixed = r.m('aiServiceAnnualFlat') * infl;
    var aiVariable = vol.aiOps * r.m('aiCostPerOp') * infl;

    var apiCost = div(vol.apiCalls, 1000) * r.m('apiCostPer1k') * infl;
    var webhookCost = div(vol.webhooks, 1000) * r.m('webhookCostPer1k') * infl;
    var storageCost = div(vol.storageRecords, 1000) * r.m('storageCostPer1kMonthly') * 12 * infl;

    var otherAutomation = r.m('otherAutomationInfraAnnual') * infl;
    var otherEnterprise = r.m('otherInfraAnnual') * infl;

    var automation = zapBase + zapSeats + zapOverage;
    var premium = premiumFixed + premiumVariable + aiFixed + aiVariable;
    var apiInfra = apiCost + webhookCost + storageCost;
    var other = otherAutomation + otherEnterprise;

    return {
      zapBase: zapBase, zapSeats: zapSeats, zapOverage: zapOverage,
      premiumFixed: premiumFixed, premiumVariable: premiumVariable,
      aiFixed: aiFixed, aiVariable: aiVariable,
      apiCost: apiCost, webhookCost: webhookCost, storageCost: storageCost,
      otherAutomation: otherAutomation, otherEnterprise: otherEnterprise,
      automation: automation,
      premium: premium,
      apiInfra: apiInfra,
      other: other,
      /* Third-party infrastructure bucket for margin purposes (premium priced separately). */
      thirdPartyBucket: automation + apiInfra + other,
      total: automation + premium + apiInfra + other
    };
  }

  /* ------------------------------------------------------------------
   * Integration setup (one-time) and integration maintenance (recurring).
   * ---------------------------------------------------------------- */
  function integrationCost(r, cx) {
    var counts = integrationCounts(r);
    var multiplier = r.b('applyComplexityToIntegrations') ? cx : 1;
    var lines = M.INTEGRATION_TYPES.map(function (t) {
      var n = counts.byType[t.key];
      var rate = r.m(t.rateKey);
      return { key: t.key, label: t.label, count: n, rate: rate, extended: n * rate * multiplier };
    });
    var setup = lines.reduce(function (a, l) { return a + l.extended; }, 0);
    var maintenance = counts.total * r.m('integrationMaintenanceAnnualPer');
    return {
      lines: lines,
      counts: counts,
      multiplier: multiplier,
      setup: setup,
      maintenanceAnnual: maintenance
    };
  }

  /* ------------------------------------------------------------------
   * Implementation cost basis (one-time).
   * ---------------------------------------------------------------- */
  function driverQuantity(driver, profile, integrationTotal, manualQty) {
    switch (driver) {
      case 'users': return profile.users;
      case 'facilities': return profile.facilities;
      case 'departments': return profile.departments;
      case 'businessUnits': return profile.businessUnits;
      case 'operatingSystems': return profile.operatingSystems;
      case 'workflows': return profile.workflows;
      case 'integrations': return integrationTotal;
      default: return qty(manualQty);
    }
  }

  function implementationCost(r, profile, integrationTotal, cx) {
    var lines = M.IMPLEMENTATION_ITEMS.map(function (item) {
      var p = 'impl.' + item.key + '.';
      var method = r.s(p + 'method');
      var driver = M.driverId(r.s(p + 'driver'));
      var manualQty = r.q(p + 'qty');
      var rate = r.m(p + 'rate');
      var flat = r.m(p + 'flat');
      var scaled = r.b(p + 'complexity');
      var multiplier = scaled ? cx : 1;

      var isFlat = method === M.IMPL_METHODS[0];
      var quantity = isFlat ? 1 : driverQuantity(driver, profile, integrationTotal, manualQty);
      var base = isFlat ? flat : quantity * rate;
      var extended = base * multiplier;

      return {
        key: item.key,
        label: item.label,
        method: method,
        isFlat: isFlat,
        driver: driver,
        driverLabel: M.driverLabel(driver),
        quantity: quantity,
        qtyUnit: item.qtyUnit || 'units',
        rate: rate,
        flat: flat,
        complexityScaled: scaled,
        multiplier: multiplier,
        base: base,
        extended: extended
      };
    });
    var total = lines.reduce(function (a, l) { return a + l.extended; }, 0);
    return { lines: lines, total: total };
  }

  /* ------------------------------------------------------------------
   * Recurring HyperSync services (annual cost basis).
   * ---------------------------------------------------------------- */
  function recurringCost(r, vol, implementationTotal) {
    var lines = M.RECURRING_ITEMS.map(function (item) {
      var p = 'rec.' + item.key + '.';
      var enabled = r.b(p + 'enabled');
      var basis = M.recurringBasisId(r.s(p + 'basis'));
      var rate = basis === 'pctImplementation' ? F.clamp(r.raw(p + 'rate'), 0, 5) : r.m(p + 'rate');
      var driverQty = 1;
      var annual = 0;

      switch (basis) {
        case 'monthly': annual = rate * 12; break;
        case 'perUserMonth': driverQty = vol.users; annual = rate * driverQty * 12; break;
        case 'perWorkflowMonth': driverQty = vol.workflows; annual = rate * driverQty * 12; break;
        case 'perOsMonth': driverQty = vol.operatingSystems; annual = rate * driverQty * 12; break;
        case 'pctImplementation': annual = rate * money(implementationTotal); break;
        default: annual = rate;
      }
      if (!enabled) annual = 0;

      return {
        key: item.key,
        label: item.label,
        enabled: enabled,
        basis: basis,
        basisLabel: M.recurringBasisLabel(basis),
        basisUnit: M.recurringBasisUnit(basis),
        rate: rate,
        driverQty: driverQty,
        costClass: item.costClass,
        annual: annual
      };
    });

    var service = lines.reduce(function (a, l) { return a + (l.costClass === 'service' ? l.annual : 0); }, 0);
    var support = lines.reduce(function (a, l) { return a + (l.costClass === 'support' ? l.annual : 0); }, 0);
    return { lines: lines, service: service, support: support, total: service + support };
  }

  /* ------------------------------------------------------------------
   * COMMERCIAL MODEL
   *
   * Markup:       Price = Cost × (1 + Markup Rate)
   * Gross margin: Price = Cost ÷ (1 − Target Gross Margin)
   *
   * These are different transformations and are never treated as equivalent.
   * ---------------------------------------------------------------- */
  function pricer(r) {
    var method = r.s('pricingMethod');
    var usingMargin = method !== 'Markup';
    return {
      method: method,
      usingMargin: usingMargin,
      methodFormula: usingMargin
        ? 'Price = Cost ÷ (1 − Target Gross Margin)'
        : 'Price = Cost × (1 + Markup Rate)',
      /* Effective rate applied to a bucket, in its own methodology's terms. */
      rateFor: function (bucket) {
        return usingMargin ? r.gm('margin.' + bucket) : r.mk('markup.' + bucket);
      },
      price: function (cost, bucket) {
        var c = money(cost);
        if (c === 0) return 0;
        if (usingMargin) {
          var gm = r.gm('margin.' + bucket);
          return div(c, 1 - gm, c);
        }
        return c * (1 + r.mk('markup.' + bucket));
      }
    };
  }

  /* ------------------------------------------------------------------
   * A single year of the model: cost basis -> price.
   * Year 1 carries one-time implementation and integration setup;
   * later years carry recurring items only.
   * ---------------------------------------------------------------- */
  function computeYear(r, year, ctx) {
    var y = Math.max(1, count(year) || 1);
    var e = y - 1;
    var isYearOne = y === 1;

    var vol = volumesForYear(r, y);
    var inflation = Math.pow(1 + r.g('infraInflationPct'), e);
    var priceAdj = Math.pow(1 + r.g('hsPriceAdjPct'), e);

    var infra = infrastructureCost(r, vol, inflation);
    var integ = ctx.integration;
    var impl = ctx.implementation;

    var recurring = recurringCost(r, vol, impl.total);

    /* ---- COST BASIS -------------------------------------------------- */
    var oneTimeImplementation = isYearOne ? impl.total : 0;
    var oneTimeIntegrationSetup = isYearOne ? integ.setup : 0;
    var integrationMaintenance = integ.maintenanceAnnual;

    /* Section 8 categories — mutually exclusive, summing to the year's cost basis. */
    var categories = {
      automation: infra.automation,
      apiIntegration: infra.apiInfra + oneTimeIntegrationSetup,
      premiumServices: infra.premium,
      implementation: oneTimeImplementation,
      recurringServices: recurring.service,
      maintenanceSupport: recurring.support + integrationMaintenance,
      otherInfrastructure: infra.other
    };
    var costTotal = Object.keys(categories).reduce(function (a, k) { return a + categories[k]; }, 0);

    /* ---- MARGIN BUCKETS ---------------------------------------------- */
    var costBuckets = {
      implementation: oneTimeImplementation,
      customIntegrations: oneTimeIntegrationSetup,
      recurring: recurring.total + integrationMaintenance,
      thirdParty: infra.thirdPartyBucket,
      premium: infra.premium
    };

    /* ---- PRICE ------------------------------------------------------- *
     * HyperSync-originated price carries the annual price adjustment.
     * Third-party price does not: its escalation already sits in the cost
     * basis via infrastructure inflation.                                */
    var p = ctx.pricer;
    var priceBuckets = {
      implementation: p.price(costBuckets.implementation, 'implementation') * priceAdj,
      customIntegrations: p.price(costBuckets.customIntegrations, 'customIntegrations') * priceAdj,
      recurring: p.price(costBuckets.recurring, 'recurring') * priceAdj,
      thirdParty: p.price(costBuckets.thirdParty, 'thirdParty'),
      premium: p.price(costBuckets.premium, 'premium')
    };
    var priceTotal = Object.keys(priceBuckets).reduce(function (a, k) { return a + priceBuckets[k]; }, 0);

    /* Recurring price = everything that repeats next year. */
    var recurringPrice = priceBuckets.recurring + priceBuckets.thirdParty + priceBuckets.premium;
    var recurringCostBasis = costBuckets.recurring + costBuckets.thirdParty + costBuckets.premium;

    var grossProfit = priceTotal - costTotal;

    /* ---- Section 9 price strata -------------------------------------- *
     * Cost strata are shown at cost; the remainder is commercial margin,
     * so customer price is never visually confused with underlying cost.  */
    var supportCost = recurring.support + integrationMaintenance;
    var strata = {
      thirdPartyCost: infra.thirdPartyBucket + infra.premium,
      implementationCost: oneTimeImplementation + oneTimeIntegrationSetup,
      recurringServicesCost: recurring.service,
      supportMaintenanceCost: supportCost,
      commercialMargin: Math.max(0, grossProfit)
    };

    return {
      year: y,
      isYearOne: isYearOne,
      volumes: vol,
      inflation: inflation,
      priceAdj: priceAdj,
      infra: infra,
      recurring: recurring,
      integrationMaintenance: integrationMaintenance,
      oneTimeImplementation: oneTimeImplementation,
      oneTimeIntegrationSetup: oneTimeIntegrationSetup,
      categories: categories,
      costBuckets: costBuckets,
      costTotal: costTotal,
      priceBuckets: priceBuckets,
      priceTotal: priceTotal,
      recurringPrice: recurringPrice,
      recurringCostBasis: recurringCostBasis,
      grossProfit: grossProfit,
      grossMargin: div(grossProfit, priceTotal, 0),
      strata: strata
    };
  }

  /* ------------------------------------------------------------------
   * Public entry point.
   * ---------------------------------------------------------------- */
  function compute(values) {
    var r = readers(values || {});
    var profile = profileOf(r);
    var cx = complexityMultiplier(r);
    var integ = integrationCost(r, cx);
    var impl = implementationCost(r, profile, integ.counts.total, cx);
    var p = pricer(r);

    var ctx = { integration: integ, implementation: impl, pricer: p };

    var years = [];
    var cumulativePrice = 0;
    var cumulativeCost = 0;
    for (var y = 1; y <= 5; y++) {
      var row = computeYear(r, y, ctx);
      cumulativePrice += row.priceTotal;
      cumulativeCost += row.costTotal;
      row.cumulativePrice = cumulativePrice;
      row.cumulativeCost = cumulativeCost;
      years.push(row);
    }

    var y1 = years[0];
    var contract3 = years.slice(0, 3).reduce(function (a, x) { return a + x.priceTotal; }, 0);
    var contract5 = cumulativePrice;
    var cost3 = years.slice(0, 3).reduce(function (a, x) { return a + x.costTotal; }, 0);
    var cost5 = cumulativeCost;

    /* Year-2 figures answer "what does this cost to keep running?" */
    var y2 = years[1];

    return {
      profile: profile,
      complexityMultiplier: cx,
      pricing: {
        method: p.method,
        usingMargin: p.usingMargin,
        formula: p.methodFormula,
        rates: M.MARGIN_BUCKETS.map(function (b) {
          return { id: b.id, label: b.label, rate: p.rateFor(b.id) };
        })
      },
      integration: integ,
      implementation: impl,
      year1: y1,
      years: years,

      /* Section 7 — headline calculated results */
      results: {
        infraMonthly: div(y1.infra.total, 12),
        infraAnnual: y1.infra.total,
        implementationCost: impl.total,
        recurringMonthlyCost: div(y1.recurring.total + integ.maintenanceAnnual, 12),
        recurringAnnualCost: y1.recurring.total + integ.maintenanceAnnual,
        thirdPartyPlatformCost: y1.infra.thirdPartyBucket,
        premiumServicesCost: y1.infra.premium,
        integrationCost: integ.setup + integ.maintenanceAnnual,
        supportMaintenanceCost: y1.recurring.support + integ.maintenanceAnnual,
        year1CostBasis: y1.costTotal,
        year1Price: y1.priceTotal,
        recurringAnnualPrice: y2.recurringPrice,
        estimatedMonthlyPrice: div(y2.recurringPrice, 12),
        contract3: contract3,
        contract5: contract5,
        cost3: cost3,
        cost5: cost5,
        grossProfitYear1: y1.grossProfit,
        grossMarginYear1: y1.grossMargin,
        grossProfit5: contract5 - cost5,
        grossMargin5: div(contract5 - cost5, contract5, 0)
      }
    };
  }

  global.HSPE = global.HSPE || {};
  global.HSPE.engine = {
    compute: compute,
    volumesForYear: function (values, year) { return volumesForYear(readers(values), year); }
  };
})(window);

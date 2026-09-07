/*
 * HyperSync Enterprise Pricing Engine
 * format.js — numeric sanitation and presentation formatting.
 *
 * Every value that reaches the screen passes through here. The engine may
 * produce edge cases (divide-by-zero, empty inputs); this layer guarantees the
 * user never sees NaN, Infinity, or "-0".
 */
(function (global) {
  'use strict';

  /** Coerce anything to a finite number. Non-finite/blank -> fallback. */
  function num(value, fallback) {
    var fb = typeof fallback === 'number' ? fallback : 0;
    if (value === null || value === undefined || value === '') return fb;
    var n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[, ]/g, ''));
    if (!isFinite(n)) return fb;
    return n;
  }

  function clamp(value, min, max) {
    var n = num(value, min);
    if (typeof min === 'number' && n < min) n = min;
    if (typeof max === 'number' && n > max) n = max;
    return n;
  }

  /** Non-negative quantity (users, tasks, counts). Never negative, never NaN. */
  function qty(value) {
    return clamp(value, 0, Number.MAX_SAFE_INTEGER);
  }

  /** Non-negative whole count. */
  function count(value) {
    return Math.round(qty(value));
  }

  /** Non-negative money amount. */
  function money(value) {
    return clamp(value, 0, Number.MAX_SAFE_INTEGER);
  }

  /**
   * A rate expressed as a fraction. Bounded so a stray entry cannot invert the
   * model. Growth/inflation may be negative (decline); margins may not.
   */
  function rate(value, min, max) {
    return clamp(value, typeof min === 'number' ? min : -0.99, typeof max === 'number' ? max : 10);
  }

  /** Safe division: zero denominator yields the fallback rather than Infinity. */
  function div(numerator, denominator, fallback) {
    var d = num(denominator, 0);
    if (d === 0) return typeof fallback === 'number' ? fallback : 0;
    var r = num(numerator, 0) / d;
    return isFinite(r) ? r : (typeof fallback === 'number' ? fallback : 0);
  }

  var currency0 = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  var currency2 = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  var currency4 = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4
  });
  var integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  var decimal2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  /** Whole-dollar currency with thousands separators. */
  function fmtCurrency(value) {
    var n = num(value, 0);
    if (n === 0) n = 0; // collapse -0
    return currency0.format(n);
  }

  /** Currency that keeps cents — used for unit rates below $100. */
  function fmtRate(value) {
    var n = num(value, 0);
    if (n !== 0 && Math.abs(n) < 0.01) return currency4.format(n);
    return currency2.format(n);
  }

  /** Compact currency for chart axes and tiles: $4.2M, $912K. */
  function fmtCompact(value) {
    var n = num(value, 0);
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return sign + '$' + decimal2.format(abs / 1e9) + 'B';
    if (abs >= 1e6) return sign + '$' + decimal2.format(abs / 1e6) + 'M';
    if (abs >= 1e3) return sign + '$' + integer.format(Math.round(abs / 1e3)) + 'K';
    return sign + '$' + integer.format(Math.round(abs));
  }

  /** Compact plain number for volumes: 24.8M, 620K. */
  function fmtCompactNumber(value) {
    var n = num(value, 0);
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return sign + decimal2.format(abs / 1e9) + 'B';
    if (abs >= 1e6) return sign + decimal2.format(abs / 1e6) + 'M';
    if (abs >= 1e4) return sign + integer.format(Math.round(abs / 1e3)) + 'K';
    return sign + integer.format(Math.round(abs));
  }

  function fmtNumber(value) {
    return integer.format(num(value, 0));
  }

  function fmtDecimal(value) {
    return decimal2.format(num(value, 0));
  }

  /** Fraction -> percentage string. 0.4386 -> "43.9%". */
  function fmtPercent(value, digits) {
    var n = num(value, 0);
    if (!isFinite(n)) n = 0;
    var d = typeof digits === 'number' ? digits : 1;
    return (n * 100).toFixed(d) + '%';
  }

  /** Percent-typed inputs are edited in percentage points, stored as fractions. */
  function toPercentInput(fraction) {
    var n = num(fraction, 0) * 100;
    return Math.round(n * 10000) / 10000;
  }

  function fromPercentInput(percentPoints) {
    return num(percentPoints, 0) / 100;
  }

  global.HSPE = global.HSPE || {};
  global.HSPE.format = {
    num: num, clamp: clamp, qty: qty, count: count, money: money, rate: rate, div: div,
    fmtCurrency: fmtCurrency, fmtRate: fmtRate, fmtCompact: fmtCompact,
    fmtCompactNumber: fmtCompactNumber, fmtNumber: fmtNumber, fmtDecimal: fmtDecimal,
    fmtPercent: fmtPercent, toPercentInput: toPercentInput, fromPercentInput: fromPercentInput
  };
})(window);

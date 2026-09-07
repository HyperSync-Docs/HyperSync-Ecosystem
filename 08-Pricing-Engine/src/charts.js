/*
 * HyperSync Enterprise Pricing Engine
 * charts.js — VISUALIZATION.
 *
 * Dependency-free SVG renderers. These know nothing about pricing: they take
 * labelled numbers and draw them. Colors are read from CSS custom properties
 * so light/dark themes swap without re-rendering logic.
 *
 * Mark specs held constant across every chart:
 *   bars <= 24px thick, 4px rounded data-end anchored to the baseline
 *   lines 2px, markers r>=4 with a 2px surface ring
 *   2px surface gap between touching fills
 *   hairline solid gridlines, one step off the surface
 */
(function (global) {
  'use strict';

  var F = global.HSPE.format;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var registry = [];

  function el(name, attrs, styleStr) {
    var node = document.createElementNS(SVG_NS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (styleStr) node.setAttribute('style', styleStr);
    return node;
  }

  function text(x, y, content, cls, extra) {
    var t = el('text', Object.assign({ x: x, y: y }, extra || {}));
    if (cls) t.setAttribute('class', cls);
    t.textContent = content;
    return t;
  }

  function widthOf(host, fallback) {
    var w = host.clientWidth || 0;
    return w > 40 ? w : (fallback || 720);
  }

  /* Real text measurement. Layout decisions (column widths, whether a label
   * fits inside a mark) are made against measured pixels, never a guess, so
   * text is never clipped or overflowed. */
  var measureCtx = null;
  function textWidth(str, fontSize, weight) {
    if (!measureCtx) {
      var canvas = document.createElement('canvas');
      measureCtx = canvas.getContext('2d');
    }
    if (!measureCtx) return String(str).length * fontSize * 0.6;
    measureCtx.font = (weight || 400) + ' ' + fontSize +
      'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    return measureCtx.measureText(String(str)).width;
  }

  function ellipsize(str, fontSize, maxWidth) {
    var s = String(str);
    if (textWidth(s, fontSize) <= maxWidth) return s;
    while (s.length > 1 && textWidth(s + '\u2026', fontSize) > maxWidth) s = s.slice(0, -1);
    return s + '\u2026';
  }

  /* Resolve a CSS custom property to its computed value on this host. */
  function cssVar(host, name) {
    try { return getComputedStyle(host).getPropertyValue(name).trim(); }
    catch (err) { return ''; }
  }

  /* Text set inside a colored fill picks white or ink by the fill's luminance,
   * so an in-segment label always clears contrast against its own segment. */
  function inkFor(colorString) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(colorString).trim());
    var r, g, b;
    if (m) {
      var hex = m[1];
      r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16);
    } else {
      var rgb = /rgba?\(([^)]+)\)/.exec(String(colorString));
      if (!rgb) return '#ffffff';
      var parts = rgb[1].split(',').map(function (x) { return parseFloat(x); });
      r = parts[0]; g = parts[1]; b = parts[2];
    }
    function lin(c) { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    /* Contrast against white vs against near-black ink. */
    var againstWhite = 1.05 / (L + 0.05);
    var againstInk = (L + 0.05) / 0.09;
    return againstInk > againstWhite ? '#0b0b0b' : '#ffffff';
  }

  function roundedRightBar(x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, w, h / 2));
    if (w <= 0) return 'M' + x + ',' + y + 'Z';
    return 'M' + x + ',' + y +
      'H' + (x + w - rr) +
      'A' + rr + ',' + rr + ' 0 0 1 ' + (x + w) + ',' + (y + rr) +
      'V' + (y + h - rr) +
      'A' + rr + ',' + rr + ' 0 0 1 ' + (x + w - rr) + ',' + (y + h) +
      'H' + x + 'Z';
  }

  function roundedTopBar(x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, w / 2, h));
    if (h <= 0) return 'M' + x + ',' + y + 'Z';
    return 'M' + x + ',' + (y + h) +
      'V' + (y + rr) +
      'A' + rr + ',' + rr + ' 0 0 1 ' + (x + rr) + ',' + y +
      'H' + (x + w - rr) +
      'A' + rr + ',' + rr + ' 0 0 1 ' + (x + w) + ',' + (y + rr) +
      'V' + (y + h) + 'Z';
  }

  /* ---- tooltip ------------------------------------------------------- */
  function ensureTooltip(host) {
    var tip = host.querySelector('.viz-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'viz-tip';
      tip.setAttribute('role', 'status');
      tip.hidden = true;
      host.appendChild(tip);
    }
    return tip;
  }

  function showTip(host, tip, clientX, clientY, html) {
    tip.innerHTML = html;
    tip.hidden = false;
    var hostRect = host.getBoundingClientRect();
    var x = clientX - hostRect.left;
    var y = clientY - hostRect.top;
    var tw = tip.offsetWidth;
    var th = tip.offsetHeight;
    var left = x + 14;
    if (left + tw > hostRect.width - 4) left = Math.max(4, x - tw - 14);
    var top = y - th - 12;
    if (top < 4) top = y + 18;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function hideTip(tip) { tip.hidden = true; }

  /* ---- nice axis ticks ----------------------------------------------- */
  function niceTicks(maxValue, targetCount) {
    var max = F.num(maxValue, 0);
    if (max <= 0) return { max: 1, ticks: [0, 1] };
    var count = targetCount || 4;
    var rawStep = max / count;
    var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var norm = rawStep / mag;
    var step;
    if (norm <= 1) step = 1 * mag;
    else if (norm <= 2) step = 2 * mag;
    else if (norm <= 2.5) step = 2.5 * mag;
    else if (norm <= 5) step = 5 * mag;
    else step = 10 * mag;
    var top = Math.ceil(max / step) * step;
    var ticks = [];
    for (var v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
    return { max: top, ticks: ticks };
  }

  /* =====================================================================
   * Horizontal bar chart — ranked magnitude across nominal categories.
   * One series, one hue: bar length already encodes the value, so hue is
   * not spent restating it.
   * =================================================================== */
  function barChart(host, config) {
    host.innerHTML = '';
    var tip = ensureTooltip(host);
    var items = (config.items || []).filter(function (d) { return F.num(d.value, 0) !== 0 || config.keepZero; });
    if (!items.length) {
      host.appendChild(emptyState('No cost has been modeled yet.'));
      return;
    }
    var fmt = config.fmt || F.fmtCurrency;
    var total = items.reduce(function (a, d) { return a + Math.max(0, F.num(d.value, 0)); }, 0);

    var width = widthOf(host);
    var rowH = 36;
    var barH = 20;
    var LABEL_FONT = 12.5;
    var VALUE_FONT = 12;
    var padRight = 8;

    var valueStrings = items.map(function (d) {
      var v = Math.max(0, F.num(d.value, 0));
      return fmt(v) + '  \u00b7  ' + F.fmtPercent(total > 0 ? v / total : 0);
    });

    /* Size both text columns from measured content so nothing is clipped. */
    var maxLabelW = items.reduce(function (a, d) { return Math.max(a, textWidth(d.label, LABEL_FONT)); }, 0);
    var maxValueW = valueStrings.reduce(function (a, s) { return Math.max(a, textWidth(s, VALUE_FONT)); }, 0);

    var labelW = Math.max(110, Math.min(maxLabelW + 24, Math.round(width * 0.46)));
    var valueW = Math.min(maxValueW + 18, Math.round(width * 0.34));
    var plotW = width - labelW - valueW - padRight;
    if (plotW < 60) {
      labelW = Math.max(90, width - valueW - padRight - 60);
      plotW = Math.max(30, width - labelW - valueW - padRight);
    }
    var height = items.length * rowH + 10;

    var maxValue = items.reduce(function (a, d) { return Math.max(a, F.num(d.value, 0)); }, 0) || 1;

    var svg = el('svg', {
      width: width, height: height, viewBox: '0 0 ' + width + ' ' + height,
      role: 'img', 'aria-label': config.ariaLabel || 'Bar chart'
    });

    /* Baseline the bars grow from. */
    svg.appendChild(el('line', { x1: labelW, y1: 4, x2: labelW, y2: height - 6, class: 'viz-baseline' }));

    items.forEach(function (d, i) {
      var value = Math.max(0, F.num(d.value, 0));
      var y = i * rowH + 6;
      var barY = y + (rowH - barH) / 2 - 4;
      var w = Math.max(value > 0 ? 3 : 0, (value / maxValue) * plotW);

      var labelNode = text(labelW - 12, barY + barH - 5,
        ellipsize(d.label, LABEL_FONT, labelW - 16), 'viz-cat-label', { 'text-anchor': 'end' });
      labelNode.appendChild(titleNode(d.label));
      svg.appendChild(labelNode);

      var bar = el('path', { d: roundedRightBar(labelW, barY, w, barH, 4) }, 'fill: var(--series-1)');
      svg.appendChild(bar);

      var share = total > 0 ? value / total : 0;
      var valueStr = valueStrings[i];
      var valueX = Math.min(labelW + w + 10, width - textWidth(valueStr, VALUE_FONT) - 2);
      svg.appendChild(text(valueX, barY + barH - 5, valueStr, 'viz-value-label'));

      var hit = el('rect', { x: 0, y: y - 4, width: width, height: rowH, fill: 'transparent' });
      hit.addEventListener('mousemove', function (ev) {
        showTip(host, tip, ev.clientX, ev.clientY,
          '<strong>' + escapeHtml(d.label) + '</strong>' +
          '<span>' + fmt(value) + '</span>' +
          '<span>' + F.fmtPercent(share) + ' of ' + escapeHtml(config.totalLabel || 'total') + '</span>');
      });
      hit.addEventListener('mouseleave', function () { hideTip(tip); });
      svg.appendChild(hit);
    });

    host.appendChild(svg);
  }

  /* =====================================================================
   * Single stacked bar — part-to-whole composition of one total.
   * =================================================================== */
  function stackedBar(host, config) {
    host.innerHTML = '';
    var tip = ensureTooltip(host);
    var segments = (config.segments || []).filter(function (s) { return F.num(s.value, 0) > 0; });
    if (!segments.length) {
      host.appendChild(emptyState('No price has been modeled yet.'));
      return;
    }
    var fmt = config.fmt || F.fmtCurrency;
    var total = segments.reduce(function (a, s) { return a + F.num(s.value, 0); }, 0);
    if (total <= 0) { host.appendChild(emptyState('No price has been modeled yet.')); return; }

    var width = widthOf(host);
    var barH = 46;
    var height = barH + 30;
    var gap = 2;

    var svg = el('svg', {
      width: width, height: height, viewBox: '0 0 ' + width + ' ' + height,
      role: 'img', 'aria-label': config.ariaLabel || 'Stacked composition bar'
    });

    var x = 0;
    var lastIndex = segments.length - 1;
    segments.forEach(function (s, i) {
      var value = F.num(s.value, 0);
      var raw = (value / total) * width;
      var w = Math.max(1, raw - (i < lastIndex ? gap : 0));
      var d;
      if (i === 0 && i === lastIndex) d = roundedRightBar(x, 0, w, barH, 4);
      else if (i === 0) d = leftRounded(x, 0, w, barH, 4);
      else if (i === lastIndex) d = roundedRightBar(x, 0, w, barH, 4);
      else d = 'M' + x + ',0 H' + (x + w) + ' V' + barH + ' H' + x + 'Z';

      var seg = el('path', { d: d }, 'fill: var(--series-' + s.slot + ')');
      svg.appendChild(seg);

      /* Only label inside the segment when the text genuinely fits, and pick
       * the ink by the segment's own luminance. */
      var pctLabel = F.fmtPercent(value / total, 0);
      if (textWidth(pctLabel, 12, 600) + 16 < w) {
        var ink = inkFor(cssVar(host, '--series-' + s.slot));
        var inBar = text(x + w / 2, barH / 2 + 4, pctLabel, 'viz-in-bar', { 'text-anchor': 'middle' });
        inBar.setAttribute('style', 'fill: ' + ink);
        svg.appendChild(inBar);
      }

      var hit = el('rect', { x: x, y: 0, width: w, height: barH, fill: 'transparent' });
      hit.addEventListener('mousemove', function (ev) {
        showTip(host, tip, ev.clientX, ev.clientY,
          '<strong>' + escapeHtml(s.label) + '</strong>' +
          '<span>' + fmt(value) + '</span>' +
          '<span>' + F.fmtPercent(value / total) + ' of ' + escapeHtml(config.totalLabel || 'total') + '</span>');
      });
      hit.addEventListener('mouseleave', function () { hideTip(tip); });
      svg.appendChild(hit);

      x += raw;
    });

    svg.appendChild(text(0, barH + 20, config.axisLeft || '', 'viz-axis-note'));
    svg.appendChild(text(width, barH + 20, config.axisRight || '', 'viz-axis-note', { 'text-anchor': 'end' }));

    host.appendChild(svg);
  }

  function leftRounded(x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, w, h / 2));
    return 'M' + (x + rr) + ',' + y +
      'H' + (x + w) + 'V' + (y + h) + 'H' + (x + rr) +
      'A' + rr + ',' + rr + ' 0 0 1 ' + x + ',' + (y + h - rr) +
      'V' + (y + rr) +
      'A' + rr + ',' + rr + ' 0 0 1 ' + (x + rr) + ',' + y + 'Z';
  }

  /* =====================================================================
   * Multi-series line chart — change over time on ONE value axis.
   * Series plotted here must share a scale; anything on a different scale
   * gets its own chart rather than a second axis.
   * =================================================================== */
  function lineChart(host, config) {
    host.innerHTML = '';
    var tip = ensureTooltip(host);
    var series = config.series || [];
    var xLabels = config.xLabels || [];
    if (!series.length || !xLabels.length) {
      host.appendChild(emptyState('No projection available.'));
      return;
    }
    var fmt = config.fmt || F.fmtCompact;
    var fullFmt = config.fullFmt || F.fmtCurrency;

    var width = widthOf(host);
    var height = config.height || 300;
    var padL = 66, padR = Math.max(58, Math.round(width * 0.09)), padT = 16, padB = 34;
    var plotW = Math.max(40, width - padL - padR);
    var plotH = Math.max(40, height - padT - padB);

    var maxValue = 0;
    series.forEach(function (s) {
      s.values.forEach(function (v) { maxValue = Math.max(maxValue, F.num(v, 0)); });
    });
    var scale = niceTicks(maxValue, 4);

    var svg = el('svg', {
      width: width, height: height, viewBox: '0 0 ' + width + ' ' + height,
      role: 'img', 'aria-label': config.ariaLabel || 'Multi-year line chart'
    });

    function xAt(i) {
      return xLabels.length === 1 ? padL + plotW / 2 : padL + (i / (xLabels.length - 1)) * plotW;
    }
    function yAt(v) {
      return padT + plotH - (F.num(v, 0) / scale.max) * plotH;
    }

    scale.ticks.forEach(function (t) {
      var y = yAt(t);
      svg.appendChild(el('line', { x1: padL, y1: y, x2: padL + plotW, y2: y, class: t === 0 ? 'viz-baseline' : 'viz-grid' }));
      svg.appendChild(text(padL - 10, y + 4, fmt(t), 'viz-tick', { 'text-anchor': 'end' }));
    });

    xLabels.forEach(function (lbl, i) {
      svg.appendChild(text(xAt(i), padT + plotH + 22, lbl, 'viz-tick', { 'text-anchor': 'middle' }));
    });

    series.forEach(function (s) {
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + xAt(i) + ',' + yAt(v); }).join(' ');
      svg.appendChild(el('path', {
        d: d, fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }, 'stroke: var(--series-' + s.slot + ')'));
    });

    /* End markers with a surface ring, plus one direct end-label per series. */
    series.forEach(function (s) {
      var lastIdx = s.values.length - 1;
      var cx = xAt(lastIdx), cy = yAt(s.values[lastIdx]);
      svg.appendChild(el('circle', { cx: cx, cy: cy, r: 4.5, 'stroke-width': 2 },
        'fill: var(--series-' + s.slot + '); stroke: var(--surface-1)'));
      svg.appendChild(text(Math.min(width - 4, cx + 10), cy + 4, fmt(s.values[lastIdx]), 'viz-end-label'));
    });

    /* Crosshair + shared tooltip across all series at the hovered year. */
    var crosshair = el('line', { x1: 0, y1: padT, x2: 0, y2: padT + plotH, class: 'viz-crosshair' });
    crosshair.setAttribute('opacity', '0');
    svg.appendChild(crosshair);

    var overlay = el('rect', { x: padL - 12, y: padT, width: plotW + 24, height: plotH, fill: 'transparent' });
    overlay.addEventListener('mousemove', function (ev) {
      var box = svg.getBoundingClientRect();
      var relX = ev.clientX - box.left;
      var idx = 0, best = Infinity;
      for (var i = 0; i < xLabels.length; i++) {
        var d = Math.abs(xAt(i) - relX);
        if (d < best) { best = d; idx = i; }
      }
      crosshair.setAttribute('x1', xAt(idx));
      crosshair.setAttribute('x2', xAt(idx));
      crosshair.setAttribute('opacity', '1');
      var rows = series.map(function (s) {
        return '<span class="viz-tip-row"><i style="background: var(--series-' + s.slot + ')"></i>' +
          escapeHtml(s.label) + '<b>' + fullFmt(s.values[idx]) + '</b></span>';
      }).join('');
      showTip(host, tip, ev.clientX, ev.clientY, '<strong>' + escapeHtml(xLabels[idx]) + '</strong>' + rows);
    });
    overlay.addEventListener('mouseleave', function () {
      crosshair.setAttribute('opacity', '0');
      hideTip(tip);
    });
    svg.appendChild(overlay);

    host.appendChild(svg);
  }

  /* =====================================================================
   * Column chart — one series over ordered periods.
   * =================================================================== */
  function columnChart(host, config) {
    host.innerHTML = '';
    var tip = ensureTooltip(host);
    var items = config.items || [];
    if (!items.length) { host.appendChild(emptyState('No projection available.')); return; }
    var fmt = config.fmt || F.fmtCompact;
    var fullFmt = config.fullFmt || F.fmtCurrency;

    var width = widthOf(host);
    var height = config.height || 230;
    var padL = 66, padR = 14, padT = 22, padB = 34;
    var plotW = Math.max(40, width - padL - padR);
    var plotH = Math.max(40, height - padT - padB);

    var maxValue = items.reduce(function (a, d) { return Math.max(a, F.num(d.value, 0)); }, 0);
    var scale = niceTicks(maxValue, 3);

    var svg = el('svg', {
      width: width, height: height, viewBox: '0 0 ' + width + ' ' + height,
      role: 'img', 'aria-label': config.ariaLabel || 'Column chart'
    });

    scale.ticks.forEach(function (t) {
      var y = padT + plotH - (t / scale.max) * plotH;
      svg.appendChild(el('line', { x1: padL, y1: y, x2: padL + plotW, y2: y, class: t === 0 ? 'viz-baseline' : 'viz-grid' }));
      svg.appendChild(text(padL - 10, y + 4, fmt(t), 'viz-tick', { 'text-anchor': 'end' }));
    });

    var band = plotW / items.length;
    var barW = Math.min(24, band * 0.5);

    items.forEach(function (d, i) {
      var value = Math.max(0, F.num(d.value, 0));
      var h = scale.max > 0 ? (value / scale.max) * plotH : 0;
      var x = padL + band * i + (band - barW) / 2;
      var y = padT + plotH - h;

      svg.appendChild(el('path', { d: roundedTopBar(x, y, barW, h, 4) }, 'fill: var(--series-' + (config.slot || 1) + ')'));
      svg.appendChild(text(x + barW / 2, Math.max(padT - 6, y - 8), fmt(value), 'viz-value-label', { 'text-anchor': 'middle' }));
      svg.appendChild(text(x + barW / 2, padT + plotH + 22, d.label, 'viz-tick', { 'text-anchor': 'middle' }));

      var hit = el('rect', { x: padL + band * i, y: padT, width: band, height: plotH, fill: 'transparent' });
      hit.addEventListener('mousemove', function (ev) {
        showTip(host, tip, ev.clientX, ev.clientY,
          '<strong>' + escapeHtml(d.label) + '</strong><span>' + fullFmt(value) + '</span>');
      });
      hit.addEventListener('mouseleave', function () { hideTip(tip); });
      svg.appendChild(hit);
    });

    host.appendChild(svg);
  }

  function titleNode(content) {
    var t = document.createElementNS(SVG_NS, 'title');
    t.textContent = content;
    return t;
  }

  function emptyState(message) {
    var p = document.createElement('p');
    p.className = 'viz-empty';
    p.textContent = message;
    return p;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ---- render registry: redraw on resize ----------------------------- */
  function draw(host, kind, config) {
    if (!host) return;
    var entry = null;
    for (var i = 0; i < registry.length; i++) if (registry[i].host === host) entry = registry[i];
    if (!entry) { entry = { host: host }; registry.push(entry); }
    entry.kind = kind;
    entry.config = config;
    render(entry);
  }

  function render(entry) {
    switch (entry.kind) {
      case 'bar': barChart(entry.host, entry.config); break;
      case 'stacked': stackedBar(entry.host, entry.config); break;
      case 'line': lineChart(entry.host, entry.config); break;
      case 'column': columnChart(entry.host, entry.config); break;
    }
  }

  var resizeTimer = null;
  function redrawAll() {
    registry.forEach(function (entry) {
      if (entry.host.isConnected && entry.host.clientWidth > 0) render(entry);
    });
  }
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redrawAll, 120);
  });

  global.HSPE = global.HSPE || {};
  global.HSPE.charts = { draw: draw, redrawAll: redrawAll, escapeHtml: escapeHtml };
})(window);

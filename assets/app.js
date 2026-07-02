/**
 * Singapore 2026 travel guide — vanilla JS, zero dependencies.
 * Fetches meta.json + per-category JSON + itinerary.json + preparation.json.
 * Renders: 1) Daily itinerary guide 2) Pre-trip preparation 3) Category cards.
 * One broken/empty file never blocks the others (Promise.allSettled).
 */

(function () {
  "use strict";

  var CATEGORIES = ["transport", "events", "food", "attractions", "souvenirs", "experiences"];
  var cacheBuster = "?v=" + Date.now();

  function fetchJSON(path) {
    return fetch(path + cacheBuster).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " for " + path);
      }
      return res.json();
    });
  }

  function escapeHTML(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ─── Header ─── */

  function renderHeader(meta) {
    var datesEl = document.getElementById("trip-dates");
    var updatedEl = document.getElementById("last-updated");

    if (meta && meta.trip_start && meta.trip_end) {
      datesEl.textContent = meta.trip_start + " – " + meta.trip_end;
    } else {
      datesEl.textContent = "行程日期資料收集中 / Trip dates pending";
    }

    if (meta && meta.last_updated) {
      updatedEl.textContent = "最後更新 / Last updated: " + meta.last_updated;
    } else {
      updatedEl.textContent = "";
    }
  }

  function renderNav(meta) {
    var nav = document.getElementById("category-nav");
    nav.innerHTML = "";
    var labels = (meta && meta.category_labels) || {};
    var cats = (meta && meta.categories) || CATEGORIES;

    // Add special nav items first (before category tabs)
    var prepLink = document.createElement("a");
    prepLink.href = "#preparation";
    prepLink.textContent = "✅ 行前準備";
    prepLink.className = "nav-highlight";
    nav.appendChild(prepLink);

    var todayLink = document.createElement("a");
    todayLink.href = "#daily-guide";
    todayLink.textContent = "📅 完整行程";
    todayLink.className = "nav-highlight";
    nav.appendChild(todayLink);

    cats.forEach(function (cat) {
      var label = labels[cat] || { zh: cat, en: cat };
      var a = document.createElement("a");
      a.href = "#cat-" + cat;
      a.textContent = label.zh + " " + label.en;
      nav.appendChild(a);
    });
  }

  /* ─── Daily Itinerary Guide ─── */

  function getTodayInSingapore() {
    // Get current date in Singapore timezone (UTC+8)
    var now = new Date();
    var sgOffset = 8 * 60; // Singapore is UTC+8
    var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    var sgDate = new Date(utcMs + (sgOffset * 60000));
    var year = sgDate.getFullYear();
    var month = String(sgDate.getMonth() + 1).padStart(2, "0");
    var day = String(sgDate.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function renderDailyGuide(itinerary) {
    var section = document.createElement("section");
    section.className = "daily-guide-section";
    section.id = "daily-guide";

    var heading = document.createElement("h2");
    heading.innerHTML = '📅 完整行程導覽 <span class="en">Full Itinerary</span>';
    section.appendChild(heading);

    if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
      var empty = document.createElement("p");
      empty.className = "category-empty";
      empty.textContent = "行程資料載入中 / Itinerary loading…";
      section.appendChild(empty);
      return section;
    }

    var today = getTodayInSingapore();
    var tripStart = itinerary.days[0].date;
    var tripEnd = itinerary.days[itinerary.days.length - 1].date;

    // Status banner
    var banner = document.createElement("div");
    banner.className = "daily-banner";

    if (today < tripStart) {
      var startDate = new Date(tripStart + "T00:00:00+08:00");
      var todayDate = new Date(today + "T00:00:00+08:00");
      var daysLeft = Math.ceil((startDate - todayDate) / (1000 * 60 * 60 * 24));
      banner.className += " banner-countdown";
      banner.innerHTML = '<div class="banner-icon">✈️</div>' +
        '<div class="banner-text">' +
        '<strong>距離出發還有 ' + daysLeft + ' 天！</strong>' +
        '<br><span class="banner-sub">旅程期間：' + tripStart + ' ~ ' + tripEnd + '</span>' +
        '</div>';
    } else if (today > tripEnd) {
      banner.className += " banner-ended";
      banner.innerHTML = '<div class="banner-icon">🏠</div>' +
        '<div class="banner-text">' +
        '<strong>旅程已結束，感謝美好回憶！</strong>' +
        '<br><span class="banner-sub">旅程期間：' + tripStart + ' ~ ' + tripEnd + '</span>' +
        '</div>';
    } else {
      banner.className += " banner-today";
      banner.innerHTML = '<div class="banner-icon">🌟</div>' +
        '<div class="banner-text">' +
        '<strong>旅途進行中！</strong>' +
        '<br><span class="banner-sub">今天：' + today + '</span>' +
        '</div>';
    }
    section.appendChild(banner);

    // Hotel info
    if (itinerary.hotels && itinerary.hotels.length > 0) {
      var hotelBox = document.createElement("div");
      hotelBox.className = "hotel-info-box";
      hotelBox.innerHTML = '<h3>🏨 住宿安排</h3>';
      var hotelList = document.createElement("div");
      hotelList.className = "hotel-list";
      itinerary.hotels.forEach(function(h) {
        hotelList.innerHTML += '<div class="hotel-item">' +
          '<strong>' + escapeHTML(h.name_zh) + '</strong> ' + escapeHTML(h.name_en) +
          '<br><span class="hotel-dates">📅 ' + escapeHTML(h.dates) + '</span>' +
          '<span class="hotel-area">📍 ' + escapeHTML(h.area) + '</span>' +
          '</div>';
      });
      hotelBox.appendChild(hotelList);
      section.appendChild(hotelBox);
    }

    // Transport summary
    if (itinerary.transport_summary) {
      var ts = itinerary.transport_summary;
      var transBox = document.createElement("div");
      transBox.className = "transport-summary-box";
      transBox.innerHTML = '<h3>🚇 交通方式</h3>' +
        '<p><strong>主要：</strong>' + escapeHTML(ts.primary) + ' ｜ <strong>輔助：</strong>' + escapeHTML(ts.secondary) + '</p>';
      if (ts.grab_scenarios && ts.grab_scenarios.length > 0) {
        transBox.innerHTML += '<p class="grab-note">🚗 建議搭 Grab：' +
          ts.grab_scenarios.map(function(s) { return escapeHTML(s); }).join('、') + '</p>';
      }
      if (ts.note) {
        transBox.innerHTML += '<p class="transport-note">💡 ' + escapeHTML(ts.note) + '</p>';
      }
      section.appendChild(transBox);
    }

    // Render ALL days
    itinerary.days.forEach(function (dayData) {
      var dayBlock = document.createElement("div");
      dayBlock.className = "day-block";
      dayBlock.id = "day-" + dayData.day_number;

      // Highlight today
      if (dayData.date === today) {
        dayBlock.className += " day-block-today";
      }

      var dayHeader = document.createElement("h3");
      dayHeader.className = "day-header";
      dayHeader.innerHTML = '<span class="day-num">Day ' + dayData.day_number + '</span>' +
        '<span class="day-date">' + escapeHTML(dayData.date) + '</span>' +
        '<span class="day-theme">' + escapeHTML(dayData.theme) + '</span>';
      if (dayData.date === today) {
        dayHeader.innerHTML += '<span class="today-badge">📍 TODAY</span>';
      }
      dayBlock.appendChild(dayHeader);

      // Schedule timeline
      dayBlock.appendChild(renderScheduleList(dayData));

      // Highlights
      if (dayData.highlights) {
        dayBlock.appendChild(renderHighlights(dayData.highlights));
      }

      // Express pass warnings
      if (dayData.express_pass_warnings) {
        dayBlock.appendChild(renderExpressWarnings(dayData.express_pass_warnings));
      }

      section.appendChild(dayBlock);
    });

    return section;
  }

  function renderScheduleList(dayData) {
    var container = document.createElement("div");
    container.className = "schedule-timeline";

    if (!dayData.schedule || dayData.schedule.length === 0) return container;

    dayData.schedule.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "timeline-item";
      if (item.conditional) {
        row.className += " timeline-conditional";
      }

      var time = document.createElement("span");
      time.className = "timeline-time";
      time.textContent = item.time || "";

      var content = document.createElement("div");
      content.className = "timeline-content";

      var activity = document.createElement("strong");
      activity.textContent = item.activity || "";
      content.appendChild(activity);

      if (item.note) {
        var note = document.createElement("span");
        note.className = "timeline-note";
        note.textContent = item.note;
        content.appendChild(note);
      }

      // Show dining recommendations
      if (item.dining && item.dining.length > 0) {
        var dining = document.createElement("div");
        dining.className = "timeline-tags";
        dining.innerHTML = '🍽️ ' + item.dining.map(function(d) {
          return '<span class="tag tag-food">' + escapeHTML(d) + '</span>';
        }).join("");
        content.appendChild(dining);
      }

      row.appendChild(time);
      row.appendChild(content);
      container.appendChild(row);
    });

    return container;
  }

  function renderHighlights(highlights) {
    var box = document.createElement("div");
    box.className = "highlights-box";

    if (highlights.food && highlights.food.length > 0) {
      box.innerHTML += '<div class="highlight-row"><span class="highlight-label">🍜 美食推薦</span>' +
        highlights.food.map(function(f) { return '<span class="tag tag-food">' + escapeHTML(f) + '</span>'; }).join("") +
        '</div>';
    }
    if (highlights.shopping && highlights.shopping.length > 0) {
      box.innerHTML += '<div class="highlight-row"><span class="highlight-label">🛍️ 購物推薦</span>' +
        highlights.shopping.map(function(s) { return '<span class="tag tag-shop">' + escapeHTML(s) + '</span>'; }).join("") +
        '</div>';
    }
    if (highlights.reminders && highlights.reminders.length > 0) {
      box.innerHTML += '<div class="highlight-row reminders"><span class="highlight-label">⚠️ 提醒事項</span>' +
        '<ul>' + highlights.reminders.map(function(r) { return '<li>' + escapeHTML(r) + '</li>'; }).join("") + '</ul>' +
        '</div>';
    }

    return box;
  }

  function renderExpressWarnings(warnings) {
    var box = document.createElement("div");
    box.className = "express-warnings";
    box.innerHTML = '<h4>⚠️ 快速通關不含但必玩</h4>';

    var list = document.createElement("ul");
    warnings.forEach(function(w) {
      var li = document.createElement("li");
      li.innerHTML = '<strong>' + escapeHTML(w.item) + '</strong> — ' +
        escapeHTML(w.reason) + '<br><em>💡 ' + escapeHTML(w.tip) + '</em>';
      list.appendChild(li);
    });
    box.appendChild(list);
    return box;
  }

  /* ─── Pre-trip Preparation ─── */

  function renderPreparation(prepData) {
    var section = document.createElement("section");
    section.className = "preparation-section";
    section.id = "preparation";

    var heading = document.createElement("h2");
    heading.innerHTML = '✅ 行前準備及注意事項 <span class="en">Pre-trip Checklist</span>';
    section.appendChild(heading);

    if (!prepData || !prepData.sections || prepData.sections.length === 0) {
      var empty = document.createElement("p");
      empty.className = "category-empty";
      empty.textContent = "資料收集中 / Collecting data…";
      section.appendChild(empty);
      return section;
    }

    var grid = document.createElement("div");
    grid.className = "prep-grid";

    prepData.sections.forEach(function (sec) {
      var card = document.createElement("div");
      card.className = "prep-card";

      var cardTitle = document.createElement("h3");
      cardTitle.textContent = (sec.icon || "") + " " + (sec.title || "");
      card.appendChild(cardTitle);

      var list = document.createElement("ul");
      list.className = "prep-list";

      sec.items.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "prep-item priority-" + getPriorityClass(item.priority);

        var badge = document.createElement("span");
        badge.className = "priority-badge";
        badge.textContent = item.priority || "";
        li.appendChild(badge);

        var text = document.createElement("span");
        text.className = "prep-text";
        text.textContent = item.text || "";
        li.appendChild(text);

        list.appendChild(li);
      });

      card.appendChild(list);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case "必備": return "essential";
      case "建議": return "recommended";
      case "選配": return "optional";
      case "注意": return "warning";
      case "資訊": return "info";
      default: return "default";
    }
  }

  /* ─── Category Cards (original) ─── */

  function cardHTML(item) {
    var title = escapeHTML(item.zh_name) || escapeHTML(item.en_name) || "未命名項目";
    var enName = item.en_name ? '<span class="en-name">' + escapeHTML(item.en_name) + "</span>" : "";
    var desc = item.zh_desc ? "<p>" + escapeHTML(item.zh_desc) + "</p>" : "";

    var addressLine = "";
    if (item.address) {
      addressLine =
        '<p><span class="field-label">地址 / Address: </span>' + escapeHTML(item.address) + "</p>";
    }

    var areaLine = "";
    if (item.area) {
      areaLine = '<p><span class="field-label">區域 / Area: </span>' + escapeHTML(item.area) + "</p>";
    }

    var priceLine = "";
    if (item.price_zh) {
      priceLine = '<p><span class="field-label">價格 / Price: </span>' + escapeHTML(item.price_zh) + "</p>";
    }

    var mapLink = "";
    if (item.map_link) {
      mapLink =
        '<a class="map-link" href="' +
        escapeHTML(item.map_link) +
        '" target="_blank" rel="noopener noreferrer">📍 地圖 / Map</a>';
    }

    var tagsHTML = "";
    if (Array.isArray(item.tags) && item.tags.length > 0) {
      tagsHTML =
        '<div class="tags">' +
        item.tags
          .map(function (t) {
            return '<span class="tag">' + escapeHTML(t) + "</span>";
          })
          .join("") +
        "</div>";
    }

    return (
      '<article class="card">' +
      "<h3>" + title + enName + "</h3>" +
      desc +
      addressLine +
      areaLine +
      priceLine +
      mapLink +
      tagsHTML +
      "</article>"
    );
  }

  function renderCategorySection(cat, label, dataOrNull, failed) {
    var section = document.createElement("section");
    section.className = "category-section";
    section.id = "cat-" + cat;

    var heading = document.createElement("h2");
    heading.innerHTML = escapeHTML(label.zh) + '<span class="en">' + escapeHTML(label.en) + "</span>";
    section.appendChild(heading);

    if (failed) {
      var errNote = document.createElement("p");
      errNote.className = "category-empty";
      errNote.textContent = "資料收集中 (載入失敗) / Collecting data (load failed)";
      section.appendChild(errNote);
      return section;
    }

    var items = (dataOrNull && Array.isArray(dataOrNull.items)) ? dataOrNull.items : [];

    if (items.length === 0) {
      var emptyNote = document.createElement("p");
      emptyNote.className = "category-empty";
      emptyNote.textContent = "資料收集中 / Collecting data…";
      section.appendChild(emptyNote);
      return section;
    }

    var grid = document.createElement("div");
    grid.className = "card-grid";
    grid.innerHTML = items.map(cardHTML).join("");
    section.appendChild(grid);

    return section;
  }

  /* ─── Main ─── */

  function main() {
    var content = document.getElementById("content");

    var metaPromise = fetchJSON("data/meta.json").catch(function (err) {
      console.error("meta.json load failed:", err);
      return null;
    });

    var itineraryPromise = fetchJSON("data/itinerary.json").catch(function (err) {
      console.error("itinerary.json load failed:", err);
      return null;
    });

    var preparationPromise = fetchJSON("data/preparation.json").catch(function (err) {
      console.error("preparation.json load failed:", err);
      return null;
    });

    var categoryPromises = CATEGORIES.map(function (cat) {
      return fetchJSON("data/" + cat + ".json");
    });

    Promise.allSettled(
      [metaPromise, itineraryPromise, preparationPromise].concat(categoryPromises)
    ).then(function (results) {
      var meta = results[0].status === "fulfilled" ? results[0].value : null;
      var itinerary = results[1].status === "fulfilled" ? results[1].value : null;
      var prepData = results[2].status === "fulfilled" ? results[2].value : null;

      renderHeader(meta);
      renderNav(meta);

      content.innerHTML = "";

      // 1. Pre-trip preparation (top — most useful before departure)
      content.appendChild(renderPreparation(prepData));

      // 2. Daily itinerary guide
      content.appendChild(renderDailyGuide(itinerary));

      // 3. Category sections
      var labels = (meta && meta.category_labels) || {};
      var cats = (meta && meta.categories) || CATEGORIES;

      cats.forEach(function (cat, idx) {
        var result = results[idx + 3]; // offset by 3 (meta, itinerary, preparation)
        var label = labels[cat] || { zh: cat, en: cat };
        var failed = !result || result.status !== "fulfilled";
        var data = failed ? null : result.value;
        content.appendChild(renderCategorySection(cat, label, data, failed));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();

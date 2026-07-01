/**
 * Singapore 2026 travel guide — vanilla JS, zero dependencies.
 * Fetches meta.json + per-category JSON, renders bilingual cards.
 * One broken/empty category file never blocks the others (Promise.allSettled).
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

    cats.forEach(function (cat) {
      var label = labels[cat] || { zh: cat, en: cat };
      var a = document.createElement("a");
      a.href = "#cat-" + cat;
      a.textContent = label.zh + " " + label.en;
      nav.appendChild(a);
    });
  }

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

  function main() {
    var content = document.getElementById("content");

    var metaPromise = fetchJSON("data/meta.json").catch(function (err) {
      console.error("meta.json load failed:", err);
      return null;
    });

    var categoryPromises = CATEGORIES.map(function (cat) {
      return fetchJSON("data/" + cat + ".json");
    });

    Promise.allSettled([metaPromise].concat(categoryPromises)).then(function (results) {
      var metaResult = results[0];
      var meta = metaResult.status === "fulfilled" ? metaResult.value : null;

      renderHeader(meta);
      renderNav(meta);

      content.innerHTML = "";

      var labels = (meta && meta.category_labels) || {};
      var cats = (meta && meta.categories) || CATEGORIES;

      cats.forEach(function (cat, idx) {
        var result = results[idx + 1];
        var label = labels[cat] || { zh: cat, en: cat };
        var failed = !result || result.status !== "fulfilled";
        var data = failed ? null : result.value;
        content.appendChild(renderCategorySection(cat, label, data, failed));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", main);
})();

(function () {
  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function ensureId(el, used) {
    if (el.id) {
      used.add(el.id);
      return el.id;
    }

    var base = slugify(el.textContent || "section") || "section";
    var id = base;
    var counter = 2;

    while (used.has(id) || document.getElementById(id)) {
      id = base + "-" + counter;
      counter += 1;
    }

    el.id = id;
    used.add(id);
    return id;
  }

  function createEntry(label, id, level) {
    return { label: label, id: id, level: level || 2 };
  }

  function buildEntries(main) {
    var usedIds = new Set();
    var entries = [];

    var introPanel = main.querySelector(".intro-panel");
    if (introPanel) {
      var introHeading = introPanel.querySelector("h1");
      if (introHeading) {
        entries.push(createEntry("Introduction", ensureId(introHeading, usedIds), 2));
      }
    }

    var frameworkOverview = main.querySelector("#top-pentagon");
    if (frameworkOverview) {
      var frameworkHeading = main.querySelector(".framework-intro h1, h1");
      if (frameworkHeading) {
        entries.push(createEntry("Framework overview", ensureId(frameworkHeading, usedIds), 2));
      }
    }

    var h2s = Array.prototype.slice.call(main.querySelectorAll("h2"));
    h2s.forEach(function (h2) {
      if (h2.closest(".on-this-page")) return;
      if (introPanel && h2.closest(".intro-panel")) return;

      var label = (h2.textContent || "").trim();
      if (!label) return;

      var id = ensureId(h2, usedIds);
      entries.push(createEntry(label, id, 2));
    });

    var includeH3 = !main.querySelector(".accordion-item") && !frameworkOverview;
    if (includeH3) {
      var h3s = Array.prototype.slice.call(main.querySelectorAll("h3"));
      h3s.forEach(function (h3) {
        if (h3.closest(".on-this-page")) return;
        if (h3.closest("details")) return;

        var label = (h3.textContent || "").trim();
        if (!label || label === "Competences") return;

        var id = ensureId(h3, usedIds);
        entries.push(createEntry(label, id, 3));
      });
    }

    var outsideResourcesHeading = document.querySelector("section.resources-panel h2");
    if (outsideResourcesHeading && !main.contains(outsideResourcesHeading)) {
      entries.push(createEntry((outsideResourcesHeading.textContent || "").trim(), ensureId(outsideResourcesHeading, usedIds), 2));
    }

    var unique = [];
    var seen = new Set();
    entries.forEach(function (entry) {
      if (!entry.label || !entry.id || seen.has(entry.id)) return;
      seen.add(entry.id);
      unique.push(entry);
    });

    return unique;
  }

  function createNav(entries) {
    var details = document.createElement("details");
    details.className = "on-this-page";
    details.open = true;

    var summary = document.createElement("summary");
    summary.textContent = "On this page";
    details.appendChild(summary);

    var nav = document.createElement("nav");
    nav.className = "on-this-page-nav";
    nav.setAttribute("aria-label", "On this page navigation");

    var ul = document.createElement("ul");

    entries.forEach(function (entry) {
      var li = document.createElement("li");
      li.className = entry.level === 3 ? "is-subheading" : "";

      var a = document.createElement("a");
      a.href = "#" + entry.id;
      a.textContent = entry.label;
      a.setAttribute("data-target-id", entry.id);

      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    details.appendChild(nav);

    return details;
  }

  function wrapContent(main, sideNav) {
    var host = main.querySelector(":scope > .container.page-layout") || main.querySelector(":scope > .container") || main;
    if (!host) return null;

    var contentNode = host.querySelector(":scope > .page-body");
    var layout = document.createElement("div");
    layout.className = "otp-layout";

    var contentWrapper = document.createElement("div");
    contentWrapper.className = "otp-content";

    if (contentNode) {
      contentNode.parentNode.insertBefore(layout, contentNode);
      layout.appendChild(sideNav);
      layout.appendChild(contentWrapper);
      contentWrapper.appendChild(contentNode);
      return layout;
    }

    var children = Array.prototype.slice.call(host.childNodes);
    layout.appendChild(sideNav);
    layout.appendChild(contentWrapper);

    children.forEach(function (node) {
      contentWrapper.appendChild(node);
    });

    host.appendChild(layout);

    if (host === main) {
      layout.classList.add("otp-layout-root");
    }

    return layout;
  }

  function setupActiveState(navRoot, entries) {
    var links = Array.prototype.slice.call(navRoot.querySelectorAll("a[data-target-id]"));
    var byId = new Map();

    links.forEach(function (link) {
      byId.set(link.getAttribute("data-target-id"), link);
    });

    function setActive(id) {
      links.forEach(function (link) {
        var isActive = link.getAttribute("data-target-id") === id;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var headingElements = entries
      .map(function (entry) {
        return document.getElementById(entry.id);
      })
      .filter(Boolean);

    if (headingElements.length === 0) return;

    var observer = new IntersectionObserver(
      function (observed) {
        var visible = observed
          .filter(function (item) {
            return item.isIntersecting;
          })
          .sort(function (a, b) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });

        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 1]
      }
    );

    headingElements.forEach(function (heading) {
      observer.observe(heading);
    });

    setActive(headingElements[0].id);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main#main-content, main");
    if (!main) return;

    var entries = buildEntries(main);
    if (entries.length < 1) return;

    var nav = createNav(entries);
    var layout = wrapContent(main, nav);
    if (!layout) return;

    setupActiveState(nav, entries);
  });
})();

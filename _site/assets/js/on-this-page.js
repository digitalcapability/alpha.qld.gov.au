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

  function pruneLegacyNavigation(main) {
    var legacyNavBlocks = Array.prototype.slice.call(main.querySelectorAll(".intro-nav"));

    legacyNavBlocks.forEach(function (block) {
      block.remove();
    });
  }

  function findLayoutHost(main) {
    var pageLayout = main.querySelector(":scope > .container.page-layout");
    if (pageLayout) return pageLayout;

    var directChildren = Array.prototype.slice.call(main.children).filter(function (child) {
      return child.tagName !== "SCRIPT";
    });

    if (directChildren.length === 1 && directChildren[0].classList.contains("container")) {
      return directChildren[0];
    }

    return main;
  }

  function findSidebarResources(contentNode) {
    if (!contentNode) return null;

    var headingOrder = [
      "policies and guidance",
      "official framework sources",
      "continue developing your capability"
    ];

    var sections = Array.prototype.slice.call(contentNode.querySelectorAll(":scope > section.framework-section"));

    return (
      sections.find(function (section) {
        var cards = Array.prototype.slice.call(section.querySelectorAll(":scope > .card-grid > .resource-card"));
        if (cards.length !== 3) return false;

        var headings = cards.map(function (card) {
          var heading = card.querySelector("h2");
          return heading ? (heading.textContent || "").trim().toLowerCase() : "";
        });

        return headingOrder.every(function (label, index) {
          return headings[index] === label;
        });
      }) || null
    );
  }

  function wrapContent(main, sideNav) {
    var host = findLayoutHost(main);
    if (!host) return null;

    var contentNode = host.querySelector(":scope > .page-body");
    var layout = document.createElement("div");
    layout.className = "otp-layout";

    var sidebar = document.createElement("aside");
    sidebar.className = "otp-sidebar";
    sidebar.setAttribute("aria-label", "Page navigation and resources");
    sidebar.appendChild(sideNav);

    var contentWrapper = document.createElement("div");
    contentWrapper.className = "otp-content";

    if (contentNode) {
      var resourcesSection = findSidebarResources(contentNode);
      if (resourcesSection) {
        resourcesSection.remove();
        sidebar.appendChild(resourcesSection);
      }

      contentNode.parentNode.insertBefore(layout, contentNode);
      layout.appendChild(sidebar);
      layout.appendChild(contentWrapper);
      contentWrapper.appendChild(contentNode);
      return layout;
    }

    var children = Array.prototype.slice.call(host.childNodes);
    layout.appendChild(sidebar);
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

  function setupDisclosureState(navRoot) {
    var desktopMedia = window.matchMedia("(min-width: 861px)");

    function syncState() {
      if (desktopMedia.matches) {
        navRoot.open = true;
      }
    }

    navRoot.addEventListener("toggle", function () {
      if (desktopMedia.matches && !navRoot.open) {
        navRoot.open = true;
      }
    });

    syncState();

    if (typeof desktopMedia.addEventListener === "function") {
      desktopMedia.addEventListener("change", syncState);
      return;
    }

    desktopMedia.addListener(syncState);
  }

  function openTargetDetails(id) {
    if (!id) return;

    var target = document.getElementById(id);
    if (!target) return;

    var parentDetails = target.closest("details");
    if (parentDetails) {
      parentDetails.open = true;
    }
  }

  function setupActiveState(navRoot, entries) {
    var links = Array.prototype.slice.call(navRoot.querySelectorAll("a[data-target-id]"));

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

  function setupNavigationBehaviour(navRoot) {
    navRoot.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-target-id]");
      if (!link) return;

      openTargetDetails(link.getAttribute("data-target-id"));
    });

    if (window.location.hash) {
      openTargetDetails(window.location.hash.slice(1));
    }

    window.addEventListener("hashchange", function () {
      openTargetDetails(window.location.hash.slice(1));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main#main-content, main");
    if (!main) return;

    pruneLegacyNavigation(main);

    var entries = buildEntries(main);
    if (entries.length < 1) return;

    var nav = createNav(entries);
    var layout = wrapContent(main, nav);
    if (!layout) return;

    setupDisclosureState(nav);
    setupNavigationBehaviour(nav);
    setupActiveState(nav, entries);
  });
})();

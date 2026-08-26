(function () {
  var SITE_SEARCH_INDEX = [
    {
      title: 'Home',
      url: '/',
      description: 'Overview of the Queensland Government Digital Capability Hub, DigComp 3.0 and the proof of concept.',
      keywords: 'digital capability hub digcomp proof of concept home'
    },
    {
      title: 'Explore the framework',
      url: '/framework/',
      description: 'DigComp 3.0 overview, capability areas and the Queensland digital capability approach.',
      keywords: 'framework digcomp capability areas overview'
    },
    {
      title: '1. Information search, evaluation and management',
      url: '/framework/area-1/',
      description: 'Find, assess, organise and manage digital information.',
      keywords: 'information search evaluation management'
    },
    {
      title: '2. Communication and collaboration',
      url: '/framework/area-2/',
      description: 'Work with others online and communicate effectively in digital environments.',
      keywords: 'communication collaboration teamwork'
    },
    {
      title: '3. Content creation',
      url: '/framework/area-3/',
      description: 'Create and adapt digital content for Queensland Government work.',
      keywords: 'content creation digital content'
    },
    {
      title: '4. Safety, wellbeing and responsible use',
      url: '/framework/area-4/',
      description: 'Use digital tools safely, responsibly and with care for wellbeing.',
      keywords: 'safety wellbeing responsible use cybersecurity'
    },
    {
      title: '5. Problem identification and solving',
      url: '/framework/area-5/',
      description: 'Identify digital problems and choose practical ways to solve them.',
      keywords: 'problem solving digital solutions'
    },
    {
      title: 'Assess your capability',
      url: '/assessment/',
      description: 'Reflect on your current strengths and development needs against DigComp 3.0.',
      keywords: 'assessment self assessment capability development'
    },
    {
      title: 'Learning and resources',
      url: '/resources/',
      description: 'Guidance, learning pathways and practical resources to support capability uplift.',
      keywords: 'resources guidance learning pathways'
    },
    {
      title: 'About',
      url: '/about/',
      description: 'Background on the Digital Capability Hub and the Queensland approach.',
      keywords: 'about background'
    },
    {
      title: 'Contact',
      url: '/contact/',
      description: 'Get in touch with the Digital Capability Team.',
      keywords: 'contact email team'
    }
  ];

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function normalizeSearchText(text) {
    return (text || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreSearchResult(entry, query) {
    var normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return 0;

    var queryTokens = normalizedQuery.split(" ");
    var title = normalizeSearchText(entry.title);
    var description = normalizeSearchText(entry.description);
    var keywords = normalizeSearchText(entry.keywords);
    var haystack = title + " " + description + " " + keywords;
    var score = 0;

    if (title === normalizedQuery) {
      score += 200;
    } else if (title.indexOf(normalizedQuery) !== -1) {
      score += 120;
    }

    if (haystack.indexOf(normalizedQuery) !== -1) {
      score += 80;
    }

    queryTokens.forEach(function (token) {
      if (!token) return;

      if (title.indexOf(token) === 0) {
        score += 25;
      } else if (title.indexOf(token) !== -1) {
        score += 15;
      }

      if (description.indexOf(token) !== -1) {
        score += 6;
      }

      if (keywords.indexOf(token) !== -1) {
        score += 10;
      }
    });

    return score;
  }

  function buildSearchResults(query) {
    return SITE_SEARCH_INDEX
      .map(function (entry) {
        return {
          entry: entry,
          score: scoreSearchResult(entry, query)
        };
      })
      .filter(function (result) {
        return result.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 6)
      .map(function (result) {
        return result.entry;
      });
  }

  function createSearchWidget() {
    var search = document.createElement("div");
    search.className = "header-search";

    var label = document.createElement("label");
    label.className = "visually-hidden";
    label.setAttribute("for", "site-search");
    label.textContent = "Search Digital Capability Hub";

    var input = document.createElement("input");
    input.id = "site-search";
    input.type = "search";
    input.placeholder = "Search framework, resources and guidance";
    input.autocomplete = "off";
    input.setAttribute("aria-controls", "search-results");
    input.setAttribute("aria-expanded", "false");

    var results = document.createElement("div");
    results.id = "search-results";
    results.className = "search-results";
    results.hidden = true;
    results.setAttribute("role", "listbox");
    results.setAttribute("aria-label", "Search results");

    search.appendChild(label);
    search.appendChild(input);
    search.appendChild(results);

    return search;
  }

  function renderSearchResults(resultsContainer, input, query) {
    var matches = buildSearchResults(query);
    resultsContainer.innerHTML = "";

    if (!query || matches.length === 0) {
      resultsContainer.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return;
    }

    matches.forEach(function (entry) {
      var item = document.createElement("a");
      item.className = "search-result";
      item.href = entry.url;
      item.setAttribute("role", "option");

      var title = document.createElement("span");
      title.className = "search-result-title";
      title.textContent = entry.title;

      var description = document.createElement("span");
      description.className = "search-result-description";
      description.textContent = entry.description;

      item.appendChild(title);
      item.appendChild(description);
      resultsContainer.appendChild(item);
    });

    resultsContainer.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function setupHeaderSearch() {
    var header = document.querySelector(".qg-header, .site-header");
    if (!header) return;

    var headerContent = header.querySelector(".header-content, .header-container");
    if (!headerContent || headerContent.querySelector(".header-search")) return;

    var searchWidget = createSearchWidget();
    var siteTitle = headerContent.querySelector(".site-title, .header-title");

    if (siteTitle) {
      headerContent.insertBefore(searchWidget, siteTitle);
    } else {
      headerContent.appendChild(searchWidget);
    }

    var input = searchWidget.querySelector("#site-search");
    var resultsContainer = searchWidget.querySelector("#search-results");
    var closeTimer = null;

    function closeResults() {
      resultsContainer.hidden = true;
      resultsContainer.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
    }

    function scheduleClose() {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(closeResults, 120);
    }

    input.addEventListener("input", function () {
      renderSearchResults(resultsContainer, input, input.value);
    });

    input.addEventListener("focus", function () {
      renderSearchResults(resultsContainer, input, input.value);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        input.value = "";
        closeResults();
        return;
      }

      if (event.key === "Enter") {
        var firstResult = resultsContainer.querySelector(".search-result");
        if (firstResult) {
          window.location.href = firstResult.href;
        }
      }
    });

    searchWidget.addEventListener("mouseenter", function () {
      window.clearTimeout(closeTimer);
    });

    searchWidget.addEventListener("mouseleave", scheduleClose);

    document.addEventListener("click", function (event) {
      if (!searchWidget.contains(event.target)) {
        closeResults();
      }
    });
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
      if (h2.closest(".resource-card")) return;

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

  function wrapContent(main, sideNav) {
    var host = findLayoutHost(main);
    if (!host) return null;

    var existingLayout = host.querySelector(":scope > .otp-layout");
    if (existingLayout) {
      var existingSidebar = existingLayout.querySelector(":scope > .otp-sidebar");
      if (existingSidebar) {
        existingSidebar.insertBefore(sideNav, existingSidebar.firstChild);
        return existingLayout;
      }
    }

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

  function moveResourcesPanelIntoContent(layout) {
    if (!layout) return;

    var sidebarHasCards = layout.querySelector(".otp-sidebar .resource-card");
    if (!sidebarHasCards) return;

    var panel = document.querySelector("section.resources-panel");
    if (!panel || layout.contains(panel)) return;

    var contentColumn = layout.querySelector(":scope > .otp-content");
    if (!contentColumn) return;

    contentColumn.appendChild(panel);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupHeaderSearch();

    var main = document.querySelector("main#main-content, main");
    if (!main) return;

    pruneLegacyNavigation(main);

    var entries = buildEntries(main);
    if (entries.length < 1) return;

    var nav = createNav(entries);
    var layout = wrapContent(main, nav);
    if (!layout) return;

    moveResourcesPanelIntoContent(layout);

    setupDisclosureState(nav);
    setupNavigationBehaviour(nav);
    setupActiveState(nav, entries);
  });
})();

(function () {
  "use strict";

  var input = document.getElementById("workplace-search");
  var results = document.getElementById("workplace-results");
  if (!input || !results) return;

  var cards = Array.prototype.slice.call(results.querySelectorAll(".workplace-question-card"));
  var suggestionList = document.getElementById("workplace-suggestions");
  var resultCount = document.getElementById("workplace-result-count");
  var noResults = document.getElementById("workplace-no-results");
  var fallbackResults = document.getElementById("workplace-fallback-results");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-chip, .workplace-topic-card"));
  var activeFilter = "all";
  var activeSuggestion = -1;
  var displayedSuggestions = [];

  function normalise(value) {
    return value.toLocaleLowerCase("en-AU")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function words(value) {
    return normalise(value).split(" ").filter(Boolean).map(function (word) {
      if (word.length > 4 && word.slice(-3) === "ies") return word.slice(0, -3) + "y";
      if (word.length > 4 && word.slice(-1) === "s") return word.slice(0, -1);
      return word;
    });
  }

  function editDistance(left, right) {
    var previous = [];
    for (var j = 0; j <= right.length; j += 1) previous[j] = j;
    for (var i = 1; i <= left.length; i += 1) {
      var current = [i];
      for (var k = 1; k <= right.length; k += 1) {
        current[k] = Math.min(
          current[k - 1] + 1,
          previous[k] + 1,
          previous[k - 1] + (left.charAt(i - 1) === right.charAt(k - 1) ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[right.length];
  }

  function similarity(left, right) {
    if (left === right) return 1;
    if (left.length >= 3 && right.indexOf(left) === 0) return 0.88;
    if (right.length >= 3 && left.indexOf(right) === 0) return 0.82;
    if (Math.min(left.length, right.length) < 4) return 0;
    return 1 - editDistance(left, right) / Math.max(left.length, right.length);
  }

  function getFields(card) {
    return [
      { value: card.dataset.title, weight: 120 },
      { value: card.dataset.keywords, weight: 105 },
      { value: card.dataset.synonyms, weight: 95 },
      { value: card.dataset.related, weight: 85 },
      { value: card.dataset.resources, weight: 70 },
      { value: card.dataset.pathways, weight: 65 },
      { value: card.dataset.summary, weight: 75 },
      { value: card.dataset.topicLabel, weight: 60 }
    ].map(function (field) {
      return {
        weight: field.weight,
        phrase: normalise(field.value),
        words: words(field.value)
      };
    });
  }

  var indexedCards = cards.map(function (card) {
    return { card: card, fields: getFields(card) };
  });

  function scoreCard(item, query) {
    var phrase = normalise(query);
    if (!phrase) return item.card.dataset.popular === "true" ? 8 : 1;

    var title = normalise(item.card.dataset.title);
    var keywords = normalise(item.card.dataset.keywords);
    var related = normalise(item.card.dataset.related);
    var summary = normalise(item.card.dataset.summary);
    var score = 0;

    if (title === phrase) score += 600;
    else if (title.indexOf(phrase) === 0) score += 460;
    else if (title.indexOf(phrase) !== -1) score += 380;
    if (keywords.indexOf(phrase) !== -1) score += 330;
    if (related.indexOf(phrase) !== -1) score += 230;
    if (summary.indexOf(phrase) !== -1) score += 180;

    var queryWords = words(phrase);
    var matchedWords = 0;
    queryWords.forEach(function (queryWord) {
      var best = 0;
      item.fields.forEach(function (field) {
        field.words.forEach(function (fieldWord) {
          var match = similarity(queryWord, fieldWord);
          if (match >= 0.6) best = Math.max(best, field.weight * match);
        });
      });
      if (best > 0) {
        matchedWords += 1;
        score += best;
      }
    });

    if (matchedWords === queryWords.length && queryWords.length > 1) score += 90;
    if (item.card.dataset.popular === "true") score += 8;
    return score;
  }

  function isInActiveFilter(card) {
    return activeFilter === "all" || card.dataset.topic === activeFilter;
  }

  function rankedCards(query, respectFilter) {
    return indexedCards.map(function (item) {
      return { item: item, score: scoreCard(item, query) };
    }).filter(function (entry) {
      return (!respectFilter || isInActiveFilter(entry.item.card)) && entry.score > 0;
    }).sort(function (left, right) {
      return right.score - left.score ||
        left.item.card.dataset.title.localeCompare(right.item.card.dataset.title, "en-AU");
    });
  }

  function closeSuggestions() {
    suggestionList.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeSuggestion = -1;
  }

  function updateActiveSuggestion(nextIndex) {
    if (!displayedSuggestions.length) return;
    activeSuggestion = (nextIndex + displayedSuggestions.length) % displayedSuggestions.length;
    var options = suggestionList.querySelectorAll('[role="option"]');
    Array.prototype.forEach.call(options, function (option, index) {
      var selected = index === activeSuggestion;
      option.setAttribute("aria-selected", String(selected));
      if (selected) {
        input.setAttribute("aria-activedescendant", option.id);
        option.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function renderSuggestions(ranked) {
    suggestionList.replaceChildren();
    displayedSuggestions = ranked.slice(0, 5).map(function (entry) {
      return entry.item.card;
    });
    activeSuggestion = -1;
    if (!normalise(input.value) || !displayedSuggestions.length) {
      closeSuggestions();
      return;
    }

    displayedSuggestions.forEach(function (card, index) {
      var link = card.querySelector("h3 a").cloneNode(true);
      link.id = "workplace-suggestion-" + index;
      link.className = "workplace-suggestion";
      link.setAttribute("role", "option");
      link.setAttribute("aria-selected", "false");
      var detail = document.createElement("span");
      detail.className = "workplace-suggestion-topic";
      detail.textContent = card.dataset.topicLabel;
      link.appendChild(detail);
      link.addEventListener("mouseenter", function () {
        updateActiveSuggestion(index);
      });
      suggestionList.appendChild(link);
    });
    suggestionList.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function renderFallback(query) {
    fallbackResults.replaceChildren();
    var closest = rankedCards(query, false).slice(0, 3);
    closest.forEach(function (entry) {
      fallbackResults.appendChild(entry.item.card);
    });
    if (!closest.length) {
      indexedCards.filter(function (item) {
        return item.card.dataset.popular === "true";
      }).slice(0, 3).forEach(function (item) {
        fallbackResults.appendChild(item.card);
      });
    }
  }

  function updateResults() {
    var query = input.value;
    var ranked = rankedCards(query, true);
    var exactMatches = ranked.filter(function (entry) {
      return !normalise(query) || scoreCard(entry.item, query) > 50;
    });
    results.replaceChildren();
    fallbackResults.replaceChildren();

    if (exactMatches.length) {
      exactMatches.forEach(function (entry) {
        results.appendChild(entry.item.card);
      });
      noResults.hidden = true;
      resultCount.textContent = exactMatches.length + (exactMatches.length === 1 ? " question" : " questions");
    } else {
      noResults.hidden = false;
      resultCount.textContent = "No exact matches.";
      renderFallback(query);
    }
    renderSuggestions(ranked);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-chip").forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip.dataset.filter === activeFilter));
      });
      document.querySelectorAll(".workplace-topic-card").forEach(function (topic) {
        topic.setAttribute("aria-pressed", String(topic.dataset.filter === activeFilter));
      });
      updateResults();
      document.getElementById("results-heading").scrollIntoView({ block: "start" });
    });
  });

  input.addEventListener("input", updateResults);
  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown" && !suggestionList.hidden) {
      event.preventDefault();
      updateActiveSuggestion(activeSuggestion + 1);
    } else if (event.key === "ArrowUp" && !suggestionList.hidden) {
      event.preventDefault();
      updateActiveSuggestion(activeSuggestion < 0 ? displayedSuggestions.length - 1 : activeSuggestion - 1);
    } else if (event.key === "Enter" && activeSuggestion >= 0 && displayedSuggestions[activeSuggestion]) {
      event.preventDefault();
      window.location.href = displayedSuggestions[activeSuggestion].querySelector("h3 a").href;
    } else if (event.key === "Escape") {
      closeSuggestions();
    }
  });

  document.addEventListener("pointerdown", function (event) {
    if (!event.target.closest(".workplace-search-wrap")) closeSuggestions();
  });

  updateResults();
}());

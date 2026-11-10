(function () {
  "use strict";

  var BASE_DOMAIN = "dreamteamhub.ca";

  function projectUrl(project) {
    if (project.url) return project.url;
    return "https://" + project.subdomain + "." + BASE_DOMAIN;
  }

  function createCard(project) {
    var card = document.createElement("a");
    card.className = "card";
    card.href = projectUrl(project);
    card.setAttribute("aria-label", project.title + " ~ " + project.description);

    var media = document.createElement("div");
    media.className = "card__media";

    if (project.image) {
      var img = document.createElement("img");
      img.src = project.image;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", function () {
        img.remove();
      });
      media.appendChild(img);
    }

    var overlay = document.createElement("div");
    overlay.className = "card__overlay";
    var desc = document.createElement("p");
    desc.className = "card__description";
    desc.textContent = project.description;
    overlay.appendChild(desc);
    media.appendChild(overlay);

    var title = document.createElement("h2");
    title.className = "card__title";
    title.textContent = project.title;

    card.appendChild(media);
    card.appendChild(title);
    return card;
  }

  function createComingSoonCard() {
    var card = document.createElement("div");
    card.className = "card card--soon";

    var media = document.createElement("div");
    media.className = "card__media";
    media.textContent = "More coming soon";

    var title = document.createElement("h2");
    title.className = "card__title";
    title.textContent = "Stay tuned";

    card.appendChild(media);
    card.appendChild(title);
    return card;
  }

  function render() {
    var grid = document.getElementById("project-grid");
    var projects = window.PROJECTS || [];

    if (projects.length === 0) {
      grid.innerHTML = '<p class="empty">No projects yet.</p>';
      return;
    }

    var fragment = document.createDocumentFragment();
    projects.forEach(function (p) {
      fragment.appendChild(createCard(p));
    });
    fragment.appendChild(createComingSoonCard());
    // Replaces the copy of the cards written into index.html for search engines
    // (scripts/build-home.mjs), so js/projects.js stays the source of truth.
    grid.replaceChildren(fragment);
  }

  document.getElementById("year").textContent = new Date().getFullYear();
  render();
})();

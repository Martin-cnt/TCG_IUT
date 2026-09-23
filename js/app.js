import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cardNames = [
  "Solune",
  "Moussefeu",
  "Lucioles",
  "Brindille",
  "Cendreau",
  "Nacréa",
  "Floraison",
  "Rocaille",
  "Ondine",
  "Éclat",
  "Noctule",
  "Sève",
  "Pétaline",
  "Astre",
  "Fulgur",
  "Myrte",
  "Virevol",
  "Aubépine",
  "Galet",
  "Rosée",
  "Songe",
  "Lichen",
  "Orée",
  "Calice",
  "Braise",
  "Nébule",
  "Aurore",
  "Épine",
  "Torréa",
  "Sylphe",
  "Mistral",
  "Lueur",
  "Céleste",
  "Racine",
  "Ardent",
  "Plumage",
  "Givre",
  "Lierre",
  "Éclipse",
  "Vesper",
  "Silex",
  "Poussière",
  "Mirage",
  "Ruisseau",
  "Soleil",
  "Toundra",
  "Pollen",
  "Comète",
  "Ombrelle",
  "Crique",
  "Pétale",
  "Quartz",
  "Murmure",
  "Flamme",
  "Écorce",
  "Alizé",
  "Halo",
  "Ronce",
  "Opale",
  "Brume",
  "Vallon",
  "Lunaire",
  "Aube",
  "Saphir",
  "Cobalt",
  "Vague",
  "Mélodie",
  "Bourgeon",
  "Vitrail",
  "Serein",
  "Élan",
  "Dahlia",
];
const glyphs = ["✦", "◒", "✧", "❋", "◇", "◈", "✺", "⬖"];
const colors = [
  "#ec855a",
  "#d6a25a",
  "#74b18b",
  "#d7796e",
  "#c997d2",
  "#73a6b8",
  "#e3c06c",
  "#b0a384",
];
let state = JSON.parse(localStorage.getItem("cardbound-state") || "null") || {
  owned: {},
  packs: 0,
  recent: [],
};
let cloudUserId = null;
const hasSupabaseConfig =
  window.SUPABASE_CONFIG?.url &&
  !window.SUPABASE_CONFIG.url.includes("REMPLACE");
const supabase = hasSupabaseConfig
  ? createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
  : null;
const $ = (selector) => document.querySelector(selector);
function setOpeningActionsVisible(visible) {
  const closeButton = $("#close-modal");
  const binderButton = $("#modal-done");
  closeButton.hidden = !visible;
  binderButton.hidden = !visible;
  closeButton.setAttribute("aria-hidden", String(!visible));
  binderButton.setAttribute("aria-hidden", String(!visible));
}
let opening = {
  cards: [],
  boosterClicks: 0,
  revealed: 0,
};
const cardData = (index) => ({
  index,
  name: cardNames[index],
  glyph: glyphs[index % glyphs.length],
  color: colors[index % colors.length],
});
async function save() {
  localStorage.setItem("cardbound-state", JSON.stringify(state));
  if (!supabase || !cloudUserId) return;
  await supabase.from("collections").upsert({
    user_id: cloudUserId,
    owned: state.owned,
    packs: state.packs,
    recent: state.recent,
  });
}
async function hydrateState() {
  if (!supabase) return;
  const { data: authData } = await supabase.auth.signInAnonymously();
  cloudUserId = authData.user?.id || null;
  if (!cloudUserId) return;
  const { data } = await supabase
    .from("collections")
    .select("owned, packs, recent")
    .eq("user_id", cloudUserId)
    .maybeSingle();
  if (data)
    state = {
      owned: data.owned || {},
      packs: data.packs || 0,
      recent: data.recent || [],
    };
  renderStats();
  renderRecent();
  renderBinder();
}
function ownedCount() {
  return Object.keys(state.owned).length;
}
function randomCards() {
  return Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * cardNames.length),
  );
}
function cardMarkup(index, type = "binder") {
  const card = cardData(index);
  const found = state.owned[index];
  return `<article class="${type}-card ${found ? "found" : "missing"}" style="--card-color:${card.color}"><span class="card-number">${String(index + 1).padStart(2, "0")}</span>${found ? '<span class="check">✓</span>' : ""}<span class="card-glyph">${card.glyph}</span><span class="card-name">${card.name}</span>${type === "binder" && found > 1 ? `<span class="quantity">×${found}</span>` : ""}</article>`;
}
function renderStats() {
  const count = ownedCount();
  const percent = Math.round((count / cardNames.length) * 100);
  const values = [
    ["#heading-progress", count],
    ["#binder-progress-number", `${percent}%`],
    ["#binder-progress-label", `${count} / ${cardNames.length} cartes`],
    ["#all-count", cardNames.length],
    ["#found-count", count],
    ["#missing-count", cardNames.length - count],
    [
      "#pack-count-label",
      `${state.packs} pack${state.packs > 1 ? "s" : ""} ouvert${state.packs > 1 ? "s" : ""}`,
    ],
  ];
  values.forEach(([selector, value]) => {
    const element = $(selector);
    if (element) element.textContent = value;
  });
  const progressBar = $("#binder-progress-bar");
  if (progressBar) progressBar.style.width = `${percent}%`;
}
function renderBinder(filter = "all") {
  const binderGrid = $("#binder-grid");
  if (!binderGrid) return;
  const indices = [...Array(cardNames.length).keys()].filter(
    (index) =>
      filter === "all" ||
      (filter === "found" ? state.owned[index] : !state.owned[index]),
  );
  binderGrid.innerHTML = indices.map((index) => cardMarkup(index)).join("");
}
function renderRecent() {
  const recentGrid = $("#recent-grid");
  if (!recentGrid) return;
  if (!state.recent.length) {
    recentGrid.innerHTML =
      '<div class="empty-state">Ouvre ton premier pack pour remplir cet espace.</div>';
    return;
  }
  recentGrid.innerHTML = state.recent
    .slice(0, 5)
    .map((index, order) => {
      const card = cardData(index);
      return `<article class="recent-card" style="--card-color:${card.color}"><span class="card-number">${String(index + 1).padStart(2, "0")}</span>${order < 2 ? '<span class="new-badge">NOUVEAU</span>' : ""}<span class="mini-art">${card.glyph}</span><span class="card-name">${card.name}</span></article>`;
    })
    .join("");
}
function openPack() {
  opening = {
    cards: randomCards(),
    boosterClicks: 0,
    revealed: 0,
  };
  $("#opening-stage").hidden = false;
  $("#sealed-pack").disabled = false;
  $("#sealed-pack").className = "sealed-pack";
  $("#revealing-stage").hidden = true;
  $("#revealed-grid").innerHTML = "";
  $("#opening-summary").hidden = true;
  $("#summary-grid").innerHTML = "";
  $("#opening-status").textContent =
    "Clique 3 fois sur le booster pour l'ouvrir.";
  setOpeningActionsVisible(false);
  $("#pack-modal").classList.add("open");
  $("#pack-modal").classList.remove("summary-mode");
  $("#pack-modal").setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  $("#sealed-pack").focus();
}
function hitBooster() {
  opening.boosterClicks += 1;
  const remaining = 3 - opening.boosterClicks;
  const sealedPack = $("#sealed-pack");
  sealedPack.classList.remove("hit", "damage-1", "damage-2");
  sealedPack.classList.add(`damage-${opening.boosterClicks}`, "hit");
  setTimeout(() => sealedPack?.classList.remove("hit"), 180);
  if (remaining > 0) {
    $("#opening-status").textContent =
      `Encore ${remaining} clic${remaining > 1 ? "s" : ""} sur le booster.`;
    return;
  }
  sealedPack.disabled = true;
  sealedPack.classList.add("bursting");
  $("#opening-status").textContent = "";
  setTimeout(() => {
    $("#opening-stage").hidden = true;
    $("#revealing-stage").hidden = false;
    renderCurrentCard();
  }, 650);
}
function renderCurrentCard() {
  const index = opening.cards[opening.revealed];
  const card = cardData(index);
  $("#revealed-grid").innerHTML =
    `<button class="revealed-card revealed-card-entering" style="--card-color:${card.color}" aria-label="Découvrir la carte ${opening.revealed + 1}"><span class="rarity">${Math.random() > 0.8 ? "RARE" : "COMMUN"}</span><span class="card-glyph">${card.glyph}</span><span class="card-name">${card.name}</span><span class="card-tap">Cliquer pour continuer</span></button>`;
  $("#revealed-grid .revealed-card").addEventListener("click", revealNextCard);
}
async function revealNextCard() {
  if (opening.revealed >= opening.cards.length) return;
  opening.revealed += 1;
  if (opening.revealed === opening.cards.length) {
    state.packs += 1;
    opening.cards.forEach((cardIndex) => {
      state.owned[cardIndex] = (state.owned[cardIndex] || 0) + 1;
    });
    state.recent = [...opening.cards, ...state.recent].slice(0, 5);
    await save();
    $("#revealed-grid").innerHTML = "";
    $("#opening-summary").hidden = false;
    $("#summary-grid").innerHTML = opening.cards
      .map((cardIndex) => {
        const card = cardData(cardIndex);
        return `<div class="summary-card" style="--card-color:${card.color}"><span>${card.glyph}</span><small>${card.name}</small></div>`;
      })
      .join("");
    setOpeningActionsVisible(true);
    $("#pack-modal").classList.add("summary-mode");
    $("#modal-done").focus();
    renderStats();
    renderRecent();
    renderBinder();
    return;
  }
  renderCurrentCard();
}
function closeModal() {
  $("#pack-modal").classList.remove("open");
  $("#pack-modal").classList.remove("summary-mode");
  $("#pack-modal").setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 2200);
}
document.querySelectorAll(".filter").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".filter")
      .forEach((item) => item.classList.toggle("active", item === button));
    renderBinder(button.dataset.filter);
  }),
);
$("#open-pack-button")?.addEventListener("click", openPack);
$("#booster-trigger")?.addEventListener("click", openPack);
$("#sealed-pack")?.addEventListener("click", hitBooster);
$("#close-modal")?.addEventListener("click", closeModal);
$("#modal-done")?.addEventListener("click", closeModal);
$("#pack-modal")?.addEventListener("click", (event) => {
  if (event.target.id === "pack-modal") closeModal();
});
renderStats();
renderRecent();
renderBinder();
hydrateState();

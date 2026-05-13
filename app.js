const categories = [
  { id: "turno_manana", name: "TURNO MAÑANA", tag: "TM", type: "days", countable: false, color: "#2563eb" },
  { id: "dia_blanco", name: "DÍA BLANCO", tag: "DB", type: "days", countable: true, color: "#64748b" },
  { id: "dia_blanco_movil", name: "DÍA BLANCO MÓVIL", tag: "DBM", type: "days", countable: true, color: "#059669" },
  { id: "dia_blanco_trabajar", name: "DÍA BLANCO TRABAJAR", tag: "DBT", type: "days", countable: true, color: "#f97316" },
  { id: "baja", name: "BAJA", tag: "BJ", type: "days", countable: true, color: "#dc2626" },
  { id: "asuntos_propios", name: "ASUNTOS PROPIOS", tag: "AP", type: "days", countable: true, color: "#7c3aed" },
  { id: "acompanamiento_1", name: "ACOMPAÑAMIENTO 1er GRADO", tag: "A1", type: "hours", countable: true, color: "#ca8a04" },
  { id: "acompanamiento_hijos", name: "ACOMPAÑAMIENTO HIJOS", tag: "AH", type: "hours", countable: true, color: "#db2777" }
];

const monthNames = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

let state = JSON.parse(localStorage.getItem("laboralApp")) || {
  calendar: {},
  counters: {},
  history: [],
  extras: [],
  colors: {}
};

let selectedCategory = categories[0].id;
let currentDate = new Date(2026, 0, 1);

function saveState() {
  localStorage.setItem("laboralApp", JSON.stringify(state));
}

function getColor(catId) {
  return state.colors[catId] || categories.find(c => c.id === catId).color;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  renderAll();
}

function renderCategoryPicker() {
  const box = document.getElementById("categoryPicker");
  if (!box) return;

  box.innerHTML = "";

  categories.forEach(cat => {
    const pill = document.createElement("button");
    pill.className = "category-pill" + (selectedCategory === cat.id ? " selected" : "");
    pill.style.background = getColor(cat.id);
    pill.textContent = cat.name;

    pill.onclick = () => {
      selectedCategory = cat.id;
      renderCategoryPicker();
    };

    box.appendChild(pill);
  });
}

function clearSelectedCategory() {
  selectedCategory = null;
  renderCategoryPicker();
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("calendarTitle");

  if (!grid || !title) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  title.textContent = `${monthNames[month]} ${year}`;
  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let start = firstDay.getDay();
  start = start === 0 ? 6 : start - 1;

  for (let i = 0; i < start; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const key = formatDate(date);

    const cell = document.createElement("div");
    cell.className = "day";

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = day;

    cell.appendChild(number);

    const assigned = state.calendar[key] || [];

    assigned.forEach(catId => {
      const cat = categories.find(c => c.id === catId);
      if (!cat) return;

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.style.background = getColor(catId);
      tag.textContent = cat.tag;

      cell.appendChild(tag);
    });

    cell.onclick = () => toggleDateCategory(key);

    grid.appendChild(cell);
  }
}

function toggleDateCategory(key) {
  if (!state.calendar[key]) {
    state.calendar[key] = [];
  }

  if (!selectedCategory) {
    state.calendar[key] = [];
  } else if (state.calendar[key].includes(selectedCategory)) {
    state.calendar[key] = state.calendar[key].filter(c => c !== selectedCategory);
  } else {
    state.calendar[key].push(selectedCategory);
  }

  if (!state.calendar[key].length) {
    delete state.calendar[key];
  }

  saveState();
  renderCalendar();
}

function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);

  if (currentDate.getFullYear() < 2026) {
    currentDate = new Date(2026, 0, 1);
  }

  if (currentDate.getFullYear() > 2032) {
    currentDate = new Date(2032, 11, 1);
  }

  renderCalendar();
}

function renderSummary() {
  const grid = document.getElementById("summaryGrid");
  if (!grid) return;

  grid.innerHTML = "";

  categories.forEach(cat => {
    const card = document.createElement("div");
    card.className = "card summary-card";

    card.innerHTML = `
      <div class="summary-title">${cat.name}</div>
      <div class="summary-value">0</div>
      <div class="summary-small">Configuración inicial</div>
    `;

    grid.appendChild(card);
  });
}

function renderCounterYears() {
  const select = document.getElementById("counterYear");
  if (!select || select.children.length) return;

  for (let y = 2026; y <= 2032; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

function renderCounters() {
  renderCounterYears();

  const select = document.getElementById("counterYear");
  const box = document.getElementById("counterInputs");

  if (!select || !box) return;

  const year = select.value || "2026";
  box.innerHTML = "";

  categories.filter(c => c.countable).forEach(cat => {
    const value = state.counters?.[year]?.[cat.id] || 0;

    const row = document.createElement("div");
    row.className = "counter-row";

    row.innerHTML = `
      <div>
        <strong>${cat.name}</strong>
        <div class="small">${cat.type === "hours" ? "Horas anuales" : "Días anuales"}</div>
      </div>
      <input type="number" step="0.25" id="counter-${cat.id}" value="${value}">
    `;

    box.appendChild(row);
  });
}

function saveCounters() {
  const year = document.getElementById("counterYear").value;

  if (!state.counters[year]) {
    state.counters[year] = {};
  }

  categories.filter(c => c.countable).forEach(cat => {
    state.counters[year][cat.id] =
      Number(document.getElementById(`counter-${cat.id}`).value || 0);
  });

  saveState();
  alert("Contadores guardados");
}

function renderHistoryForm() {
  const select = document.getElementById("historyCategory");
  if (!select) return;

  select.innerHTML = "";

  categories
    .filter(c => c.id !== "turno_manana")
    .forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
}

function saveHistory() {
  const date = document.getElementById("historyDate").value;
  const category = document.getElementById("historyCategory").value;
  const note = document.getElementById("historyNote").value;

  if (!date || !category) return;

  state.history.unshift({
    date,
    category,
    note
  });

  saveState();
  renderHistoryList();
}

function renderHistoryList() {
  const box = document.getElementById("historyList");
  if (!box) return;

  if (!state.history.length) {
    box.innerHTML = `<p class="small">No hay registros todavía.</p>`;
    return;
  }

  box.innerHTML = state.history.map(item => `
    <div class="list-item">
      <strong>${item.date}</strong>
      <div>${categories.find(c => c.id === item.category)?.name || ""}</div>
      <div class="small">${item.note || ""}</div>
    </div>
  `).join("");
}

function saveExtra() {
  const date = document.getElementById("extraDate").value;
  const hours = document.getElementById("extraHours").value;
  const note = document.getElementById("extraNote").value;

  if (!date || !hours) return;

  state.extras.unshift({
    date,
    hours,
    note
  });

  saveState();
  renderExtraList();
}

function renderExtraList() {
  const box = document.getElementById("extraList");
  if (!box) return;

  if (!state.extras.length) {
    box.innerHTML = `<p class="small">No hay horas extra registradas.</p>`;
    return;
  }

  box.innerHTML = state.extras.map(item => `
    <div class="list-item">
      <strong>${item.date}</strong>
      <div>${item.hours} horas</div>
      <div class="small">${item.note || ""}</div>
    </div>
  `).join("");
}

function renderColors() {
  const box = document.getElementById("colorSettings");
  if (!box) return;

  box.innerHTML = "";

  categories.forEach(cat => {
    const row = document.createElement("div");
    row.className = "color-row";

    row.innerHTML = `
      <strong>${cat.name}</strong>
      <input type="color" id="color-${cat.id}" value="${getColor(cat.id)}">
    `;

    box.appendChild(row);
  });
}

function saveColors() {
  categories.forEach(cat => {
    state.colors[cat.id] =
      document.getElementById(`color-${cat.id}`).value;
  });

  saveState();
  renderCategoryPicker();
  alert("Colores guardados");
}

function resetApp() {
  if (!confirm("¿Seguro que quieres borrar todos los datos?")) return;

  localStorage.removeItem("laboralApp");
  location.reload();
}

function enableSwipe() {
  const calendar = document.getElementById("calendario");
  if (!calendar) return;

  let startX = 0;

  calendar.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  calendar.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) > 60) {
      changeMonth(diff > 0 ? -1 : 1);
    }
  });
}

function renderAll() {
  renderCategoryPicker();
  renderCalendar();
  renderSummary();
  renderCounters();
  renderHistoryForm();
  renderHistoryList();
  renderExtraList();
  renderColors();
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  enableSwipe();
});

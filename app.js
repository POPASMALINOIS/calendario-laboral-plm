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
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const weekdayNames = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

let state = JSON.parse(localStorage.getItem("laboralApp")) || {
  calendar: {},
  counters: {},
  history: [],
  extras: [],
  colors: {},
  hourUsage: {}
};

if (!state.hourUsage) state.hourUsage = {};
if (!state.colors) state.colors = {};
if (!state.calendar) state.calendar = {};
if (!state.counters) state.counters = {};
if (!state.history) state.history = [];
if (!state.extras) state.extras = [];

let selectedCategory = categories[0].id;
let currentDate = new Date(2026, 0, 1);
let calendarView = "month";

function saveState() {
  localStorage.setItem("laboralApp", JSON.stringify(state));
}

function getColor(catId) {
  const cat = categories.find(c => c.id === catId);
  return state.colors[catId] || cat?.color || "#1f3a5f";
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  renderAll();
}

function setSelectedCategory(value) {
  selectedCategory = value === "erase" ? null : value;
}

function clearSelectedCategory() {
  selectedCategory = null;
  const select = document.getElementById("categorySelect");
  if (select) select.value = "erase";
}

function renderCategorySelect() {
  const select = document.getElementById("categorySelect");
  if (!select) return;

  select.innerHTML = "";

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });

  const erase = document.createElement("option");
  erase.value = "erase";
  erase.textContent = "BORRAR CATEGORÍAS DEL DÍA";
  select.appendChild(erase);

  select.value = selectedCategory || "erase";
}

function changeCalendarView() {
  const select = document.getElementById("calendarView");
  calendarView = select.value;
  renderCalendar();
}

function moveCalendar(direction) {
  if (calendarView === "year") {
    currentDate.setFullYear(currentDate.getFullYear() + direction);
  } else if (calendarView === "week") {
    currentDate.setDate(currentDate.getDate() + direction * 7);
  } else {
    currentDate.setMonth(currentDate.getMonth() + direction);
  }

  if (currentDate.getFullYear() < 2026) currentDate = new Date(2026, 0, 1);
  if (currentDate.getFullYear() > 2032) currentDate = new Date(2032, 11, 31);

  renderCalendar();
  renderSummary();
}

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getHolidays(year) {
  const holidays = {};

  function add(date, name, type = "Nacional") {
    holidays[date] = `${name} · ${type}`;
  }

  add(`${year}-01-01`, "Año Nuevo");
  add(`${year}-01-06`, "Reyes");
  add(`${year}-05-01`, "Fiesta del Trabajo");
  add(`${year}-08-15`, "Asunción");
  add(`${year}-10-12`, "Fiesta Nacional");
  add(`${year}-12-08`, "Inmaculada");
  add(`${year}-12-25`, "Navidad");

  const easter = getEasterSunday(year);
  add(formatDate(addDays(easter, -2)), "Viernes Santo");
  add(formatDate(addDays(easter, -3)), "Jueves Santo", "Madrid");

  add(`${year}-05-02`, "Comunidad de Madrid", "Madrid");

  if (year === 2026) {
    add("2026-11-02", "Traslado Todos los Santos");
    add("2026-12-07", "Traslado Constitución");
  } else {
    const allSaints = new Date(year, 10, 1);
    const constitution = new Date(year, 11, 6);

    if (allSaints.getDay() === 0) {
      add(`${year}-11-02`, "Traslado Todos los Santos");
    } else {
      add(`${year}-11-01`, "Todos los Santos");
    }

    if (constitution.getDay() === 0) {
      add(`${year}-12-07`, "Traslado Constitución");
    } else {
      add(`${year}-12-06`, "Constitución");
    }
  }

  return holidays;
}

function getDayClassAndStyle(assigned) {
  if (!assigned || assigned.length === 0) return { className: "", style: "" };

  if (assigned.length === 1) {
    return {
      className: "colored",
      style: `background:${getColor(assigned[0])};`
    };
  }

  return {
    className: "multi",
    style: `--c1:${getColor(assigned[0])};--c2:${getColor(assigned[1])};`
  };
}

function renderCalendar() {
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");
  if (!container || !title) return;

  if (calendarView === "year") {
    renderYearCalendar(container, title);
  } else if (calendarView === "week") {
    renderWeekCalendar(container, title);
  } else {
    renderMonthCalendar(container, title);
  }
}

function renderMonthCalendar(container, title) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const holidays = getHolidays(year);

  title.textContent = `${monthNames[month]} ${year}`;

  container.innerHTML = `
    <div class="weekdays">
      <div class="weekday">L</div>
      <div class="weekday">M</div>
      <div class="weekday">X</div>
      <div class="weekday">J</div>
      <div class="weekday">V</div>
      <div class="weekday">S</div>
      <div class="weekday">D</div>
    </div>
    <div class="calendar-grid" id="monthGrid"></div>
  `;

  const grid = document.getElementById("monthGrid");
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
    const assigned = state.calendar[key] || [];
    const holiday = holidays[key];
    const visual = getDayClassAndStyle(assigned);

    const cell = document.createElement("div");
    cell.className = `day ${visual.className}`;
    cell.style = visual.style;
    cell.onclick = () => toggleDateCategory(key);

    cell.innerHTML = `
      <div class="day-number ${holiday ? "holiday

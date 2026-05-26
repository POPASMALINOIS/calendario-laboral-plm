const categories = [
  { id: "turno_manana", name: "TURNO MAÑANA", tag: "TM", type: "days", countable: false, color: "#2563eb", shift: "manana" },
  { id: "turno_tarde", name: "TURNO TARDE", tag: "TT", type: "days", countable: false, color: "#f97316", shift: "tarde" },
  { id: "turno_noche", name: "TURNO NOCHE", tag: "TN", type: "days", countable: false, color: "#1e293b", shift: "noche" },

  { id: "vacaciones", name: "VACACIONES", tag: "VAC", type: "days", countable: true, color: "#22c55e" },
  { id: "dia_blanco", name: "DÍA BLANCO", tag: "DB", type: "days", countable: true, color: "#64748b" },
  { id: "dia_blanco_movil", name: "DÍA BLANCO MÓVIL", tag: "DBM", type: "days", countable: true, color: "#a855f7" },
  { id: "dia_blanco_trabajar", name: "DÍA BLANCO TRABAJAR", tag: "DBT", type: "days", countable: true, color: "#f97316" },
  { id: "baja", name: "BAJA", tag: "BJ", type: "days", countable: true, color: "#ef4444" },

  { id: "asuntos_propios", name: "ASUNTOS PROPIOS", tag: "AP", type: "mixed", countable: true, color: "#c084fc" },

  { id: "acompanamiento_1", name: "ACOMPAÑAMIENTO 1er GRADO", tag: "A1", type: "hours", countable: true, color: "#eab308" },
  { id: "acompanamiento_hijos", name: "ACOMPAÑAMIENTO HIJOS", tag: "AH", type: "hours", countable: true, color: "#ec4899" }
];

const HOURS_PER_DAY = 8;
const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const weekDays = ["L","M","X","J","V","S","D"];

let oldState = JSON.parse(localStorage.getItem("laboralAppPLM") || "null") || {};

let state = oldState;

if (!state.profiles) {
  state = {
    profiles: {
      profile1: {
        id: "profile1",
        name: "Perfil 1",
        color: "#2563eb",
        reduced: false,
        shifts: {
          manana: 8,
          tarde: 8,
          noche: 8
        },
        calendar: oldState.calendar || {},
        counters: oldState.counters || {},
        history: oldState.history || [],
        extras: oldState.extras || [],
        notes: oldState.notes || {}
      },
      profile2: {
        id: "profile2",
        name: "Perfil 2",
        color: "#ec4899",
        reduced: false,
        shifts: {
          manana: 8,
          tarde: 8,
          noche: 8
        },
        calendar: {},
        counters: {},
        history: [],
        extras: [],
        notes: {}
      }
    },
    activeProfile: "profile1",
    colors: oldState.colors || {},
    reminders: oldState.reminders || [],
    view: oldState.view || "month"
  };
}

state.profiles ||= {};
state.activeProfile ||= "profile1";
state.colors ||= {};
state.reminders ||= [];
state.view ||= "month";

let currentDate = new Date();
let summaryYear = currentDate.getFullYear();
let selectedCategory = "turno_manana";
let editingDateKey = null;

function saveState() {
  localStorage.setItem("laboralAppPLM", JSON.stringify(state));
}

function getProfiles() {
  return Object.values(state.profiles);
}

function getProfile(id) {
  return state.profiles[id];
}

function activeProfiles() {
  if (state.activeProfile === "all") {
    return getProfiles();
  }

  return [getProfile(state.activeProfile)].filter(Boolean);
}

function getEditableProfile() {
  if (state.activeProfile === "all") {
    return null;
  }

  return getProfile(state.activeProfile);
}

function setActiveProfile(id) {
  state.activeProfile = id;
  saveState();
  renderAll();
}

function formatAmount(value) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

function formatDate(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function getColor(id) {
  if (id === "evento") return "#0f172a";
  return state.colors[id] || categories.find(c => c.id === id)?.color || "#2563eb";
}

function getCategoryName(id) {
  if (id === "evento") return "EVENTO";
  return categories.find(c => c.id === id)?.name || id;
}

function getCategoryTag(id) {
  if (id === "evento") return "EV";
  return categories.find(c => c.id === id)?.tag || id;
}

function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  renderAll();
}

function renderYearSelectors() {
  ["summaryYear","counterYear","calendarYearSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const currentValue = el.value || summaryYear;
    el.innerHTML = "";

    for (let y = 2025; y <= 2035; y++) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      el.appendChild(opt);
    }

    el.value = currentValue;
  });

  const summary = document.getElementById("summaryYear");
  if (summary) summary.value = summaryYear;

  const counter = document.getElementById("counterYear");
  if (counter) counter.value = summaryYear;

  const calendar = document.getElementById("calendarYearSelect");
  if (calendar) calendar.value = currentDate.getFullYear();
}

function renderProfileSelectors() {
  const selectors = [
    "summaryProfileSelect",
    "calendarProfileSelect",
    "counterProfileSelect",
    "historyProfileSelect",
    "extraProfileSelect",
    "modalProfile"
  ];

  selectors.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = "";

    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Vista conjunta";
    el.appendChild(all);

    getProfiles().forEach(profile => {
      const opt = document.createElement("option");
      opt.value = profile.id;
      opt.textContent = profile.name;
      el.appendChild(opt);
    });

    el.value = state.activeProfile;
  });
}

function renderCategorySelect() {
  const select = document.getElementById("categorySelect");
  if (!select) return;

  select.innerHTML = "";

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });

  select.value = selectedCategory;
}

function setSelectedCategory(v) {
  selectedCategory = v;
}

function changeSummaryYear(y) {
  summaryYear = Number(y);
  renderSummary();
}

function jumpToYear(y) {
  currentDate.setFullYear(Number(y));
  renderCalendar();
}

function setCalendarView(v) {
  state.view = v;
  saveState();
  renderCalendar();
}

function changePeriod(n) {
  if (state.view === "year") currentDate.setFullYear(currentDate.getFullYear() + n);
  if (state.view === "month") currentDate.setMonth(currentDate.getMonth() + n);
  if (state.view === "week") currentDate.setDate(currentDate.getDate() + (n * 7));

  const calendar = document.getElementById("calendarYearSelect");
  if (calendar) calendar.value = currentDate.getFullYear();

  renderCalendar();
}

function easter(y) {
  let a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,da);
}

function holidays(y) {
  const h = {};
  const e = easter(y);

  h[`${y}-01-01`] = "Año Nuevo";
  h[`${y}-01-06`] = "Reyes";
  h[formatDate(addDays(e,-3))] = "Jueves Santo";
  h[formatDate(addDays(e,-2))] = "Viernes Santo";
  h[`${y}-05-01`] = "Trabajo";
  h[`${y}-05-02`] = "Madrid";
  h[`${y}-08-15`] = "Asunción";
  h[`${y}-10-12`] = "Fiesta Nacional";
  h[`${y}-12-08`] = "Inmaculada";
  h[`${y}-12-25`] = "Navidad";

  return h;
}

function buildDayBackground(assignments) {
  const colors = assignments.map(a => getColor(a.category));

  if (!colors.length) return "";

  if (colors.length === 1) {
    return colors[0];
  }

  const step = 100 / colors.length;
  return `linear-gradient(135deg, ${colors.map((c,i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
}

function getDayAssignments(key) {
  const result = [];

  activeProfiles().forEach(profile => {
    const assigned = profile.calendar[key] || [];

    assigned.forEach(category => {
      result.push({
        profile,
        category
      });
    });
  });

  return result;
}

function createDayCell(date, mini = false) {
  const key = formatDate(date);
  const holiday = holidays(date.getFullYear())[key];
  const today = formatDate(new Date());
  const assignments = getDayAssignments(key);

  const cell = document.createElement("div");
  cell.className = mini ? "year-mini-day" : "day";

  if (key === today) cell.classList.add("today");

  if (assignments.length) {
    cell.classList.add("has");
    cell.style.background = buildDayBackground(assignments);
  }

  const num = document.createElement("div");
  num.className = "day-number" + (holiday ? " holiday" : "");
  num.textContent = date.getDate();
  cell.appendChild(num);

  if (!mini && holiday) {
    const h = document.createElement("div");
    h.className = "holiday-label";
    h.textContent = holiday;
    cell.appendChild(h);
  }

  if (!mini) {
    const shown = assignments.slice(0, 4);

    shown.forEach(item => {
      const chip = document.createElement("div");
      chip.className = "profile-shift";
      chip.innerHTML = `
        <span class="profile-dot" style="background:${item.profile.color}"></span>
        <span class="profile-name">${item.profile.name}</span>
        <span class="profile-tag">${getCategoryTag(item.category)}</span>
      `;
      cell.appendChild(chip);
    });

    if (assignments.length > 4) {
      const more = document.createElement("div");
      more.className = "profile-shift more";
      more.textContent = `+${assignments.length - 4}`;
      cell.appendChild(more);
    }
  }

  cell.onclick = () => toggleDate(key);

  return cell;
}

function renderMonthCalendar() {
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  title.textContent = `${monthNames[m]} ${y}`;
  container.innerHTML = "";

  const weekdays = document.createElement("div");
  weekdays.className = "weekdays";

  weekDays.forEach(w => {
    const d = document.createElement("div");
    d.className = "weekday";
    d.textContent = w;
    weekdays.appendChild(d);
  });

  container.appendChild(weekdays);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const first = new Date(y,m,1);
  const last = new Date(y,m+1,0);

  let start = first.getDay();
  start = start === 0 ? 6 : start - 1;

  for (let i=0; i<start; i++) {
    const e = document.createElement("div");
    e.className = "day empty";
    grid.appendChild(e);
  }

  for (let d=1; d<=last.getDate(); d++) {
    grid.appendChild(createDayCell(new Date(y,m,d)));
  }

  container.appendChild(grid);
}

function renderWeekCalendar() {
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  container.innerHTML = "";

  const base = new Date(currentDate);
  const day = base.getDay() === 0 ? 6 : base.getDay() - 1;
  const monday = addDays(base, -day);
  const sunday = addDays(monday, 6);

  title.textContent = `${formatDate(monday)} / ${formatDate(sunday)}`;

  const weekdays = document.createElement("div");
  weekdays.className = "weekdays";

  weekDays.forEach(w => {
    const d = document.createElement("div");
    d.className = "weekday";
    d.textContent = w;
    weekdays.appendChild(d);
  });

  container.appendChild(weekdays);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  for (let i=0; i<7; i++) {
    grid.appendChild(createDayCell(addDays(monday,i)));
  }

  container.appendChild(grid);
}

function renderYearCalendar() {
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  const y = currentDate.getFullYear();

  title.textContent = y;
  container.innerHTML = "";

  const yearGrid = document.createElement("div");
  yearGrid.className = "year-grid";

  for (let m=0; m<12; m++) {
    const box = document.createElement("div");
    box.className = "year-month";

    const h = document.createElement("h4");
    h.textContent = monthNames[m];
    box.appendChild(h);

    const grid = document.createElement("div");
    grid.className = "year-mini-grid";

    const first = new Date(y,m,1);
    const last = new Date(y,m+1,0);

    let start = first.getDay();
    start = start === 0 ? 6 : start - 1;

    for (let i=0; i<start; i++) {
      const e = document.createElement("div");
      e.className = "year-mini-day empty";
      grid.appendChild(e);
    }

    for (let d=1; d<=last.getDate(); d++) {
      grid.appendChild(createDayCell(new Date(y,m,d), true));
    }

    box.appendChild(grid);
    yearGrid.appendChild(box);
  }

  container.appendChild(yearGrid);
}

function renderCalendar() {
  const month = document.getElementById("viewMonth");
  const week = document.getElementById("viewWeek");
  const year = document.getElementById("viewYear");

  if (month) month.classList.toggle("active", state.view === "month");
  if (week) week.classList.toggle("active", state.view === "week");
  if (year) year.classList.toggle("active", state.view === "year");

  if (state.view === "month") renderMonthCalendar();
  if (state.view === "week") renderWeekCalendar();
  if (state.view === "year") renderYearCalendar();
}

function toggleDate(key) {
  const profile = getEditableProfile();

  if (!profile) {
    alert("Selecciona un perfil individual para editar el calendario.");
    return;
  }

  profile.calendar ||= {};
  profile.notes ||= {};

  if (!profile.calendar[key]) {
    profile.calendar[key] = [];
  }

  if (profile.calendar[key].includes(selectedCategory)) {
    profile.calendar[key] = profile.calendar[key].filter(x => x !== selectedCategory);

    if (profile.notes[key]?.[selectedCategory]) {
      delete profile.notes[key][selectedCategory];
    }

    if (profile.notes[key] && !Object.keys(profile.notes[key]).length) {
      delete profile.notes[key];
    }

  } else {
    profile.calendar[key].push(selectedCategory);

    const cat = categories.find(c => c.id === selectedCategory);

    if (cat && (cat.type === "hours" || cat.type === "mixed")) {
      let msg = "¿Cuántas horas has gastado este día?";

      if (selectedCategory === "asuntos_propios") {
        msg = "¿Cuántas horas de asuntos propios has gastado? Usa 4 para medio día u 8 para día completo.";
      }

      const hours = prompt(msg, selectedCategory === "asuntos_propios" ? "4" : "");

      if (hours !== null && hours !== "") {
        profile.notes[key] ||= {};
        profile.notes[key][selectedCategory] = {
          hours: Number(String(hours).replace(",", ".")) || 0,
          note: ""
        };
      }
    }
  }

  if (!profile.calendar[key].length) {
    delete profile.calendar[key];
  }

  saveState();
  renderCalendar();
  renderSummary();
}

function calculateProfileHours(profile, year) {
  let manana = 0;
  let tarde = 0;
  let noche = 0;

  Object.entries(profile.calendar || {}).forEach(([date,cats]) => {
    if (!date.startsWith(String(year))) return;

    cats.forEach(catId => {
      if (catId === "turno_manana") manana += Number(profile.shifts?.manana || 8);
      if (catId === "turno_tarde") tarde += Number(profile.shifts?.tarde || 8);
      if (catId === "turno_noche") noche += Number(profile.shifts?.noche || 8);
    });
  });

  return {
    manana,
    tarde,
    noche,
    total: manana + tarde + noche
  };
}

function calculateUsed(profile, catId, year) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return 0;

  if (cat.type === "hours") {
    let total = 0;

    Object.entries(profile.notes || {}).forEach(([date,items]) => {
      if (date.startsWith(String(year)) && items[catId]) {
        total += Number(items[catId].hours || 0);
      }
    });

    (profile.history || [])
      .filter(h => h.source !== "calendar" && h.category === catId && h.date.startsWith(String(year)))
      .forEach(h => total += Number(h.hours || 0));

    return total;
  }

  if (cat.type === "mixed") {
    let usedDays = 0;

    Object.entries(profile.calendar || {}).forEach(([date,cats]) => {
      if (!date.startsWith(String(year)) || !cats.includes(catId)) return;

      const hours = Number(profile.notes?.[date]?.[catId]?.hours || 0);
      usedDays += hours > 0 ? hours / HOURS_PER_DAY : 1;
    });

    (profile.history || [])
      .filter(h => h.source !== "calendar" && h.category === catId && h.date.startsWith(String(year)))
      .forEach(h => {
        const hHours = Number(h.hours || 0);
        usedDays += hHours > 0 ? hHours / HOURS_PER_DAY : 1;
      });

    return usedDays;
  }

  return Object.entries(profile.calendar || {})
    .filter(([date,cats]) => date.startsWith(String(year)) && cats.includes(catId))
    .length;
}

function renderSummary() {
  const panel = document.getElementById("profileSummaryPanel");
  const grid = document.getElementById("summaryGrid");

  if (!panel || !grid) return;

  panel.innerHTML = "";
  grid.innerHTML = "";

  activeProfiles().forEach(profile => {
    const hours = calculateProfileHours(profile, summaryYear);

    const card = document.createElement("div");
    card.className = "profile-dashboard-card";

    card.innerHTML = `
      <div class="profile-dashboard-top">
        <div class="profile-dashboard-user">
          <span class="profile-large-dot" style="background:${profile.color}"></span>
          <div>
            <div class="profile-dashboard-name">${profile.name}</div>
            <div class="profile-dashboard-type">${profile.reduced ? "Jornada reducida" : "Jornada completa"}</div>
          </div>
        </div>
        <div class="profile-total-hours">${formatAmount(hours.total)}h</div>
      </div>

      <div class="hours-mini-grid">
        <div class="mini-hour-card">
          <div class="mini-hour-label">Mañana</div>
          <div class="mini-hour-value">${formatAmount(hours.manana)}h</div>
        </div>
        <div class="mini-hour-card">
          <div class="mini-hour-label">Tarde</div>
          <div class="mini-hour-value">${formatAmount(hours.tarde)}h</div>
        </div>
        <div class="mini-hour-card">
          <div class="mini-hour-label">Noche</div>
          <div class="mini-hour-value">${formatAmount(hours.noche)}h</div>
        </div>
      </div>
    `;

    panel.appendChild(card);
  });

  const profilesForCounters = state.activeProfile === "all"
    ? getProfiles()
    : activeProfiles();

  profilesForCounters.forEach(profile => {
    const group = document.createElement("div");
    group.className = "compact-profile-group";
    group.innerHTML = `
      <div class="compact-profile-title">
        <span class="profile-large-dot" style="background:${profile.color}"></span>
        ${profile.name}
      </div>
    `;
    grid.appendChild(group);

    categories.filter(c => c.countable).forEach(cat => {
      const total = Number(profile.counters?.[summaryYear]?.[cat.id] || 0);
      const used = calculateUsed(profile, cat.id, summaryYear);
      const remain = Math.max(total - used, 0);
      const unit = cat.type === "hours" ? "h" : "d";

      const item = document.createElement("div");
      item.className = "compact-summary-card";

      item.innerHTML = `
        <div class="compact-summary-top">
          <span class="mini-color" style="background:${getColor(cat.id)}"></span>
          <span class="compact-tag">${cat.tag}</span>
        </div>
        <div class="compact-value">${formatAmount(remain)}${unit}</div>
        <div class="compact-label">${cat.name}</div>
        <div class="compact-small">Usados ${formatAmount(used)} / ${formatAmount(total)}</div>
      `;

      grid.appendChild(item);
    });
  });
}

function renderCounters() {
  const year = document.getElementById("counterYear")?.value || summaryYear;
  const box = document.getElementById("counterInputs");
  if (!box) return;

  box.innerHTML = "";

  const profiles = state.activeProfile === "all" ? getProfiles() : activeProfiles();

  profiles.forEach(profile => {
    const title = document.createElement("div");
    title.className = "profile-settings-title";
    title.innerHTML = `
      <span class="profile-large-dot" style="background:${profile.color}"></span>
      ${profile.name}
    `;
    box.appendChild(title);

    categories.filter(c => c.countable).forEach(cat => {
      const value = Number(profile.counters?.[year]?.[cat.id] || 0);

      const row = document.createElement("div");
      row.className = "counter-row";

      row.innerHTML = `
        <div>
          <strong>${cat.name}</strong>
          <div class="small">${cat.type === "hours" ? "Horas anuales" : "Días anuales"}</div>
        </div>
        <div class="counter-control">
          <button type="button" class="counter-btn" onclick="changeCounterValue('${profile.id}','${cat.id}',-1)">−</button>
          <div class="counter-value">${value}</div>
          <button type="button" class="counter-btn" onclick="changeCounterValue('${profile.id}','${cat.id}',1)">+</button>
        </div>
      `;

      box.appendChild(row);
    });
  });
}

function changeCounterValue(profileId, catId, delta) {
  const year = document.getElementById("counterYear")?.value || summaryYear;
  const profile = getProfile(profileId);

  profile.counters ||= {};
  profile.counters[year] ||= {};

  const current = Number(profile.counters[year][catId] || 0);
  profile.counters[year][catId] = Math.max(0, current + delta);

  saveState();
  renderCounters();
  renderSummary();
}

function saveCounters() {
  saveState();
  alert("Contadores guardados");
}

function renderHistoryForm() {
  const select = document.getElementById("historyCategory");
  if (!select) return;

  select.innerHTML = "";

  const eventOpt = document.createElement("option");
  eventOpt.value = "evento";
  eventOpt.textContent = "EVENTO";
  select.appendChild(eventOpt);

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

function saveHistory() {
  const profile = getEditableProfile();

  if (!profile) {
    alert("Selecciona un perfil individual.");
    return;
  }

  const date = document.getElementById("historyDate").value;
  const category = document.getElementById("historyCategory").value;
  const hours = Number(document.getElementById("historyHours").value || 0);
  const note = document.getElementById("historyNote").value || "";

  if (!date || !category) {
    alert("Indica fecha y categoría.");
    return;
  }

  profile.history ||= [];

  profile.history.unshift({
    id: Date.now(),
    date,
    category,
    hours,
    note,
    source: "manual"
  });

  saveState();

  document.getElementById("historyDate").value = "";
  document.getElementById("historyHours").value = "";
  document.getElementById("historyNote").value = "";

  renderHistoryList();
  renderSummary();
}

function renderHistoryList() {
  const box = document.getElementById("historyList");
  if (!box) return;

  const profiles = state.activeProfile === "all" ? getProfiles() : activeProfiles();
  const rows = [];

  profiles.forEach(profile => {
    (profile.history || []).forEach(item => {
      rows.push({ profile, item });
    });
  });

  if (!rows.length) {
    box.innerHTML = `<div class="small">No hay eventos guardados todavía.</div>`;
    return;
  }

  box.innerHTML = rows.map(({profile,item}) => `
    <div class="list-item">
      <strong>${item.date}</strong>
      <div>
        <span class="profile-dot" style="background:${profile.color}"></span>
        ${profile.name} · ${getCategoryName(item.category)}${item.hours ? ` · ${item.hours} h` : ""}
      </div>
      <div class="small">${item.note || "Sin observaciones"}</div>
      <br>
      <button class="danger" onclick="deleteHistoryItem('${profile.id}','${item.id}')">Eliminar</button>
    </div>
  `).join("");
}

function deleteHistoryItem(profileId, id) {
  const profile = getProfile(profileId);
  if (!profile) return;

  if (!confirm("¿Quieres eliminar este registro?")) return;

  profile.history = (profile.history || []).filter(h => String(h.id) !== String(id));

  saveState();
  renderHistoryList();
  renderSummary();
}

function saveExtra() {
  const profile = getEditableProfile();

  if (!profile) {
    alert("Selecciona un perfil individual.");
    return;
  }

  const date = document.getElementById("extraDate").value;
  const hours = Number(document.getElementById("extraHours").value || 0);
  const note = document.getElementById("extraNote").value || "";

  if (!date || !hours) {
    alert("Indica fecha y horas.");
    return;
  }

  profile.extras ||= [];

  profile.extras.unshift({
    id: Date.now(),
    date,
    hours,
    note
  });

  saveState();

  document.getElementById("extraDate").value = "";
  document.getElementById("extraHours").value = "";
  document.getElementById("extraNote").value = "";

  renderExtraList();
}

function renderExtraList() {
  const box = document.getElementById("extraList");
  if (!box) return;

  const profiles = state.activeProfile === "all" ? getProfiles() : activeProfiles();
  const rows = [];

  profiles.forEach(profile => {
    (profile.extras || []).forEach(item => {
      rows.push({ profile, item });
    });
  });

  if (!rows.length) {
    box.innerHTML = `<div class="small">No hay horas extra registradas.</div>`;
    return;
  }

  const total = rows.reduce((sum, row) => sum + Number(row.item.hours || 0), 0);

  box.innerHTML = `
    <p><strong>Total acumulado:</strong> ${formatAmount(total)} h</p>
    ${rows.map(({profile,item}) => `
      <div class="list-item">
        <strong>${item.date}</strong>
        <div>
          <span class="profile-dot" style="background:${profile.color}"></span>
          ${profile.name} · ${item.hours} horas
        </div>
        <div class="small">${item.note || "Sin observaciones"}</div>
      </div>
    `).join("")}
  `;
}

function renderProfileSettings() {
  const box = document.getElementById("profileSettings");
  if (!box) return;

  box.innerHTML = "";

  getProfiles().forEach(profile => {
    const card = document.createElement("div");
    card.className = "profile-config-card";

    card.innerHTML = `
      <div class="profile-settings-title">
        <span class="profile-large-dot" style="background:${profile.color}"></span>
        ${profile.name}
      </div>

      <div class="form-row">
        <label>Nombre</label>
        <input type="text" id="name-${profile.id}" value="${profile.name}">
      </div>

      <div class="form-row">
        <label>Color del perfil</label>
        <input type="color" id="profile-color-${profile.id}" value="${profile.color}">
      </div>

      <div class="form-row check-row">
        <label>
          <input type="checkbox" id="reduced-${profile.id}" ${profile.reduced ? "checked" : ""}>
          Jornada reducida
        </label>
      </div>

      <div class="shift-config-grid">
        <div>
          <label>Mañana</label>
          <input type="number" step="0.25" id="manana-${profile.id}" value="${profile.shifts?.manana || 8}">
        </div>
        <div>
          <label>Tarde</label>
          <input type="number" step="0.25" id="tarde-${profile.id}" value="${profile.shifts?.tarde || 8}">
        </div>
        <div>
          <label>Noche</label>
          <input type="number" step="0.25" id="noche-${profile.id}" value="${profile.shifts?.noche || 8}">
        </div>
      </div>
    `;

    box.appendChild(card);
  });
}

function saveProfiles() {
  getProfiles().forEach(profile => {
    profile.name = document.getElementById(`name-${profile.id}`).value || profile.name;
    profile.color = document.getElementById(`profile-color-${profile.id}`).value || profile.color;
    profile.reduced = document.getElementById(`reduced-${profile.id}`).checked;

    profile.shifts ||= {};
    profile.shifts.manana = Number(document.getElementById(`manana-${profile.id}`).value || 8);
    profile.shifts.tarde = Number(document.getElementById(`tarde-${profile.id}`).value || 8);
    profile.shifts.noche = Number(document.getElementById(`noche-${profile.id}`).value || 8);
  });

  saveState();
  renderAll();
  alert("Perfiles guardados");
}

function renderColors() {
  const box = document.getElementById("colorSettings");
  if (!box) return;

  box.innerHTML = "";

  categories.forEach(cat => {
    const color = getColor(cat.id);

    const row = document.createElement("div");
    row.className = "color-row";

    row.innerHTML = `
      <div>
        <span class="color-preview" id="preview-${cat.id}" style="background:${color}"></span>
        <strong>${cat.name}</strong>
      </div>

      <label class="color-edit-btn">
        Editar color
        <input 
          type="color" 
          id="color-${cat.id}" 
          value="${color}"
          onchange="previewColor('${cat.id}', this.value)"
        >
      </label>
    `;

    box.appendChild(row);
  });
}

function previewColor(catId, value) {
  state.colors[catId] = value;

  const preview = document.getElementById(`preview-${catId}`);
  if (preview) preview.style.background = value;

  saveState();
  renderCalendar();
  renderSummary();
}

function saveColors() {
  categories.forEach(cat => {
    const picker = document.getElementById(`color-${cat.id}`);
    if (picker) state.colors[cat.id] = picker.value;
  });

  saveState();
  renderAll();
  alert("Colores guardados");
}

function openEditModal(key) {
  editingDateKey = key;

  const modal = document.getElementById("editModal");
  const title = document.getElementById("modalTitle");

  if (title) title.textContent = `Editar ${key}`;

  renderProfileSelectors();

  const modalCategory = document.getElementById("modalCategory");
  if (modalCategory) {
    modalCategory.innerHTML = "";

    const eventOpt = document.createElement("option");
    eventOpt.value = "evento";
    eventOpt.textContent = "EVENTO";
    modalCategory.appendChild(eventOpt);

    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      modalCategory.appendChild(opt);
    });

    modalCategory.value = selectedCategory;
  }

  toggleModalHours();

  modal.classList.add("active");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
}

function toggleModalHours() {
  const catId = document.getElementById("modalCategory")?.value;
  const cat = categories.find(c => c.id === catId);

  const hoursRow = document.getElementById("modalHoursRow");
  const titleRow = document.getElementById("modalEventTitleRow");
  const timeRow = document.getElementById("modalEventTimeRow");

  if (hoursRow) hoursRow.style.display = cat && (cat.type === "hours" || cat.type === "mixed") ? "block" : "none";
  if (titleRow) titleRow.style.display = catId === "evento" ? "block" : "none";
  if (timeRow) timeRow.style.display = catId === "evento" ? "block" : "none";
}

function saveEditModal() {
  if (!editingDateKey) return;

  const profileId = document.getElementById("modalProfile").value;
  const profile = getProfile(profileId);

  if (!profile) {
    alert("Selecciona un perfil individual.");
    return;
  }

  const catId = document.getElementById("modalCategory").value;
  const note = document.getElementById("modalNote").value || "";
  const hours = Number(document.getElementById("modalHours").value || 0);

  profile.calendar ||= {};
  profile.notes ||= {};
  profile.history ||= {};

  if (!profile.calendar[editingDateKey]) profile.calendar[editingDateKey] = [];
  if (!profile.calendar[editingDateKey].includes(catId)) profile.calendar[editingDateKey].push(catId);

  profile.notes[editingDateKey] ||= {};
  profile.notes[editingDateKey][catId] = {
    note,
    hours
  };

  saveState();
  closeEditModal();
  renderAll();
}

function deleteModalEntry() {
  if (!editingDateKey) return;

  const profileId = document.getElementById("modalProfile").value;
  const catId = document.getElementById("modalCategory").value;
  const profile = getProfile(profileId);

  if (!profile) return;

  if (!confirm("¿Quieres eliminar esta categoría o evento del día?")) return;

  if (profile.calendar?.[editingDateKey]) {
    profile.calendar[editingDateKey] = profile.calendar[editingDateKey].filter(c => c !== catId);
    if (!profile.calendar[editingDateKey].length) delete profile.calendar[editingDateKey];
  }

  if (profile.notes?.[editingDateKey]?.[catId]) {
    delete profile.notes[editingDateKey][catId];
  }

  saveState();
  closeEditModal();
  renderAll();
}

function downloadFile(filename, content, type="text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function exportHistoryCSV() {
  const rows = ["Perfil,Fecha,Categoría,Horas,Observaciones"];

  getProfiles().forEach(profile => {
    (profile.history || []).forEach(item => {
      rows.push(`"${profile.name}","${item.date}","${getCategoryName(item.category)}","${item.hours || ""}","${(item.note || "").replace(/"/g,'""')}"`);
    });
  });

  downloadFile(`historico_calendario_plm_${new Date().toISOString().slice(0,10)}.csv`, rows.join("\n"), "text/csv");
}

function exportExtrasCSV() {
  const rows = ["Perfil,Fecha,Horas,Observaciones"];

  getProfiles().forEach(profile => {
    (profile.extras || []).forEach(item => {
      rows.push(`"${profile.name}","${item.date}","${item.hours || ""}","${(item.note || "").replace(/"/g,'""')}"`);
    });
  });

  downloadFile(`horas_extra_plm_${new Date().toISOString().slice(0,10)}.csv`, rows.join("\n"), "text/csv");
}

function exportBackup() {
  downloadFile(
    `backup_calendario_plm_${new Date().toISOString().slice(0,10)}.json`,
    JSON.stringify(state, null, 2),
    "application/json"
  );
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);

      if (!imported.profiles) {
        throw new Error("Formato inválido");
      }

      state = imported;
      saveState();
      renderAll();
      alert("Copia restaurada correctamente.");
    } catch (err) {
      alert("Error al importar copia de seguridad.");
    }
  };

  reader.readAsText(file);
}

function exportPDF() {
  window.print();
}

function exportAnnualCalendarPDF() {
  const year = Number(document.getElementById("calendarYearSelect")?.value || currentDate.getFullYear());

  let html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Calendario Laboral ${year}</title>
    <style>
      body{
        font-family:Arial,sans-serif;
        margin:14px;
        color:#111827;
      }

      h1{
        text-align:center;
        font-size:22px;
        margin:0 0 14px;
      }

      .year-grid{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
      }

      .month{
        border:1px solid #d1d5db;
        border-radius:10px;
        padding:7px;
        page-break-inside:avoid;
      }

      .month h2{
        text-align:center;
        font-size:13px;
        margin:0 0 6px;
        text-transform:capitalize;
      }

      .weekdays,
      .days{
        display:grid;
        grid-template-columns:repeat(7,1fr);
        gap:2px;
      }

      .weekday{
        font-size:7px;
        font-weight:bold;
        text-align:center;
        color:#6b7280;
      }

      .day{
        min-height:30px;
        border:1px solid #e5e7eb;
        border-radius:5px;
        padding:2px;
        font-size:7px;
        overflow:hidden;
      }

      .empty{
        border:none;
      }

      .has{
        color:white;
        font-weight:bold;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }

      .tag{
        display:block;
        font-size:6px;
        margin-top:1px;
        background:rgba(0,0,0,.25);
        color:white;
        border-radius:4px;
        padding:1px 2px;
      }

      .legend{
        margin-top:12px;
        border-top:1px solid #d1d5db;
        padding-top:8px;
      }

      .legend h3{
        text-align:center;
        font-size:11px;
        margin:0 0 6px;
      }

      .legend-grid{
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:4px 8px;
        font-size:7px;
      }

      .legend-item{
        display:flex;
        align-items:center;
        gap:4px;
      }

      .legend-color{
        width:9px;
        height:9px;
        border-radius:2px;
        border:1px solid #555;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }

      @media print{
        @page{
          size:A4 portrait;
          margin:10mm;
        }
      }
    </style>
  </head>
  <body>
    <h1>Calendario Laboral ${year}</h1>
    <div class="year-grid">
  `;

  for (let m = 0; m < 12; m++) {
    html += `<div class="month"><h2>${monthNames[m]}</h2>`;

    html += `<div class="weekdays">`;
    weekDays.forEach(w => html += `<div class="weekday">${w}</div>`);
    html += `</div><div class="days">`;

    const first = new Date(year, m, 1);
    const last = new Date(year, m + 1, 0);

    let start = first.getDay();
    start = start === 0 ? 6 : start - 1;

    for (let i = 0; i < start; i++) {
      html += `<div class="day empty"></div>`;
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, m, d);
      const key = formatDate(date);
      const assignments = getDayAssignments(key);
      const background = buildDayBackground(assignments);

      html += `
        <div class="day ${assignments.length ? "has" : ""}" style="${background ? `background:${background};` : ""}">
          <strong>${d}</strong>
      `;

      assignments.slice(0, 2).forEach(item => {
        html += `<span class="tag">${item.profile.name} · ${getCategoryTag(item.category)}</span>`;
      });

      html += `</div>`;
    }

    html += `</div></div>`;
  }

  html += `
    </div>

    <div class="legend">
      <h3>Leyenda de colores</h3>
      <div class="legend-grid">
  `;

  categories.forEach(cat => {
    html += `
      <div class="legend-item">
        <span class="legend-color" style="background:${getColor(cat.id)}"></span>
        <span><strong>${cat.tag}</strong> ${cat.name}</span>
      </div>
    `;
  });

  getProfiles().forEach(profile => {
    html += `
      <div class="legend-item">
        <span class="legend-color" style="background:${profile.color}"></span>
        <span>${profile.name}</span>
      </div>
    `;
  });

  html += `
      </div>
    </div>

    <script>
      window.onload = function(){
        window.print();
      };
    </script>
  </body>
  </html>
  `;

  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Tu dispositivo no soporta notificaciones.");
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      alert("Notificaciones activadas correctamente.");
    } else {
      alert("Permiso de notificaciones denegado.");
    }
  });
}

function saveReminder() {
  const title = document.getElementById("reminderTitle").value.trim();
  const body = document.getElementById("reminderBody").value.trim();
  const date = document.getElementById("reminderDate").value;

  if (!title || !body || !date) {
    alert("Completa todos los campos del recordatorio.");
    return;
  }

  state.reminders ||= [];

  state.reminders.push({
    id: Date.now(),
    title,
    body,
    date,
    triggered: false
  });

  saveState();

  document.getElementById("reminderTitle").value = "";
  document.getElementById("reminderBody").value = "";
  document.getElementById("reminderDate").value = "";

  renderReminders();
  alert("Recordatorio guardado.");
}

function renderReminders() {
  const box = document.getElementById("reminderList");
  if (!box) return;

  if (!state.reminders.length) {
    box.innerHTML = `<div class="small">No hay recordatorios programados.</div>`;
    return;
  }

  box.innerHTML = state.reminders
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .map(rem => `
      <div class="list-item">
        <strong>${rem.title}</strong>
        <div class="small">${rem.body}</div>
        <div class="small">${new Date(rem.date).toLocaleString()}</div>
        <br>
        <button class="danger" onclick="deleteReminder(${rem.id})">Eliminar</button>
      </div>
    `).join("");
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter(r => r.id !== id);
  saveState();
  renderReminders();
}

function applyDarkMode() {
  if (localStorage.getItem("plmDarkMode") === "true") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function toggleDarkMode() {
  const enabled = document.body.classList.toggle("dark");
  localStorage.setItem("plmDarkMode", enabled ? "true" : "false");
}

function resetApp() {
  if (confirm("¿Seguro que deseas borrar todos los datos?")) {
    localStorage.removeItem("laboralAppPLM");
    location.reload();
  }
}

function renderAll() {
  renderYearSelectors();
  renderProfileSelectors();
  renderCategorySelect();
  renderCalendar();
  renderSummary();
  renderCounters();
  renderHistoryForm();
  renderHistoryList();
  renderExtraList();
  renderProfileSettings();
  renderColors();
  renderReminders();
  applyDarkMode();
}

document.addEventListener("DOMContentLoaded", renderAll);

window.addEventListener("load", () => {
  applyDarkMode();

  const splash = document.getElementById("splashScreen");

  setTimeout(() => {
    if (splash) splash.classList.add("hidden");
  }, 1000);
});

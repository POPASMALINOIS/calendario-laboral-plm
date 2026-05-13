const categories = [
  { id: "turno_manana", name: "TURNO MAÑANA", tag: "TM", type: "days", countable: false, color: "#2563eb" },
  { id: "turno_tarde", name: "TURNO TARDE", tag: "TT", type: "days", countable: false, color: "#f97316" },
  { id: "turno_noche", name: "TURNO NOCHE", tag: "TN", type: "days", countable: false, color: "#1e293b" },

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

function formatAmount(value){
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const weekDays = ["L","M","X","J","V","S","D"];

let state = JSON.parse(localStorage.getItem("laboralAppPLM") || "null") || {
  calendar: {},
  counters: {},
  history: [],
  extras: [],
  colors: {},
  notes: {},
  reminders: [],
  view: "month"
};

state.calendar ||= {};
state.counters ||= {};
state.history ||= [];
state.extras ||= [];
state.colors ||= {};
state.notes ||= {};
state.reminders ||= [];
state.view ||= "month";

let selectedCategory = categories[0].id;
let currentDate = new Date();
if (currentDate.getFullYear() < 2026) currentDate = new Date(2026,0,1);
if (currentDate.getFullYear() > 2032) currentDate = new Date(2032,11,31);

let summaryYear = currentDate.getFullYear();
let editingDateKey = null;
let longPressTimer = null;
let longPressTriggered = false;

function saveState(){
  localStorage.setItem("laboralAppPLM", JSON.stringify(state));
}

function getColor(id){
  if (id === "evento") return "#0f172a";
  return state.colors[id] || categories.find(c => c.id === id)?.color || "#2563eb";
}

function getCategoryName(id){
  if (id === "evento") return "EVENTO";
  return categories.find(c => c.id === id)?.name || id;
}

function getCategoryTag(id, dateKey){
  if (id === "evento") {
    const ev = state.notes?.[dateKey]?.evento;
    return ev?.time ? `EV ${ev.time}` : "EV";
  }
  return categories.find(c => c.id === id)?.tag || id;
}

function formatDate(d){
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function addDays(d,n){
  let x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function showTab(id,btn){
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  renderAll();
}

function renderYearSelectors(){
  ["summaryYear","counterYear","calendarYearSelect"].forEach(id => {
    let el = document.getElementById(id);
    if (!el || el.children.length) return;

    for (let y = 2026; y <= 2032; y++) {
      let opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      el.appendChild(opt);
    }
  });

  document.getElementById("summaryYear").value = summaryYear;
  document.getElementById("counterYear").value = summaryYear;
  document.getElementById("calendarYearSelect").value = currentDate.getFullYear();
}

function changeSummaryYear(y){
  summaryYear = Number(y);
  renderSummary();
}

function jumpToYear(y){
  currentDate.setFullYear(Number(y));
  renderCalendar();
}

function renderCategorySelect(){
  let select = document.getElementById("categorySelect");
  if (!select) return;

  select.innerHTML = "";

  categories.forEach(cat => {
    let opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });

  select.value = selectedCategory;
}

function setSelectedCategory(v){
  selectedCategory = v;
}

function setCalendarView(v){
  state.view = v;
  saveState();
  renderCalendar();
}

function changePeriod(n){
  if (state.view === "year") currentDate.setFullYear(currentDate.getFullYear() + n);
  if (state.view === "month") currentDate.setMonth(currentDate.getMonth() + n);
  if (state.view === "week") currentDate.setDate(currentDate.getDate() + (n * 7));

  if (currentDate.getFullYear() < 2026) currentDate = new Date(2026,0,1);
  if (currentDate.getFullYear() > 2032) currentDate = new Date(2032,11,31);

  document.getElementById("calendarYearSelect").value = currentDate.getFullYear();

  renderCalendar();
}

function easter(y){
  let a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,da);
}

function holidays(y){
  let h = {}, e = easter(y);
  function add(k,n){ h[k] = n; }

  add(`${y}-01-01`, "Año Nuevo");
  add(`${y}-01-06`, "Reyes");
  add(formatDate(addDays(e,-3)), "Jueves Santo");
  add(formatDate(addDays(e,-2)), "Viernes Santo");
  add(`${y}-05-01`, "Trabajo");
  add(`${y}-05-02`, "Madrid");
  add(`${y}-08-15`, "Asunción");
  add(`${y}-10-12`, "Fiesta Nacional");
  add(`${y}-12-08`, "Inmaculada");
  add(`${y}-12-25`, "Navidad");

  return h;
}

function attachPressEvents(el,key){
  el.addEventListener("touchstart", () => {
    longPressTriggered = false;
    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      openEditModal(key);
    }, 650);
  });

  el.addEventListener("touchend", () => {
    clearTimeout(longPressTimer);
    setTimeout(() => longPressTriggered = false, 100);
  });

  el.addEventListener("mousedown", () => {
    longPressTriggered = false;
    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      openEditModal(key);
    }, 650);
  });

  el.addEventListener("mouseup", () => clearTimeout(longPressTimer));
}

function createDayCell(date, mini=false){
  const key = formatDate(date);
  const assigned = state.calendar[key] || [];
  const holiday = holidays(date.getFullYear())[key];
  const today = formatDate(new Date());

  let cell = document.createElement("div");
  cell.className = mini ? "year-mini-day" : "day";

  if (key === today) cell.classList.add("today");

  if (assigned.length) {
    cell.classList.add("has");

    let colors = assigned.map(id => getColor(id));

    if (colors.length === 1) {
      cell.style.background = colors[0];
    } else {
      let step = 100 / colors.length;
      cell.style.background = `linear-gradient(135deg, ${colors.map((c,i)=>`${c} ${i*step}% ${(i+1)*step}%`).join(", ")})`;
    }
  }

  let num = document.createElement("div");
  num.className = "day-number" + (holiday ? " holiday" : "");
  num.textContent = date.getDate();
  cell.appendChild(num);

  if (!mini && holiday) {
    let h = document.createElement("div");
    h.className = "holiday-label";
    h.textContent = holiday;
    cell.appendChild(h);
  }

  if (!mini) {
    assigned.forEach(id => {
      let tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = getCategoryTag(id, key);

      if (state.notes?.[key]?.[id]?.note || state.notes?.[key]?.[id]?.title) {
        let dot = document.createElement("span");
        dot.className = "note-dot";
        tag.appendChild(dot);
      }

      cell.appendChild(tag);
    });
  }

  cell.onclick = () => {
    if (longPressTriggered) return;
    toggleDate(key);
  };

  attachPressEvents(cell,key);

  return cell;
}

function renderMonthCalendar(){
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  let y = currentDate.getFullYear();
  let m = currentDate.getMonth();

  title.textContent = `${monthNames[m]} ${y}`;
  container.innerHTML = "";

  let weekdays = document.createElement("div");
  weekdays.className = "weekdays";

  weekDays.forEach(w => {
    let d = document.createElement("div");
    d.className = "weekday";
    d.textContent = w;
    weekdays.appendChild(d);
  });

  container.appendChild(weekdays);

  let grid = document.createElement("div");
  grid.className = "calendar-grid";

  let first = new Date(y,m,1);
  let last = new Date(y,m+1,0);

  let start = first.getDay();
  start = start === 0 ? 6 : start - 1;

  for (let i=0; i<start; i++) {
    let e = document.createElement("div");
    e.className = "day empty";
    grid.appendChild(e);
  }

  for (let d=1; d<=last.getDate(); d++) {
    grid.appendChild(createDayCell(new Date(y,m,d)));
  }

  container.appendChild(grid);
}

function renderWeekCalendar(){
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  container.innerHTML = "";

  let base = new Date(currentDate);
  let day = base.getDay() === 0 ? 6 : base.getDay() - 1;
  let monday = addDays(base,-day);
  let sunday = addDays(monday,6);

  title.textContent = `${formatDate(monday)} / ${formatDate(sunday)}`;

  let weekdays = document.createElement("div");
  weekdays.className = "weekdays";

  weekDays.forEach(w => {
    let d = document.createElement("div");
    d.className = "weekday";
    d.textContent = w;
    weekdays.appendChild(d);
  });

  container.appendChild(weekdays);

  let grid = document.createElement("div");
  grid.className = "calendar-grid";

  for (let i=0; i<7; i++) {
    grid.appendChild(createDayCell(addDays(monday,i)));
  }

  container.appendChild(grid);
}

function renderYearCalendar(){
  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  let y = currentDate.getFullYear();

  title.textContent = y;
  container.innerHTML = "";

  let yearGrid = document.createElement("div");
  yearGrid.className = "year-grid";

  for (let m=0; m<12; m++) {
    let box = document.createElement("div");
    box.className = "year-month";

    let h = document.createElement("h4");
    h.textContent = monthNames[m];
    box.appendChild(h);

    let grid = document.createElement("div");
    grid.className = "year-mini-grid";

    let first = new Date(y,m,1);
    let last = new Date(y,m+1,0);

    let start = first.getDay();
    start = start === 0 ? 6 : start - 1;

    for (let i=0; i<start; i++) {
      let e = document.createElement("div");
      e.className = "year-mini-day";
      e.style.opacity = "0";
      grid.appendChild(e);
    }

    for (let d=1; d<=last.getDate(); d++) {
      grid.appendChild(createDayCell(new Date(y,m,d),true));
    }

    box.appendChild(grid);
    yearGrid.appendChild(box);
  }

  container.appendChild(yearGrid);
}

function renderCalendar(){
  document.getElementById("viewMonth").classList.toggle("active",state.view==="month");
  document.getElementById("viewWeek").classList.toggle("active",state.view==="week");
  document.getElementById("viewYear").classList.toggle("active",state.view==="year");

  if (state.view === "month") renderMonthCalendar();
  if (state.view === "week") renderWeekCalendar();
  if (state.view === "year") renderYearCalendar();
}

function toggleDate(key){
  if (!state.calendar[key]) state.calendar[key] = [];

  if (state.calendar[key].includes(selectedCategory)) {
    state.calendar[key] = state.calendar[key].filter(x => x !== selectedCategory);
    if (state.notes[key]) delete state.notes[key][selectedCategory];
  } else {
    state.calendar[key].push(selectedCategory);

    let cat = categories.find(c => c.id === selectedCategory);

    if (cat.type === "hours" || cat.type === "mixed") {
      let hours = prompt("¿Cuántas horas has gastado?", "");
      if (hours) {
        if (!state.notes[key]) state.notes[key] = {};

        let note = prompt("Observaciones:", "") || "";

        state.notes[key][selectedCategory] = {
          hours: Number(hours) || 0,
          note
        };

        syncCalendarEventToHistory(key, selectedCategory, Number(hours)||0, note);
      }
    }
  }

  if (!state.calendar[key].length) delete state.calendar[key];

  saveState();
  renderCalendar();
  renderSummary();
  renderHistoryList();
}

function calculateUsed(catId,year){
  let cat = categories.find(c => c.id === catId);

  if (cat.type === "hours") {
    let total = 0;

    Object.entries(state.notes || {}).forEach(([date,items]) => {
      if (date.startsWith(String(year)) && items[catId]) {
        total += Number(items[catId].hours || 0);
      }
    });

    state.history
      .filter(h => h.source !== "calendar" && h.category === catId && h.date.startsWith(String(year)))
      .forEach(h => total += Number(h.hours || 0));

    return total;
  }

  if (cat.type === "mixed") {
    let usedDays = 0;

    Object.entries(state.calendar).forEach(([date,cats]) => {
      if (!date.startsWith(String(year)) || !cats.includes(catId)) return;

      const hours = Number(state.notes?.[date]?.[catId]?.hours || 0);

      if (hours > 0) {
        usedDays += hours / HOURS_PER_DAY;
      } else {
        usedDays += 1;
      }
    });

    state.history
      .filter(h => h.source !== "calendar" && h.category === catId && h.date.startsWith(String(year)))
      .forEach(h => {
        const hHours = Number(h.hours || 0);
        usedDays += hHours > 0 ? hHours / HOURS_PER_DAY : 1;
      });

    return usedDays;
  }

  return Object.entries(state.calendar)
    .filter(([date,cats]) => date.startsWith(String(year)) && cats.includes(catId))
    .length;
}

function renderSummary(){
  const grid = document.getElementById("summaryGrid");
  if (!grid) return;

  grid.innerHTML = "";

  categories
    .filter(c => c.countable)
    .forEach(cat => {
      let used = calculateUsed(cat.id, summaryYear);
      let total = Number(state.counters?.[summaryYear]?.[cat.id] || 0);
      let remaining = Math.max(total - used, 0);
      let percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
      let color = getColor(cat.id);
      let unit = cat.type === "hours" ? "h" : "d";

      let card = document.createElement("div");
      card.className = "card summary-card";

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="background:${color};color:white;font-size:10px;font-weight:900;padding:4px 8px;border-radius:999px;">
            ${cat.tag}
          </span>
          <span style="font-size:11px;color:var(--muted);font-weight:800;">
            ${cat.type === "hours" ? "HORAS" : "DÍAS"}
          </span>
        </div>

        <div class="summary-title" style="min-height:34px;">
          ${cat.name}
        </div>

        <div class="summary-value" style="color:${color};">
          ${formatAmount(remaining)}${unit}
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%;background:${color};"></div>
        </div>

        <div class="summary-small">
          Usados ${formatAmount(used)} / ${formatAmount(total)}
        </div>
      `;

      grid.appendChild(card);
    });
}

function renderCounters(){
  let year = document.getElementById("counterYear").value;
  let box = document.getElementById("counterInputs");
  box.innerHTML = "";

  categories.filter(c => c.countable).forEach(cat => {
    let value = Number(state.counters?.[year]?.[cat.id] || 0);

    let row = document.createElement("div");
    row.className = "counter-row";

    row.innerHTML = `
      <div>
        <strong>${cat.name}</strong>
        <div class="small">${cat.type === "hours" ? "Horas anuales" : "Días anuales"}</div>
      </div>

      <div class="counter-control">
        <button 
          type="button" 
          class="counter-btn" 
          onclick="changeCounterValue('${cat.id}', -1)"
        >−</button>

        <div class="counter-value" id="counter-${cat.id}">${value}</div>

        <span class="counter-unit">${cat.type === "hours" ? "h" : "d"}</span>

        <button 
          type="button" 
          class="counter-btn" 
          onclick="changeCounterValue('${cat.id}', 1)"
        >+</button>
      </div>
    `;

    box.appendChild(row);
  });
}

function changeCounterValue(catId, delta){
  let year = document.getElementById("counterYear").value;

  if (!state.counters[year]) {
    state.counters[year] = {};
  }

  let current = Number(state.counters[year][catId] || 0);
  let next = Math.max(0, current + delta);

  state.counters[year][catId] = next;

  let valueBox = document.getElementById(`counter-${catId}`);
  if (valueBox) {
    valueBox.textContent = next;
  }

  saveState();
  renderSummary();
}

function saveCounters(){
  saveState();
  renderSummary();
  alert("Contadores guardados");
}

function renderHistoryForm(){
  let select = document.getElementById("historyCategory");
  if (!select) return;

  select.innerHTML = "";

  let eventOpt = document.createElement("option");
  eventOpt.value = "evento";
  eventOpt.textContent = "EVENTO";
  select.appendChild(eventOpt);

  categories.forEach(cat => {
    let opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

function saveHistory(){
  let date = document.getElementById("historyDate").value;
  let category = document.getElementById("historyCategory").value;
  let hours = Number(document.getElementById("historyHours").value || 0);
  let note = document.getElementById("historyNote").value || "";

  if (!date || !category) {
    alert("Indica fecha y categoría.");
    return;
  }

  let cat = categories.find(c => c.id === category);

  if (cat && cat.type === "hours" && hours <= 0) {
    alert("Indica las horas.");
    return;
  }

  state.history.unshift({
    id: Date.now(),
    date,
    category,
    hours: cat && cat.type === "hours" ? hours : 0,
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

function syncCalendarEventToHistory(date, category, hours, note){
  const eventId = `calendar-${date}-${category}`;
  const existing = state.history.find(h => h.eventId === eventId);

  const item = {
    eventId,
    id: eventId,
    date,
    category,
    hours: Number(hours || 0),
    note: note || "",
    source: "calendar"
  };

  if (existing) {
    existing.hours = item.hours;
    existing.note = item.note;
    existing.source = "calendar";
  } else {
    state.history.unshift(item);
  }
}

function renderHistoryList(){
  const box = document.getElementById("historyList");
  if (!box) return;

  if (!state.history || !state.history.length) {
    box.innerHTML = `<div class="small">No hay eventos guardados todavía.</div>`;
    return;
  }

  box.innerHTML = state.history.map(item => {
    return `
      <div class="list-item">
        <strong>${item.date}</strong>
        <div>${getCategoryName(item.category)}${item.hours ? ` · ${item.hours} h` : ""}</div>
        <div class="small">${item.note || "Sin observaciones"}</div>
        <div class="small">${item.source === "calendar" ? "Evento del calendario" : "Registro manual"}</div>
      </div>
    `;
  }).join("");
}

function saveExtra(){
  let date = document.getElementById("extraDate").value;
  let hours = Number(document.getElementById("extraHours").value || 0);
  let note = document.getElementById("extraNote").value || "";

  if (!date || !hours) {
    alert("Indica fecha y horas.");
    return;
  }

  state.extras.unshift({
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

function renderExtraList(){
  const box = document.getElementById("extraList");
  if (!box) return;

  if (!state.extras || !state.extras.length) {
    box.innerHTML = `<div class="small">No hay horas extra registradas.</div>`;
    return;
  }

  const total = state.extras.reduce((sum,e) => sum + Number(e.hours || 0), 0);

  box.innerHTML = `
    <p><strong>Total acumulado:</strong> ${total} h</p>
    ${state.extras.map(e => `
      <div class="list-item">
        <strong>${e.date}</strong>
        <div>${e.hours} horas</div>
        <div class="small">${e.note || "Sin observaciones"}</div>
      </div>
    `).join("")}
  `;
}

function renderColors(){
  let box = document.getElementById("colorSettings");
  if (!box) return;

  box.innerHTML = "";

  categories.forEach(cat => {
    let row = document.createElement("div");
    row.className = "color-row";

    let color = getColor(cat.id);

    row.innerHTML = `
      <div>
        <span class="color-preview" id="preview-${cat.id}" style="background:${color}"></span>
        <strong>${cat.name}</strong>
      </div>

      <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;">
        <input 
          type="color" 
          id="color-${cat.id}" 
          value="${color}" 
          style="width:1px;height:1px;opacity:0;position:absolute;"
          onchange="previewColor('${cat.id}', this.value)"
        >
        <button 
          type="button" 
          class="secondary" 
          style="padding:8px 12px;font-size:13px;border-radius:999px;"
          onclick="document.getElementById('color-${cat.id}').click()"
        >
          Editar
        </button>
      </div>
    `;

    box.appendChild(row);
  });
}

function previewColor(catId,value){
  state.colors[catId] = value;

  let preview = document.getElementById(`preview-${catId}`);
  if (preview) preview.style.background = value;

  saveState();
  renderCalendar();
  renderSummary();
}

function saveColors(){
  categories.forEach(cat => {
    let picker = document.getElementById(`color-${cat.id}`);
    if (picker) state.colors[cat.id] = picker.value;
  });

  saveState();
  renderAll();
  alert("Colores guardados");
}

function openEditModal(key){
  editingDateKey = key;

  let modal = document.getElementById("editModal");
  let select = document.getElementById("modalCategory");

  document.getElementById("modalTitle").textContent = `Editar ${key}`;

  select.innerHTML = "";

  let eventOpt = document.createElement("option");
  eventOpt.value = "evento";
  eventOpt.textContent = "EVENTO";
  select.appendChild(eventOpt);

  categories.forEach(cat => {
    let opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });

  select.value = (state.calendar[key] && state.calendar[key][0]) || selectedCategory || "evento";

  toggleModalHours();

  let current = state.notes?.[key]?.[select.value] || {};

  document.getElementById("modalHours").value = current.hours || "";
  document.getElementById("modalNote").value = current.note || "";
  document.getElementById("modalEventTitle").value = current.title || "";
  document.getElementById("modalEventTime").value = current.time || "";

  modal.classList.add("active");
}

function closeEditModal(){
  document.getElementById("editModal").classList.remove("active");
}

function toggleModalHours(){
  let catId = document.getElementById("modalCategory").value;
  let cat = categories.find(c => c.id === catId);

  document.getElementById("modalHoursRow").style.display =
    cat && cat.type === "hours" ? "block" : "none";

  document.getElementById("modalEventTitleRow").style.display =
    catId === "evento" ? "block" : "none";

  document.getElementById("modalEventTimeRow").style.display =
    catId === "evento" ? "block" : "none";

  if (editingDateKey) {
    let current = state.notes?.[editingDateKey]?.[catId] || {};
    document.getElementById("modalHours").value = current.hours || "";
    document.getElementById("modalNote").value = current.note || "";
    document.getElementById("modalEventTitle").value = current.title || "";
    document.getElementById("modalEventTime").value = current.time || "";
  }
}

function saveEditModal(){
  if (!editingDateKey) return;

  let catId = document.getElementById("modalCategory").value;
  let note = document.getElementById("modalNote").value || "";
  let hours = Number(document.getElementById("modalHours").value || 0);
  let eventTitle = document.getElementById("modalEventTitle")?.value || "";
  let eventTime = document.getElementById("modalEventTime")?.value || "";

  if (!state.calendar[editingDateKey]) state.calendar[editingDateKey] = [];
  if (!state.notes[editingDateKey]) state.notes[editingDateKey] = {};

  if (catId === "evento") {
    if (!state.calendar[editingDateKey].includes("evento")) {
      state.calendar[editingDateKey].push("evento");
    }

    state.notes[editingDateKey]["evento"] = {
      title: eventTitle || "Evento",
      time: eventTime,
      note,
      hours: 0
    };

    syncCalendarEventToHistory(
      editingDateKey,
      "evento",
      0,
      `${eventTime ? eventTime + " · " : ""}${eventTitle || "Evento"}${note ? " · " + note : ""}`
    );

  } else {
    if (!state.calendar[editingDateKey].includes(catId)) {
      state.calendar[editingDateKey].push(catId);
    }

    state.notes[editingDateKey][catId] = {
      note,
      hours
    };

    syncCalendarEventToHistory(editingDateKey, catId, hours, note);
  }

  saveState();
  closeEditModal();
  renderCalendar();
  renderSummary();
  renderHistoryList();
}

function downloadFile(filename, content, type="text/plain"){
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function exportHistoryCSV(){
  if (!state.history || !state.history.length) {
    alert("No hay histórico para exportar.");
    return;
  }

  let rows = ["Fecha,Categoría,Horas,Observaciones,Origen"];

  state.history.forEach(item => {
    rows.push(`"${item.date}","${getCategoryName(item.category)}","${item.hours || ""}","${(item.note || "").replace(/"/g,'""')}","${item.source || ""}"`);
  });

  downloadFile(`historico_calendario_plm_${new Date().toISOString().slice(0,10)}.csv`, rows.join("\n"), "text/csv");
}

function exportExtrasCSV(){
  if (!state.extras || !state.extras.length) {
    alert("No hay horas extra para exportar.");
    return;
  }

  let rows = ["Fecha,Horas,Observaciones"];

  state.extras.forEach(item => {
    rows.push(`"${item.date}","${item.hours}","${(item.note || "").replace(/"/g,'""')}"`);
  });

  downloadFile(`horas_extra_plm_${new Date().toISOString().slice(0,10)}.csv`, rows.join("\n"), "text/csv");
}

function exportBackup(){
  downloadFile(
    `backup_calendario_plm_${new Date().toISOString().slice(0,10)}.json`,
    JSON.stringify(state, null, 2),
    "application/json"
  );
}

function importBackup(event){
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e){
    try {
      const imported = JSON.parse(e.target.result);

      if (!imported.calendar || !imported.counters) {
        throw new Error("Formato inválido");
      }

      state = imported;
      state.history ||= [];
      state.extras ||= [];
      state.colors ||= {};
      state.notes ||= {};
      state.reminders ||= [];
      state.view ||= "month";

      saveState();
      renderAll();

      alert("Copia restaurada correctamente.");
    } catch (err) {
      alert("Error al importar copia de seguridad.");
    }
  };

  reader.readAsText(file);
}

function exportPDF(){
  window.print();
}

function requestNotificationPermission(){
  if (!("Notification" in window)) {
    alert("Tu dispositivo no soporta notificaciones.");
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      alert("Notificaciones activadas correctamente.");

      new Notification("Calendario Laboral PLM", {
        body: "Recordatorios activados correctamente."
      });

    } else {
      alert("Permiso de notificaciones denegado.");
    }
  });
}

function saveReminder(){
  const title = document.getElementById("reminderTitle").value.trim();
  const body = document.getElementById("reminderBody").value.trim();
  const date = document.getElementById("reminderDate").value;

  if (!title || !body || !date) {
    alert("Completa todos los campos del recordatorio.");
    return;
  }

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

function renderReminders(){
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

function deleteReminder(id){
  state.reminders = state.reminders.filter(r => r.id !== id);
  saveState();
  renderReminders();
}

function checkReminders(){
  if (!state.reminders || !state.reminders.length) return;

  const now = new Date();

  state.reminders.forEach(rem => {
    if (!rem.triggered && new Date(rem.date) <= now) {
      if (Notification.permission === "granted") {
        new Notification(rem.title, { body: rem.body });
      } else {
        alert(`${rem.title}\n\n${rem.body}`);
      }

      rem.triggered = true;
    }
  });

  saveState();
  renderReminders();
}

function applyDarkMode(){
  if (localStorage.getItem("plmDarkMode") === "true") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function toggleDarkMode(){
  const enabled = document.body.classList.toggle("dark");
  localStorage.setItem("plmDarkMode", enabled ? "true" : "false");
}

function resetApp(){
  if (confirm("¿Seguro que deseas borrar todos los datos?")) {
    localStorage.removeItem("laboralAppPLM");
    location.reload();
  }
}

function renderAll(){
  renderYearSelectors();
  renderCategorySelect();
  renderCalendar();
  renderSummary();
  renderCounters();
  renderHistoryForm();
  renderHistoryList();
  renderExtraList();
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
  }, 1400);

  checkReminders();
});
function removeCalendarCategory(dateKey, categoryId){
  if (state.calendar[dateKey]) {
    state.calendar[dateKey] = state.calendar[dateKey].filter(c => c !== categoryId);

    if (!state.calendar[dateKey].length) {
      delete state.calendar[dateKey];
    }
  }

  if (state.notes[dateKey] && state.notes[dateKey][categoryId]) {
    delete state.notes[dateKey][categoryId];

    if (Object.keys(state.notes[dateKey]).length === 0) {
      delete state.notes[dateKey];
    }
  }

  state.history = state.history.filter(h => {
    return !(h.source === "calendar" && h.date === dateKey && h.category === categoryId);
  });
}

function deleteModalEntry(){
  if (!editingDateKey) return;

  const catId = document.getElementById("modalCategory").value;

  if (!catId) return;

  if (!confirm("¿Quieres eliminar esta categoría o evento del día?")) return;

  removeCalendarCategory(editingDateKey, catId);

  saveState();
  closeEditModal();
  renderCalendar();
  renderHistoryList();
  renderSummary();
}

function renderHistoryList(){
  const box = document.getElementById("historyList");
  if (!box) return;

  if (!state.history || !state.history.length) {
    box.innerHTML = `<div class="small">No hay eventos guardados todavía.</div>`;
    return;
  }

  box.innerHTML = state.history.map(item => {
    return `
      <div class="list-item">
        <strong>${item.date}</strong>
        <div>${getCategoryName(item.category)}${item.hours ? ` · ${item.hours} h` : ""}</div>
        <div class="small">${item.note || "Sin observaciones"}</div>
        <div class="small">${item.source === "calendar" ? "Evento del calendario" : "Registro manual"}</div>
        <br>
        <button class="danger" onclick="deleteHistoryItem('${item.id}')">Eliminar</button>
      </div>
    `;
  }).join("");
}

function deleteHistoryItem(id){
  const item = state.history.find(h => String(h.id) === String(id));
  if (!item) return;

  if (!confirm("¿Quieres eliminar este registro?")) return;

  state.history = state.history.filter(h => String(h.id) !== String(id));

  if (item.source === "calendar" && item.date && item.category) {
    removeCalendarCategory(item.date, item.category);
  }

  saveState();
  renderCalendar();
  renderHistoryList();
  renderSummary();
}
function exportAnnualCalendarPDF(){
  const year = Number(document.getElementById("calendarYearSelect")?.value || currentDate.getFullYear());
  const existing = document.getElementById("printAnnualCalendar");
  if(existing) existing.remove();

  const printBox = document.createElement("div");
  printBox.id = "printAnnualCalendar";

  let html = `
    <div class="print-title">Calendario Laboral PLM · ${year}</div>
    <div class="print-year-grid">
  `;

  for(let month = 0; month < 12; month++){
    html += `
      <div class="print-month">
        <h4>${monthNames[month]}</h4>
        <div class="print-weekdays">
          ${weekDays.map(w => `<div class="print-weekday">${w}</div>`).join("")}
        </div>
        <div class="print-days">
    `;

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let start = first.getDay();
    start = start === 0 ? 6 : start - 1;

    for(let i = 0; i < start; i++){
      html += `<div class="print-day empty"></div>`;
    }

    for(let day = 1; day <= last.getDate(); day++){
      const date = new Date(year, month, day);
      const key = formatDate(date);
      const assigned = state.calendar[key] || [];
      const holiday = holidays(year)[key];

      let style = "";
      let cls = "print-day";

      if(assigned.length){
        cls += " has";
        const colors = assigned.map(id => getColor(id));

        if(colors.length === 1){
          style = `background:${colors[0]};`;
        }else{
          const step = 100 / colors.length;
          style = `background:linear-gradient(135deg, ${colors.map((c,i)=>`${c} ${i*step}% ${(i+1)*step}%`).join(", ")});`;
        }
      }

      if(holiday && !assigned.length){
        cls += " holiday";
      }

      html += `
        <div class="${cls}" style="${style}">
          <strong>${day}</strong>
          ${holiday ? `<div class="print-tag">${holiday}</div>` : ""}
          ${assigned.map(id => `<span class="print-tag">${getCategoryTag(id, key)}</span>`).join("")}
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  html += `</div>`;

  printBox.innerHTML = html;
  document.body.appendChild(printBox);

  document.body.classList.add("print-annual");

  setTimeout(() => {
    window.print();

    setTimeout(() => {
      document.body.classList.remove("print-annual");
      printBox.remove();
    }, 500);
  }, 250);
}

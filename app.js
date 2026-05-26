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

let state = JSON.parse(localStorage.getItem("laboralAppPLM") || "null") || {};

if(!state.profiles){

  state = {
    profiles:{
      profile1:{
        id:"profile1",
        name:"Perfil 1",
        color:"#2563eb",
        reduced:false,
        shifts:{
          manana:8,
          tarde:8,
          noche:8
        },
        calendar: state.calendar || {},
        counters: state.counters || {},
        history: state.history || [],
        extras: state.extras || [],
        notes: state.notes || {}
      },

      profile2:{
        id:"profile2",
        name:"Perfil 2",
        color:"#ec4899",
        reduced:false,
        shifts:{
          manana:8,
          tarde:8,
          noche:8
        },
        calendar:{},
        counters:{},
        history:[],
        extras:[],
        notes:{}
      }
    },

    activeProfile:"all",
    reminders: state.reminders || [],
    colors: state.colors || {},
    view: state.view || "month"
  };
}

function saveState(){
  localStorage.setItem("laboralAppPLM", JSON.stringify(state));
}

let currentDate = new Date();
let selectedCategory = "turno_manana";
let summaryYear = currentDate.getFullYear();

function getProfiles(){
  return Object.values(state.profiles);
}

function getProfile(id){
  return state.profiles[id];
}

function setActiveProfile(id){
  state.activeProfile = id;
  saveState();
  renderAll();
}

function activeProfiles(){
  if(state.activeProfile === "all"){
    return getProfiles();
  }

  return [getProfile(state.activeProfile)];
}

function renderProfileSelectors(){

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
    if(!el) return;

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

function renderYearSelectors(){

  ["summaryYear","counterYear","calendarYearSelect"].forEach(id => {

    const el = document.getElementById(id);
    if(!el || el.children.length) return;

    for(let y=2025;y<=2035;y++){

      const opt = document.createElement("option");

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

function setSelectedCategory(v){
  selectedCategory = v;
}

function showTab(id,btn){

  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.remove("active");
  });

  btn.classList.add("active");
}

function renderCategorySelect(){

  const select = document.getElementById("categorySelect");

  if(!select) return;

  select.innerHTML = "";

  categories.forEach(cat => {

    const opt = document.createElement("option");

    opt.value = cat.id;
    opt.textContent = cat.name;

    select.appendChild(opt);
  });

  select.value = selectedCategory;
}

function formatDate(d){

  return d.getFullYear() + "-" +
  String(d.getMonth()+1).padStart(2,"0") + "-" +
  String(d.getDate()).padStart(2,"0");
}

function renderCalendar(){

  const container = document.getElementById("calendarContainer");
  const title = document.getElementById("calendarTitle");

  if(!container) return;

  container.innerHTML = "";

  let y = currentDate.getFullYear();
  let m = currentDate.getMonth();

  title.textContent = currentDate.toLocaleDateString("es-ES",{
    month:"long",
    year:"numeric"
  });

  const weekdays = document.createElement("div");
  weekdays.className = "weekdays";

  ["L","M","X","J","V","S","D"].forEach(d => {

    const div = document.createElement("div");

    div.className = "weekday";
    div.textContent = d;

    weekdays.appendChild(div);
  });

  container.appendChild(weekdays);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const first = new Date(y,m,1);
  const last = new Date(y,m+1,0);

  let start = first.getDay();
  start = start === 0 ? 6 : start - 1;

  for(let i=0;i<start;i++){

    const e = document.createElement("div");
    e.className = "day empty";

    grid.appendChild(e);
  }

  for(let d=1;d<=last.getDate();d++){

    const date = new Date(y,m,d);
    const key = formatDate(date);

    const cell = document.createElement("div");
    cell.className = "day";

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = d;

    cell.appendChild(number);

    activeProfiles().forEach(profile => {

      const assigned = profile.calendar[key] || [];

      assigned.forEach(catId => {

        const cat = categories.find(c => c.id === catId);

        if(!cat) return;

        const row = document.createElement("div");
        row.className = "profile-shift";

        row.innerHTML = `
          <span class="profile-dot" style="background:${profile.color}"></span>
          <span class="profile-name">${profile.name}</span>
          <span class="profile-tag">${cat.tag}</span>
        `;

        cell.appendChild(row);
      });
    });

    cell.onclick = () => toggleDate(key);

    grid.appendChild(cell);
  }

  container.appendChild(grid);
}

function toggleDate(key){

  if(state.activeProfile === "all"){
    alert("Selecciona un perfil individual para editar.");
    return;
  }

  const profile = getProfile(state.activeProfile);

  if(!profile.calendar[key]){
    profile.calendar[key] = [];
  }

  if(profile.calendar[key].includes(selectedCategory)){

    profile.calendar[key] =
      profile.calendar[key].filter(x => x !== selectedCategory);

  } else {

    profile.calendar[key].push(selectedCategory);
  }

  saveState();

  renderCalendar();
  renderSummary();
}

function calculateProfileHours(profile,year){

  let manana = 0;
  let tarde = 0;
  let noche = 0;

  Object.entries(profile.calendar).forEach(([date,cats]) => {

    if(!date.startsWith(String(year))) return;

    cats.forEach(cat => {

      if(cat === "turno_manana"){
        manana += Number(profile.shifts.manana || 8);
      }

      if(cat === "turno_tarde"){
        tarde += Number(profile.shifts.tarde || 8);
      }

      if(cat === "turno_noche"){
        noche += Number(profile.shifts.noche || 8);
      }
    });
  });

  return {
    manana,
    tarde,
    noche,
    total: manana + tarde + noche
  };
}

function renderSummary(){

  const panel = document.getElementById("profileSummaryPanel");
  const grid = document.getElementById("summaryGrid");

  if(!panel || !grid) return;

  panel.innerHTML = "";

  activeProfiles().forEach(profile => {

    const hours = calculateProfileHours(profile,summaryYear);

    const card = document.createElement("div");

    card.className = "profile-dashboard-card";

    card.innerHTML = `
      <div class="profile-dashboard-top">
        <div class="profile-dashboard-user">
          <span class="profile-large-dot" style="background:${profile.color}"></span>
          <div>
            <div class="profile-dashboard-name">${profile.name}</div>
            <div class="profile-dashboard-type">
              ${profile.reduced ? "Jornada reducida" : "Jornada completa"}
            </div>
          </div>
        </div>

        <div class="profile-total-hours">
          ${hours.total}h
        </div>
      </div>

      <div class="hours-mini-grid">

        <div class="mini-hour-card">
          <div class="mini-hour-label">Mañana</div>
          <div class="mini-hour-value">${hours.manana}h</div>
        </div>

        <div class="mini-hour-card">
          <div class="mini-hour-label">Tarde</div>
          <div class="mini-hour-value">${hours.tarde}h</div>
        </div>

        <div class="mini-hour-card">
          <div class="mini-hour-label">Noche</div>
          <div class="mini-hour-value">${hours.noche}h</div>
        </div>

      </div>
    `;

    panel.appendChild(card);
  });

  grid.innerHTML = "";

  activeProfiles().forEach(profile => {

    categories
    .filter(c => c.countable)
    .forEach(cat => {

      const total =
        Number(profile.counters?.[summaryYear]?.[cat.id] || 0);

      const used = Object.entries(profile.calendar)
      .filter(([date,cats]) =>
        date.startsWith(String(summaryYear)) &&
        cats.includes(cat.id)
      ).length;

      const remain = Math.max(total - used,0);

      const card = document.createElement("div");
      card.className = "compact-summary-card";

      card.innerHTML = `
        <div class="compact-summary-top">
          <span class="mini-color" style="background:${cat.color}"></span>
          <span class="compact-tag">${cat.tag}</span>
        </div>

        <div class="compact-value">
          ${remain}
        </div>

        <div class="compact-label">
          ${cat.name}
        </div>

        <div class="compact-small">
          ${used}/${total}
        </div>
      `;

      grid.appendChild(card);
    });
  });
}

function renderCounters(){

  const year =
    document.getElementById("counterYear").value;

  const box =
    document.getElementById("counterInputs");

  if(!box) return;

  box.innerHTML = "";

  activeProfiles().forEach(profile => {

    const title = document.createElement("div");

    title.className = "profile-settings-title";
    title.innerHTML = `
      <span class="profile-large-dot" style="background:${profile.color}"></span>
      ${profile.name}
    `;

    box.appendChild(title);

    categories
    .filter(c => c.countable)
    .forEach(cat => {

      const value =
        Number(profile.counters?.[year]?.[cat.id] || 0);

      const row = document.createElement("div");
      row.className = "counter-row";

      row.innerHTML = `
        <div>
          <strong>${cat.name}</strong>
        </div>

        <div class="counter-control">

          <button class="counter-btn"
            onclick="changeCounterValue('${profile.id}','${cat.id}',-1)">
            −
          </button>

          <div class="counter-value">
            ${value}
          </div>

          <button class="counter-btn"
            onclick="changeCounterValue('${profile.id}','${cat.id}',1)">
            +
          </button>

        </div>
      `;

      box.appendChild(row);
    });
  });
}

function changeCounterValue(profileId,catId,delta){

  const year =
    document.getElementById("counterYear").value;

  const profile = getProfile(profileId);

  if(!profile.counters[year]){
    profile.counters[year] = {};
  }

  let current =
    Number(profile.counters[year][catId] || 0);

  profile.counters[year][catId] =
    Math.max(0,current + delta);

  saveState();
  renderCounters();
  renderSummary();
}

function saveCounters(){
  saveState();
  alert("Contadores guardados");
}

function renderProfileSettings(){

  const box =
    document.getElementById("profileSettings");

  if(!box) return;

  box.innerHTML = "";

  getProfiles().forEach(profile => {

    const card = document.createElement("div");
    card.className = "profile-config-card";

    card.innerHTML = `

      <div class="profile-settings-title">
        <span class="profile-large-dot"
          style="background:${profile.color}">
        </span>

        ${profile.name}
      </div>

      <div class="form-row">
        <label>Nombre</label>
        <input type="text"
          id="name-${profile.id}"
          value="${profile.name}">
      </div>

      <div class="form-row">
        <label>Color</label>
        <input type="color"
          id="color-${profile.id}"
          value="${profile.color}">
      </div>

      <div class="form-row">
        <label>
          <input type="checkbox"
            id="reduced-${profile.id}"
            ${profile.reduced ? "checked" : ""}>
          Jornada reducida
        </label>
      </div>

      <div class="shift-config-grid">

        <div>
          <label>Mañana</label>
          <input type="number"
            step="0.5"
            id="manana-${profile.id}"
            value="${profile.shifts.manana}">
        </div>

        <div>
          <label>Tarde</label>
          <input type="number"
            step="0.5"
            id="tarde-${profile.id}"
            value="${profile.shifts.tarde}">
        </div>

        <div>
          <label>Noche</label>
          <input type="number"
            step="0.5"
            id="noche-${profile.id}"
            value="${profile.shifts.noche}">
        </div>

      </div>
    `;

    box.appendChild(card);
  });
}

function saveProfiles(){

  getProfiles().forEach(profile => {

    profile.name =
      document.getElementById(`name-${profile.id}`).value;

    profile.color =
      document.getElementById(`color-${profile.id}`).value;

    profile.reduced =
      document.getElementById(`reduced-${profile.id}`).checked;

    profile.shifts.manana =
      Number(document.getElementById(`manana-${profile.id}`).value || 8);

    profile.shifts.tarde =
      Number(document.getElementById(`tarde-${profile.id}`).value || 8);

    profile.shifts.noche =
      Number(document.getElementById(`noche-${profile.id}`).value || 8);
  });

  saveState();

  renderAll();

  alert("Perfiles guardados");
}

function renderAll(){

  renderYearSelectors();
  renderProfileSelectors();
  renderCategorySelect();
  renderCalendar();
  renderSummary();
  renderCounters();
  renderProfileSettings();
}

document.addEventListener("DOMContentLoaded", renderAll);
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");

  setTimeout(() => {
    if (splash) {
      splash.classList.add("hidden");
    }
  }, 1200);
});

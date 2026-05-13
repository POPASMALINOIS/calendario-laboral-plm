const categories = [
  { id: "turno_manana", name: "TURNO MAÑANA", tag: "TM", type: "days", countable: false, color: "#2563eb" },
  { id: "vacaciones", name: "VACACIONES", tag: "VAC", type: "days", countable: true, color: "#22c55e" },
  { id: "dia_blanco", name: "DÍA BLANCO", tag: "DB", type: "days", countable: true, color: "#64748b" },
  { id: "dia_blanco_movil", name: "DÍA BLANCO MÓVIL", tag: "DBM", type: "days", countable: true, color: "#a855f7" },
  { id: "dia_blanco_trabajar", name: "DÍA BLANCO TRABAJAR", tag: "DBT", type: "days", countable: true, color: "#f97316" },
  { id: "baja", name: "BAJA", tag: "BJ", type: "days", countable: true, color: "#ef4444" },
  { id: "asuntos_propios", name: "ASUNTOS PROPIOS", tag: "AP", type: "days", countable: true, color: "#c084fc" },
  { id: "acompanamiento_1", name: "ACOMPAÑAMIENTO 1er GRADO", tag: "A1", type: "hours", countable: true, color: "#eab308" },
  { id: "acompanamiento_hijos", name: "ACOMPAÑAMIENTO HIJOS", tag: "AH", type: "hours", countable: true, color: "#ec4899" }
];

const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const weekDays = ["L","M","X","J","V","S","D"];

let state = JSON.parse(localStorage.getItem("laboralAppPLM") || "null") || {
  calendar: {},
  counters: {},
  history: [],
  extras: [],
  colors: {},
  notes: {},
  view: "month"
};

let selectedCategory = categories[0].id;
let currentDate = new Date();
if(currentDate.getFullYear() < 2026) currentDate = new Date(2026,0,1);
if(currentDate.getFullYear() > 2032) currentDate = new Date(2032,11,31);

let summaryYear = currentDate.getFullYear();
let editingDateKey = null;
let longPressTimer = null;
let longPressTriggered = false;

function saveState() {
  localStorage.setItem("laboralAppPLM", JSON.stringify(state));
}

function getColor(id) {
  return state.colors[id] || categories.find(c => c.id === id)?.color || "#2563eb";
}

function formatDate(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function addDays(d, n) {
  let x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  renderAll();
}

function renderYearSelectors() {
  ["summaryYear","counterYear","calendarYearSelect"].forEach(id=>{
    let el=document.getElementById(id);
    if(!el || el.children.length) return;

    for(let y=2026;y<=2032;y++){
      let opt=document.createElement("option");
      opt.value=y;
      opt.textContent=y;
      el.appendChild(opt);
    }
  });

  document.getElementById("summaryYear").value=summaryYear;
  document.getElementById("counterYear").value=summaryYear;
  document.getElementById("calendarYearSelect").value=currentDate.getFullYear();
}

function changeSummaryYear(y){
  summaryYear=Number(y);
  renderSummary();
}

function jumpToYear(y){
  currentDate.setFullYear(Number(y));
  renderCalendar();
}

function renderCategorySelect(){
  let select=document.getElementById("categorySelect");
  if(!select) return;

  select.innerHTML="";

  categories.forEach(cat=>{
    let opt=document.createElement("option");
    opt.value=cat.id;
    opt.textContent=cat.name;
    select.appendChild(opt);
  });

  select.value=selectedCategory;
}

function setSelectedCategory(v){
  selectedCategory=v;
}

function setCalendarView(v){
  state.view=v;
  saveState();
  renderCalendar();
}

function changePeriod(n){
  if(state.view==="year") currentDate.setFullYear(currentDate.getFullYear()+n);
  if(state.view==="month") currentDate.setMonth(currentDate.getMonth()+n);
  if(state.view==="week") currentDate.setDate(currentDate.getDate()+(n*7));

  if(currentDate.getFullYear()<2026) currentDate=new Date(2026,0,1);
  if(currentDate.getFullYear()>2032) currentDate=new Date(2032,11,31);

  document.getElementById("calendarYearSelect").value=currentDate.getFullYear();

  renderCalendar();
}

function easter(y){
  let a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,da);
}

function holidays(y){
  let h={},e=easter(y);
  function add(k,n){h[k]=n;}
  add(`${y}-01-01`,"Año Nuevo");
  add(`${y}-01-06`,"Reyes");
  add(formatDate(addDays(e,-3)),"Jueves Santo");
  add(formatDate(addDays(e,-2)),"Viernes Santo");
  add(`${y}-05-01`,"Trabajo");
  add(`${y}-05-02`,"Madrid");
  add(`${y}-08-15`,"Asunción");
  add(`${y}-10-12`,"Fiesta Nacional");
  add(`${y}-12-08`,"Inmaculada");
  add(`${y}-12-25`,"Navidad");
  return h;
}

function attachPressEvents(el,key){
  el.addEventListener("touchstart",()=>{
    longPressTriggered=false;
    longPressTimer=setTimeout(()=>{
      longPressTriggered=true;
      openEditModal(key);
    },650);
  });

  el.addEventListener("touchend",()=>{
    clearTimeout(longPressTimer);
    setTimeout(()=>longPressTriggered=false,100);
  });

  el.addEventListener("mousedown",()=>{
    longPressTriggered=false;
    longPressTimer=setTimeout(()=>{
      longPressTriggered=true;
      openEditModal(key);
    },650);
  });

  el.addEventListener("mouseup",()=>clearTimeout(longPressTimer));
}

function createDayCell(date, mini=false){
  const key=formatDate(date);
  const assigned=state.calendar[key]||[];
  const holiday=holidays(date.getFullYear())[key];
  const today=formatDate(new Date());

  let cell=document.createElement("div");
  cell.className=mini?"year-mini-day":"day";

  if(key===today) cell.classList.add("today");

  if(assigned.length){
    cell.classList.add("has");

    let colors=assigned.map(id=>getColor(id));

    if(colors.length===1){
      cell.style.background=colors[0];
    }else{
      let step=100/colors.length;
      cell.style.background=`linear-gradient(135deg, ${colors.map((c,i)=>`${c} ${i*step}% ${(i+1)*step}%`).join(", ")})`;
    }
  }

  let num=document.createElement("div");
  num.className="day-number"+(holiday?" holiday":"");
  num.textContent=date.getDate();
  cell.appendChild(num);

  if(!mini && holiday){
    let h=document.createElement("div");
    h.className="holiday-label";
    h.textContent=holiday;
    cell.appendChild(h);
  }

  if(!mini){
    assigned.forEach(id=>{
      let cat=categories.find(c=>c.id===id);
      if(!cat) return;

      let tag=document.createElement("span");
      tag.className="tag";
      tag.textContent=cat.tag;
      cell.appendChild(tag);
    });
  }

  cell.onclick=()=>{
    if(longPressTriggered) return;
    toggleDate(key);
  };

  attachPressEvents(cell,key);

  return cell;
}

function renderMonthCalendar(){
  const container=document.getElementById("calendarContainer");
  const title=document.getElementById("calendarTitle");

  let y=currentDate.getFullYear();
  let m=currentDate.getMonth();

  title.textContent=`${monthNames[m]} ${y}`;
  container.innerHTML="";

  let weekdays=document.createElement("div");
  weekdays.className="weekdays";

  weekDays.forEach(w=>{
    let d=document.createElement("div");
    d.className="weekday";
    d.textContent=w;
    weekdays.appendChild(d);
  });

  container.appendChild(weekdays);

  let grid=document.createElement("div");
  grid.className="calendar-grid";

  let first=new Date(y,m,1);
  let last=new Date(y,m+1,0);

  let start=first.getDay();
  start=start===0?6:start-1;

  for(let i=0;i<start;i++){
    let e=document.createElement("div");
    e.className="day empty";
    grid.appendChild(e);
  }

  for(let d=1;d<=last.getDate();d++){
    grid.appendChild(createDayCell(new Date(y,m,d)));
  }

  container.appendChild(grid);
}

function renderWeekCalendar(){
  const container=document.getElementById("calendarContainer");
  const title=document.getElementById("calendarTitle");

  container.innerHTML="";

  let base=new Date(currentDate);
  let day=base.getDay()===0?6:base.getDay()-1;
  let monday=addDays(base,-day);

  title.textContent="Semana";

  let weekdays=document.createElement("div");
  weekdays.className="weekdays";

  weekDays.forEach(w=>{
    let d=document.createElement("div");
    d.className="weekday";
    d.textContent=w;
    weekdays.appendChild(d);
  });

  container.appendChild(weekdays);

  let grid=document.createElement("div");
  grid.className="calendar-grid";

  for(let i=0;i<7;i++){
    grid.appendChild(createDayCell(addDays(monday,i)));
  }

  container.appendChild(grid);
}

function renderYearCalendar(){
  const container=document.getElementById("calendarContainer");
  const title=document.getElementById("calendarTitle");

  let y=currentDate.getFullYear();

  title.textContent=y;
  container.innerHTML="";

  let yearGrid=document.createElement("div");
  yearGrid.className="year-grid";

  for(let m=0;m<12;m++){
    let box=document.createElement("div");
    box.className="year-month";

    let h=document.createElement("h4");
    h.textContent=monthNames[m];
    box.appendChild(h);

    let grid=document.createElement("div");
    grid.className="year-mini-grid";

    let first=new Date(y,m,1);
    let last=new Date(y,m+1,0);

    let start=first.getDay();
    start=start===0?6:start-1;

    for(let i=0;i<start;i++){
      let e=document.createElement("div");
      e.className="year-mini-day";
      e.style.opacity="0";
      grid.appendChild(e);
    }

    for(let d=1;d<=last.getDate();d++){
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

  if(state.view==="month") renderMonthCalendar();
  if(state.view==="week") renderWeekCalendar();
  if(state.view==="year") renderYearCalendar();
}

function toggleDate(key){
  if(!state.calendar[key]) state.calendar[key]=[];

  if(state.calendar[key].includes(selectedCategory)){
    state.calendar[key]=state.calendar[key].filter(x=>x!==selectedCategory);
  }else{
    state.calendar[key].push(selectedCategory);

    let cat=categories.find(c=>c.id===selectedCategory);

    if(cat.type==="hours"){
      let hours=prompt("¿Cuántas horas has gastado?","");
      if(hours){
        if(!state.notes[key]) state.notes[key]={};

        state.notes[key][selectedCategory]={
          hours:Number(hours)||0,
          note:prompt("Observaciones:","")||""
        };
      }
    }
  }

  if(!state.calendar[key].length) delete state.calendar[key];

  saveState();
  renderCalendar();
  renderSummary();
}

function calculateUsed(catId,year){
  let cat=categories.find(c=>c.id===catId);

  if(cat.type==="hours"){
    let total=0;

    Object.entries(state.notes||{}).forEach(([date,items])=>{
      if(date.startsWith(String(year)) && items[catId]){
        total += Number(items[catId].hours||0);
      }
    });

    return total;
  }

  return Object.entries(state.calendar)
    .filter(([date,cats])=>date.startsWith(String(year)) && cats.includes(catId))
    .length;
}

function renderSummary(){
  const grid=document.getElementById("summaryGrid");
  if(!grid) return;

  grid.innerHTML="";

  categories.filter(c=>c.countable).forEach(cat=>{
    let used=calculateUsed(cat.id,summaryYear);
    let total=Number(state.counters?.[summaryYear]?.[cat.id]||0);
    let remaining=total-used;
    let percent=total>0?Math.min((used/total)*100,100):0;

    let card=document.createElement("div");
    card.className="card summary-card";

    card.innerHTML=`
      <div class="summary-title">${cat.name}</div>
      <div class="summary-value">${remaining}${cat.type==="hours"?"h":"d"}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%;background:${getColor(cat.id)}"></div>
      </div>
      <div class="summary-small">${used}/${total} usados</div>
    `;

    grid.appendChild(card);
  });
}

function renderCounters(){
  let year=document.getElementById("counterYear").value;
  let box=document.getElementById("counterInputs");
  box.innerHTML="";

  categories.filter(c=>c.countable).forEach(cat=>{
    let value=state.counters?.[year]?.[cat.id]||0;

    let row=document.createElement("div");
    row.className="counter-row";

    row.innerHTML=`
      <div>
        <strong>${cat.name}</strong>
        <div class="small">${cat.type==="hours"?"Horas":"Días"} anuales</div>
      </div>
      <input type="number" step="0.25" id="counter-${cat.id}" value="${value}">
    `;

    box.appendChild(row);
  });
}

function saveCounters(){
  let year=document.getElementById("counterYear").value;
  if(!state.counters[year]) state.counters[year]={};

  categories.filter(c=>c.countable).forEach(cat=>{
    state.counters[year][cat.id]=Number(document.getElementById(`counter-${cat.id}`).value||0);
  });

  saveState();
  renderSummary();
  alert("Contadores guardados");
}

function renderColors(){
  let box=document.getElementById("colorSettings");
  if(!box) return;

  box.innerHTML="";

  categories.forEach(cat=>{
    let row=document.createElement("div");
    row.className="color-row";

    let color=getColor(cat.id);

    row.innerHTML=`
      <div>
        <span class="color-preview" style="background:${color}"></span>
        <strong>${cat.name}</strong>
      </div>
      <input type="color" id="color-${cat.id}" value="${color}">
    `;

    box.appendChild(row);
  });
}

function saveColors(){
  categories.forEach(cat=>{
    let picker=document.getElementById(`color-${cat.id}`);
    if(picker){
      state.colors[cat.id]=picker.value;
    }
  });

  saveState();
  renderAll();
  alert("Colores guardados");
}

function resetApp(){
  if(confirm("¿Seguro que deseas borrar todos los datos?")){
    localStorage.removeItem("laboralAppPLM");
    location.reload();
  }
}

function renderHistoryForm(){}
function renderHistoryList(){}
function saveHistory(){}
function renderExtraList(){}
function saveExtra(){}

function openEditModal(key){
  editingDateKey=key;

  let modal=document.getElementById("editModal");
  let select=document.getElementById("modalCategory");

  document.getElementById("modalTitle").textContent=`Editar ${key}`;

  select.innerHTML="";

  categories.forEach(cat=>{
    let opt=document.createElement("option");
    opt.value=cat.id;
    opt.textContent=cat.name;
    select.appendChild(opt);
  });

  select.value=(state.calendar[key] && state.calendar[key][0]) || categories[0].id;

  toggleModalHours();

  let current=state.notes?.[key]?.[select.value] || {};

  document.getElementById("modalHours").value=current.hours||"";
  document.getElementById("modalNote").value=current.note||"";

  modal.classList.add("active");
}

function closeEditModal(){
  document.getElementById("editModal").classList.remove("active");
}

function toggleModalHours(){
  let catId=document.getElementById("modalCategory").value;
  let cat=categories.find(c=>c.id===catId);

  document.getElementById("modalHoursRow").style.display=
    cat.type==="hours" ? "block" : "none";
}

function saveEditModal(){
  if(!editingDateKey) return;

  let catId=document.getElementById("modalCategory").value;
  let note=document.getElementById("modalNote").value;
  let hours=Number(document.getElementById("modalHours").value||0);

  if(!state.calendar[editingDateKey]) state.calendar[editingDateKey]=[];

  if(!state.calendar[editingDateKey].includes(catId)){
    state.calendar[editingDateKey].push(catId);
  }

  if(!state.notes[editingDateKey]) state.notes[editingDateKey]={};

  state.notes[editingDateKey][catId]={
    note,
    hours
  };

  saveState();
  closeEditModal();
  renderCalendar();
  renderSummary();
}

function renderAll(){
  renderYearSelectors();
  renderCategorySelect();
  renderCalendar();
  renderSummary();
  renderCounters();
  renderColors();
}

document.addEventListener("DOMContentLoaded",renderAll);

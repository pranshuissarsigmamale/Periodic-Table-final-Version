window.addEventListener("DOMContentLoaded", () => {

const table = document.getElementById("table");
const searchInput = document.getElementById("search");
const modal = document.getElementById("modal");
const title = document.getElementById("title");
const content = document.getElementById("content");
const closeBtn = document.getElementById("close");

let elementsData = {};
let allElements = [];
let ready = false;
let activeTimeouts = [];

/* SAFE */
const safe = v => (v ?? "N/A");

/* THEME */
const toggleBtn = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}

toggleBtn.onclick = () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme",
        document.body.classList.contains("light") ? "light" : "dark"
    );
};

/* CATEGORY */
function getCategoryClass(cat){
    if(!cat) return "";
    cat = cat.toLowerCase();
    if(cat.includes("alkaline")) return "alkaline";
    if(cat.includes("alkali")) return "alkali";
    if(cat.includes("transition")) return "transition";
    if(cat.includes("metalloid")) return "metalloid";
    if(cat.includes("nonmetal")) return "nonmetal";
    if(cat.includes("halogen")) return "halogen";
    if(cat.includes("noble")) return "noble";
    return "";
}

/* LOAD */
table.innerHTML = "<h2>Loading...</h2>";

fetch("https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json")
.then(res=>res.json())
.then(data=>{
    renderTable(data);
    ready = true;
})
.catch(()=> table.innerHTML="<h2>⚠ Failed to load</h2>");

function renderTable(data){
    const frag = document.createDocumentFragment();

    data.elements.forEach(el=>{
        elementsData[el.symbol]=el;

        const div=document.createElement("div");
        div.className="element "+getCategoryClass(el.category);

        div.dataset.symbol=el.symbol;
        div.dataset.name=el.name;

        div.style.gridColumn=el.xpos;
        div.style.gridRow=el.ypos;

        div.innerHTML=`${el.number}<br><b>${el.symbol}</b>`;

        frag.appendChild(div);
    });

    table.innerHTML="";
    table.appendChild(frag);
    allElements = table.querySelectorAll(".element");
}

/* CLICK */
table.addEventListener("click",(e)=>{
    const elDiv = e.target.closest(".element");
    if(!elDiv || !ready) return;
    openModal(elDiv.dataset.symbol);
});

/* SEARCH */
let timer;
searchInput.addEventListener("input",()=>{
    clearTimeout(timer);

    timer=setTimeout(()=>{
        const val = searchInput.value.trim().toLowerCase();
        let first=null;

        allElements.forEach(div=>{
            const match =
                div.dataset.symbol.toLowerCase().includes(val) ||
                div.dataset.name.toLowerCase().includes(val);

            div.classList.toggle("highlight", val && match);
            div.style.opacity = val ? (match ? "1":"0.15") : "1";

            if(!first && match) first = div;
        });

        if(first){
            requestAnimationFrame(()=>{
                first.scrollIntoView({behavior:"smooth",block:"center"});
            });
        }
    },120);
});

/* MODAL */
function openModal(symbol){
    const el = elementsData[symbol];
    if(!el) return;

    clearAnimations();

    modal.classList.add("show");

    title.textContent = el.name;
    content.replaceChildren();

    content.appendChild(buildInfo(el));
    content.appendChild(section("Electron Config"));
    content.appendChild(animateConfig(el.electron_configuration||""));
    content.appendChild(section("Orbital Diagram"));
    content.appendChild(generateOrbitalBoxes(el.electron_configuration||""));
    content.appendChild(section("Shell Model"));
    content.appendChild(generateShellDiagram(el.number));
}

/* CLOSE */
function closeModal(){
    modal.classList.remove("show");
    clearAnimations();
}

closeBtn.onclick = closeModal;
window.addEventListener("click",e=>{
    if(e.target===modal) closeModal();
});
document.addEventListener("keydown",e=>{
    if(e.key==="Escape") closeModal();
});

/* HELPERS */
function section(t){
    const h=document.createElement("h3");
    h.textContent=t;
    return h;
}

function buildInfo(el){
    const d=document.createElement("div");
    d.innerHTML=`
        <b>Atomic Number:</b> ${safe(el.number)}<br>
        <b>Mass:</b> ${safe(el.atomic_mass)}<br>
        <b>Category:</b> ${safe(el.category)}<br>
    `;
    return d;
}

/* ANIMATION */
function animateConfig(config){
    const d=document.createElement("div");

    config.split(" ").forEach((o,i)=>{
        const s=document.createElement("span");
        s.className="orbital";
        s.textContent=o;

        const id=setTimeout(()=> s.style.opacity=1, i*150);
        activeTimeouts.push(id);

        d.appendChild(s);
    });

    return d;
}

function clearAnimations(){
    activeTimeouts.forEach(id=>clearTimeout(id));
    activeTimeouts=[];
}

/* ORBITALS */
const subshell={s:1,p:3,d:5,f:7};

function generateOrbitalBoxes(config){
    const c=document.createElement("div");
    config=config.replace(/\[.*?\]/g,"");

    config.split(" ").forEach(o=>{
        const m=o.match(/(\d+)([spdf])(\d+)/);
        if(!m) return;

        let e=parseInt(m[3]);
        let boxes=subshell[m[2]];
        let arr=Array(boxes).fill(0);

        for(let i=0;i<boxes&&e>0;i++){arr[i]++;e--;}
        for(let i=0;i<boxes&&e>0;i++){arr[i]++;e--;}

        arr.forEach(v=>{
            const b=document.createElement("div");
            b.className="orbital-box";
            b.textContent=v===2?"↑↓":v===1?"↑":"";
            c.appendChild(b);
        });
    });

    return c;
}

/* SHELL */
function generateShellDiagram(eCount){
    const container=document.createElement("div");
    container.className="atom";

    const shells=[2,8,18,32,32,18,8];
    let r=eCount;

    shells.forEach((cap,i)=>{
        if(r<=0) return;

        let fill=Math.min(cap,r);
        r-=fill;

        const orbit=document.createElement("div");
        orbit.className="orbit";
        orbit.style.width=orbit.style.height=(80+i*40)+"px";

        for(let j=0;j<fill;j++){
            const e=document.createElement("div");
            e.className="electron orbiting";
            e.style.animationDuration=(4+i*2)+"s";
            orbit.appendChild(e);
        }

        container.appendChild(orbit);
    });

    return container;
}

});

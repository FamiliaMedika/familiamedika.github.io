/* Familia Medika Health Assistant HA-3 */

let healthState={
 step:0,
 patient_relation:"",
 age:"",
 complaint:"",
 duration:"",
 medical_history:"",
 medication:"",
 danger_sign:""
};

function addHealthMessage(text,type="bot"){
 const box=document.getElementById("aiMessages");
 const d=document.createElement("div");
 d.className="ai-msg "+type;
 d.innerHTML=text;
 box.appendChild(d);
 box.scrollTop=box.scrollHeight;
}

function openHealthAssistant(){
 const panel=document.getElementById("aiPanel");
 panel.classList.add("open");
 if(!document.getElementById("haWelcome")){
  const d=document.createElement("div");
  d.id="haWelcome";
  d.className="ai-msg bot";
  d.innerHTML=`Halo 👋<br><br>
  Saya <b>Health Assistant Familia Medika</b>.<br><br>
  Siapa yang membutuhkan bantuan kesehatan?
  <div class="health-choice">
  <button onclick="selectRelation('Saya sendiri')">👤 Saya sendiri</button>
  <button onclick="selectRelation('Orang tua')">👴 Orang tua</button>
  <button onclick="selectRelation('Anak')">👶 Anak</button>
  <button onclick="selectRelation('Keluarga lain')">👨‍👩‍👧 Keluarga lain</button>
  </div>`;
  document.getElementById("aiMessages").appendChild(d);
  healthState.step=1;
 }
}

function selectRelation(v){
 healthState.patient_relation=v;
 addHealthMessage(v,"user");
 healthState.step=2;
 setTimeout(()=>addHealthMessage("Berapa usia pasien?"),400);
}

function processHealthInput(v){
 if(!v.trim()) return;
 addHealthMessage(v,"user");
 switch(healthState.step){
 case 2: healthState.age=v; healthState.step=3; setTimeout(()=>addHealthMessage("Apa keluhan utama pasien?"),400); break;
 case 3: healthState.complaint=v; healthState.step=4; setTimeout(()=>addHealthMessage("Sudah berapa lama keluhan terjadi?"),400); break;
 case 4: healthState.duration=v; healthState.step=5; setTimeout(()=>addHealthMessage("Apakah ada riwayat penyakit sebelumnya?"),400); break;
 case 5: healthState.medical_history=v; healthState.step=6; setTimeout(()=>addHealthMessage("Apakah pasien mengonsumsi obat rutin?"),400); break;
 case 6: healthState.medication=v; healthState.step=7; setTimeout(()=>addHealthMessage("Apakah ada tanda bahaya seperti sesak berat, nyeri dada, penurunan kesadaran, atau luka memburuk?"),400); break;
 case 7: healthState.danger_sign=v; showRisk(); break;
 }
}

function showRisk(){
 let risk="LOW";
 let service="Health Assessment / Wellness Program";
 let c=(healthState.complaint+" "+healthState.medical_history).toLowerCase();

 if(healthState.danger_sign.toLowerCase().includes("ada")){
  risk="HIGH"; service="Pemeriksaan segera / IGD";
 } else if(c.includes("luka")||c.includes("diabetes")||parseInt(healthState.age)>=65){
  risk="MODERATE"; service="Home Visit Dokter / Home Care / Wound Care";
 }

 addHealthMessage(`<b>Ringkasan Awal</b><br><br>
 Usia: ${healthState.age}<br>
 Keluhan: ${healthState.complaint}<br><br>
 Risk Level:<br>
 ${risk==="HIGH"?"🔴 HIGH RISK":risk==="MODERATE"?"🟡 MODERATE RISK":"🟢 LOW RISK"}
 <br><br>
 Rekomendasi:<br><b>${service}</b>
 <br><br>
 <button onclick="location.href='/asesmen/'">🩺 Lanjut Health Assessment</button>`);

}

document.addEventListener("DOMContentLoaded",()=>{
 const input=document.getElementById("aiInput");
 const close=document.getElementById("aiClose");
 if(input) input.addEventListener("keydown",e=>{if(e.key==="Enter"){processHealthInput(input.value);input.value="";}});
 if(close) close.onclick=()=>document.getElementById("aiPanel").classList.remove("open");
});

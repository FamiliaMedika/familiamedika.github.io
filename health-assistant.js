/* Familia Medika Health Assistant HA-3 Clinical Intake */

let healthState={
 step:0,
 patient_relation:null,
 age:null,
 complaint:null,
 duration:null,
 medical_history:null,
 medication:null,
 danger_sign:null
};

function openHealthAssistant(){

 const panel=document.getElementById("aiPanel");
 if(panel) panel.classList.add("open");

 const messages=document.getElementById("aiMessages");

 if(messages && !document.getElementById("healthWelcome")){

  const div=document.createElement("div");
  div.id="healthWelcome";
  div.className="ai-msg bot";

  div.innerHTML=`
  Halo 👋<br><br>
  Saya <b>Health Assistant Familia Medika</b>.<br><br>
  Saya membantu melakukan penilaian awal kesehatan dan mengarahkan layanan yang sesuai.<br><br>
  Siapa yang membutuhkan bantuan kesehatan?
  <div class="health-choice">
  <button onclick="selectRelation('Saya sendiri')">👤 Saya sendiri</button>
  <button onclick="selectRelation('Orang tua')">👴 Orang tua</button>
  <button onclick="selectRelation('Anak')">👶 Anak</button>
  <button onclick="selectRelation('Keluarga lain')">👨‍👩‍👧 Keluarga lain</button>
  </div>`;

  messages.appendChild(div);
  messages.scrollTop=messages.scrollHeight;
  healthState.step=1;
 }
}

function addHealthMessage(text,type="bot"){
 const box=document.getElementById("aiMessages");
 const div=document.createElement("div");
 div.className="ai-msg "+type;
 div.innerHTML=text;
 box.appendChild(div);
 box.scrollTop=box.scrollHeight;
}

function selectRelation(value){
 healthState.patient_relation=value;
 addHealthMessage(value,"user");
 setTimeout(()=>{
  addHealthMessage("Baik. Berapa usia pasien?");
  healthState.step=2;
 },400);
}

function processHealthInput(text){
 if(!text)return;
 addHealthMessage(text,"user");

 switch(healthState.step){
 case 2:
  healthState.age=text;
  healthState.step=3;
  addHealthMessage("Apa keluhan utama yang dirasakan?");
  break;
 case 3:
  healthState.complaint=text;
  healthState.step=4;
  addHealthMessage("Sudah berapa lama keluhan terjadi?");
  break;
 case 4:
  healthState.duration=text;
  healthState.step=5;
  addHealthMessage("Apakah ada riwayat penyakit sebelumnya?");
  break;
 case 5:
  healthState.medical_history=text;
  healthState.step=6;
  addHealthMessage("Apakah pasien mengonsumsi obat rutin?");
  break;
 case 6:
  healthState.medication=text;
  healthState.step=7;
  addHealthMessage("Apakah ada tanda bahaya seperti sesak berat, nyeri dada, penurunan kesadaran, perdarahan, atau luka menghitam?");
  break;
 case 7:
  healthState.danger_sign=text;
  generateRisk();
  break;
 }
}

function generateRisk(){

 let risk="LOW";
 let service="Health Assessment / Wellness Program";

 let c=(healthState.complaint||"").toLowerCase();
 let h=(healthState.medical_history||"").toLowerCase();

 if((healthState.danger_sign||"").toLowerCase().includes("ada")){
  risk="HIGH";
  service="Pemeriksaan segera / fasilitas kesehatan";
 }
 else if(c.includes("luka") || h.includes("diabetes") || Number(healthState.age)>=65){
  risk="MODERATE";
  service="Home Visit Dokter / Home Care / Wound Care";
 }

 addHealthMessage(`
 <b>Ringkasan Awal Kesehatan</b><br><br>
 👤 ${healthState.patient_relation}<br>
 🎂 Usia: ${healthState.age}<br>
 Keluhan: ${healthState.complaint}<br><br>
 Risk Level:<br>
 ${risk==="HIGH"?"🔴 HIGH RISK":risk==="MODERATE"?"🟡 MODERATE RISK":"🟢 LOW RISK"}<br><br>
 Rekomendasi:<br>
 <b>${service}</b><br><br>
 <div class="health-choice">
 <button onclick="location.href='/asesmen/'">🩺 Lanjut Health Assessment</button>
 </div>
 `);
}

document.addEventListener("DOMContentLoaded",()=>{
 const input=document.getElementById("aiInput");
 if(input){
  input.addEventListener("keydown",e=>{
   if(e.key==="Enter"){
    processHealthInput(input.value);
    input.value="";
   }
  });
 }
});

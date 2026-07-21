
/* =====================================================
   Familia Medika Health Assistant
   HA-3 Clinical Intake Flow FINAL
   9 Step Clinical Intake Engine
   ===================================================== */

let healthState = {
  step: 1,
  patient_relation: "",
  age: "",
  chief_complaint: "",
  duration: "",
  complaint_detail: "",
  medical_history: "",
  medication: "",
  danger_sign: "",
  risk_level: "",
  recommended_service: []
};


function openHealthAssistant(){

  const panel=document.getElementById("aiPanel");

  if(panel){
    panel.classList.add("open");
  }

  const messages=document.getElementById("aiMessages");

  if(messages && !document.getElementById("healthWelcome")){

    const div=document.createElement("div");

    div.id="healthWelcome";
    div.className="ai-msg bot";

    div.innerHTML=`
    Halo 👋

    Saya <b>Health Assistant Familia Medika</b>.

    <br><br>

    Saya membantu melakukan penilaian awal kesehatan
    untuk menentukan kebutuhan layanan yang sesuai.

    <br><br>

    <b>Siapa yang membutuhkan bantuan kesehatan?</b>

    <div class="health-choice">

      <button onclick="selectRelation('Saya sendiri')">
      👤 Saya sendiri
      </button>

      <button onclick="selectRelation('Orang tua')">
      👴 Orang tua
      </button>

      <button onclick="selectRelation('Anak')">
      👶 Anak
      </button>

      <button onclick="selectRelation('Keluarga lain')">
      👨‍👩‍👧 Keluarga lain
      </button>

    </div>
    `;

    messages.appendChild(div);
    messages.scrollTop=messages.scrollHeight;

  }

}


function addHealthMessage(text,type="bot"){

  const messages=document.getElementById("aiMessages");

  const div=document.createElement("div");

  div.className="ai-msg "+type;

  div.innerHTML=text;

  messages.appendChild(div);

  messages.scrollTop=messages.scrollHeight;

}



function selectRelation(value){

  healthState.patient_relation=value;

  addHealthMessage(value,"user");

  setTimeout(()=>{

    addHealthMessage(`
    Baik.

    <br><br>

    <b>Berapa usia pasien?</b>
    `);

    healthState.step=2;

  },400);

}



function processHealthInput(text){

  if(!text.trim()) return;

  addHealthMessage(text,"user");


  switch(healthState.step){

    case 2:
      healthState.age=text;
      askComplaint();
      break;


    case 3:
      healthState.chief_complaint=text;
      askDuration();
      break;


    case 4:
      healthState.duration=text;
      askComplaintDetail();
      break;


    case 5:
      healthState.complaint_detail=text;
      askHistory();
      break;


    case 6:
      healthState.medical_history=text;
      askMedication();
      break;


    case 7:
      healthState.medication=text;
      askDanger();
      break;


    case 8:
      healthState.danger_sign=text;
      generateRisk();
      break;

  }

}



/* STEP 3 */

function askComplaint(){

setTimeout(()=>{

addHealthMessage(`
<b>Apa keluhan utama pasien?</b>

<br><br>

Contoh:
<br>
🌡 Demam
<br>
😷 Batuk / sesak napas
<br>
🩹 Luka sulit sembuh
<br>
🩸 Gula darah tinggi
<br>
❤️ Nyeri dada
<br>
🚶 Sulit berjalan

`);

healthState.step=3;

},400);

}



/* STEP 4 */

function askDuration(){

setTimeout(()=>{

addHealthMessage(`
<b>Sudah berapa lama keluhan terjadi?</b>

<br><br>

Contoh:
<br>
• Hari ini
<br>
• 3 hari
<br>
• 2 minggu
<br>
• 1 bulan

`);

healthState.step=4;

},400);

}



/* STEP 5 */

function askComplaintDetail(){

setTimeout(()=>{

addHealthMessage(`
<b>Ceritakan keluhan utama pasien</b>

<br><br>

Contoh:
<br>
"Luka kaki diabetes sejak 2 minggu,
keluar cairan dan terasa nyeri"

`);

healthState.step=5;

},400);

}



/* STEP 6 */

function askHistory(){

setTimeout(()=>{

addHealthMessage(`
<b>Apakah ada riwayat penyakit sebelumnya?</b>

<br><br>

Contoh:
<br>
✓ Diabetes
<br>
✓ Hipertensi
<br>
✓ Stroke
<br>
✓ Jantung
<br>
✓ Ginjal
<br>
✓ Tidak ada

`);

healthState.step=6;

},400);

}



/* STEP 7 */

function askMedication(){

setTimeout(()=>{

addHealthMessage(`
<b>Apakah ada obat rutin yang sedang diminum?</b>

<br><br>

Contoh:
<br>
• Obat diabetes
<br>
• Obat tekanan darah
<br>
• Pengencer darah
<br>
• Tidak ada

`);

healthState.step=7;

},400);

}



/* STEP 8 */

function askDanger(){

setTimeout(()=>{

addHealthMessage(`
<b>Apakah ada tanda bahaya?</b>

<br><br>

🚨 Sesak napas berat
<br>
🚨 Nyeri dada
<br>
🚨 Penurunan kesadaran
<br>
🚨 Kejang
<br>
🚨 Perdarahan berat
<br>
🚨 Demam tinggi menetap
<br>
🚨 Luka menghitam / bernanah banyak

<br><br>

Jawab:
<b>Ada</b> atau <b>Tidak ada</b>

`);

healthState.step=8;

},400);

}



/* STEP 9 */

function generateRisk(){

let complaint=(healthState.chief_complaint+
" "+healthState.complaint_detail).toLowerCase();

let history=(healthState.medical_history||"").toLowerCase();

let danger=(healthState.danger_sign||"").toLowerCase();


let risk="LOW";
let services=["Health Assessment","Wellness Program"];


if(danger.includes("ada")){

risk="HIGH";
services=["Pemeriksaan segera","IGD"];

}

else if(
 complaint.includes("luka") ||
 history.includes("diabetes") ||
 history.includes("stroke") ||
 parseInt(healthState.age)>=65
){

risk="MODERATE";
services=[
"Home Visit Dokter",
"Home Care",
"Wound Care"
];

}


healthState.risk_level=risk;
healthState.recommended_service=services;


setTimeout(()=>{

addHealthMessage(`

<b>📋 Ringkasan Awal Kesehatan</b>

<br><br>

👤 Pasien:
${healthState.patient_relation}

<br><br>

🎂 Usia:
${healthState.age}

<br><br>

🩺 Keluhan:
${healthState.chief_complaint}

<br><br>

📝 Detail:
${healthState.complaint_detail}

<br><br>

📌 Riwayat:
${healthState.medical_history}

<br><br>

💊 Obat:
${healthState.medication}

<br><br>

<b>Risk Level:</b>

<br>

${
risk==="HIGH" 
?"🔴 HIGH RISK"
:
risk==="MODERATE"
?"🟡 MODERATE RISK"
:
"🟢 LOW RISK"
}

<br><br>

<b>Rekomendasi Familia Medika:</b>

<br>
${services.join("<br>")}


<br><br>

<div class="health-choice">

<button onclick="location.href='/asesmen/'">
🩺 Lanjutkan Health Assessment
</button>

</div>

`);

},700);

}



document.addEventListener("DOMContentLoaded",()=>{

const input=document.getElementById("aiInput");

if(input){

input.addEventListener("keydown",(e)=>{

if(e.key==="Enter"){

processHealthInput(input.value);

input.value="";

}

});

}

});

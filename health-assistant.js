
/* =====================================================
 Familia Medika Health Assistant
 HA-3 Human Conversation + Progress Indicator FINAL
 ===================================================== */

let healthState = {

step:1,

patient_relation:"",
age:"",
chief_complaint:"",
duration:"",
complaint_detail:"",
medical_history:"",
medication:"",
danger_sign:"",
risk_level:"",

confirmation:false,
confirmationStep:"",

conversation:{
 lastQuestion:"",
 expectedType:""
}

};

// =====================================
// HA-4.0 Conversation Manager
// Natural Language Understanding Layer
// =====================================

let extractedHealthData = {
 patient_relation:"",
 age:null,
 chief_complaint:"",
 duration:"",
 medical_history:[],
 medication:[],
 danger_sign:false,
 confidence:0
};


const nlpDictionary = {

diabetes:[
"diabetes",
"gula darah",
"kencing manis"
],

hypertension:[
"hipertensi",
"darah tinggi"
],

stroke:[
"stroke"
],

kidney:[
"ginjal",
"gagal ginjal"
],

wound:[
"luka",
"borok",
"tidak sembuh",
"nanah"
],

shortness:[
"sesak",
"susah napas",
"napas berat"
]

};



function extractAge(text){

const match=text.match(/(\d+)\s*(tahun|thn)?/i);

return match ? Number(match[1]) : null;

}



function extractRelation(text){

text=text.toLowerCase();

if(text.includes("ayah") || text.includes("bapak")){
return "Ayah";
}

if(text.includes("ibu") || text.includes("mama")){
return "Ibu";
}

if(text.includes("anak")){
return "Anak";
}

return "";

}



function extractMedicalHistory(text){

let result=[];

for(const key in nlpDictionary){

nlpDictionary[key].forEach(word=>{

if(text.toLowerCase().includes(word)){

if(
key==="diabetes" &&
!result.includes("Diabetes")
) result.push("Diabetes");

if(
key==="hypertension" &&
!result.includes("Hipertensi")
) result.push("Hipertensi");

if(
key==="stroke" &&
!result.includes("Stroke")
) result.push("Stroke");

if(
key==="kidney" &&
!result.includes("Ginjal")
) result.push("Ginjal");

}

});

}

return result;

}



function extractDuration(text){

const match=text.match(
/(\d+)\s*(hari|minggu|bulan|tahun)/i
);

if(match){

return match[0];

}

if(text.includes("seminggu"))
return "1 minggu";

return "";

}



function extractComplaint(text){

let lower=text.toLowerCase();

if(lower.includes("luka") || lower.includes("borok"))
return "Luka";

if(lower.includes("sesak"))
return "Sesak napas";

if(lower.includes("demam"))
return "Demam";

if(lower.includes("nyeri"))
return "Nyeri";

return "";

}



function understandFreeText(text){

const age=extractAge(text);
const relation=extractRelation(text);
const history=extractMedicalHistory(text);
const duration=extractDuration(text);
const complaint=extractComplaint(text);


let filled=0;

if(age) filled++;
if(relation) filled++;
if(history.length) filled++;
if(duration) filled++;
if(complaint) filled++;


extractedHealthData={
patient_relation:relation,
age:age,
chief_complaint:complaint,
duration:duration,
medical_history:history,
confidence: filled/5
};


return extractedHealthData;

}



function applyExtractedData(){

const data=extractedHealthData;


if(data.patient_relation)
healthState.patient_relation=data.patient_relation;

if(data.age)
healthState.age=data.age;

if(data.chief_complaint)
healthState.chief_complaint=data.chief_complaint;

if(data.duration)
healthState.duration=data.duration;

if(data.medical_history.length)
healthState.medical_history=data.medical_history.join(", ");

}


const empathyMessages = [

"Terima kasih sudah menjelaskan.",

"Baik, saya catat informasinya.",

"Saya bantu memahami kondisi pasien terlebih dahulu ya.",

"Informasi ini membantu kami menentukan layanan yang sesuai."

];


function randomEmpathy(){

return empathyMessages[
Math.floor(
Math.random()*empathyMessages.length
)
];

}


function setConversation(question,type){

healthState.conversation={
lastQuestion:question,
expectedType:type
};

}


function requestClarification(type){

if(type==="age"){
return `
Maaf, saya belum mendapatkan usia pasien.

Boleh masukkan usia pasien dalam tahun?

Contoh:
70 tahun
`;
}

if(type==="duration"){
return `
Maaf, saya belum mendapatkan lama keluhan.

Boleh diinformasikan sudah berapa lama keluhan terjadi?

Contoh:
• 3 hari
• 2 minggu
• 1 bulan
`;
}

if(type==="complaint"){
return `
Saya ingin memahami keluhan pasien terlebih dahulu.

Boleh ceritakan keluhan utama pasien?

Contoh:
• Demam
• Luka sulit sembuh
• Batuk atau sesak
`;
}

return `
Mohon berikan informasi yang sesuai agar saya dapat membantu.
`;

}

function updateProgress(step){

 const container=document.getElementById("healthProgress");

 if(!container) return;

 const total=8;

 let html=`
 <div class="progress-title">Clinical Intake</div>
 <div class="progress-dots">
 `;

 for(let i=1;i<=total;i++){
   html+=`<span class="${i<=step?'active':''}"></span>`;
 }

 html+=`
 </div>
 <div class="progress-text">
 Tahap ${step} dari ${total}
 </div>
 `;

 container.innerHTML=html;

}


function openHealthAssistant(){

 const panel=document.getElementById("aiPanel");
 if(panel) panel.classList.add("open");

 updateProgress(1);

 const messages=document.getElementById("aiMessages");

 if(messages && !document.getElementById("healthWelcome")){

 const div=document.createElement("div");
 div.id="healthWelcome";
 div.className="ai-msg bot";

 div.innerHTML=`
 Halo 👋

 <br><br>

 Saya <b>Health Assistant Familia Medika</b>.

 <br><br>

 Saya akan membantu memahami kondisi kesehatan Anda
 melalui beberapa pertanyaan singkat.

 <br><br>

 Siapa yang membutuhkan bantuan kesehatan?

 <div class="health-choice">
 <button onclick="selectRelation('Saya sendiri')">👤 Saya sendiri</button>
 <button onclick="selectRelation('Orang tua')">👴 Orang tua</button>
 <button onclick="selectRelation('Anak')">👶 Anak</button>
 <button onclick="selectRelation('Keluarga lain')">👨‍👩‍👧 Keluarga lain</button>
 </div>
 `;

 messages.appendChild(div);
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


function showTyping(){

 const messages=document.getElementById("aiMessages");

 if(document.getElementById("typingIndicator")) return;

 const div=document.createElement("div");

 div.id="typingIndicator";
 div.className="ai-msg bot typing";

 div.innerHTML=`
 Health Assistant sedang mengetik
 <span class="dots">
 <span></span><span></span><span></span>
 </span>
 `;

 messages.appendChild(div);
 messages.scrollTop=messages.scrollHeight;

}


function hideTyping(){

 const el=document.getElementById("typingIndicator");
 if(el) el.remove();

}


function assistantReply(text,next,time=1500){

 showTyping();

 setTimeout(()=>{

 hideTyping();

 addHealthMessage(text);

 if(next) next();

 },time);

}


function setStep(step){

 healthState.step=step;
 updateProgress(step);

 const contextMap={
  2:{lastQuestion:"age",expectedType:"age"},
  3:{lastQuestion:"complaint",expectedType:"complaint"},
  4:{lastQuestion:"duration",expectedType:"duration"},
  5:{lastQuestion:"complaint_detail",expectedType:"text"},
  6:{lastQuestion:"medical_history",expectedType:"text"},
  7:{lastQuestion:"medication",expectedType:"text"},
  8:{lastQuestion:"danger_sign",expectedType:"text"}
 };

 healthState.conversation=contextMap[step]||{};

}


function selectRelation(value){

 healthState.patient_relation=value;

 addHealthMessage(value,"user");

 assistantReply(`
 ${randomEmpathy()}

 <br><br>

 Saya bantu melakukan penilaian awal terlebih dahulu ya.

 <br><br>

 Boleh tahu berapa usia pasien?
 `,()=>setStep(2));

}

function validateAnswer(text,type){

text=(text||"").trim().toLowerCase();


if(type==="age"){

let age=parseInt(text);

return !isNaN(age) && age>=0 && age<=120;

}


if(type==="complaint"){

return (
text.length>=3 &&
!/^\d+$/.test(text)
);

}


if(type==="duration"){

const durationPattern =
/(hari|minggu|bulan|tahun|jam|kemarin|tadi|sejak|baru|lama|\d)/i;


return (
text.length>=2 &&
durationPattern.test(text)
);

}


if(type==="text"){

return text.length>=3;

}


return true;

}

function processHealthInput(text){

 if(!text || !text.trim()) return;

 addHealthMessage(text,"user");


 // HA-4.0 free text understanding
 if(text.length>25){

  const extracted=understandFreeText(text);

  if(extracted.confidence>=0.6){

    applyExtractedData();

    assistantReply(`

    ${randomEmpathy()}

    <br><br>

    Saya memahami informasi awal berikut:

    <br><br>

    ${healthState.patient_relation ? "👤 Pasien: "+healthState.patient_relation+"<br>" : ""}

    ${healthState.age ? "🎂 Usia: "+healthState.age+" tahun<br>" : ""}

    ${healthState.chief_complaint ? "🩺 Keluhan: "+healthState.chief_complaint+"<br>" : ""}

    ${healthState.duration ? "⏱ Durasi: "+healthState.duration+"<br>" : ""}

    ${healthState.medical_history ? "📌 Riwayat: "+healthState.medical_history+"<br>" : ""}

    <br>

    Saya akan menanyakan beberapa hal tambahan untuk memastikan kebutuhan pelayanan.

    `);

    setStep(5);

    return;

  }

 }


 switch(healthState.step){

case 2:


if(!validateAnswer(text,"age")){


assistantReply(`

Maaf, saya belum mendapatkan usia pasien.

Boleh masukkan usia pasien dalam tahun?

Contoh:

70 tahun

`);

return;

}



healthState.age=text;


assistantReply(`

Terima kasih.

Pasien berusia ${text} tahun.

<br><br>

Sekarang, apa keluhan utama pasien?

`,()=>setStep(3));


break;


 case 3:


if(!validateAnswer(text,"complaint")){


assistantReply(`

Saya ingin memahami keluhan pasien terlebih dahulu.

Boleh ceritakan keluhan utama pasien?

Contoh:

• Demam
• Luka sulit sembuh
• Sesak napas
• Nyeri dada

`);

return;

}


healthState.chief_complaint=text;


assistantReply(`

${randomEmpathy()}

<br><br>

Keluhan utama:
<b>${text}</b>


<br><br>

Sudah berapa lama keluhan tersebut terjadi?

`,()=>setStep(4));


break;


 case 4:

if(!validateAnswer(text,"duration")){

assistantReply(requestClarification("duration"));

return;

}

healthState.duration=text;

assistantReply(`

${randomEmpathy()}

<br><br>

Keluhan sudah berlangsung selama:
<b>${text}</b>

<br><br>

Sekarang boleh ceritakan keluhan pasien secara lebih lengkap.

`,()=>setStep(5));

break;


 case 5:
 healthState.complaint_detail=text;

 assistantReply(`
 Terima kasih sudah menjelaskan.

 <br><br>

 Apakah pasien memiliki riwayat penyakit sebelumnya?
 `,()=>setStep(6));
 break;


 case 6:
 healthState.medical_history=text;

 assistantReply(`
 Baik.

 <br><br>

 Apakah pasien sedang mengonsumsi obat rutin?
 `,()=>setStep(7));
 break;


 case 7:
 healthState.medication=text;

 assistantReply(`
 Terima kasih.

 <br><br>

 Apakah terdapat tanda bahaya?

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
 🚨 Luka menghitam / bernanah banyak

 <br><br>

 Jawab: <b>Ada</b> atau <b>Tidak ada</b>
 `,()=>setStep(8));
 break;


case 8:

healthState.danger_sign=text;


assistantReply(`

Terima kasih.

Saya akan merangkum informasi yang sudah diberikan terlebih dahulu.

`,()=>{

showConfirmationSummary();

},1500);


break;

}

}



// =====================================
// HA-3.6 Confirmation Memory Layer
// =====================================

function showConfirmationSummary(){

addHealthMessage(`

<div class="assessment-summary-card">

<b>📋 Ringkasan Informasi Kesehatan</b>

<br><br>

👤 Pasien:
${healthState.patient_relation}

<br>
🎂 Usia:
${healthState.age} tahun

<br>
🩺 Keluhan:
${healthState.chief_complaint}

<br>
⏱ Durasi:
${healthState.duration}

<br>
📝 Detail:
${healthState.complaint_detail}

<br>
📌 Riwayat:
${healthState.medical_history}

<br>
💊 Obat:
${healthState.medication}

<br><br>

<b>Apakah informasi ini sudah benar?</b>

<div class="health-choice">

<button onclick="confirmHealthData(true)">
✅ Ya, sudah benar
</button>

<button onclick="confirmHealthData(false)">
✏️ Ada yang ingin diperbaiki
</button>

</div>

</div>

`);

}


function confirmHealthData(value){

if(value){

healthState.confirmation=true;

assistantReply(`

Terima kasih.

Saya akan melakukan analisis awal berdasarkan informasi tersebut.

Mohon tunggu sebentar...

`,()=>{

generateRisk();

},1500);


}
else{

assistantReply(`

Baik, saya bantu perbaiki informasinya.

Bagian mana yang ingin diperbaiki?

<div class="health-choice">

<button onclick="editHealthField('age')">
🎂 Usia
</button>

<button onclick="editHealthField('chief_complaint')">
🩺 Keluhan utama
</button>

<button onclick="editHealthField('duration')">
⏱ Lama keluhan
</button>

<button onclick="editHealthField('medical_history')">
📌 Riwayat penyakit
</button>

<button onclick="editHealthField('medication')">
💊 Obat rutin
</button>

</div>

`);

}

}


window.confirmHealthData=confirmHealthData;
window.showConfirmationSummary=showConfirmationSummary;





// =====================================
// HA-3.8 Clinical Recommendation Engine
// =====================================

let clinicalRecommendation = {
 services:[],
 priority:"",
 reason:[],
 nextAction:""
};


function generateClinicalRecommendation(){

clinicalRecommendation={
services:[],
priority:"",
reason:[],
nextAction:""
};


let complaint=(
healthState.chief_complaint+
" "+
healthState.complaint_detail
).toLowerCase();


let history=(
healthState.medical_history || ""
).toLowerCase();


let risk =
(typeof healthRisk !== "undefined")
? healthRisk.level
: healthState.risk_level;



if(risk==="HIGH"){

clinicalRecommendation.services=[
"🚑 Pemeriksaan segera",
"🏥 Rujukan IGD"
];

clinicalRecommendation.priority="Segera";
clinicalRecommendation.reason.push(
"Terdapat faktor risiko tinggi atau tanda bahaya"
);

clinicalRecommendation.nextAction=
"Hubungi tenaga kesehatan segera";

return clinicalRecommendation;

}


if(
complaint.includes("luka") ||
complaint.includes("borok") ||
complaint.includes("tidak sembuh")
){

clinicalRecommendation.services.push(
"🩹 Wound Care",
"👨‍⚕️ Home Visit Dokter",
"🏠 Home Care Monitoring"
);

clinicalRecommendation.priority="Dalam 1-3 hari";

clinicalRecommendation.reason.push(
"Keluhan luka membutuhkan evaluasi dan perawatan berkala"
);

}


if(
history.includes("diabetes") ||
complaint.includes("gula")
){

clinicalRecommendation.services.push(
"🩸 Diabetes Monitoring"
);

clinicalRecommendation.reason.push(
"Memiliki faktor risiko diabetes"
);

}


if(Number(healthState.age)>=65){

clinicalRecommendation.services.push(
"👴 Elderly Care & Monitoring"
);

clinicalRecommendation.reason.push(
"Pasien termasuk kelompok usia lanjut"
);

}


if(clinicalRecommendation.services.length===0){

clinicalRecommendation.services=[
"🩺 Health Assessment",
"🌱 Wellness Program"
];

clinicalRecommendation.priority="Terjadwal";

clinicalRecommendation.reason.push(
"Kondisi membutuhkan evaluasi kesehatan umum"
);

}


if(!clinicalRecommendation.priority){
clinicalRecommendation.priority="Terjadwal";
}

clinicalRecommendation.nextAction=
"Melanjutkan assessment Familia Medika";


return clinicalRecommendation;

}



function showClinicalRecommendation(){

let result=generateClinicalRecommendation();

addHealthMessage(`

<div class="assessment-summary-card">

<b>🏥 Rekomendasi Familia Medika</b>

<br><br>

<b>Layanan yang disarankan:</b>

<br>
${result.services.join("<br>")}

<br><br>

<b>Alasan:</b>

<br>
${result.reason.map(x=>"✓ "+x).join("<br>")}

<br><br>

<b>Prioritas:</b>

<br>
${result.priority}

<br><br>

<b>Langkah berikutnya:</b>

<br>
${result.nextAction}

</div>

`);

}



// =====================================
// HA-3.9 Patient Journey Routing
// =====================================

let patientJourney = {

route:"",
priority:"",
steps:[],
nextAction:""

};


function generatePatientJourney(){

patientJourney={
route:"",
priority:"",
steps:[],
nextAction:""
};


let risk =
(typeof healthRisk !== "undefined")
? healthRisk.level
: healthState.risk_level;


let services =
(typeof clinicalRecommendation !== "undefined")
?
clinicalRecommendation.services.join(" ").toLowerCase()
:
"";


if(risk==="HIGH"){

patientJourney.route="Emergency Pathway";
patientJourney.priority="SEGERA";

patientJourney.steps=[
"Hubungi tenaga kesehatan",
"Evaluasi kondisi pasien",
"Rujukan bila diperlukan"
];

patientJourney.nextAction=
"Segera mendapatkan pertolongan medis";

return patientJourney;

}


if(
services.includes("wound") ||
services.includes("luka")
){

patientJourney.route="Wound Care Journey";
patientJourney.priority="Dalam 1-3 hari";

patientJourney.steps=[
"Assessment dokter",
"Home Visit",
"Perawatan luka",
"Monitoring berkala"
];

patientJourney.nextAction=
"Menjadwalkan kunjungan Wound Care";

return patientJourney;

}


if(
services.includes("elderly") ||
services.includes("lansia")
){

patientJourney.route="Elderly Care Journey";
patientJourney.priority="Terjadwal";

patientJourney.steps=[
"Assessment lansia",
"Monitoring rutin",
"Edukasi keluarga"
];

patientJourney.nextAction=
"Menjadwalkan monitoring lansia";

return patientJourney;

}


patientJourney.route="Wellness Journey";
patientJourney.priority="Terjadwal";

patientJourney.steps=[
"Health Assessment",
"Edukasi kesehatan",
"Wellness Monitoring"
];

patientJourney.nextAction=
"Melanjutkan program kesehatan Familia Medika";

return patientJourney;

}



function showPatientJourney(){

let result=generatePatientJourney();

addHealthMessage(`

<div class="assessment-summary-card">

<b>🧭 Jalur Pelayanan Familia Medika</b>

<br><br>

<b>Jalur Anda:</b>

<br>

${result.route}

<br><br>

<b>Prioritas:</b>

<br>

${result.priority}

<br><br>

<b>Tahapan:</b>

<br>

${result.steps.map(x=>"✓ "+x).join("<br>")}

<br><br>

<b>Langkah berikutnya:</b>

<br>

${result.nextAction}

</div>

`);

}

window.generatePatientJourney=generatePatientJourney;
window.showPatientJourney=showPatientJourney;



// =====================================
// HA-3.7 Intelligent Risk Engine FIX
// =====================================

let healthRisk = {
score:0,
level:"",
reasons:[],
recommendations:[]
};


function calculateRisk(){

healthRisk={
score:0,
level:"",
reasons:[],
recommendations:[]
};

let complaint=(healthState.chief_complaint+" "+healthState.complaint_detail).toLowerCase();
let history=(healthState.medical_history||"").toLowerCase();
let danger=(healthState.danger_sign||"").toLowerCase();
let age=Number(healthState.age);


if(
danger.includes("ada") ||
complaint.includes("sesak berat") ||
complaint.includes("nyeri dada") ||
complaint.includes("kejang") ||
complaint.includes("tidak sadar")
){

healthRisk.score=10;
healthRisk.level="HIGH";
healthRisk.reasons.push("Terdapat tanda bahaya");
healthRisk.recommendations=["Pemeriksaan segera","IGD"];

return healthRisk;

}


if(age>=65){
healthRisk.score+=2;
healthRisk.reasons.push("Usia pasien ≥65 tahun");
}

if(history.includes("diabetes")){
healthRisk.score+=2;
healthRisk.reasons.push("Riwayat diabetes");
}

if(history.includes("stroke")){
healthRisk.score+=2;
healthRisk.reasons.push("Riwayat stroke");
}

if(complaint.includes("luka")){
healthRisk.score+=3;
healthRisk.reasons.push("Keluhan luka membutuhkan pemantauan");
}


if(healthRisk.score>=9){
healthRisk.level="HIGH";
healthRisk.recommendations=["Pemeriksaan segera","IGD"];
}
else if(healthRisk.score>=6){
healthRisk.level="HIGH MODERATE";
healthRisk.recommendations=["Home Visit Dokter","Wound Care","Monitoring"];
}
else if(healthRisk.score>=3){
healthRisk.level="MODERATE";
healthRisk.recommendations=["Health Assessment","Home Visit Dokter"];
}
else{
healthRisk.level="LOW";
healthRisk.recommendations=["Wellness Program"];
}

return healthRisk;

}



function showIntelligentRisk(){

let result=calculateRisk();

addHealthMessage(`

<div class="assessment-summary-card">

<b>🧠 Analisis Risiko Kesehatan Awal</b>

<br><br>

Risk Level:
<br>
${result.level}

<br><br>

Skor Risiko:
${result.score}

<br><br>

<b>Faktor:</b>

<br>
${result.reasons.map(x=>"✓ "+x).join("<br>")}

</div>

`);

}


function generateRisk(){

 showTyping();

 setTimeout(()=>{

 hideTyping();

 showIntelligentRisk();

 setTimeout(()=>{

 showClinicalRecommendation();

 },1000);

 setTimeout(()=>{

 showAssessmentSummary();

 },2500);


 },2000);

}



document.addEventListener("DOMContentLoaded",()=>{

 const input=document.getElementById("aiInput");
 const sendButton=document.getElementById("aiSend");

 if(input){

 input.addEventListener("keydown",(e)=>{

  if(e.key==="Enter"){

   e.preventDefault();
   processHealthInput(input.value);
   input.value="";

  }

 });

 }


 if(sendButton){

 sendButton.addEventListener("click",()=>{

  processHealthInput(input.value);
  input.value="";

 });

 }

});

// =====================================
// Close Health Assistant Panel
// =====================================

document.addEventListener("DOMContentLoaded",()=>{

  const aiPanel = document.getElementById("aiPanel");
  const aiClose = document.getElementById("aiClose");


  if(aiClose && aiPanel){

    aiClose.onclick = function(){

      aiPanel.classList.remove("open");

    };

  }

});


// HA-3.5 compatibility export
window.openHealthAssistant=openHealthAssistant;
window.submitAssessment=window.submitAssessment || function(){};


window.healthState=healthState;
window.validateAnswer=validateAnswer;


function editHealthField(field){

assistantReply(`

Baik, kita perbaiki bagian ${field}.

Silakan masukkan informasi yang benar.

`);

healthState.step={
age:2,
chief_complaint:3,
duration:4,
medical_history:6,
medication:7
}[field] || 2;

updateProgress(healthState.step);

}

window.editHealthField=editHealthField;

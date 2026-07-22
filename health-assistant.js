
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



function generateRisk(){

 showTyping();

 setTimeout(()=>{

 hideTyping();

 let complaint=(healthState.chief_complaint+" "+healthState.complaint_detail).toLowerCase();
 let history=(healthState.medical_history||"").toLowerCase();
 let danger=(healthState.danger_sign||"").toLowerCase();

 let risk="LOW";
 let recommendation="Health Assessment / Wellness Program";


 if(danger.includes("ada")){
   risk="HIGH";
   recommendation="Pemeriksaan segera / IGD";
 }
 else if(
   complaint.includes("luka") ||
   history.includes("diabetes") ||
   history.includes("stroke") ||
   Number(healthState.age)>=65
 ){
   risk="MODERATE";
   recommendation="Home Visit Dokter / Home Care / Wound Care";
 }


 healthState.risk_level=risk;

showAssessmentSummary();

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

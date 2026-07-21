
/* =====================================================
 Familia Medika Health Assistant
 HA-3 Human Conversation Edition
 Natural typing + empathetic clinical intake
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
  risk_level:""
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
  Halo 👋

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


function assistantReply(text,next,time=1200){

 showTyping();

 setTimeout(()=>{

  hideTyping();

  addHealthMessage(text);

  if(next) next();

 },time);

}



function selectRelation(value){

 healthState.patient_relation=value;

 addHealthMessage(value,"user");

 assistantReply(`
 Terima kasih sudah memberikan informasi.

 <br><br>

 Saya bantu melakukan penilaian awal terlebih dahulu ya.

 <br><br>

 Boleh tahu berapa usia pasien?
 `,()=>healthState.step=2);

}



function processHealthInput(text){

 if(!text.trim()) return;

 addHealthMessage(text,"user");


 switch(healthState.step){

 case 2:
  healthState.age=text;
  assistantReply(`
  Baik.

  <br><br>

  Apa keluhan utama pasien?

  <br><br>

  Contoh:
  <br>
  • Demam
  <br>
  • Luka sulit sembuh
  <br>
  • Sesak napas
  <br>
  • Gula darah tidak terkontrol
  `,()=>healthState.step=3);
 break;


 case 3:
  healthState.chief_complaint=text;
  assistantReply(`
  Terima kasih.

  <br><br>

  Sudah berapa lama keluhan tersebut terjadi?
  `,()=>healthState.step=4);
 break;


 case 4:
  healthState.duration=text;
  assistantReply(`
  Baik.

  <br><br>

  Sekarang, boleh ceritakan keluhan pasien secara lebih lengkap?

  <br><br>

  Misalnya:
  <br>
  "Luka kaki diabetes sejak 2 minggu, terasa nyeri dan keluar cairan"
  `,()=>healthState.step=5);
 break;


 case 5:
  healthState.complaint_detail=text;
  assistantReply(`
  Terima kasih sudah menjelaskan.

  <br><br>

  Untuk membantu memberikan arahan yang lebih sesuai,
  apakah pasien memiliki riwayat penyakit sebelumnya?
  `,()=>healthState.step=6);
 break;


 case 6:
  healthState.medical_history=text;
  assistantReply(`
  Baik.

  <br><br>

  Apakah pasien sedang mengonsumsi obat rutin?
  `,()=>healthState.step=7);
 break;


 case 7:
  healthState.medication=text;
  assistantReply(`
  Terima kasih.

  <br><br>

  Apakah terdapat tanda bahaya berikut?

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
  `,()=>healthState.step=8);
 break;


 case 8:
  healthState.danger_sign=text;
  generateRisk();
 break;

 }

}



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


 addHealthMessage(`

 <b>📋 Ringkasan Awal Kesehatan</b>

 <br><br>

 👤 Pasien: ${healthState.patient_relation}

 <br>
 🎂 Usia: ${healthState.age}

 <br>
 🩺 Keluhan: ${healthState.chief_complaint}

 <br>
 📝 Detail: ${healthState.complaint_detail}

 <br>
 📌 Riwayat: ${healthState.medical_history}

 <br>
 💊 Obat: ${healthState.medication}

 <br><br>

 <b>Risk Level:</b>

 <br>

 ${risk==="HIGH"?"🔴 HIGH RISK":risk==="MODERATE"?"🟡 MODERATE RISK":"🟢 LOW RISK"}

 <br><br>

 <b>Rekomendasi Familia Medika:</b>

 <br>
 ${recommendation}

 <br><br>

 <div class="health-choice">
 <button onclick="location.href='/asesmen/'">
 🩺 Lanjutkan Health Assessment
 </button>
 </div>

 `);

 },2000);

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

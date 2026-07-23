/* =====================================================
 Familia Medika Health Assistant
 HA-4.5 Navigator Mode FINAL
 ===================================================== */

function openHealthAssistant(){

const panel=document.getElementById("aiPanel");

if(panel){
panel.classList.add("open");
}


const messages=document.getElementById("aiMessages");

if(
messages &&
!document.getElementById("healthWelcome")
){

const div=document.createElement("div");

div.id="healthWelcome";
div.className="ai-msg bot";

div.innerHTML=`

Halo 👋

<br><br>

Saya <b>Health Assistant Familia Medika</b>.

<br><br>

Saya membantu Anda memulai proses
<b>Health Assessment</b> untuk memahami kebutuhan kesehatan Anda.

<br><br>

Melalui Health Assessment, kami akan membantu mengumpulkan:

<br>
✓ Keluhan utama
<br>
✓ Riwayat kesehatan
<br>
✓ Kondisi saat ini
<br>
✓ Kebutuhan layanan kesehatan

<br><br>

Silakan mulai Health Assessment untuk melanjutkan.

<br><br>

<div class="health-choice">

<button onclick="startHealthAssessment()">

🩺 Mulai Health Assessment

</button>


<button onclick="showServiceHelp()">

💬 Tanya Layanan Familia Medika

</button>

</div>

`;

messages.appendChild(div);

}

}



function startHealthAssessment(){

location.href="/asesmen/";

}



function showServiceHelp(){

addHealthMessage(`

<b>Layanan Familia Medika</b>

<br><br>

🏠 Home Visit Dokter

<br>
🩹 Wound Care

<br>
👴 Elderly Care & Monitoring

<br>
👩‍⚕️ Home Care Keluarga

<br>
🏥 Medical Team Event

<br><br>

Untuk menentukan layanan yang paling sesuai,
silakan lakukan Health Assessment terlebih dahulu.

`);

}



function addHealthMessage(text,type="bot"){

const messages=document.getElementById("aiMessages");

if(!messages) return;

const div=document.createElement("div");

div.className="ai-msg "+type;

div.innerHTML=text;

messages.appendChild(div);

messages.scrollTop=messages.scrollHeight;

}



document.addEventListener("DOMContentLoaded",()=>{

const aiClose=document.getElementById("aiClose");

const aiPanel=document.getElementById("aiPanel");


if(aiClose && aiPanel){

aiClose.onclick=()=>{

aiPanel.classList.remove("open");

};

}


const input=document.getElementById("aiInput");

if(input){

input.disabled=true;

input.placeholder=
"Gunakan tombol Health Assessment untuk memulai";

}

});

window.openHealthAssistant=openHealthAssistant;
window.startHealthAssessment=startHealthAssessment;
window.showServiceHelp=showServiceHelp;

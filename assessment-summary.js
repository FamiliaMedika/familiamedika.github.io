const SUPABASE_ASSESSMENT_URL =
"https://tegsvhbhdyeqqlhbbjpz.supabase.co/functions/v1/create-assessment-request";

function showAssessmentSummary(){

localStorage.setItem("familiaAssessment",JSON.stringify(healthState));

let riskClass="risk-low";
let riskText="🟢 LOW RISK";

if(healthState.risk_level==="MODERATE"){
riskClass="risk-moderate";
riskText="🟡 MODERATE RISK";
}
async function submitAssessment(){

const payload = {

session_id:
"FM-" + Date.now(),

patient_relation:
healthState.patient_relation,

age:
Number(healthState.age),

chief_complaint:
healthState.chief_complaint,

duration:
healthState.duration,

complaint_detail:
healthState.complaint_detail,

medical_history:
healthState.medical_history,

medication:
healthState.medication,

danger_sign:
healthState.danger_sign,

risk_level:
healthState.risk_level,

recommended_service:
"Home Visit Dokter / Home Care / Wound Care"

};


try{

const response = await fetch(
SUPABASE_ASSESSMENT_URL,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:
JSON.stringify(payload)

}
);


const result = await response.json();


if(result.success){

addHealthMessage(`
<div class="assessment-summary-card">

<b>✅ Data berhasil dikirim ke Familia Medika</b>

<br><br>

Tim kami akan meninjau informasi kesehatan Anda.

</div>
`);

}


}catch(error){

console.error(error);

addHealthMessage(`
⚠️ Data belum berhasil dikirim.
Silakan coba kembali.
`);

}

}
if(healthState.risk_level==="HIGH"){
riskClass="risk-high";
riskText="🔴 HIGH RISK";
}

addHealthMessage(`

<div class="assessment-summary-card">

<div class="summary-title">📋 Ringkasan Awal Kesehatan</div>

<div class="summary-item">
<div class="summary-label">👤 Pasien</div>
<div class="summary-value">${healthState.patient_relation}</div>
</div>

<div class="summary-item">
<div class="summary-label">🎂 Usia</div>
<div class="summary-value">${healthState.age}</div>
</div>

<div class="summary-item">
<div class="summary-label">🩺 Keluhan</div>
<div class="summary-value">${healthState.chief_complaint}</div>
</div>

<div class="summary-item">
<div class="summary-label">⏱ Durasi</div>
<div class="summary-value">${healthState.duration}</div>
</div>

<div class="risk-badge ${riskClass}">
${riskText}
</div>

<div class="summary-recommendation">
Rekomendasi Familia Medika:
<br><br>
${healthState.risk_level==="HIGH"?"🚑 Pemeriksaan segera / IGD":"👨‍⚕️ Home Visit Dokter<br>🏠 Home Care<br>🩹 Wound Care"}
</div>

<div class="summary-actions">
<div class="summary-actions">

<button onclick="submitAssessment()">

📤 Kirim ke Familia Medika

</button>


<button onclick="location.href='/asesmen/'">

🩺 Lanjutkan Health Assessment

</button>

</div>
</div>

</div>

`);

}

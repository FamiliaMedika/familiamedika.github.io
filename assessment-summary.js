
function showAssessmentSummary(){

localStorage.setItem("familiaAssessment",JSON.stringify(healthState));

let riskClass="risk-low";
let riskText="🟢 LOW RISK";

if(healthState.risk_level==="MODERATE"){
riskClass="risk-moderate";
riskText="🟡 MODERATE RISK";
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
<button onclick="location.href='/asesmen/'">
🩺 Lanjutkan Health Assessment
</button>
</div>

</div>

`);

}

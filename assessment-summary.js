const SUPABASE_ASSESSMENT_URL =
"https://cvfuuflnfexaqnncgjmw.supabase.co/functions/v1/create-assessment-request";


async function submitAssessment(){

const payload = {

session_id:
"FM-" + Date.now(),

full_name:
healthState.full_name || "Guest",

phone:
healthState.phone || null,

email:
healthState.email || null,

date_of_birth:
healthState.date_of_birth || null,

gender:
healthState.gender || null,


patient_relation:
healthState.patient_relation || null,

age:
Number(healthState.age || 0),

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


risk_summary:
healthState.risk_level === "HIGH"
? "Pasien memiliki faktor risiko tinggi dan membutuhkan evaluasi segera."
: healthState.risk_level === "MODERATE"
? "Pasien memiliki faktor risiko sedang dan membutuhkan tindak lanjut."
: "Pasien memiliki risiko rendah berdasarkan assessment awal.",


recommendations:[

healthState.risk_level === "HIGH"
? "Pemeriksaan segera / IGD"
: "Konsultasi Dokter",

"Home Care",

"Personal Health Plan"

],


journey:[

"Health Screening",

"Doctor Consultation",

"Personal Care Plan"

],


summary:

"Initial Health Assessment from FamiCare Health Assistant"


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

Assessment Anda telah tersimpan.

Tim Familia Medika akan meninjau hasil assessment dan menghubungi Anda untuk langkah berikutnya.

</div>

`);

}else{

throw new Error(result.message);

}


}catch(error){


console.error(error);


addHealthMessage(`

<div class="assessment-summary-card">

⚠️ Data belum berhasil dikirim.

Silakan coba kembali.

</div>

`);


}

}



function showAssessmentSummary(){

localStorage.setItem(
"familiaAssessment",
JSON.stringify(healthState)
);


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

<div class="summary-title">
📋 Ringkasan Awal Kesehatan
</div>


<div class="summary-item">

<div class="summary-label">
👤 Pasien
</div>

<div class="summary-value">
${healthState.patient_relation || "-"}
</div>

</div>



<div class="summary-item">

<div class="summary-label">
🎂 Usia
</div>

<div class="summary-value">
${healthState.age || "-"}
</div>

</div>



<div class="summary-item">

<div class="summary-label">
🩺 Keluhan
</div>

<div class="summary-value">
${healthState.chief_complaint || "-"}
</div>

</div>



<div class="summary-item">

<div class="summary-label">
⏱ Durasi
</div>

<div class="summary-value">
${healthState.duration || "-"}
</div>

</div>


<div class="risk-badge ${riskClass}">

${riskText}

</div>


<div class="summary-recommendation">

Rekomendasi Familia Medika:

<br><br>

${healthState.risk_level==="HIGH"
?"🚑 Pemeriksaan segera / IGD"
:"👨‍⚕️ Home Visit Dokter<br>🏠 Home Care<br>🩹 Wound Care"}

</div>


<div class="summary-actions">


<button onclick="submitAssessment()">

📤 Kirim ke Familia Medika

</button>


<button onclick="continueAssessment()">

🩺 Lanjutkan Health Assessment

</button>


</div>


</div>

`);

}

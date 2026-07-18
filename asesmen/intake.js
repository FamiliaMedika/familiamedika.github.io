(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const sb=window.fmSupabase;
  const form=$('#intakeForm');
  let step=1;
  const flags={
    severe_breathing:'Sesak napas berat',severe_chest_pain:'Nyeri dada berat',decreased_consciousness:'Sulit dibangunkan / penurunan kesadaran',
    seizure:'Kejang',heavy_bleeding:'Perdarahan hebat',stroke_signs:'Kelemahan satu sisi / bicara pelo mendadak',blue_lips:'Bibir kebiruan',rapid_deterioration:'Kondisi memburuk cepat'
  };

  function show(n){step=n;$$('.step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===n));$('#progressBar').style.width=`${n*20}%`;window.scrollTo({top:0,behavior:'smooth'});clearErrors();if(n===5)buildSummary();}
  function clearErrors(){$$('.error').forEach(x=>x.textContent='');}
  function setError(id,msg){$('#'+id).textContent=msg;}
  function values(){return Object.fromEntries(new FormData(form).entries());}
  function selectedFlags(){const out={};Object.keys(flags).forEach(k=>out[k]=form.elements[k].value==='true');return out;}
  function hasRedFlag(){return Object.values(selectedFlags()).some(Boolean);}
  function validate(n){
    clearErrors();const v=values();
    if(n===1&&(!form.elements.consent.checked||!form.elements.dataConsent.checked||!form.elements.emergencyUnderstanding.checked)){setError('step1Error','Mohon centang seluruh persetujuan.');return false;}
    if(n===2){const age=Number(v.age),phone=v.phone.replace(/[^0-9+]/g,'');if(!v.patient_name.trim()||!Number.isFinite(age)||age<0||age>120){setError('step2Error','Nama/inisial dan usia wajib diisi dengan benar.');return false;}if(phone.length<8){setError('step2Error','Nomor WhatsApp wajib diisi dengan benar.');return false;}if(age<18&&!form.elements.guardian_confirmed.checked){setError('step2Error','Konfirmasi orang tua/wali diperlukan untuk pasien di bawah 18 tahun.');return false;}}
    if(n===3&&hasRedFlag()){setError('step3Error','Asesmen tidak boleh dilanjutkan karena terdapat tanda bahaya.');return false;}
    if(n===4&&!v.chief_complaint.trim()){setError('step4Error','Keluhan utama wajib diisi.');return false;}
    return true;
  }
  function updateGuardian(){const age=Number(form.elements.age.value);$('#guardianBox').classList.toggle('hidden',!(age>=0&&age<18));}
  function updateEmergency(){const danger=hasRedFlag();$('#emergencyBox').classList.toggle('hidden',!danger);$('#redFlagNext').disabled=danger;}
  function row(label,value){const d=document.createElement('div');d.className='summary-row';const s=document.createElement('span');s.textContent=label;const b=document.createElement('b');b.textContent=value||'-';d.append(s,b);return d;}
  function buildSummary(){
    const v=values(),box=$('#summaryList');box.innerHTML='';
    const vitals=[v.temperature?`Suhu ${v.temperature}°C`:'Suhu belum diperiksa',v.spo2?`SpO₂ ${v.spo2}%`:'SpO₂ belum diperiksa',v.respiratory_rate?`RR ${v.respiratory_rate}/menit`:'RR belum diperiksa',v.blood_pressure?`TD ${v.blood_pressure}`:'TD belum diperiksa'].join(' · ');
    [['Pasien',`${v.patient_name}, ${v.age} tahun`],['Keluhan utama',v.chief_complaint],['Onset / perjalanan',`${v.onset||'-'} / ${v.course||'-'}`],['Gejala penyerta',v.associated_symptoms||'-'],['Riwayat penyakit',v.medical_history||'-'],['Obat',v.current_medication||'-'],['Alergi',v.allergies||'Belum diketahui'],['Data mandiri',vitals],['Tanda bahaya','Tidak dilaporkan berdasarkan jawaban yang diberikan']].forEach(x=>box.appendChild(row(x[0],x[1])));
  }
  async function submit(){
    const v=values();
    const payload={consent:true,consent_version:'2026-07-01',guardian_confirmed:form.elements.guardian_confirmed.checked,patient_name:v.patient_name.trim(),age:Number(v.age),gender:v.gender,pregnancy:v.pregnancy,phone:v.phone.trim(),area:v.area.trim(),chief_complaint:v.chief_complaint.trim(),onset:v.onset.trim(),course:v.course.trim(),associated_symptoms:v.associated_symptoms.trim(),medical_history:v.medical_history.trim(),current_medication:v.current_medication.trim(),allergies:v.allergies.trim(),red_flags:selectedFlags(),vitals:{temperature:v.temperature.trim(),spo2:v.spo2.trim(),respiratory_rate:v.respiratory_rate.trim(),blood_pressure:v.blood_pressure.trim()}};
    $('#submitBtn').disabled=true;$('#submitBtn').textContent='Mengirim...';
    const {data,error}=await sb.rpc('submit_public_assessment',{payload});
    $('#submitBtn').disabled=false;$('#submitBtn').textContent='Kirim untuk ditinjau';
    if(error)throw error;
    if(data?.emergency){show(3);$('#emergencyBox').classList.remove('hidden');throw new Error(data.message||'Segera cari pertolongan darurat.');}
    form.classList.add('hidden');$('#successBox').classList.remove('hidden');$('#successCode').textContent=data.assessment_code;$('#progressBar').style.width='100%';window.scrollTo({top:0,behavior:'smooth'});
  }

  if(window.FM_CONFIG_INVALID||!sb){$('#configAlert').classList.remove('hidden');$('#submitBtn').disabled=true;}
  $('#redFlagGrid').innerHTML=Object.entries(flags).map(([k,l])=>`<div class="red-item"><label>${l}</label><select name="${k}"><option value="false">Tidak</option><option value="true">Ya</option></select></div>`).join('');
  Object.keys(flags).forEach(k=>form.elements[k].addEventListener('change',updateEmergency));
  form.elements.age.addEventListener('input',updateGuardian);
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(validate(step))show(Math.min(5,step+1));}));
  $$('[data-prev]').forEach(b=>b.addEventListener('click',()=>show(Math.max(1,step-1))));
  form.addEventListener('submit',e=>{e.preventDefault();clearErrors();if(!validate(4)||hasRedFlag())return;submit().catch(err=>setError('submitError',err.message||'Gagal mengirim asesmen.'));});
  show(1);updateGuardian();updateEmergency();
})();

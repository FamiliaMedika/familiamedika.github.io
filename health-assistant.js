/* Familia Medika Health Assistant - HA-2 */

function openHealthAssistant(){

  const panel = document.getElementById('aiPanel');

  if(panel){
    panel.classList.add('open');
  }


  const messages = document.getElementById('aiMessages');


  if(messages && !document.getElementById('healthWelcome')){


    const div = document.createElement('div');

    div.id = 'healthWelcome';

    div.className = 'ai-msg bot';


    div.innerHTML = `

    Halo 👋 
    Saya <b>Health Assistant Familia Medika</b>.

    <br><br>

    Saya membantu Anda:

    <br>✓ Memahami keluhan kesehatan awal

    <br>✓ Melakukan Health Assessment

    <br>✓ Memilih layanan yang sesuai


    <br><br>

    Apa yang ingin Anda lakukan?


    <div class="health-choice">


      <button onclick="startAssessment()">
      🩺 Mulai Health Assessment
      </button>


      <button onclick="startComplaint()">
      💬 Ceritakan Keluhan
      </button>


      <button onclick="showServices()">
      🏠 Cari Layanan
      </button>


    </div>

    `;


    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

  }

}


/* Tombol Health Assessment */

function startAssessment(){

  window.location.href="/asesmen/";

}



/* Tombol Ceritakan Keluhan */

function startComplaint(){

  const messages=document.getElementById('aiMessages');


  const div=document.createElement('div');

  div.className='ai-msg bot';


  div.innerHTML=`

  Silakan ceritakan keluhan kesehatan Anda.

  <br><br>

  Contoh:

  <br>
  "Ayah saya usia 70 tahun, diabetes, sering lemas"

  <br><br>

  "Ibu saya punya luka kaki yang sulit sembuh"

  `;


  messages.appendChild(div);

  messages.scrollTop=messages.scrollHeight;


  const input=document.getElementById('aiInput');

  if(input){
    input.focus();
  }

}



/* Tombol Cari Layanan */

function showServices(){

  const messages=document.getElementById('aiMessages');


  const div=document.createElement('div');


  div.className='ai-msg bot';


  div.innerHTML=`

  Berikut layanan Familia Medika:

  <br><br>

  🏠 <b>Home Visit Dokter</b>

  <br>
  Pemeriksaan dokter langsung ke rumah.

  <br><br>

  ❤️ <b>Home Care Keluarga</b>

  <br>
  Pendampingan pasien dan monitoring kesehatan.

  <br><br>

  🩹 <b>Wound Care</b>

  <br>
  Perawatan luka akut maupun kronis.

  <br><br>

  👴 <b>Elderly Care</b>

  <br>
  Pemantauan kesehatan lansia.

  <br><br>

  🏥 <b>Medical Team Event</b>

  <br>
  Dukungan tim medis untuk kegiatan.

  `;


  messages.appendChild(div);

  messages.scrollTop=messages.scrollHeight;

}


/* Familia Medika Health Assistant */

function openHealthAssistant(){
  const panel=document.getElementById('aiPanel');

  if(panel){
    panel.classList.add('open');
  }

  const messages=document.getElementById('aiMessages');

  if(messages && !document.getElementById('healthWelcome')){
    const div=document.createElement('div');
    div.id='healthWelcome';
    div.className='ai-msg bot';
    div.innerHTML=`
    Halo 👋 Saya <b>Health Assistant Familia Medika</b>.<br><br>
    Saya membantu Anda:
    <br>✓ Memahami keluhan awal
    <br>✓ Melakukan Health Assessment
    <br>✓ Memilih layanan yang sesuai
    <br><br>
    <div class="health-choice">
      <button onclick="location.href='/asesmen/'">
      🩺 Mulai Health Assessment
      </button>
      <button>
      💬 Ceritakan Keluhan
      </button>
    </div>`;
    messages.appendChild(div);
  }
}

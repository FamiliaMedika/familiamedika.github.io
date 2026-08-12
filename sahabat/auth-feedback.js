(()=>{
  'use strict';

  let registrationPending=false;

  document.addEventListener('submit',event=>{
    if(event.target?.id==='registerForm')registrationPending=true;
  },true);

  const restoreRegistrationMessage=()=>{
    if(!registrationPending)return;
    const registerForm=document.querySelector('#registerForm');
    const loginForm=document.querySelector('#loginForm');
    const message=document.querySelector('#authMessage');
    if(!registerForm||!loginForm||!message)return;

    const registrationCompleted=
      registerForm.classList.contains('hidden')&&
      !loginForm.classList.contains('hidden');

    if(registrationCompleted&&!message.textContent.trim()){
      message.className='form-success';
      message.textContent='Akun dibuat. Buka email verifikasi, lalu kembali untuk masuk.';
      registrationPending=false;
    }
  };

  const observer=new MutationObserver(restoreRegistrationMessage);
  const registerForm=document.querySelector('#registerForm');
  const loginForm=document.querySelector('#loginForm');
  if(registerForm)observer.observe(registerForm,{attributes:true,attributeFilter:['class']});
  if(loginForm)observer.observe(loginForm,{attributes:true,attributeFilter:['class']});
})();

(()=>{
  'use strict';

  let registrationPending=false;
  let authBound=false;

  const authParams=new Set([
    'code','error','error_code','error_description','type','token_hash','recovery'
  ]);

  function decode(value=''){
    try{return decodeURIComponent(String(value).replaceAll('+',' '));}
    catch(_){return String(value);}
  }

  function currentAuthPayload(){
    const query=new URLSearchParams(location.search);
    const hash=new URLSearchParams(location.hash.replace(/^#/,''));
    return {
      code:query.get('code'),
      error:query.get('error')||hash.get('error'),
      errorCode:query.get('error_code')||hash.get('error_code'),
      errorDescription:decode(query.get('error_description')||hash.get('error_description')||''),
      type:query.get('type')||hash.get('type'),
      hasSessionHash:Boolean(hash.get('access_token')||hash.get('refresh_token')),
      recovery:query.get('recovery')==='1'||hash.get('type')==='recovery'
    };
  }

  function cleanAuthUrl(){
    const url=new URL(location.href);
    for(const key of authParams)url.searchParams.delete(key);
    if(/(?:access_token|refresh_token|error|type)=/.test(url.hash))url.hash='';
    history.replaceState(null,'',`${url.pathname}${url.search}${url.hash}`);
  }

  function setAuthMessage(message,type='success'){
    const box=document.querySelector('#authMessage');
    if(!box)return false;
    box.className=type==='success'?'form-success':'form-error';
    box.textContent=message;
    return true;
  }

  function showNotice(message,type='success'){
    if(setAuthMessage(message,type)){
      const authScreen=document.querySelector('#authScreen');
      if(authScreen&&!authScreen.classList.contains('hidden'))return;
    }

    const wrap=document.querySelector('#toastWrap');
    if(wrap){
      const toast=document.createElement('div');
      toast.className=`toast ${type==='success'?'success':'error'}`;
      toast.textContent=message;
      wrap.appendChild(toast);
      setTimeout(()=>toast.remove(),6000);
      return;
    }

    const notice=document.createElement('div');
    notice.setAttribute('role','status');
    notice.style.cssText='position:fixed;z-index:99999;left:16px;right:16px;top:16px;max-width:720px;margin:auto;padding:14px 16px;border-radius:14px;font:600 14px/1.45 system-ui;background:'+
      (type==='success'?'#e8f8ef;color:#12643a;border:1px solid #bde7cf':'#fff0f0;color:#8d2020;border:1px solid #f0c1c1');
    notice.textContent=message;
    document.body.appendChild(notice);
    setTimeout(()=>notice.remove(),6500);
  }

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
      message.textContent='Akun dibuat. Buka email verifikasi resmi Sahabat Familia, lalu kembali untuk masuk.';
      registrationPending=false;
    }
  };

  async function recoverPkceCode(payload){
    if(!payload.code||!window.sfSupabase?.auth?.exchangeCodeForSession)return false;
    try{
      const {error}=await window.sfSupabase.auth.exchangeCodeForSession(payload.code);
      if(error)throw error;
      sessionStorage.setItem('sf_auth_notice','Email berhasil diverifikasi. Selamat datang di Sahabat Familia.');
      cleanAuthUrl();
      return true;
    }catch(error){
      console.warn('Sahabat Familia callback:',error);
      return false;
    }
  }

  function bindAuthFeedback(){
    if(authBound||!window.sfSupabase?.auth)return;
    authBound=true;

    window.sfSupabase.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){
        sessionStorage.setItem('sf_auth_notice','Silakan buat kata sandi baru untuk akun Sahabat Familia Anda.');
        setTimeout(cleanAuthUrl,100);
        return;
      }

      if(event==='SIGNED_IN'&&session){
        const payload=currentAuthPayload();
        const justVerified=payload.type==='signup'||payload.type==='email'||payload.hasSessionHash;
        if(justVerified){
          sessionStorage.setItem('sf_auth_notice','Email berhasil diverifikasi. Selamat datang di Sahabat Familia.');
          setTimeout(cleanAuthUrl,100);
        }
      }
    });
  }

  async function initialize(){
    const observer=new MutationObserver(restoreRegistrationMessage);
    const registerForm=document.querySelector('#registerForm');
    const loginForm=document.querySelector('#loginForm');
    if(registerForm)observer.observe(registerForm,{attributes:true,attributeFilter:['class']});
    if(loginForm)observer.observe(loginForm,{attributes:true,attributeFilter:['class']});

    const payload=currentAuthPayload();
    if(payload.error||payload.errorDescription){
      showNotice(
        payload.errorDescription||'Tautan verifikasi tidak dapat diproses. Silakan minta tautan baru.',
        'error'
      );
      cleanAuthUrl();
    }else if(payload.code){
      await recoverPkceCode(payload);
    }

    bindAuthFeedback();

    const pendingNotice=sessionStorage.getItem('sf_auth_notice');
    if(pendingNotice){
      sessionStorage.removeItem('sf_auth_notice');
      for(const delay of [100,500,1200]){
        setTimeout(()=>showNotice(pendingNotice,'success'),delay);
      }
    }
  }

  initialize().catch(error=>console.error('Sahabat Familia auth feedback:',error));
})();

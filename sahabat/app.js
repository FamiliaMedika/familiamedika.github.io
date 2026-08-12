(()=>{
  'use strict';

  const cfg=window.SF_CONFIG||{};
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=(value='')=>String(value??'').replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));

  const requiredConfig=[cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY];
  if(requiredConfig.some(value=>!value)||!window.supabase?.createClient){
    $('#configAlert')?.classList.remove('hidden');
    return;
  }

  const storagePreferenceKey='sf_auth_storage';
  const authStorage={
    getItem(key){
      const mode=localStorage.getItem(storagePreferenceKey)==='session'?'session':'local';
      return (mode==='session'?sessionStorage:localStorage).getItem(key);
    },
    setItem(key,value){
      const mode=localStorage.getItem(storagePreferenceKey)==='session'?'session':'local';
      const target=mode==='session'?sessionStorage:localStorage;
      const other=mode==='session'?localStorage:sessionStorage;
      target.setItem(key,value);
      other.removeItem(key);
    },
    removeItem(key){
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  };

  const sb=window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_PUBLISHABLE_KEY,
    {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        storage:authStorage,
        flowType:'pkce'
      }
    }
  );
  window.sfSupabase=sb;

  const state={
    session:null,
    user:null,
    account:null,
    members:[],
    services:[],
    bookings:[],
    notifications:[],
    documents:[],
    invoices:[],
    selectedService:null,
    bookingStep:1,
    bookingFilter:'active',
    currentView:'home',
    deferredInstallPrompt:null,
    recoveryMode:false,
    bootVersion:0
  };

  const activeBookingStatuses=new Set([
    'MENUNGGU_KONFIRMASI','PRIORITAS_KLINIS','TERJADWAL','DIKONFIRMASI',
    'TENAGA_MENUJU_LOKASI','BERLANGSUNG'
  ]);
  const cancellableStatuses=new Set([
    'MENUNGGU_KONFIRMASI','PRIORITAS_KLINIS','TERJADWAL','DIKONFIRMASI'
  ]);
  const validViews=new Set(['home','services','bookings','documents','family']);
  const redFlags={
    severe_breathing:'Sesak napas berat',
    severe_chest_pain:'Nyeri dada berat',
    decreased_consciousness:'Sulit dibangunkan / penurunan kesadaran',
    seizure:'Kejang',
    heavy_bleeding:'Perdarahan hebat',
    stroke_signs:'Kelemahan satu sisi / bicara pelo mendadak',
    blue_lips:'Bibir kebiruan',
    rapid_deterioration:'Kondisi memburuk cepat'
  };

  const roleLabels={
    MENUNGGU_KONFIRMASI:'Menunggu konfirmasi',
    PRIORITAS_KLINIS:'Prioritas klinis',
    TERJADWAL:'Terjadwal',
    DIKONFIRMASI:'Dikonfirmasi',
    TENAGA_MENUJU_LOKASI:'Tenaga kesehatan menuju lokasi',
    BERLANGSUNG:'Pelayanan berlangsung',
    SELESAI:'Selesai',
    DIBATALKAN:'Dibatalkan',
    BELUM_DITAGIHKAN:'Belum ditagihkan',
    BELUM_BAYAR:'Belum bayar',
    SEBAGIAN:'Dibayar sebagian',
    LUNAS:'Lunas',
    DRAFT:'Draft',
    ISSUED:'Diterbitkan',
    PARTIAL:'Dibayar sebagian',
    PAID:'Lunas',
    CANCELLED:'Dibatalkan',
    AVAILABLE:'Tersedia',
    REVOKED:'Dicabut'
  };

  function safeDate(value){
    if(!value)return null;
    const date=new Date(value);
    return Number.isNaN(date.getTime())?null:date;
  }
  function formatDate(value){
    const date=safeDate(value);
    return date?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium'}).format(date):'-';
  }
  function formatDateTime(value){
    const date=safeDate(value);
    return date?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(date):'-';
  }
  function formatMoney(value){
    if(value===null||value===undefined||value==='')return 'Tarif dikonfirmasi';
    const amount=Number(value);
    return Number.isFinite(amount)
      ?new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount)
      :'Tarif dikonfirmasi';
  }
  function initials(name=''){return String(name).trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'SF';}
  function firstName(name=''){return String(name).trim().split(/\s+/).filter(Boolean)[0]||'Sahabat';}
  function statusLabel(status){return roleLabels[status]||String(status||'-').replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase());}
  function statusClass(status){
    if(['SELESAI','LUNAS','PAID','AVAILABLE'].includes(status))return 'status-success';
    if(['DIBATALKAN','CANCELLED','REVOKED'].includes(status))return 'status-danger';
    if(['PRIORITAS_KLINIS','MENUNGGU_KONFIRMASI','BELUM_BAYAR','SEBAGIAN','PARTIAL','ISSUED'].includes(status))return 'status-wait';
    if(['TERJADWAL','DIKONFIRMASI','TENAGA_MENUJU_LOKASI','BERLANGSUNG'].includes(status))return 'status-active';
    return 'status-muted';
  }
  function statusChip(status){return `<span class="status-chip ${statusClass(status)}">${esc(statusLabel(status))}</span>`;}
  function memberById(id){return state.members.find(item=>item.id===id)||{};}
  function serviceById(id){return state.services.find(item=>item.id===id)||{};}
  function bookingById(id){return state.bookings.find(item=>item.id===id)||{};}
  function primaryMember(){return state.members.find(item=>item.is_primary)||state.members[0]||{};}
  function normalizePhone(value){return String(value||'').replace(/[^0-9+]/g,'');}
  function toIso(value){
    if(!value)return null;
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return null;
    return date.toISOString();
  }
  function localDateTimeValue(date){
    const d=date instanceof Date?date:new Date(date);
    const offset=d.getTimezoneOffset();
    return new Date(d.getTime()-offset*60000).toISOString().slice(0,16);
  }

  function toast(message,type='success'){
    const wrap=$('#toastWrap');
    if(!wrap)return;
    const item=document.createElement('div');
    item.className=`toast ${type}`;
    item.textContent=message;
    wrap.appendChild(item);
    setTimeout(()=>item.remove(),4200);
  }
  function setMessage(id,message='',type='error'){
    const element=$(id.startsWith('#')?id:`#${id}`);
    if(!element)return;
    element.textContent=message;
    element.className=message?(type==='success'?'form-success':'form-error'):'form-error';
  }
  function setButtonBusy(button,busy,busyText='Memproses...'){
    if(!button)return;
    if(!button.dataset.defaultText)button.dataset.defaultText=button.textContent||'';
    button.disabled=Boolean(busy);
    button.textContent=busy?busyText:button.dataset.defaultText;
  }
  async function withBusy(button,action,busyText){
    setButtonBusy(button,true,busyText);
    try{return await action();}
    finally{setButtonBusy(button,false);}
  }

  function showOnly(screenId){
    ['authScreen','onboardingScreen','appShell'].forEach(id=>{
      const node=$(`#${id}`);
      if(node)node.classList.toggle('hidden',id!==screenId);
    });
  }
  function showAuth(message='',type='error'){
    showOnly('authScreen');
    if(message)setMessage('authMessage',message,type);
  }
  function showOnboarding(){
    showOnly('onboardingScreen');
    const form=$('#onboardingForm');
    if(!form)return;
    const metadata=state.user?.user_metadata||{};
    if(!form.elements.full_name.value)form.elements.full_name.value=metadata.full_name||metadata.name||'';
    if(!form.elements.phone.value)form.elements.phone.value=metadata.phone||'';
  }
  function showApp(){
    showOnly('appShell');
    const requested=new URLSearchParams(location.search).get('view');
    switchView(validViews.has(requested)?requested:'home',{replace:true});
  }

  function resetPortalState(){
    state.session=null;
    state.user=null;
    state.account=null;
    state.members=[];
    state.services=[];
    state.bookings=[];
    state.notifications=[];
    state.documents=[];
    state.invoices=[];
  }

  async function loadPortalData(){
    const queries=await Promise.all([
      sb.from('patient_portal_accounts').select('*').eq('user_id',state.user.id).maybeSingle(),
      sb.from('patient_portal_members').select('*').is('archived_at',null).order('is_primary',{ascending:false}).order('created_at',{ascending:true}),
      sb.from('patient_services').select('*').eq('active',true).order('sort_order',{ascending:true}),
      sb.from('patient_bookings').select('*').order('requested_start',{ascending:false}),
      sb.from('patient_notifications').select('*').order('created_at',{ascending:false}).limit(100),
      sb.from('patient_documents').select('*').eq('status','AVAILABLE').order('issued_at',{ascending:false}).limit(100),
      sb.from('patient_invoices').select('*').order('created_at',{ascending:false}).limit(100)
    ]);
    for(const result of queries){if(result.error)throw result.error;}
    state.account=queries[0].data||null;
    state.members=queries[1].data||[];
    state.services=queries[2].data||[];
    state.bookings=queries[3].data||[];
    state.notifications=queries[4].data||[];
    state.documents=queries[5].data||[];
    state.invoices=queries[6].data||[];
  }

  async function refreshPortal({silent=false}={}){
    try{
      await loadPortalData();
      renderAll();
    }catch(error){
      console.error(error);
      if(!silent)toast(error.message||'Data Sahabat Familia gagal dimuat.','error');
      throw error;
    }
  }

  async function boot(session){
    const version=++state.bootVersion;
    if(!session){
      resetPortalState();
      showAuth();
      return;
    }

    state.session=session;
    state.user=session.user;
    setMessage('authMessage','Login berhasil. Memuat Sahabat Familia...','success');

    try{
      const {data:account,error}=await sb
        .from('patient_portal_accounts')
        .select('*')
        .eq('user_id',session.user.id)
        .maybeSingle();
      if(error)throw error;
      if(version!==state.bootVersion)return;

      state.account=account||null;
      if(!account){
        showOnboarding();
        if(state.recoveryMode)openModal('passwordModal');
        return;
      }
      if(account.status!=='ACTIVE'){
        await sb.auth.signOut();
        showAuth('Akun sedang dibatasi. Hubungi Familia Medika.');
        return;
      }

      await loadPortalData();
      if(version!==state.bootVersion)return;
      renderAll();
      showApp();
      setMessage('authMessage','');
      if(state.recoveryMode)openModal('passwordModal');
    }catch(error){
      console.error(error);
      showAuth(error.message||'Sahabat Familia belum dapat dimuat. Coba kembali.');
    }
  }

  function switchAuthTab(mode){
    const login=mode==='login';
    $('#loginForm')?.classList.toggle('hidden',!login);
    $('#registerForm')?.classList.toggle('hidden',login);
    $$('[data-auth-tab]').forEach(button=>{
      const active=button.dataset.authTab===mode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    $('#authTitle').textContent=login?'Masuk ke akun':'Buat akun pasien';
    $('#authDescription').textContent=login
      ?'Gunakan email dan kata sandi akun pasien.'
      :'Daftar dengan email aktif, lalu lengkapi profil keluarga.';
    setMessage('authMessage','');
  }

  async function signIn(form){
    setMessage('authMessage','');
    const email=form.elements.email.value.trim().toLowerCase();
    const password=form.elements.password.value;
    localStorage.setItem(storagePreferenceKey,$('#rememberMe')?.checked?'local':'session');
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error)throw error;
  }

  async function signUp(form){
    setMessage('authMessage','');
    const email=form.elements.email.value.trim().toLowerCase();
    const password=form.elements.password.value;
    const confirmation=form.elements.password_confirmation.value;
    if(password.length<12)throw new Error('Kata sandi minimal 12 karakter.');
    if(password!==confirmation)throw new Error('Konfirmasi kata sandi tidak sama.');
    if(!$('#registerConsent')?.checked)throw new Error('Persetujuan penggunaan wajib dicentang.');

    localStorage.setItem(storagePreferenceKey,'local');
    const {data,error}=await sb.auth.signUp({
      email,
      password,
      options:{
        emailRedirectTo:`${location.origin}${cfg.APP_PATH||'/sahabat/'}`,
        data:{app_name:'Sahabat Familia'}
      }
    });
    if(error)throw error;
    if(data.session){
      toast('Akun berhasil dibuat. Lengkapi profil Anda.');
    }else{
      setMessage('authMessage','Akun dibuat. Buka email verifikasi, lalu kembali untuk masuk.','success');
      switchAuthTab('login');
      $('#loginEmail').value=email;
    }
  }

  async function requestPasswordReset(){
    const email=$('#loginEmail')?.value.trim().toLowerCase();
    if(!email)throw new Error('Masukkan email akun terlebih dahulu.');
    const {error}=await sb.auth.resetPasswordForEmail(email,{
      redirectTo:`${location.origin}${cfg.APP_PATH||'/sahabat/'}`
    });
    if(error)throw error;
    setMessage('authMessage','Tautan pemulihan kata sandi telah dikirim. Periksa Kotak Masuk dan Spam.','success');
  }

  async function submitOnboarding(form){
    const payload=Object.fromEntries(new FormData(form).entries());
    delete payload.consent;
    payload.phone=normalizePhone(payload.phone);
    payload.terms_version=cfg.TERMS_VERSION||'2026-08-12';
    const {error}=await sb.rpc('patient_portal_onboard',{payload});
    if(error)throw error;
    toast('Profil berhasil disimpan.');
    await boot((await sb.auth.getSession()).data.session);
  }

  function switchView(view,{replace=false}={}){
    if(!validViews.has(view))view='home';
    state.currentView=view;
    $$('.app-view').forEach(node=>node.classList.toggle('active',node.dataset.view===view));
    $$('[data-nav-view]').forEach(button=>button.classList.toggle('active',button.dataset.navView===view));
    const url=new URL(location.href);
    url.searchParams.set('view',view);
    if(replace)history.replaceState({view},'',url);
    else if(new URLSearchParams(location.search).get('view')!==view)history.pushState({view},'',url);
    window.scrollTo({top:0,behavior:'smooth'});
    if(view==='family')renderFamily();
    if(view==='documents')renderDocuments();
  }

  function renderAll(){
    renderHome();
    renderServices();
    renderBookings();
    renderFamily();
    renderDocuments();
    renderNotifications();
    renderAccount();
    populateBookingMembers();
  }

  function serviceCard(service){
    return `<button class="service-card" type="button" data-service-id="${esc(service.id)}">
      <span class="service-icon" aria-hidden="true">${esc(service.icon||'✚')}</span>
      <h3>${esc(service.name)}</h3>
      <p>${esc(service.description||'Layanan Familia Medika.')}</p>
      <span class="service-price">${esc(formatMoney(service.base_price))}</span>
    </button>`;
  }

  function renderHome(){
    $('#homeGreeting').textContent=`Halo, ${firstName(state.account?.full_name)} 👋`;
    const active=state.bookings.filter(item=>activeBookingStatuses.has(item.status)).length;
    const unread=state.notifications.filter(item=>item.status==='UNREAD').length;
    const metrics=[
      [active,'Jadwal aktif'],
      [state.members.length,'Anggota keluarga'],
      [state.documents.length,'Dokumen'],
      [unread,'Notifikasi baru']
    ];
    $('#homeMetrics').innerHTML=metrics.map(([value,label])=>`<article class="metric-card"><strong>${esc(value)}</strong><span>${esc(label)}</span></article>`).join('');
    $('#homeServiceGrid').innerHTML=state.services.slice(0,6).map(serviceCard).join('')||emptyState('✚','Layanan belum tersedia','Katalog layanan sedang disiapkan.');

    const upcoming=state.bookings
      .filter(item=>activeBookingStatuses.has(item.status))
      .sort((a,b)=>new Date(a.requested_start)-new Date(b.requested_start))[0];
    $('#nextBooking').innerHTML=upcoming?bookingCard(upcoming):emptyState('◷','Belum ada jadwal','Pesan layanan untuk membuat jadwal pertama Anda.','Pesan layanan','services');
    updateNotificationBadge();
  }

  function renderServices(){
    $('#serviceGrid').innerHTML=state.services.map(serviceCard).join('')||emptyState('✚','Belum ada layanan','Layanan sedang disiapkan Familia Medika.');
  }

  function emptyState(icon,title,description,buttonLabel='',view=''){
    return `<div class="empty-state"><div class="empty-icon">${esc(icon)}</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${buttonLabel?`<button class="btn btn-secondary btn-sm" type="button" data-go-view="${esc(view)}" style="margin-top:14px">${esc(buttonLabel)}</button>`:''}</div>`;
  }

  function bookingCard(booking){
    const service=serviceById(booking.service_id);
    const member=memberById(booking.member_id);
    const cancel=cancellableStatuses.has(booking.status);
    return `<article class="card booking-card">
      <div class="booking-top">
        <div>
          <span class="booking-code">${esc(booking.booking_code)}</span>
          <h3 class="booking-title">${esc(service.name||'Layanan Familia Medika')}</h3>
          <p class="muted small" style="margin:4px 0 0">Untuk ${esc(member.full_name||'-')}</p>
        </div>
        <span class="spacer"></span>
        ${statusChip(booking.status)}
      </div>
      <div class="booking-meta">
        <span>🗓️ <b>${esc(formatDateTime(booking.requested_start))}</b></span>
        <span>📍 ${esc(booking.visit_mode==='HOME_VISIT'?(booking.address||booking.city||'Alamat pasien'):booking.visit_mode==='ONLINE'?'Online':'Klinik Familia Medika')}</span>
        <span>👤 ${esc(booking.assigned_provider_name||'Tenaga kesehatan belum ditentukan')}</span>
        <span>💳 ${esc(statusLabel(booking.payment_status))}</span>
      </div>
      ${booking.chief_complaint?`<p class="booking-note">${esc(booking.chief_complaint)}</p>`:''}
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" type="button" data-booking-detail="${esc(booking.id)}">Lihat detail</button>
        ${cancel?`<button class="btn btn-outline btn-sm" type="button" data-cancel-booking="${esc(booking.id)}">Batalkan</button>`:''}
      </div>
    </article>`;
  }

  function renderBookings(){
    let list=[...state.bookings];
    if(state.bookingFilter==='active')list=list.filter(item=>activeBookingStatuses.has(item.status));
    if(state.bookingFilter==='history')list=list.filter(item=>!activeBookingStatuses.has(item.status));
    list.sort((a,b)=>new Date(b.requested_start)-new Date(a.requested_start));
    $('#bookingList').innerHTML=list.length?list.map(bookingCard).join(''):emptyState('◷','Belum ada pemesanan','Jadwal dan riwayat pelayanan akan tampil di sini.','Pesan layanan','services');
    $$('.booking-filter').forEach(button=>{
      const active=button.dataset.bookingFilter===state.bookingFilter;
      button.classList.toggle('active',active);
      button.classList.toggle('btn-secondary',active);
      button.classList.toggle('btn-outline',!active);
    });
  }

  function renderFamily(){
    if(!state.account)return;
    $('#accountSummary').innerHTML=`<div class="card-head"><div><p class="eyebrow">AKUN UTAMA</p><h3>${esc(state.account.full_name)}</h3><p>${esc(state.account.email||state.user?.email||'-')} · ${esc(state.account.phone||'-')}</p></div>${statusChip(state.account.status)}</div>`;
    $('#memberGrid').innerHTML=state.members.length?state.members.map(member=>`<article class="card member-card">
      <div class="member-avatar">${esc(initials(member.full_name))}</div>
      <div class="member-info"><h3>${esc(member.full_name)}</h3><p>${esc(member.relationship)} · ${esc(formatDate(member.birth_date))}</p></div>
      <span class="spacer"></span>
      ${member.is_primary?'<span class="status-chip status-active member-badge">Utama</span>':''}
      <button class="btn btn-outline btn-sm" type="button" data-edit-member="${esc(member.id)}">Edit</button>
    </article>`).join(''):emptyState('♙','Belum ada profil','Lengkapi profil utama atau tambah anggota keluarga.');
  }

  function renderAccount(){
    if(!state.account)return;
    const html=`<div class="card-head"><div class="member-avatar">${esc(initials(state.account.full_name))}</div><div><h3>${esc(state.account.full_name)}</h3><p>${esc(state.account.email||state.user?.email||'-')}</p><p>${esc(state.account.phone||'-')}</p></div></div>`;
    $('#accountModalSummary').innerHTML=html;
  }

  function documentCard(documentItem){
    return `<article class="card document-card">
      <div class="document-icon">▤</div>
      <div><h3>${esc(documentItem.title)}</h3><p>${esc(documentItem.document_type)} · ${esc(formatDateTime(documentItem.issued_at))}</p></div>
      <span class="spacer"></span>
      <button class="btn btn-outline btn-sm" type="button" data-document-detail="${esc(documentItem.id)}">Lihat</button>
    </article>`;
  }

  function invoiceCard(invoice){
    return `<article class="card document-card">
      <div class="document-icon">💳</div>
      <div><h3>${esc(invoice.invoice_code)}</h3><p>${esc(formatDateTime(invoice.issued_at||invoice.created_at))} · ${esc(statusLabel(invoice.status))}</p></div>
      <div class="invoice-total"><b>${esc(formatMoney(invoice.total))}</b><span>${esc(statusLabel(invoice.status))}</span></div>
      <button class="btn btn-outline btn-sm" type="button" data-invoice-detail="${esc(invoice.id)}">Rincian</button>
    </article>`;
  }

  function renderDocuments(){
    $('#documentList').innerHTML=state.documents.length?state.documents.map(documentCard).join(''):emptyState('▤','Belum ada dokumen','Resume, resep, atau dokumen final akan tampil setelah diterbitkan.');
    $('#invoiceList').innerHTML=state.invoices.length?state.invoices.map(invoiceCard).join(''):emptyState('💳','Belum ada tagihan','Tagihan pelayanan akan tampil setelah diterbitkan.');
  }

  function updateNotificationBadge(){
    const unread=state.notifications.filter(item=>item.status==='UNREAD').length;
    const badge=$('#notificationBadge');
    badge.textContent=unread>99?'99+':String(unread);
    badge.classList.toggle('hidden',unread===0);
  }

  function renderNotifications(){
    const list=$('#notificationList');
    if(!list)return;
    list.innerHTML=state.notifications.length?state.notifications.map(item=>`<button class="notification-card ${item.status==='UNREAD'?'unread':''}" type="button" data-notification-id="${esc(item.id)}">
      <span class="notification-dot"></span>
      <span style="text-align:left"><h3>${esc(item.title)}</h3><p>${esc(item.message)}</p><time>${esc(formatDateTime(item.created_at))}</time></span>
    </button>`).join(''):emptyState('🔔','Tidak ada notifikasi','Pembaruan layanan akan tampil di sini.');
    updateNotificationBadge();
  }

  function populateBookingMembers(){
    const select=$('#bookingMember');
    if(!select)return;
    select.innerHTML='<option value="">Pilih pasien</option>'+state.members.map(member=>`<option value="${esc(member.id)}">${esc(member.full_name)} — ${esc(member.relationship)}</option>`).join('');
  }

  function openModal(id){
    const modal=$(`#${id}`);
    if(!modal)return;
    modal.classList.remove('hidden');
    document.body.style.overflow='hidden';
    setTimeout(()=>modal.querySelector('input,select,textarea,button')?.focus(),50);
  }
  function closeModal(id){
    const modal=$(`#${id}`);
    if(!modal)return;
    modal.classList.add('hidden');
    if(!$$('.modal-backdrop:not(.hidden)').length)document.body.style.overflow='';
  }

  function setBookingStep(step){
    state.bookingStep=Math.max(1,Math.min(4,step));
    $$('.booking-step').forEach(section=>section.classList.toggle('active',Number(section.dataset.bookingStep)===state.bookingStep));
    $$('.stepper span').forEach((span,index)=>span.classList.toggle('active',index<state.bookingStep));
    $('#bookingPrevBtn').classList.toggle('hidden',state.bookingStep===1);
    $('#bookingNextBtn').classList.toggle('hidden',state.bookingStep===4);
    $('#bookingSubmitBtn').classList.toggle('hidden',state.bookingStep!==4);
    setMessage('bookingError','');
    if(state.bookingStep===4)buildBookingSummary();
  }

  function openBooking(serviceId){
    const service=serviceById(serviceId);
    if(!service.id){toast('Layanan tidak ditemukan.','error');return;}
    if(!state.members.length){toast('Lengkapi profil keluarga terlebih dahulu.','error');switchView('family');return;}

    state.selectedService=service;
    const form=$('#bookingForm');
    form.reset();
    $('#bookingServiceId').value=service.id;
    $('#bookingModalTitle').textContent=service.name;
    $('#bookingModalEyebrow').textContent=service.category||'PESAN LAYANAN';
    populateBookingMembers();
    const primary=primaryMember();
    $('#bookingMember').value=primary.id||'';

    const minDate=new Date(Date.now()+30*60*1000);
    const defaultDate=new Date(Date.now()+24*60*60*1000);
    const maxDate=new Date(Date.now()+180*24*60*60*1000);
    $('#bookingRequestedStart').min=localDateTimeValue(minDate);
    $('#bookingRequestedStart').max=localDateTimeValue(maxDate);
    $('#bookingRequestedStart').value=localDateTimeValue(defaultDate);
    form.elements.alternative_start.min=localDateTimeValue(minDate);
    form.elements.alternative_start.max=localDateTimeValue(maxDate);
    applyBookingMember(primary.id);
    renderBookingMode();
    setBookingStep(1);
    updateRedFlagWarning();
    openModal('bookingModal');
  }

  function renderBookingMode(){
    const service=state.selectedService||{};
    const labels={
      HOME_VISIT:'Tenaga kesehatan datang ke alamat pasien setelah jadwal dikonfirmasi.',
      ONLINE:'Konsultasi dilakukan secara online setelah jadwal dan kanal konsultasi dikonfirmasi.',
      KLINIK:'Pelayanan dilakukan di Klinik Familia Medika.'
    };
    $('#bookingModeInfo').textContent=labels[service.service_mode]||'Lokasi akan dikonfirmasi.';
    $$('.home-visit-field').forEach(field=>field.classList.toggle('hidden',service.service_mode!=='HOME_VISIT'));
  }

  function applyBookingMember(memberId){
    const member=memberById(memberId);
    if(!member.id)return;
    const form=$('#bookingForm');
    $('#bookingAddress').value=member.address||'';
    $('#bookingCity').value=member.city||'';
    form.elements.medical_history.value=member.medical_history||'';
    form.elements.allergies.value=member.allergies||'';
  }

  function selectedRedFlags(){
    const result={};
    Object.keys(redFlags).forEach(key=>{
      result[key]=Boolean($(`#red-${key}`)?.checked);
    });
    return result;
  }
  function hasRedFlag(){return Object.values(selectedRedFlags()).some(Boolean);}
  function updateRedFlagWarning(){$('#redFlagWarning').classList.toggle('hidden',!hasRedFlag());}

  function validateBookingStep(step){
    const form=$('#bookingForm');
    const data=new FormData(form);
    if(step===1){
      if(!data.get('member_id'))return 'Pilih pasien yang akan menerima layanan.';
      const requested=toIso(data.get('requested_start'));
      if(!requested||new Date(requested)<new Date(Date.now()+25*60*1000))return 'Pilih jadwal minimal 30 menit dari sekarang.';
      if(!String(data.get('chief_complaint')||'').trim())return 'Keluhan atau kebutuhan utama wajib diisi.';
    }
    if(step===2&&state.selectedService?.service_mode==='HOME_VISIT'){
      if(!String(data.get('address')||'').trim())return 'Alamat home visit wajib diisi.';
      if(!String(data.get('city')||'').trim())return 'Kota/Kabupaten wajib diisi.';
    }
    if(step===4&&!form.elements.consent.checked)return 'Persetujuan pengiriman data wajib dicentang.';
    return '';
  }

  function buildBookingSummary(){
    const form=$('#bookingForm');
    const data=Object.fromEntries(new FormData(form).entries());
    const member=memberById(data.member_id);
    const service=state.selectedService||{};
    const rows=[
      ['Layanan',service.name||'-'],
      ['Pasien',member.full_name||'-'],
      ['Jadwal pilihan',formatDateTime(toIso(data.requested_start))],
      ['Lokasi',service.service_mode==='HOME_VISIT'?(data.address||'-'):service.service_mode==='ONLINE'?'Online':'Klinik Familia Medika'],
      ['Keluhan/kebutuhan',data.chief_complaint||'-'],
      ['Tanda bahaya',hasRedFlag()?'Ada — prioritas klinis':'Tidak dilaporkan'],
      ['Perkiraan tarif',formatMoney(service.base_price)]
    ];
    $('#bookingSummary').innerHTML=rows.map(([label,value])=>`<div class="summary-row"><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('');
  }

  async function submitBooking(form){
    const errorMessage=validateBookingStep(4);
    if(errorMessage)throw new Error(errorMessage);
    const raw=Object.fromEntries(new FormData(form).entries());
    const payload={
      service_id:state.selectedService.id,
      member_id:raw.member_id,
      requested_start:toIso(raw.requested_start),
      alternative_start:toIso(raw.alternative_start),
      chief_complaint:String(raw.chief_complaint||'').trim(),
      address:String(raw.address||'').trim()||null,
      city:String(raw.city||'').trim()||null,
      notes:String(raw.notes||'').trim()||null,
      onset:String(raw.onset||'').trim()||null,
      course:String(raw.course||'').trim()||null,
      associated_symptoms:String(raw.associated_symptoms||'').trim()||null,
      medical_history:String(raw.medical_history||'').trim()||null,
      medication:String(raw.medication||'').trim()||null,
      allergies:String(raw.allergies||'').trim()||null,
      pregnancy:String(raw.pregnancy||'').trim()||null,
      red_flags:selectedRedFlags(),
      vitals:{}
    };
    const {data,error}=await sb.rpc('patient_portal_create_booking',{payload});
    if(error)throw error;
    closeModal('bookingModal');
    await refreshPortal();
    switchView('bookings');
    if(data?.emergency){
      toast('Permintaan tercatat sebagai prioritas klinis. Cari pertolongan darurat bila kondisi berat atau memburuk.','error');
    }else{
      toast(`Permintaan ${data?.booking_code||''} berhasil dikirim.`);
    }
  }

  function openBookingDetail(id){
    const booking=bookingById(id);
    if(!booking.id)return;
    const service=serviceById(booking.service_id);
    const member=memberById(booking.member_id);
    const rows=[
      ['Kode',booking.booking_code],
      ['Status',statusLabel(booking.status)],
      ['Layanan',service.name||'-'],
      ['Pasien',member.full_name||'-'],
      ['Jadwal',formatDateTime(booking.requested_start)],
      ['Lokasi',booking.visit_mode==='HOME_VISIT'?(booking.address||booking.city||'-'):booking.visit_mode==='ONLINE'?'Online':'Klinik Familia Medika'],
      ['Tenaga kesehatan',booking.assigned_provider_name||'Belum ditentukan'],
      ['Keluhan/kebutuhan',booking.chief_complaint||'-'],
      ['No. kunjungan',booking.encounter_code||'Belum diterbitkan'],
      ['Pembayaran',statusLabel(booking.payment_status)],
      ['Perkiraan tarif',formatMoney(booking.price_estimate)]
    ];
    $('#bookingDetailBody').innerHTML=`<div style="margin-bottom:14px">${statusChip(booking.status)}</div><div class="summary-list">${rows.map(([label,value])=>`<div class="summary-row"><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}</div>`;
    const actions=$('#bookingDetailActions');
    actions.innerHTML=`<button class="btn btn-outline" type="button" data-close-modal="bookingDetailModal">Tutup</button>${cancellableStatuses.has(booking.status)?`<button class="btn btn-danger" type="button" data-cancel-booking="${esc(booking.id)}">Batalkan</button>`:''}`;
    openModal('bookingDetailModal');
  }

  async function cancelBooking(id){
    const booking=bookingById(id);
    if(!booking.id||!cancellableStatuses.has(booking.status))return;
    if(!confirm(`Batalkan pemesanan ${booking.booking_code}?`))return;
    const {error}=await sb.rpc('patient_portal_cancel_booking',{p_booking_id:id});
    if(error)throw error;
    closeModal('bookingDetailModal');
    await refreshPortal();
    toast('Pemesanan dibatalkan.');
  }

  function ensureRelationshipOption(select,value){
    if(!value)return;
    if(![...select.options].some(option=>option.value===value))select.add(new Option(value,value),0);
  }

  function openMemberEditor(id=''){
    const form=$('#memberForm');
    form.reset();
    $('#memberId').value=id;
    setMessage('memberError','');
    const relationship=form.elements.relationship;
    relationship.disabled=false;

    if(id){
      const member=memberById(id);
      if(!member.id)return;
      $('#memberModalTitle').textContent=member.is_primary?'Edit profil utama':'Edit anggota keluarga';
      ensureRelationshipOption(relationship,member.relationship);
      ['full_name','relationship','birth_date','gender','phone','address','city','emergency_contact','allergies','medical_history','national_id_last4'].forEach(name=>{
        if(form.elements[name])form.elements[name].value=member[name]||'';
      });
      if(member.is_primary)relationship.disabled=true;
    }else{
      $('#memberModalTitle').textContent='Tambah anggota keluarga';
    }
    openModal('memberModal');
  }

  function memberPayload(form){
    const raw=Object.fromEntries(new FormData(form).entries());
    const member=id=>memberById(id);
    const current=member($('#memberId').value);
    return {
      full_name:String(raw.full_name||'').trim(),
      relationship:current.is_primary?'Diri sendiri':String(raw.relationship||'Keluarga').trim(),
      birth_date:raw.birth_date||null,
      gender:raw.gender||'Tidak diketahui',
      phone:normalizePhone(raw.phone)||null,
      address:String(raw.address||'').trim()||null,
      city:String(raw.city||'').trim()||null,
      emergency_contact:String(raw.emergency_contact||'').trim()||null,
      allergies:String(raw.allergies||'').trim()||null,
      medical_history:String(raw.medical_history||'').trim()||null,
      national_id_last4:String(raw.national_id_last4||'').trim()||null
    };
  }

  async function saveMember(form){
    const id=$('#memberId').value;
    const payload=memberPayload(form);
    if(!payload.full_name)throw new Error('Nama lengkap wajib diisi.');
    if(!payload.birth_date)throw new Error('Tanggal lahir wajib diisi.');
    if(payload.national_id_last4&&!/^\d{4}$/.test(payload.national_id_last4))throw new Error('Masukkan tepat 4 digit terakhir NIK.');

    if(!id){
      const {error}=await sb.rpc('patient_portal_add_member',{payload});
      if(error)throw error;
    }else{
      const member=memberById(id);
      if(member.is_primary){
        payload.terms_version=cfg.TERMS_VERSION||'2026-08-12';
        const {error}=await sb.rpc('patient_portal_onboard',{payload});
        if(error)throw error;
      }else{
        const {error}=await sb.from('patient_portal_members').update(payload).eq('id',id).eq('user_id',state.user.id);
        if(error)throw error;
      }
    }
    closeModal('memberModal');
    await refreshPortal();
    toast(id?'Profil diperbarui.':'Anggota keluarga ditambahkan.');
  }

  async function openNotifications(){
    renderNotifications();
    openModal('notificationModal');
  }

  async function readNotification(id){
    const item=state.notifications.find(row=>row.id===id);
    if(!item)return;
    if(item.status==='UNREAD'){
      const {error}=await sb.from('patient_notifications').update({status:'READ',read_at:new Date().toISOString()}).eq('id',id).eq('user_id',state.user.id);
      if(error){toast(error.message,'error');return;}
      item.status='READ';
      item.read_at=new Date().toISOString();
      renderNotifications();
      renderHome();
    }
    closeModal('notificationModal');
    if(item.link_view&&validViews.has(item.link_view))switchView(item.link_view);
  }

  function humanizeKey(key){return String(key).replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());}
  function contentRows(content){
    if(!content||typeof content!=='object')return '<p class="muted">Tidak ada rincian tambahan.</p>';
    const entries=Object.entries(content).filter(([,value])=>value!==null&&value!==undefined&&value!=='');
    if(!entries.length)return '<p class="muted">Tidak ada rincian tambahan.</p>';
    return `<div class="summary-list">${entries.map(([key,value])=>{
      const display=typeof value==='object'?JSON.stringify(value,null,2):String(value);
      return `<div class="summary-row"><span>${esc(humanizeKey(key))}</span><b style="white-space:pre-wrap">${esc(display)}</b></div>`;
    }).join('')}</div>`;
  }

  function openDocumentDetail(id){
    const item=state.documents.find(row=>row.id===id);
    if(!item)return;
    $('#bookingDetailTitle').textContent=item.title;
    $('#bookingDetailBody').innerHTML=`<div class="inline" style="margin-bottom:14px">${statusChip(item.status)}<span class="muted small">${esc(formatDateTime(item.issued_at))}</span></div>${contentRows(item.content)}`;
    $('#bookingDetailActions').innerHTML='<button class="btn btn-outline" type="button" data-close-modal="bookingDetailModal">Tutup</button>';
    openModal('bookingDetailModal');
  }

  function openInvoiceDetail(id){
    const item=state.invoices.find(row=>row.id===id);
    if(!item)return;
    const items=Array.isArray(item.items)?item.items:[];
    $('#bookingDetailTitle').textContent=`Tagihan ${item.invoice_code}`;
    $('#bookingDetailBody').innerHTML=`
      <div class="inline" style="margin-bottom:14px">${statusChip(item.status)}<span class="muted small">${esc(formatDateTime(item.issued_at||item.created_at))}</span></div>
      <div class="summary-list">
        ${items.map(row=>`<div class="summary-row"><span>${esc(row.description||row.name||'Item')}</span><b>${esc(formatMoney(row.line_total??row.amount??row.unit_price))}</b></div>`).join('')||'<p class="muted small">Rincian item belum tersedia.</p>'}
        <div class="summary-row"><span>Subtotal</span><b>${esc(formatMoney(item.subtotal))}</b></div>
        <div class="summary-row"><span>Diskon</span><b>${esc(formatMoney(item.discount))}</b></div>
        <div class="summary-row"><span>Total</span><b>${esc(formatMoney(item.total))}</b></div>
        <div class="summary-row"><span>Jatuh tempo</span><b>${esc(formatDate(item.due_date))}</b></div>
      </div>
      ${item.status!=='PAID'?'<div class="warning-box" style="margin-top:14px">Metode pembayaran digital akan ditampilkan setelah kanal pembayaran resmi Familia Medika diaktifkan.</div>':''}`;
    $('#bookingDetailActions').innerHTML='<button class="btn btn-outline" type="button" data-close-modal="bookingDetailModal">Tutup</button>';
    openModal('bookingDetailModal');
  }

  async function updatePassword(form){
    const password=form.elements.password.value;
    const confirmation=form.elements.confirmation.value;
    if(password.length<12)throw new Error('Kata sandi minimal 12 karakter.');
    if(password!==confirmation)throw new Error('Konfirmasi kata sandi tidak sama.');
    const {error}=await sb.auth.updateUser({password});
    if(error)throw error;
    state.recoveryMode=false;
    closeModal('passwordModal');
    form.reset();
    toast('Kata sandi berhasil diperbarui.');
  }

  async function logout(){
    await sb.auth.signOut({scope:'local'});
    resetPortalState();
    showAuth('Anda telah keluar.','success');
  }

  function configurePwa(){
    const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('sw.js').catch(error=>console.warn('Service worker:',error));
    }
    window.addEventListener('beforeinstallprompt',event=>{
      event.preventDefault();
      state.deferredInstallPrompt=event;
      if(!standalone){
        $('#installBtn')?.classList.remove('hidden');
        $('#installBanner')?.classList.remove('hidden');
      }
    });
    window.addEventListener('appinstalled',()=>{
      state.deferredInstallPrompt=null;
      $('#installBtn')?.classList.add('hidden');
      $('#installBanner')?.classList.add('hidden');
      toast('Sahabat Familia berhasil dipasang.');
    });
  }

  async function installApp(){
    if(state.deferredInstallPrompt){
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice.catch(()=>null);
      state.deferredInstallPrompt=null;
      return;
    }
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    alert(ios
      ?'Di Safari, tekan Bagikan lalu pilih “Tambahkan ke Layar Utama”.'
      :'Buka menu browser lalu pilih “Instal aplikasi” atau “Tambahkan ke layar utama”.');
  }

  function bindEvents(){
    $$('[data-auth-tab]').forEach(button=>button.addEventListener('click',()=>switchAuthTab(button.dataset.authTab)));
    $$('[data-password-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const input=$(`#${button.dataset.passwordToggle}`);
      if(!input)return;
      input.type=input.type==='password'?'text':'password';
      button.textContent=input.type==='password'?'Lihat':'Sembunyikan';
    }));

    $('#loginForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const button=$('#loginSubmit');
      withBusy(button,()=>signIn(event.currentTarget),'Memverifikasi...')
        .catch(error=>setMessage('authMessage',error.message||'Login gagal.'));
    });
    $('#registerForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const button=$('#registerSubmit');
      withBusy(button,()=>signUp(event.currentTarget),'Membuat akun...')
        .catch(error=>setMessage('authMessage',error.message||'Pendaftaran gagal.'));
    });
    $('#forgotPasswordBtn')?.addEventListener('click',()=>requestPasswordReset().catch(error=>setMessage('authMessage',error.message)));
    $('#rememberMe').checked=localStorage.getItem(storagePreferenceKey)!=='session';

    $('#onboardingForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const button=event.currentTarget.querySelector('button[type="submit"]');
      setMessage('onboardingError','');
      withBusy(button,()=>submitOnboarding(event.currentTarget),'Menyimpan...')
        .catch(error=>setMessage('onboardingError',error.message||'Profil gagal disimpan.'));
    });
    $('#onboardingLogout')?.addEventListener('click',()=>logout().catch(console.error));

    $$('[data-nav-view]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.navView)));
    document.addEventListener('click',event=>{
      const go=event.target.closest('[data-go-view]');
      if(go){switchView(go.dataset.goView);return;}
      const service=event.target.closest('[data-service-id]');
      if(service){openBooking(service.dataset.serviceId);return;}
      const detail=event.target.closest('[data-booking-detail]');
      if(detail){openBookingDetail(detail.dataset.bookingDetail);return;}
      const cancel=event.target.closest('[data-cancel-booking]');
      if(cancel){cancelBooking(cancel.dataset.cancelBooking).catch(error=>toast(error.message,'error'));return;}
      const editMember=event.target.closest('[data-edit-member]');
      if(editMember){openMemberEditor(editMember.dataset.editMember);return;}
      const documentDetail=event.target.closest('[data-document-detail]');
      if(documentDetail){openDocumentDetail(documentDetail.dataset.documentDetail);return;}
      const invoiceDetail=event.target.closest('[data-invoice-detail]');
      if(invoiceDetail){openInvoiceDetail(invoiceDetail.dataset.invoiceDetail);return;}
      const notification=event.target.closest('[data-notification-id]');
      if(notification){readNotification(notification.dataset.notificationId).catch(error=>toast(error.message,'error'));return;}
      const close=event.target.closest('[data-close-modal]');
      if(close){closeModal(close.dataset.closeModal);return;}
      if(event.target.classList.contains('modal-backdrop'))closeModal(event.target.id);
    });

    $$('.booking-filter').forEach(button=>button.addEventListener('click',()=>{
      state.bookingFilter=button.dataset.bookingFilter;
      renderBookings();
    }));
    $('#bookingMember')?.addEventListener('change',event=>applyBookingMember(event.target.value));
    $('#redFlagGrid').innerHTML=Object.entries(redFlags).map(([key,label])=>`<label class="red-flag-item"><input id="red-${esc(key)}" type="checkbox"><span>${esc(label)}</span></label>`).join('');
    $('#redFlagGrid')?.addEventListener('change',updateRedFlagWarning);
    $('#bookingNextBtn')?.addEventListener('click',()=>{
      const message=validateBookingStep(state.bookingStep);
      if(message){setMessage('bookingError',message);return;}
      setBookingStep(state.bookingStep+1);
    });
    $('#bookingPrevBtn')?.addEventListener('click',()=>setBookingStep(state.bookingStep-1));
    $('#bookingForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const button=$('#bookingSubmitBtn');
      setMessage('bookingError','');
      withBusy(button,()=>submitBooking(event.currentTarget),'Mengirim...')
        .catch(error=>setMessage('bookingError',error.message||'Pemesanan gagal dikirim.'));
    });

    $('#addMemberBtn')?.addEventListener('click',()=>openMemberEditor());
    $('#memberForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const button=event.currentTarget.querySelector('button[type="submit"]');
      setMessage('memberError','');
      withBusy(button,()=>saveMember(event.currentTarget),'Menyimpan...')
        .catch(error=>setMessage('memberError',error.message||'Profil gagal disimpan.'));
    });

    $('#notificationBtn')?.addEventListener('click',()=>openNotifications());
    $('#accountMenuBtn')?.addEventListener('click',()=>openModal('accountModal'));
    $('#accountModalFamily')?.addEventListener('click',()=>{closeModal('accountModal');switchView('family');});
    $('#accountModalLogout')?.addEventListener('click',()=>logout().catch(error=>toast(error.message,'error')));
    $('#logoutBtn')?.addEventListener('click',()=>logout().catch(error=>toast(error.message,'error')));
    $('#changePasswordBtn')?.addEventListener('click',()=>openModal('passwordModal'));
    $('#passwordForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const button=event.currentTarget.querySelector('button[type="submit"]');
      setMessage('passwordError','');
      withBusy(button,()=>updatePassword(event.currentTarget),'Menyimpan...')
        .catch(error=>setMessage('passwordError',error.message||'Kata sandi gagal diperbarui.'));
    });

    $('#installBtn')?.addEventListener('click',installApp);
    $('#installBannerBtn')?.addEventListener('click',installApp);
    window.addEventListener('popstate',()=>{
      const view=new URLSearchParams(location.search).get('view');
      if(validViews.has(view))switchView(view,{replace:true});
    });
    window.addEventListener('online',()=>toast('Koneksi internet kembali tersedia.'));
    window.addEventListener('offline',()=>toast('Anda sedang offline. Data klinis tidak tersedia tanpa internet.','error'));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        const open=$$('.modal-backdrop:not(.hidden)').pop();
        if(open)closeModal(open.id);
      }
    });
  }

  function initializeAuth(){
    sb.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY')state.recoveryMode=true;
      setTimeout(()=>boot(session),0);
    });
    sb.auth.getSession().then(({data,error})=>{
      if(error){showAuth(error.message);return;}
      boot(data.session);
    });
  }

  bindEvents();
  configurePwa();
  initializeAuth();
})();

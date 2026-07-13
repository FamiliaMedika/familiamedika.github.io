(function(){
  'use strict';
  const cfg=window.FM_CONFIG||{};
  const invalid=!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes('PROJECT_ID')||!cfg.SUPABASE_ANON_KEY||cfg.SUPABASE_ANON_KEY.includes('REPLACE_ME');
  window.FM_CONFIG_INVALID=invalid;
  if(invalid){console.warn('Supabase config belum diisi.');return;}
  if(!window.supabase?.createClient){console.error('Library Supabase tidak termuat.');window.FM_CONFIG_INVALID=true;return;}
  window.fmSupabase=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
})();

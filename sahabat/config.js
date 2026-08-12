window.SF_CONFIG = Object.freeze({
  SUPABASE_URL: "https://cvfuuflnfexaqnncgjmw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_mqJVZHJKwvtbT5xAJurv9w_j5LMqUlK",
  APP_NAME: "Sahabat Familia",
  APP_TAGLINE: "Kesehatan Keluarga, Lebih Dekat",
  APP_PATH: "/sahabat/",
  AUTH_REDIRECT_URL: "https://www.familiamedika.id/sahabat/",
  SUPPORT_WHATSAPP: "",
  TERMS_VERSION: "2026-08-12"
});

// Sahabat Familia is a static client-side application. Force every new signup
// and recovery request to use the production URL, even when the app is opened
// from a local preview. The implicit flow is appropriate for this static PWA and
// avoids redirecting users to a server-side code-exchange endpoint.
(()=>{
  'use strict';

  const sdk=window.supabase;
  const originalCreateClient=sdk?.createClient;
  if(typeof originalCreateClient!=='function'||sdk.__sahabatAuthRedirectPatched)return;

  const canonicalRedirect=window.SF_CONFIG.AUTH_REDIRECT_URL;

  sdk.createClient=function(url,key,options={}){
    const client=originalCreateClient.call(this,url,key,{
      ...options,
      auth:{
        ...(options.auth||{}),
        detectSessionInUrl:true,
        flowType:'implicit'
      }
    });

    if(client?.auth&&!client.auth.__sahabatRedirectPatched){
      const originalSignUp=client.auth.signUp.bind(client.auth);
      const originalReset=client.auth.resetPasswordForEmail.bind(client.auth);

      client.auth.signUp=(credentials={})=>originalSignUp({
        ...credentials,
        options:{
          ...(credentials.options||{}),
          emailRedirectTo:canonicalRedirect
        }
      });

      client.auth.resetPasswordForEmail=(email,options={})=>originalReset(email,{
        ...options,
        redirectTo:`${canonicalRedirect}?recovery=1`
      });

      Object.defineProperty(client.auth,'__sahabatRedirectPatched',{
        value:true,
        configurable:false,
        enumerable:false
      });
    }

    return client;
  };

  Object.defineProperty(sdk,'__sahabatAuthRedirectPatched',{
    value:true,
    configurable:false,
    enumerable:false
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("script[data-sahabat-auth-feedback]")) return;
  const script = document.createElement("script");
  script.src = "auth-feedback.js?v=20260812b";
  script.dataset.sahabatAuthFeedback = "true";
  document.body.appendChild(script);
}, { once: true });

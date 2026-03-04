import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("id");

  if (!userId) {
    return new Response("// vox-widget: missing id parameter", {
      headers: { ...corsHeaders, "Content-Type": "application/javascript" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const chatUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/functions/v1/vox-chat`;

  // The widget JS creates an iframe pointing to the hosted chat page
  // This is the simplest and most maintainable approach
  const projectUrl = url.origin.replace("/functions/v1/vox-widget", "");
  
  const widgetJS = `
(function() {
  if (window.__voxWidgetLoaded) return;
  window.__voxWidgetLoaded = true;

  var userId = "${userId}";
  var chatOrigin = "${supabaseUrl}";
  
  // Fetch settings
  fetch(chatOrigin + "/rest/v1/vox_settings?user_id=eq." + userId + "&select=primary_color,widget_position,widget_trigger_seconds,widget_trigger_scroll,ai_name,ai_avatar_url", {
    headers: { "apikey": "${Deno.env.get("SUPABASE_ANON_KEY")}", "Content-Type": "application/json" }
  })
  .then(function(r) { return r.json(); })
  .then(function(settings) {
    var s = (settings && settings[0]) || {};
    var color = s.primary_color || "#6366f1";
    var position = s.widget_position || "bottom-right";
    var triggerSeconds = s.widget_trigger_seconds || 0;
    var triggerScroll = s.widget_trigger_scroll || 0;
    var aiName = s.ai_name || "Vox";
    var isRight = position === "bottom-right";

    // Create toggle button
    var btn = document.createElement("div");
    btn.id = "vox-widget-btn";
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    btn.style.cssText = "position:fixed;bottom:20px;" + (isRight ? "right:20px" : "left:20px") + ";width:56px;height:56px;border-radius:50%;background:" + color + ";color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:transform 0.2s;";
    btn.onmouseenter = function() { btn.style.transform = "scale(1.1)"; };
    btn.onmouseleave = function() { btn.style.transform = "scale(1)"; };

    // Create iframe container
    var container = document.createElement("div");
    container.id = "vox-widget-container";
    container.style.cssText = "position:fixed;bottom:86px;" + (isRight ? "right:20px" : "left:20px") + ";width:380px;height:550px;max-height:80vh;border-radius:16px;overflow:hidden;z-index:99998;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:none;transition:opacity 0.2s,transform 0.2s;opacity:0;transform:translateY(10px);";

    var iframe = document.createElement("iframe");
    var params = new URLSearchParams(window.location.search);
    var chatPageUrl = window.location.origin.indexOf("localhost") > -1
      ? window.location.origin + "/chat/" + userId
      : "https://" + window.location.hostname + "/chat/" + userId;
    
    // Try using the published app URL from the script src
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var dataSrc = scripts[i].getAttribute("data-vox-id");
      var src = scripts[i].src || "";
      if (dataSrc === userId && src.indexOf("vox-widget") > -1) {
        var srcUrl = new URL(src);
        // The chat page lives on the app's domain
        var appOriginAttr = scripts[i].getAttribute("data-vox-origin");
        if (appOriginAttr) {
          chatPageUrl = appOriginAttr + "/chat/" + userId;
        }
        break;
      }
    }

    // Pass UTM params
    var utmKeys = ["utm_source", "utm_medium", "utm_campaign"];
    var chatParams = new URLSearchParams();
    utmKeys.forEach(function(k) { var v = params.get(k); if (v) chatParams.set(k, v); });
    if (chatParams.toString()) chatPageUrl += "?" + chatParams.toString();

    iframe.src = chatPageUrl;
    iframe.style.cssText = "width:100%;height:100%;border:none;";
    iframe.allow = "clipboard-write";
    container.appendChild(iframe);

    var isOpen = false;
    function toggle() {
      isOpen = !isOpen;
      if (isOpen) {
        container.style.display = "block";
        setTimeout(function() { container.style.opacity = "1"; container.style.transform = "translateY(0)"; }, 10);
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      } else {
        container.style.opacity = "0";
        container.style.transform = "translateY(10px)";
        setTimeout(function() { container.style.display = "none"; }, 200);
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      }
    }
    btn.onclick = toggle;

    document.body.appendChild(container);
    document.body.appendChild(btn);

    // Auto-open triggers
    if (triggerSeconds > 0) {
      setTimeout(function() { if (!isOpen) toggle(); }, triggerSeconds * 1000);
    }
    if (triggerScroll > 0) {
      var scrollTriggered = false;
      window.addEventListener("scroll", function() {
        if (scrollTriggered || isOpen) return;
        var scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= triggerScroll) {
          scrollTriggered = true;
          toggle();
        }
      });
    }
  })
  .catch(function(e) { console.error("Vox widget error:", e); });
})();
`;

  return new Response(widgetJS, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=300",
    },
  });
});

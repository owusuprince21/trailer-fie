function detectProblematicEnv() {
  const ua = navigator.userAgent || '';
  const inApp =
    /\bFBAN|FBAV|Instagram|Line\/|Twitter|TikTok|Snapchat|Pinterest|WeChat|MiuiBrowser\b/i.test(ua) ||
    // some in-app browsers expose this
    !!(window as any).webkit?.messageHandlers;

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  // PWA “standalone” modes
  const isStandalonePWA =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    // iOS homescreen
    (navigator as any).standalone === true;

  return { inApp, isStandalonePWA, isIOS, isAndroid };
}

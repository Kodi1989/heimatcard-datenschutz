(() => {
  'use strict';
  const endpoint = 'https://blxuozjyzxhguzchclmn.supabase.co/auth/v1/verify';
  const apiKey = 'sb_publishable_AdAFKzG_D-5Zr8FP5uDNhQ_wJdGK7tL';
  const title = document.getElementById('title');
  const message = document.getElementById('message');
  const button = document.getElementById('confirm');
  const app = document.getElementById('app');
  const params = new URLSearchParams(location.hash.slice(1));
  let token = params.get('token_hash');
  // Remove the token before any user follows another link. Never persist sessions.
  history.replaceState(null, '', location.pathname);
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  function show(heading, text) {
    title.textContent = heading;
    message.textContent = text;
  }
  function invalid() {
    show('Dieser Link ist nicht mehr gültig', 'Der Link ist abgelaufen oder wurde bereits verwendet. Versuche zuerst, dich in der HEIMATCard-App anzumelden. Falls deine E-Mail-Adresse noch nicht bestätigt ist, kannst du dort eine neue Bestätigungs-E-Mail anfordern.');
    button.hidden = true;
    token = null;
  }
  if (!token || !/^[a-f0-9]{32,128}$/i.test(token)) {
    show('Öffne den Link aus deiner E-Mail', 'Bitte öffne den vollständigen Bestätigungslink aus der neuesten HEIMATCard-E-Mail. Wenn du deine E-Mail bereits bestätigt hast, melde dich jetzt in der App an.');
    button.hidden = true;
    return;
  }
  button.hidden = false;
  button.addEventListener('click', async () => {
    if (button.disabled || !token) return;
    button.disabled = true;
    button.textContent = 'Wird bestätigt …';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: token, type: 'email' }),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (response.status === 403 || response.status === 400 || response.status === 422) {
        invalid();
        return;
      }
      if (!response.ok) throw new Error('Verification temporarily unavailable');
      const result = await response.json();
      if (!result.user?.email_confirmed_at) throw new Error('Confirmation not verified');
      token = null;
      button.hidden = true;
      show('Deine E-Mail-Adresse wurde bestätigt', 'Öffne jetzt die HEIMATCard-App auf deinem Smartphone und melde dich mit deiner E-Mail-Adresse und deinem Passwort an. Wenn du deine physische Karte bereits geprüft hast, wird sie beim Login automatisch übernommen. Bei Problemen mit der Verknüpfung hilft dir unser Support.');
      if (mobile) app.hidden = false;
    } catch {
      show('Bestätigung gerade nicht möglich', 'Bitte prüfe deine Internetverbindung und versuche es erneut. Falls du dich bereits in der App anmelden kannst, ist deine E-Mail-Adresse schon bestätigt.');
      button.disabled = false;
      button.textContent = 'Erneut versuchen';
    } finally {
      clearTimeout(timer);
    }
  });
})();

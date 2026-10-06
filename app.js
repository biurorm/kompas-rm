// RM NIERUCHOMOŚCI, Kompas
// Kierunek okna po polsku, godziny słońca w oknie i podpowiedź, jakie pomieszczenie tu pasuje.
// Wszystko liczone w telefonie, nic nie jest wysyłane.

const WERSJA = 1;

const $ = (s) => document.querySelector(s);
document.querySelectorAll('[data-wersja]').forEach((el) => { el.textContent = 'v' + WERSJA; });

const ELBLAG = { lat: 54.156, lon: 19.404, nazwa: 'Elbląg' };
const SVG = 'http://www.w3.org/2000/svg';

// ---------- PAMIĘĆ (tylko wygoda, aplikacja działa i bez niej) ----------
function czytaj(klucz, dom) { try { const v = localStorage.getItem(klucz); return v ? JSON.parse(v) : dom; } catch (e) { return dom; } }
function zapisz(klucz, v) { try { localStorage.setItem(klucz, JSON.stringify(v)); } catch (e) { /* brak pamięci */ } }

const stan = {
  kat: 180,            // kierunek okna w stopniach (0 = północ)
  zamrozone: false,
  czujnik: false,
  miejsce: czytaj('kompas-rm-miejsce', ELBLAG),
  deklinacja: czytaj('kompas-rm-deklinacja', 6),
  pomiary: czytaj('kompas-rm-pomiary', []),
};

// ---------- KIERUNKI ----------
const KIERUNKI = [
  { nazwa: 'Północ', skrot: 'Pn', przym: 'północną', na: 'północ' },
  { nazwa: 'Północny wschód', skrot: 'Pn-Wsch', przym: 'północno-wschodnią', na: 'północny wschód' },
  { nazwa: 'Wschód', skrot: 'Wsch', przym: 'wschodnią', na: 'wschód' },
  { nazwa: 'Południowy wschód', skrot: 'Pd-Wsch', przym: 'południowo-wschodnią', na: 'południowy wschód' },
  { nazwa: 'Południe', skrot: 'Pd', przym: 'południową', na: 'południe' },
  { nazwa: 'Południowy zachód', skrot: 'Pd-Zach', przym: 'południowo-zachodnią', na: 'południowy zachód' },
  { nazwa: 'Zachód', skrot: 'Zach', przym: 'zachodnią', na: 'zachód' },
  { nazwa: 'Północny zachód', skrot: 'Pn-Zach', przym: 'północno-zachodnią', na: 'północny zachód' },
];
const sektor = (k) => Math.round(((k % 360) + 360) % 360 / 45) % 8;

// Co pasuje do okna w danym kierunku. tak = polecane, moze = może być, nie = lepiej nie.
const POKOJE = [
  { // Północ
    tak: [['Łazienka', 'słońce niepotrzebne, chłodno i równo przez cały rok'], ['Kuchnia', 'jedzenie i lodówka nie nagrzewają się od słońca'], ['Gabinet, pracownia', 'równe, rozproszone światło bez odblasków na ekranie'], ['Garderoba, spiżarnia', 'ubrania nie płowieją, zapasy trzymają chłód']],
    moze: [['Sypialnia', 'dla osób, które lubią chłód i ciemno rano']],
    nie: [['Salon', 'słońce zagląda tylko latem, wcześnie rano i późnym wieczorem'], ['Pokój dziecka', 'przez większą część roku bez słońca']],
    zdanie: 'Okna od północy dają równe, rozproszone światło przez cały dzień, a latem mieszkanie się nie przegrzewa. To wymarzone warunki do pracy przy komputerze i do kuchni, w której nic nie nagrzewa się od słońca.',
  },
  { // Północny wschód
    tak: [['Sypialnia', 'łagodne słońce o świcie, wieczorem przyjemnie chłodno'], ['Kuchnia', 'jasno przy śniadaniu, bez upału przy gotowaniu'], ['Łazienka', 'poranne światło przy myciu']],
    moze: [['Gabinet', 'po południu równe światło do pracy']],
    nie: [['Salon', 'po południu i wieczorem już bez słońca']],
    zdanie: 'Okna na północny wschód łapią pierwsze, łagodne słońce o świcie, a wieczorem w środku jest przyjemnie chłodno. Sypialnia od tej strony to spokojny sen nawet w upalne lato.',
  },
  { // Wschód
    tak: [['Sypialnia', 'budzi naturalne światło, wieczorem chłodno'], ['Kuchnia z jadalnią', 'śniadanie w słońcu'], ['Pokój dziecka', 'jasne poranki, spokojne wieczory do snu']],
    moze: [['Salon', 'jasny do południa, po południu już w cieniu'], ['Gabinet', 'rano słońce może odbijać się w ekranie']],
    nie: [],
    zdanie: 'Okna od wschodu wpuszczają poranne słońce, więc dzień zaczyna się od światła, a nie od budzika. Po południu wnętrze odpoczywa w cieniu i wieczorem jest przyjemnie chłodno.',
  },
  { // Południowy wschód
    tak: [['Kuchnia z jadalnią', 'słońce od rana do wczesnego popołudnia'], ['Pokój dziecka', 'jasno przez większość dnia'], ['Sypialnia', 'słońce rano, chłodno wieczorem'], ['Gabinet', 'dużo światła w godzinach pracy']],
    moze: [['Salon', 'jasny przed południem, wieczorem bez słońca']],
    nie: [['Garderoba, spiżarnia', 'szkoda najlepszego światła na schowek']],
    zdanie: 'Okna na południowy wschód to słońce od śniadania aż do wczesnego popołudnia. Wnętrze jest jasne przez większą część dnia, a wieczorem nie nagrzewa się jak od zachodu.',
  },
  { // Południe
    tak: [['Salon', 'najwięcej słońca w roku, jasno przez cały dzień'], ['Pokój dziecka', 'słońce w ciągu dnia'], ['Jadalnia', 'jasno przy każdym posiłku'], ['Balkon, taras', 'najdłuższe słońce, także zimą']],
    moze: [['Gabinet', 'z roletami albo żaluzjami']],
    nie: [['Sypialnia', 'latem się przegrzewa'], ['Spiżarnia', 'za ciepło na zapasy']],
    zdanie: 'Okna od południa łapią najwięcej słońca w ciągu roku. Zimą wnętrze grzeje się światłem, a salon jest jasny od rana do wieczora.',
  },
  { // Południowy zachód
    tak: [['Salon', 'słońce od południa do wieczora, kiedy wszyscy są w domu'], ['Balkon, taras', 'popołudnia i wieczory w słońcu'], ['Pokój dziecka', 'słońce po powrocie ze szkoły']],
    moze: [['Jadalnia', 'kolacja w słońcu, latem ciepło'], ['Gabinet', 'popołudniowe odblaski na ekranie']],
    nie: [['Sypialnia', 'wieczorem nagrzana, trudniej zasnąć latem'], ['Kuchnia', 'latem upał w porze gotowania obiadu']],
    zdanie: 'Okna na południowy zachód to słońce od południa aż do wieczora, czyli wtedy, kiedy jesteś w domu po pracy. Salon i balkon od tej strony to popołudnia w pełnym świetle.',
  },
  { // Zachód
    tak: [['Salon', 'wieczorne słońce po powrocie z pracy'], ['Balkon, taras', 'zachody słońca z okna']],
    moze: [['Jadalnia', 'kolacja w złotym świetle'], ['Pokój dziecka', 'jasne popołudnia, latem ciepło wieczorem']],
    nie: [['Sypialnia', 'latem przegrzana wieczorem'], ['Kuchnia', 'popołudniowy upał przy gotowaniu']],
    zdanie: 'Okna od zachodu to słońce po południu i wieczorem, w porze, kiedy naprawdę korzystasz z mieszkania. Zachody słońca oglądasz prosto z kanapy.',
  },
  { // Północny zachód
    tak: [['Kuchnia', 'bez porannego i południowego upału'], ['Łazienka', 'słońce niepotrzebne'], ['Garderoba, spiżarnia', 'chłodno i bez płowienia']],
    moze: [['Sypialnia', 'chłodno, latem późne słońce wieczorem'], ['Gabinet', 'równe światło przez większość dnia']],
    nie: [['Salon', 'słońce tylko latem, późnym wieczorem']],
    zdanie: 'Okna na północny zachód dają spokojne, równe światło, a latem złote słońce późnym wieczorem. Wnętrze nie przegrzewa się w ciągu dnia.',
  },
];

// ---------- POŁOŻENIE SŁOŃCA (algorytm uproszczony, dokładność ok. 1°) ----------
const RAD = Math.PI / 180;
function slonce(data, lat, lon) {
  const n = data.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const dek = Math.asin(Math.sin(eps) * Math.sin(lam));
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const H = (gmst * 15 + lon) * RAD - ra;
  const f = lat * RAD;
  const wys = Math.asin(Math.sin(f) * Math.sin(dek) + Math.cos(f) * Math.cos(dek) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(f) - Math.tan(dek) * Math.cos(f)) / RAD + 180;
  return { wys: wys / RAD, az: (az + 360) % 360 };
}

const KROK = 5; // minut
const roznica = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

// Dla danego dnia: kiedy jest dzień i kiedy słońce świeci w okno skierowane na kat.
function dzienSlonca(rok, mies, dzien, kat) {
  const { lat, lon } = stan.miejsce;
  const okresy = []; let dzienOd = null, dzienDo = null, start = null;
  for (let m = 0; m <= 1440; m += KROK) {
    const d = new Date(rok, mies, dzien, 0, m);
    const s = slonce(d, lat, lon);
    if (s.wys > -0.83) { if (dzienOd === null) dzienOd = m; dzienDo = m; }
    // słońce w oknie: nad horyzontem i z przodu okna (bez promieni prawie równoległych do ściany)
    const w = s.wys > 2 && roznica(s.az, kat) < 85;
    if (w && start === null) start = m;
    if (!w && start !== null) { okresy.push([start, m]); start = null; }
  }
  if (start !== null) okresy.push([start, 1440]);
  return { okresy, dzienOd, dzienDo };
}

const hm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
const czas = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? (h + ' h' + (r ? ' ' + r + ' min' : '')) : r + ' min'; };
const suma = (okresy) => okresy.reduce((s, [a, b]) => s + b - a, 0);
const godziny = (okresy) => okresy.length ? okresy.map(([a, b]) => hm(a) + '–' + hm(b)).join(', ') : 'brak słońca';

const PORY = [['Rano', 0, 600], ['Przed południem', 600, 720], ['Po południu', 720, 1020], ['Wieczorem', 1020, 1440]];
function pory(okresy) {
  // pora się liczy, gdy słońce jest w oknie co najmniej 30 minut w tym przedziale
  return PORY.map(([n, a, b]) => [n, okresy.reduce((s, [x, y]) => s + Math.max(0, Math.min(b, y) - Math.max(a, x)), 0) >= 30]);
}

// ---------- TARCZA ----------
const napisy = [];
(function rysujTarcze() {
  const g = $('#kreski');
  for (let k = 0; k < 360; k += 5) {
    const duza = k % 45 === 0, r1 = duza ? 118 : (k % 15 === 0 ? 128 : 134);
    const l = document.createElementNS(SVG, 'line');
    l.setAttribute('x1', 146 * Math.sin(k * RAD)); l.setAttribute('y1', -146 * Math.cos(k * RAD));
    l.setAttribute('x2', r1 * Math.sin(k * RAD)); l.setAttribute('y2', -r1 * Math.cos(k * RAD));
    l.setAttribute('class', 't-kreska' + (duza ? ' duza' : ''));
    g.appendChild(l);
  }
  KIERUNKI.forEach((kier, i) => {
    const k = i * 45, glowny = i % 2 === 0, r = glowny ? 96 : 92;
    const t = document.createElementNS(SVG, 'text');
    const x = r * Math.sin(k * RAD), y = -r * Math.cos(k * RAD);
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('class', 't-napis' + (glowny ? '' : ' maly') + (i === 0 ? ' pn' : ''));
    t.textContent = kier.skrot;
    g.appendChild(t); napisy.push({ t, x, y });
  });
})();

function obrocTarcze(kat) {
  $('#obrot').setAttribute('transform', 'rotate(' + (-kat).toFixed(1) + ')');
  // napisy zostają w pionie, żeby dało się je czytać
  napisy.forEach(({ t, x, y }) => t.setAttribute('transform', 'rotate(' + kat.toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'));
}

function slonceNaTarczy() {
  const s = slonce(new Date(), stan.miejsce.lat, stan.miejsce.lon);
  const el = $('#slonce-teraz');
  el.hidden = s.wys <= 0;
  el.setAttribute('transform', 'translate(' + (134 * Math.sin(s.az * RAD)).toFixed(1) + ' ' + (-134 * Math.cos(s.az * RAD)).toFixed(1) + ')');
}

// ---------- WIDOK ----------
let ostatniOpis = null;
function pokaz() {
  const kat = Math.round(stan.kat) % 360;
  obrocTarcze(stan.kat);
  const i = sektor(kat), kier = KIERUNKI[i];
  $('#kierunek').textContent = kier.nazwa;
  $('#stopnie').textContent = kat + '°  ·  ' + kier.skrot;
  if (!stan.czujnik || stan.zamrozone) $('#suwak').value = kat;
  document.querySelectorAll('#kierunki-chips .chip').forEach((c, j) => c.classList.toggle('on', j === i));
  // przeliczenie słońca tylko po zmianie o 2° albo więcej (oszczędza baterię)
  if (ostatniOpis !== null && roznica(ostatniOpis, kat) < 2) return;
  ostatniOpis = kat;
  opiszSlonce(kat); opiszPokoje(i);
}

const SEZONY = [['Lato', 5, 21, '21 czerwca'], ['Wiosna', 2, 21, '21 marca'], ['Jesień', 8, 23, '23 września'], ['Zima', 11, 21, '21 grudnia']];
let ostatnieSlonce = null;

function opiszSlonce(kat) {
  const rok = new Date().getFullYear(), dzis = new Date();
  const dzisiaj = dzienSlonca(dzis.getFullYear(), dzis.getMonth(), dzis.getDate(), kat);
  const wyniki = SEZONY.map(([n, m, d]) => dzienSlonca(rok, m, d, kat));
  const rownonoc = wyniki[1];
  ostatnieSlonce = { dzisiaj, rownonoc };

  const p = $('#slonce-podsum');
  p.textContent = '';
  const b = document.createElement('b');
  b.textContent = 'Dziś: ' + godziny(dzisiaj.okresy);
  p.appendChild(b);
  if (dzisiaj.okresy.length) p.appendChild(document.createTextNode(' (' + czas(suma(dzisiaj.okresy)) + ')'));

  // pory dnia liczone dla lata i równonocy razem, bo to typowy obraz okna przez większą część roku
  const lacznie = pory([...wyniki[0].okresy, ...rownonoc.okresy]);
  const pBox = $('#pory'); pBox.textContent = '';
  lacznie.forEach(([n, tak]) => { const s = document.createElement('span'); s.className = 'pora' + (tak ? ' tak' : ''); s.textContent = (tak ? '☀️ ' : '') + n; pBox.appendChild(s); });

  const box = $('#sezony'); box.textContent = '';
  const OD = 240, DO = 1320, zakres = DO - OD; // pasek od 4:00 do 22:00
  const proc = (m) => (Math.max(0, Math.min(zakres, m - OD)) / zakres * 100).toFixed(2) + '%';
  SEZONY.forEach(([n, , , data], j) => {
    const w = wyniki[j];
    const d = document.createElement('div'); d.className = 'sezon';
    const gora = document.createElement('div'); gora.className = 'sezon-gora';
    const lewo = document.createElement('span'); const bb = document.createElement('b'); bb.textContent = n; lewo.appendChild(bb); lewo.appendChild(document.createTextNode(' ' + data));
    const prawo = document.createElement('span'); prawo.className = 'sezon-godz';
    prawo.textContent = godziny(w.okresy) + (w.okresy.length ? ' · ' + czas(suma(w.okresy)) : '');
    gora.append(lewo, prawo);
    const pas = document.createElement('div'); pas.className = 'pasek';
    if (w.dzienOd !== null) {
      const dz = document.createElement('div'); dz.className = 'dzien';
      dz.style.left = proc(w.dzienOd); dz.style.width = 'calc(' + proc(w.dzienDo) + ' - ' + proc(w.dzienOd) + ')';
      pas.appendChild(dz);
    }
    w.okresy.forEach(([a, c]) => {
      const s = document.createElement('div'); s.className = 'sl';
      s.style.left = proc(a); s.style.width = 'calc(' + proc(c) + ' - ' + proc(a) + ')';
      pas.appendChild(s);
    });
    d.append(gora, pas); box.appendChild(d);
  });

  // Warunki techniczne § 60: pokój ma mieć min. 3 h słońca w dniach równonocy między 7:00 a 17:00
  const w717 = rownonoc.okresy.reduce((s, [a, c]) => s + Math.max(0, Math.min(1020, c) - Math.max(420, a)), 0);
  const wt = $('#wt');
  const ok = w717 >= 180;
  wt.className = 'wt ' + (ok ? 'ok' : 'nie');
  wt.textContent = (ok ? '✓ ' : '✗ ') + 'W dniu równonocy między 7:00 a 17:00 słońce świeci tu ' + czas(w717) + '. Warunki techniczne wymagają co najmniej 3 h dla pokoju (w mieszkaniu wielopokojowym wystarczy jeden pokój, w zabudowie śródmiejskiej 1,5 h).';
}

function grupa(klasa, tytul, lista) {
  if (!lista.length) return null;
  const g = document.createElement('div'); g.className = 'grupa ' + klasa;
  const t = document.createElement('div'); t.className = 'grupa-tytul'; t.textContent = tytul; g.appendChild(t);
  lista.forEach(([n, pow]) => {
    const r = document.createElement('div'); r.className = 'pokoj';
    const b = document.createElement('b'); b.textContent = n;
    const s = document.createElement('span'); s.textContent = ', ' + pow;
    r.append(b, s); g.appendChild(r);
  });
  return g;
}

function opiszPokoje(i) {
  const d = POKOJE[i], box = $('#pokoje'); box.textContent = '';
  [grupa('tak', '✅ Najlepiej', d.tak), grupa('moze', '🟡 Może być', d.moze), grupa('nie', '⛔ Lepiej nie', d.nie)].forEach((g) => g && box.appendChild(g));
  $('#zdanie').textContent = d.zdanie;
}

// ---------- CZUJNIK ----------
let sx = 0, sy = -1, ostatniOdczyt = 0, klatka = false;
function odczyt(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) h = e.webkitCompassHeading; // iPhone
  else if (e.absolute && e.alpha !== null) h = 360 - e.alpha; // Android
  if (h === null) return;
  ostatniOdczyt = Date.now();
  if (!stan.czujnik) { stan.czujnik = true; $('#start').hidden = true; }
  $('#plasko').hidden = e.beta === null || Math.abs(e.beta) < 50;
  if (stan.zamrozone) return;
  const ekran = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
  h = (h + ekran + Number(stan.deklinacja) + 720) % 360;
  // wygładzanie, żeby cyfry nie skakały
  sx = sx * 0.8 + Math.sin(h * RAD) * 0.2; sy = sy * 0.8 + -Math.cos(h * RAD) * 0.2;
  stan.kat = (Math.atan2(sx, -sy) / RAD + 360) % 360;
  if (!klatka) { klatka = true; requestAnimationFrame(() => { klatka = false; pokaz(); }); }
}

async function wlaczKompas() {
  const info = $('#start-info');
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const z = await DeviceOrientationEvent.requestPermission();
      if (z !== 'granted') { info.textContent = 'Bez zgody na czujnik ruchu kompas nie działa. Na iPhonie zamknij aplikację i otwórz ponownie, potem wybierz Zezwól.'; return; }
    }
  } catch (e) { /* stare przeglądarki nie pytają */ }
  if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', odczyt, true);
  window.addEventListener('deviceorientation', odczyt, true);
  info.textContent = 'Szukam kompasu…';
  setTimeout(() => {
    if (!ostatniOdczyt) { info.textContent = 'To urządzenie nie ma kompasu. Ustaw kierunek ręcznie.'; pokazRecznie(true); }
  }, 2500);
}
$('#wlacz-btn').addEventListener('click', wlaczKompas);

// ---------- STEROWANIE ----------
function ustawZamrozenie(z) {
  stan.zamrozone = z;
  const b = $('#zamroz-btn');
  b.textContent = z ? '▶ Wznów odczyt' : '⏸ Zatrzymaj odczyt';
  b.classList.toggle('on', z);
}
$('#zamroz-btn').addEventListener('click', () => ustawZamrozenie(!stan.zamrozone));

function pokazRecznie(widac) {
  $('#recznie').hidden = !widac;
  $('#recznie-btn').classList.toggle('on', widac);
}
$('#recznie-btn').addEventListener('click', () => pokazRecznie($('#recznie').hidden));

function ustawRecznie(k) {
  if (stan.czujnik) ustawZamrozenie(true);
  stan.kat = k; sx = Math.sin(k * RAD); sy = -Math.cos(k * RAD);
  pokaz();
}
KIERUNKI.forEach((kier, i) => {
  const c = document.createElement('button'); c.className = 'chip'; c.textContent = kier.nazwa;
  c.addEventListener('click', () => ustawRecznie(i * 45));
  $('#kierunki-chips').appendChild(c);
});
$('#suwak').addEventListener('input', (e) => ustawRecznie(Number(e.target.value)));

// ---------- KOPIOWANIE ----------
function toast(t) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d);
  setTimeout(() => d.remove(), 1800);
}
async function kopiuj(tekst) {
  try { await navigator.clipboard.writeText(tekst); toast('Skopiowane'); }
  catch (e) { prompt('Skopiuj tekst:', tekst); }
}
$('#kopiuj-zdanie').addEventListener('click', () => kopiuj($('#zdanie').textContent));

// ---------- POMIARY ----------
const NAZWY = ['Salon', 'Sypialnia', 'Kuchnia', 'Pokój', 'Pokój dziecka', 'Balkon', 'Łazienka'];
NAZWY.forEach((n) => {
  const c = document.createElement('button'); c.className = 'chip'; c.textContent = n;
  c.addEventListener('click', () => { $('#nazwa').value = n; });
  $('#nazwy-chips').appendChild(c);
});

function opisPomiaru(p) {
  const kier = KIERUNKI[sektor(p.kat)];
  const w = dzienSlonca(new Date().getFullYear(), 2, 21, p.kat);
  const l = dzienSlonca(new Date().getFullYear(), 5, 21, p.kat);
  return { kier, rownonoc: godziny(w.okresy), lato: godziny(l.okresy) };
}

function rysujListe() {
  const ul = $('#lista'); ul.textContent = '';
  stan.pomiary.forEach((p, i) => {
    const o = opisPomiaru(p);
    const li = document.createElement('li');
    const t = document.createElement('div');
    const b = document.createElement('b'); b.textContent = p.nazwa;
    const s = document.createElement('div'); s.className = 'hint';
    s.textContent = o.kier.nazwa + ' (' + p.kat + '°) · słońce wiosną i jesienią ' + o.rownonoc;
    t.append(b, s);
    const x = document.createElement('button'); x.className = 'usun'; x.textContent = '✕'; x.setAttribute('aria-label', 'Usuń');
    x.addEventListener('click', () => { stan.pomiary.splice(i, 1); zapisz('kompas-rm-pomiary', stan.pomiary); rysujListe(); });
    li.append(t, x); ul.appendChild(li);
  });
  $('#lista-akcje').hidden = !stan.pomiary.length;
}

$('#zapisz-btn').addEventListener('click', () => {
  const nazwa = $('#nazwa').value.trim() || 'Okno ' + (stan.pomiary.length + 1);
  stan.pomiary.push({ nazwa, kat: Math.round(stan.kat) % 360 });
  zapisz('kompas-rm-pomiary', stan.pomiary);
  $('#nazwa').value = '';
  rysujListe(); toast('Zapisano: ' + nazwa);
});

$('#kopiuj-liste').addEventListener('click', () => {
  const linie = stan.pomiary.map((p) => {
    const o = opisPomiaru(p);
    return p.nazwa + ': okno na ' + o.kier.na + ' (' + p.kat + '°). Słońce wiosną i jesienią ' + o.rownonoc + ', latem ' + o.lato + '.';
  });
  kopiuj('Strony świata w mieszkaniu\n' + linie.join('\n'));
});
$('#wyczysc-btn').addEventListener('click', () => {
  if (!confirm('Usunąć wszystkie pomiary?')) return;
  stan.pomiary = []; zapisz('kompas-rm-pomiary', stan.pomiary); rysujListe();
});

// ---------- USTAWIENIA ----------
function pokazMiejsce() {
  const m = stan.miejsce;
  $('#lokalizacja-info').textContent = m.nazwa ? m.nazwa + ' (domyślna)' : 'Twoja lokalizacja: ' + m.lat.toFixed(3) + ', ' + m.lon.toFixed(3);
}
function noweMiejsce(m) {
  stan.miejsce = m; zapisz('kompas-rm-miejsce', m); pokazMiejsce();
  ostatniOpis = null; pokaz(); rysujListe(); slonceNaTarczy();
}
$('#ustawienia-btn').addEventListener('click', () => {
  const u = $('#ustawienia'); u.hidden = !u.hidden;
  if (!u.hidden) u.scrollIntoView({ behavior: 'smooth' });
});
$('#gps-btn').addEventListener('click', () => {
  if (!navigator.geolocation) { toast('Brak lokalizacji w tym urządzeniu'); return; }
  navigator.geolocation.getCurrentPosition(
    (p) => noweMiejsce({ lat: p.coords.latitude, lon: p.coords.longitude }),
    () => toast('Nie udało się pobrać lokalizacji'),
    { enableHighAccuracy: false, timeout: 10000 });
});
$('#elblag-btn').addEventListener('click', () => noweMiejsce(ELBLAG));
$('#deklinacja').value = stan.deklinacja;
$('#deklinacja').addEventListener('change', (e) => { const v = Number(e.target.value); if (!isNaN(v)) { stan.deklinacja = v; zapisz('kompas-rm-deklinacja', v); } });

// ---------- START ----------
pokazMiejsce();
pokaz();
rysujListe();
slonceNaTarczy();
setInterval(slonceNaTarczy, 60000);
// komputer bez czujników: od razu ręczne ustawianie
if (!('DeviceOrientationEvent' in window)) { $('#start-info').textContent = 'To urządzenie nie ma kompasu. Ustaw kierunek ręcznie.'; pokazRecznie(true); }

// ---------- OFFLINE / AKTUALIZACJE ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  let przeladowano = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (przeladowano) return;
    przeladowano = true; location.reload();
  });
}
// iPhone trzyma aplikację z ekranu głównego w pamięci całymi dniami, więc przy powrocie sprawdzamy wersję
async function sprawdzWersje() {
  try {
    const t = await (await fetch('app.js?spr=' + Date.now(), { cache: 'no-store' })).text();
    const m = t.match(/const WERSJA = (\d+);/);
    if (m && +m[1] > WERSJA) $('#aktualizacja').hidden = false;
  } catch (e) { /* brak zasięgu */ }
}
$('#aktualizacja-btn').addEventListener('click', () => location.reload());
document.addEventListener('visibilitychange', () => { if (!document.hidden) { sprawdzWersje(); slonceNaTarczy(); } });
sprawdzWersje();

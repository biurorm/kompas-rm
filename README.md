# Kompas RM

PWA biura: kierunek okna po polsku (8 stron swiata + stopnie), godziny slonca w oknie
(dzis, lato, wiosna, jesien, zima, pasek 4:00-22:00), kontrola 3 h slonca z warunkow technicznych (par. 60),
polecane pomieszczenia dla kierunku, gotowe zdanie do opisu oferty i lista pomiarow mieszkania do skopiowania.

- Kompas: iPhone `webkitCompassHeading` (zgoda po kliknieciu "Wlacz kompas"), Android `deviceorientationabsolute`.
  Poprawka deklinacji w ustawieniach (domyslnie 6 st.). Bez czujnika: reczne ustawienie (chipy + suwak).
- Slonce: uproszczony algorytm polozenia slonca (ok. 1 st.), krok 5 min, lokalizacja domyslnie Elblag albo GPS.
  Slonce "w oknie" = wysokosc > 2 st. i azymut w granicach 85 st. od kierunku okna. Bez zaslaniajacej zabudowy.
- Dane: tylko localStorage (pomiary, lokalizacja), zero serwera, CSP connect-src 'self'.
- Wydanie: podbic razem WERSJA w app.js, `?v=` w index.html i CACHE w sw.js.
- Ikony: `python generate-icons.py`.

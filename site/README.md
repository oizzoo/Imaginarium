# Imaginarium: aplikacja Next.js

Pierwszy etap migracji: szkielet App Router, statyczny eksport i kontrola builda.
Ten katalog nie jest jeszcze źródłem publicznej strony. Obecna publikacja
GitHub Pages nadal korzysta z HTML w katalogu głównym repo.

## Lokalnie

Wymagany Node 24 (CI: 24.18.0). W katalogu `site`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run build
npm run check:export
python -m http.server 8080 --bind 127.0.0.1 --directory out
```

Otwórz `http://127.0.0.1:8080/`. Serwer serwuje rzeczywisty eksport,
bez uruchamiania Next.js. Plik błędu można obejrzeć pod `/404.html`;
Python nie naśladuje automatycznej obsługi własnego 404 przez GitHub Pages.
Adresy zasobów są liczone od korzenia domeny, zgodnie z `www.hubertkniaz.pl`.
Do pracy nad kodem użyj `npm run dev`.

## Granice pierwszego etapu

- `next.config.ts`: eksport do `out/`, adresy z końcowym ukośnikiem.
- Obrazy nie wymagają serwerowej optymalizacji Next.js.
- Metadane `noindex` dotyczą roboczej aplikacji. Przed przełączeniem publikacji
  trzeba je zastąpić docelowymi metadanymi PL/EN.
- `_config.yml` w głównym katalogu wyklucza całe `site/` z legacy Pages.
- CI sprawdza eksport oraz porównuje publiczne pliki starej strony z wynikiem
  Jekylla. Artefakt `next-preview` służy do przeglądu, bez kroku deploy.
- `next-env.d.ts`, `.next/`, `out/` i `node_modules/` są generowane lokalnie.
- Następny etap: wspólne komponenty i pilotażowe strony `/main/` oraz `/en-main/`.

# Dielňa · (Ne)potrebný muž

Pracovný nástroj na písanie knihy *(Ne)potrebný muž*. Celá kniha je postavená na pyramíde deviatich úrovní. Každé faktické tvrdenie v texte sa dá prepojiť so zdrojom, a tak sa stráži sľub knihy: **netvrdím, čo neviem**.

## Čo aplikácia vie

| Časť | Na čo slúži |
|---|---|
| **Pyramída** | 9 úrovní, kapitoly, stav kapitoly, rozpočet strán (1 strana ≈ 280 slov) |
| **Editor kapitoly** | Písanie, voliteľná kostra (Otázka · Čo vieme · Čo vedeli predkovia · Úvaha · Kroky), označovanie tvrdení |
| **Tvrdenia** | 🟢 silný zdroj · 🟡 slabý zdroj · 🔴 bez zdroja · ⚪ môj názor. Farba sa odvodzuje od typu dôkazu zdroja, nie ručne |
| **Knižnica zdrojov** | Import cez DOI (Crossref) alebo PubMed ID, disciplína, typ dôkazu, replikácia, pole „Ľudsky“ (píše len autor) |
| **Asistent** | Zhrnutie a preklad štúdie, protiargumenty, overenie tvrdenia voči zdroju, hľadanie súvisiacich štúdií v PubMed. **Knihu nepíše** — jeho výstup ide len do poznámok, nikdy do textu |
| **Pracovné listy** | Cvičenia ku kapitole (reflexia, záväzok na 7 dní, návyk, rozhovor, list sebe), voliteľne prepojené s výskumom |
| **Matica vyváženosti** | Úroveň × disciplína: kde chýba uhol pohľadu |
| **Kontrola** | Žargón, jazyk manosféry, písanie o samovražde podľa odporúčaní WHO, stigmatizujúci jazyk o závislosti. Len upozorňuje, nič neprepisuje |
| **Export** | DOCX, ePub, PDF (A5). Tvrdenia so zdrojom sa stanú poznámkami na konci kapitoly, na konci knihy je zoznam zdrojov. Dá sa exportovať aj len pracovné listy |

## Nastavenie (jednorazovo)

1. **Supabase projekt.** V [Supabase](https://supabase.com) otvor projekt (alebo vytvor nový) → **SQL Editor** → vlož a spusti obsah `supabase/migrations/0001_init.sql`.
2. **Tvoj účet.** **Authentication → Users → Add user** (e-mail a heslo). Potom v **Authentication → Sign In / Providers** vypni registráciu nových používateľov, aby sa nikto iný nemohol prihlásiť.
3. **Kľúče.** Skopíruj `.env.example` do `.env.local` a doplň:
   - `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API),
   - `ANTHROPIC_API_KEY` z [console.anthropic.com](https://console.anthropic.com) (bez neho funguje všetko okrem asistenta).
4. **Spustenie.**
   ```bash
   npm install
   npm run dev
   ```
   Aplikácia beží na http://localhost:3000.

### Nasadenie na web (napr. Vercel)

Importuj repozitár do [Vercel](https://vercel.com), nastav rovnaké tri premenné prostredia a nasaď. Asistent aj import zdrojov bežia na serveri a fungujú len pre prihláseného používateľa.

## Vývoj

```bash
npm test         # testy logiky, kontroly textu a exportov
npx tsc --noEmit # typy
npm run lint
```

- `src/lib/book.ts`: úrovne, číselníky, farba tvrdenia, citácie
- `src/lib/rules.ts`: pravidlá kontroly (žargón, tón, citlivé témy). Nové pravidlo pridáš jedným riadkom.
- `src/lib/manuscript.ts` + `src/lib/export/*`: zostavenie rukopisu a exporty
- `src/lib/server/assistant.ts`: pokyny pre asistenta vrátane pravidla, že knihu nepíše
- `supabase/migrations/`: databázová schéma s RLS (každý vidí len svoje dáta)

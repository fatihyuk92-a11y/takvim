# Bønnetider i Danmark

En statisk PWA til danske bønnetider med:

- Semerkand Takvimi som basis
- Fajr og Isha som median af Semerkand, Türkiye Diyanet og Muslim World League
- Automatisk nærmeste by via placering
- Ezan-lyd
- Web Push-notifikationer 45 minutter før og ved hver bønnetid
- Installérbar på iPhone og Android

## Deploy på Vercel

1. Upload alle filer i denne mappe til et GitHub-repository.
2. Importér repository i Vercel.
3. Opret Vercel KV/Redis Storage til projektet.
4. Tilføj environment variables fra `.env.example`.
5. Kør `npm run generate:vapid` lokalt eller via `npx web-push generate-vapid-keys`, og indsæt nøglerne som `VAPID_PUBLIC_KEY` og `VAPID_PRIVATE_KEY`.
6. Deploy.

Placering og notifikationer kræver HTTPS. Det får du automatisk på Vercel.

iPhone kræver, at brugeren installerer appen på hjemmeskærmen, før Web Push-notifikationer virker stabilt. Android virker typisk direkte i Chrome/PWA.

## Vigtigt om notifikationer

Brugeren skal selv aktivere notifikationer i appen. Indstillingen gemmes på serveren, og push fortsætter automatisk, indtil brugeren slår det fra.

`vercel.json` kører `/api/push/cron` hvert minut, så notifikationerne kan komme mens mobilen er låst. Vercel Hobby/free kan være begrænset til daglige cron jobs. Hvis deployment fejler på cron-grænsen, fjern `crons`-sektionen i `vercel.json` og brug i stedet en ekstern cron-service til at kalde:

`https://dit-domæne.vercel.app/api/push/cron`

Den bør kaldes hvert minut for mest præcise bønnetidsnotifikationer.

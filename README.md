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

Vercel Hobby/free tillader ikke cron hvert minut. Derfor bruger denne version en ekstern cron-service til at kalde:

`https://dit-domæne.vercel.app/api/push/cron`

Den bør kaldes hvert minut for mest præcise bønnetidsnotifikationer.

Du kan fx bruge cron-job.org:

1. Opret en cronjob efter deployment.
2. Sæt URL til `https://dit-domæne.vercel.app/api/push/cron`.
3. Sæt schedule til hvert minut.
4. Sæt method til `GET`.

Hvis du senere opgraderer til Vercel Pro, kan du i stedet tilføje dette i `vercel.json`:

```json
"crons": [
  {
    "path": "/api/push/cron",
    "schedule": "* * * * *"
  }
]
```

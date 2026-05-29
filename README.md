# Namaz Vakitleri

Danimarka şehirleri için statik PWA:

- Semerkand Takvimi temel kaynak olarak kullanılır
- Sabah ve Yatsı vakitleri Semerkand, Türkiye Diyanet ve Muslim World League medyanı ile hesaplanır
- Konuma göre en yakın şehir seçilir
- Ezan sesi vardır
- Web Push bildirimleri namazdan 45 dakika önce ve namaz vakti girince gelir
- iPhone ve Android üzerinde yüklenebilir

## Vercel Deploy

1. Bu klasördeki tüm dosyaları GitHub repository içine yükleyin.
2. Repository'yi Vercel'e import edin.
3. Vercel Redis Storage oluşturup projeye bağlayın.
4. `.env.example` içindeki environment variable değerlerini Vercel'e ekleyin.
5. Yerelde `npm run generate:vapid` veya `npx web-push generate-vapid-keys` çalıştırıp çıkan değerleri `VAPID_PUBLIC_KEY` ve `VAPID_PRIVATE_KEY` olarak ekleyin.
6. Deploy edin.

Güvenlik için `CRON_SECRET` değerini uzun ve rastgele tutun. Bu değer GitHub'a yüklenmemelidir.

Konum ve bildirimler HTTPS gerektirir. Vercel bunu otomatik sağlar.

iPhone'da Web Push bildirimlerinin stabil çalışması için kullanıcının uygulamayı ana ekrana eklemesi gerekir. Android'de genelde Chrome/PWA üzerinden çalışır.

## Bildirimler

Kullanıcı bildirimleri uygulama içinden etkinleştirmelidir. Abonelik Redis üzerinde saklanır ve kullanıcı kapatana kadar push bildirimleri devam eder.

Redis bağlantısı `STORAGE_URL`, `REDIS_URL` veya `KV_URL` olarak okunur. Prefix olarak `STORAGE` kullandıysanız `STORAGE_URL` doğrudan uyumludur.

Vercel Hobby/free her dakika cron çalıştırmaya izin vermez. Bu yüzden harici bir cron servisi şu endpoint'i çağırmalıdır:

`https://alan-adiniz.vercel.app/api/push/cron?secret=CRON_SECRET_DEGERI`

En doğru bildirim zamanı için her dakika çağrılmalıdır.

Örneğin cron-job.org:

1. Deploy sonrası yeni cronjob oluşturun.
2. URL olarak `https://alan-adiniz.vercel.app/api/push/cron?secret=CRON_SECRET_DEGERI` girin.
3. Schedule değerini her dakika yapın.
4. Method değerini `GET` seçin.

`CRON_SECRET` Vercel'de tanımlıysa, secretsiz cron istekleri reddedilir. Tanımlı değilse endpoint çalışmaya devam eder ama herkese açık kalır.

Vercel Pro kullanırsanız ve `CRON_SECRET` tanımlı değilse `vercel.json` içine şu ayarı ekleyebilirsiniz:

```json
"crons": [
  {
    "path": "/api/push/cron",
    "schedule": "* * * * *"
  }
]
```

# Seyahat Modu ve Barsız Program — Kısa Tasarım

Tarih: 2026-11-24 · Durum: Onaylandı (kullanıcı: önerilen tablo + "şu an yukarıdan çekecek hiçbir ekipmanım yok,
birkaç gün seyahat modunu kullanacağım") · Ana tasarım: `2026-11-23-fitness-app-design.md`

## Amaç
Kullanıcı barfiks barını henüz kuramadı ve bazı günler seyahatte olacak. Seyahatte yalnız bantları var; yukarıdan
çekme (bar, kapı ankrajı, merdiven) yok. Program bu iki durumda da aksamadan sürmeli; barfiksin işi (kanat, biceps)
başka bantlı hareketle karşılanmalı.

## Yaklaşımlar
1. **Seçilen:** Hareket bazında *yedek* tanımı. Katalogda yedek hareketler ayrı hareket olarak durur (kendi seviyesi,
   kendi ilerlemesi); oturum kurulurken moda ve barfiks ayarına göre ana hareketin yerine geçer. Ana hareketlerin
   seviyesi bozulmaz.
2. Aynı hareketin seviye merdivenine "seyahat aşaması" eklemek. Elendi: seyahat dönüşünde seviye geri gelmez,
   ilerleme karışır.
3. Ayrı bir "seyahat programı" (C günü). Elendi: A/B dengesi ve haftalık kas hacmi bozulur.

## Tasarım
- **Ayar:** `hasPullupBar` (varsayılan **kapalı**). Ayarlar → Program bölümünde "Barfiks barı: Var / Yok" seçimi.
  Kapalıyken barfiks yerine **Bantlı eğilerek row** gelir (evde ve seyahatte). Ayar değişince açık antrenmandaki
  henüz set girilmemiş barfiks/row da hemen değişir. Antrenmanda barfiks kartında "Barım yok, bantlı row yap" kısayolu.
  (İlk sürümdeki onay kutusu, genel giriş stili yüzünden bozuk göründüğü ve açık antrenmanı değiştirmediği için
  2026-11-24'te bu hale getirildi.)
- **Mod:** Antrenman başlarken "Başla" (evde) ya da "Seyahatte başla". Oturuma `mode: 'home' | 'travel'` yazılır
  (eski oturumlar = evde). A/B sırası iki modda ortak.
- **Seyahatte yedekler** (merdiven ya da yukarıdan bağlantı gerektirenler):

| Ana hareket | Yedek (seyahat) | Tekrar | Merdiven | Kaslar (ana / yardımcı) |
|---|---|---|---|---|
| Barfiks (bar yoksa evde de) | Bantlı eğilerek row | 8–12 | Bantlar | Kanat, Üst sırt / Biceps, Arka omuz |
| Ters row | Bantlı oturarak row | 8–12 | Bantlar | Üst sırt, Kanat / Biceps, Arka omuz |
| Şınav | Şınav (seyahat) | 8–12 | Dizüstü şınav → Yer şınavı → Bantlı şınav (bant sırttan) | Göğüs, Triceps / Omuz, Karın |
| Asılı bacak kaldırma | Yerde bacak kaldırma | 8–12 | Yerde diz çekme → Yerde düz bacak kaldırma | Karın / Yan karın |
| Bantlı Pallof press | Ölü böcek (her taraf) | 8–12 | Ölü böcek → Yavaş tempolu ölü böcek (3 sn) | Yan karın, Karın / — |
| Bantlı göğüs fly | Bantlı fly (bant sırttan) | 10–15 | Bantlar | Göğüs / Omuz |
| Bantlı triceps pushdown | Bantlı baş üstü triceps | 10–15 | Bantlar | Triceps / — |

  Squat, RDL, lunge, hip thrust, omuz press, lateral raise, biceps curl seyahatte **aynen** kalır.
- **Ekranlar:** Bekleme ekranı ve Bugün kartında iki düğme: "Başla" ve "Seyahatte başla". Aktif antrenman başlığı
  "Antrenman A · Seyahat". Kas haritası o oturumun gerçek hareketlerinden çizilir.
- **Yedeklerin karakteri:** yardımcı hareketin yedeği yardımcı (3 set), karın yedeği karın (3 set) sayılır.

## İki kez kontrol
1. *Hareket bilimi:* Eğilerek row ve oturarak row kanat/üst sırtı yukarıdan bağlantısız çalıştırır; barfiksin kas
   hedefini karşılar (dikey çekiş becerisini değil — bar kurulunca bant destekli seviyeden başlamak normal).
   Bantlı şınav, yer şınavından sonra doğal ilerlemedir. Ölü böcek, Pallof gibi gövdeyi sabit tutma hareketidir.
   Sırttan geçen bantla fly ve ayakla basılan bantla baş üstü triceps bağlantı noktası gerektirmez.
2. *Yapım soruları ve kararlar:* (a) Yedeklerin ilerlemesi kendi kimlikleriyle saklanır; (b) ayarlar/ilerleme/Claude
   özeti listelerinde yedekler de görünür; (c) `hasPullupBar` eski kayıtlarda yok → varsayılan (kapalı) devreye girer;
   (d) seyahatte squat/press'in merdivenli aşamaları (Bulgar split squat, ayaklar kademede pike) sandalye/yatakla
   yapılır, ayrı yedek yok; (e) haftalık "Bu hafta N antrenman" sayacı iki modu birlikte sayar.

## Hedef olmayanlar
Konuma/takvime göre otomatik seyahat algılama; seyahat için ayrı ekipman listesi.

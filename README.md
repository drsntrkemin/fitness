# Ev Fitness

Kişisel ev antrenmanı koçu ve beslenme defteri. iPhone'da ana ekrana eklenerek uygulama gibi kullanılır. İnternetsiz çalışır. Tüm veriler sadece telefonda saklanır.

**Adres:** https://drsntrkemin.github.io/fitness/

## iPhone'a kurulum

1. Yukarıdaki adresi **Safari**'de aç.
2. Alttaki **Paylaş** düğmesine (⬆︎) dokun ve **Ana Ekrana Ekle**'yi seç.
3. Uygulamayı bundan sonra hep **ana ekrandaki ikondan** aç. Safari sekmesinde açılan kopya verilerini ayrı tutar.

İlk açılışta üç kısa adım var:

1. Bantlarını **hafiften ağıra** sırayla ekle.
2. Merdivenindeki kademe sayısını gir.
3. Günlük kalori ve makro hedeflerini gir. Bu adımı atlayıp sonra da girebilirsin.

## Günlük kullanım

- **Bugün:** Sıradaki antrenmanı ve günün kalori/protein durumunu gösterir. Buradan öğün eklenir. Haftada bir kilo ve bel ölçüsü girilir.
- **Antrenman:** Program A ve B günlerinden oluşur, sırayla gelir.
  - Bir hareketi ilk kez yaparken başlangıç seviyeni seçersin.
  - Bir set kutusuna **tek dokunuş**, hedef tekrarı yaptın demektir.
  - Farklı sayıda tekrar yaptıysan kutuya bir kez daha dokunup +/− ile düzeltirsin.
  - **Bitir** dediğinde koç bir sonraki antrenmanın hedefini belirler.
- **Beslenme:** Öğünleri kalori, protein, karbonhidrat ve yağ olarak elle girersin. Daha önce girdiğin öğünler tek dokunuşla tekrar eklenir.
- **İlerleme:** Kilo ve bel grafiği, 7 ve 30 günlük beslenme ortalamaları ve her hareketin geçmişi burada. Yanlış girilen ölçüm buradan düzeltilir ya da silinir.
- **Claude'a sor:** Son 2 haftanın özetini panoya kopyalar. claude.ai'ye yapıştırıp tavsiye isteyebilirsin.

### Koç nasıl ilerletir?

Her hareketin bir tekrar aralığı var. Barfikste bu 4–8, günün sonundaki yardımcı hareketlerde (lateral raise, biceps curl, göğüs fly, triceps pushdown) 10–15, diğer hareketlerde 8–12.

- Tüm setlerde hedefi yaparsan, bir sonraki sefer hedef 1 tekrar artar.
- Aralığın üstünü geçince bir sonraki zorluğa geçersin ve tekrar sayısı alt sınıra döner. Sonraki zorluk, ağır bir bant, merdivende bir kademe aşağısı ya da daha zor bir varyasyon olabilir.
- Aynı seviyede üst üste 2 antrenmanda alt sınırın altında kalırsan bir seviye geri inersin.
- Squat ve omuz press'te en ağır bant da kolaylaşınca koç tek bacak squat ve pike şınav gibi merdiven varyasyonlarına geçer.

### Kaslı dostun

Sıradaki antrenman kartındaki karakter, tamamladığın antrenmanlarla büyür. Her 3 antrenmanda bir seviye atlar, en fazla 10. seviyeye çıkar. Seviye 1–3'te tombul, 4–5'te fit, 6–10'da kaslıdır. Antrenman kaçırırsan küçülmez. Her hareketin kartındaki küçük figürde o hareketin çalıştırdığı kaslar kırmızı yanar.

### Barfiks barı yoksa ve seyahatte

- **Barfiks barı:** Ayarlar (⚙) → Program → **Barfiks barım var**. Kapalıyken (varsayılan) barfiksin yerine **bantlı eğilerek row** yapılır. Barı kurunca aç; barfiks kaldığı seviyeden devam eder.
- **Seyahat modu:** Sıradaki antrenman kartında **🧳 Seyahatte başla**. Yalnız bantlarla, yukarıdan bağlantı olmadan yapılır: ters row → bantlı oturarak row, şınav → dizüstü/yer/bantlı şınav, asılı bacak kaldırma → yerde bacak kaldırma, Pallof press → ölü böcek, göğüs fly → bantlı fly (bant sırttan), triceps pushdown → bantlı baş üstü triceps. Diğer bantlı hareketler aynen kalır. Seyahat hareketlerinin seviyeleri ayrı tutulur; A/B sırası iki modda ortaktır.

## Yedekleme

Veriler sadece bu telefonda saklanır. Telefon kaybolursa ya da Safari verileri silinirse kayıtlar da gider.

Bunun için **ayda bir yedek al**: Ayarlar (⚙) → **Yedekle** → **Dosyalara Kaydet** → iCloud Drive. Yeni bir telefonda yedeği aynı ekrandaki **Geri yükle** ile yüklersin. Son yedeğin üzerinden 30 gün geçince uygulama seni uyarır.

## Geliştirme

```bash
npm install
npm run dev      # yerel geliştirme sunucusu
npm test         # birim ve ekran testleri
npm run build    # tip kontrolü + üretim derlemesi (dist/)
npx vite preview --port 4173 &   # derlenmiş uygulamayı sunar
npm run smoke    # iPhone 13 emülasyonunda uçtan uca duman testi (Playwright gerekir)
```

`main` dalına yapılan her push, GitHub Actions ile testleri çalıştırır ve uygulamayı GitHub Pages'e yayınlar.

Tasarım belgesi: `docs/superpowers/specs/2026-11-23-fitness-app-design.md`. Uygulama planı: `docs/superpowers/plans/2026-11-23-fitness-app.md`.

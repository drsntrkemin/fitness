# Kas Haritası — Kısa Tasarım

Tarih: 2026-11-23 · Durum: Onaylandı (kullanıcı: "2 kez kontrol ettikten sonra yapmaya başla") · Ana tasarım: `2026-11-23-fitness-app-design.md`

## Amaç
Kullanıcı uygulamanın daha görsel ve **motive edici** olmasını, hareketlerin hangi kasları çalıştırdığının resimle
görünmesini istiyor. Hedefi "kaslı ve şekilli" görünmek; hangi kasın çalıştığını görmek motivasyonu artırır.

## Değerlendirilen yaklaşımlar (görsel örneklerle gösterildi)
1. Her kartta küçük ön/arka figür + etiketler. Ayrıntılı ama 7 kartta kalabalık, figürler küçük.
2. Sadece renkli etiketler ve şerit. Sade ama motive edici görsel etkisi zayıf.
3. **Seçilen:** Günün büyük ön/arka kas haritası (başlarken ve bitirince) + kartlarda etiketler. Motivasyon başlangıçta
   ve ödül anında; antrenman sırasında ekran sade kalır.

## Tasarım
- **Figür:** Uygulama içinde çizilen sade ön/arka vücut (SVG). İnternetsiz çalışır, açık/koyu temaya uyar.
  Ön görünüm: omuz, göğüs, biceps, ön kol, karın, yan karın, ön bacak. Arka görünüm: trapez, arka omuz, üst sırt,
  kanat, bel, triceps, ön kol, kalça, arka bacak, baldır. Baldır yalnız arkada çizilir (anatomik olarak arka bacaktadır).
  **Turuncu** = ana kas, **açık turuncu** = yardımcı kas, gri = çalışmıyor.
- **Antrenman ekranı (aktif):** En üstte yeşil degrade kart: "Bugün çalışacak kasların 🔥", "N hareket · tüm vücut",
  büyük ön/arka figür (günün tüm hareketlerinin birleşimi), ana kas etiketleri. Her hareket kartında adın altında ana
  (turuncu) ve yardımcı (gri) kas etiketleri.
- **Bitirince:** "Bugün çalıştırdığın kaslar" kartı. Figür sadece en az bir seti girilen hareketlerin kaslarını gösterir.
  Altında "N set · M hareket ilerledi" yazar. Hiç ilerleme yoksa "Aynı hedeflerle devam".
- **Bugün ekranı ve Antrenman sekmesinin bekleme ekranı:** "Sıradaki: Antrenman X" kartı aynı yeşil degradeye geçer ve
  sıradaki günün kaslarını küçük figürle gösterir. *(Benim önerim; kullanıcı 3. seçeneği seçti, bu ek onun parçası
  olarak önerildi.)*
- **Erişilebilirlik:** Figürün ekran okuyucu metni çalışan kasları sayar ("Ön: Göğüs, Omuz…").

## Hareket → kas tablosu (ana / yardımcı)

| Hareket | Ana | Yardımcı |
|---|---|---|
| Barfiks | Kanat, Biceps | Üst sırt, Arka omuz, Ön kol |
| Şınav | Göğüs, Triceps | Omuz, Karın |
| Bantlı squat | Ön bacak, Kalça | Arka bacak, Bel |
| Bantlı Romanian deadlift | Arka bacak, Kalça | Bel |
| Asılı bacak kaldırma | Karın | Yan karın, Ön kol |
| Bantlı lateral raise | Omuz | Trapez |
| Bantlı biceps curl | Biceps | Ön kol |
| Ters row | Üst sırt, Kanat | Biceps, Arka omuz |
| Bantlı omuz press | Omuz | Triceps, Trapez |
| Geri lunge | Ön bacak, Kalça | Arka bacak, Baldır |
| Bantlı hip thrust | Kalça | Arka bacak |
| Bantlı Pallof press | Yan karın, Karın | — |
| Bantlı göğüs fly | Göğüs | Omuz |
| Bantlı triceps pushdown | Triceps | — |

## İki kez kontrol sonucu alınan kararlar
1. *Anatomi:* Eşleşmeler hareket bilimiyle uyumlu. Düzeltmeler: baldır yalnız arka figürde (örnekte ön alt bacakta
   yanıyordu); Pallof press'te yan karın önce.
2. *Veri:* Kaslar katalogdaki her harekete `muscles: { primary, secondary }` olarak eklenir. Her hareketin en az bir
   ana kası olmalı, kas adları sabit listeden (test bunu zorlar).
3. *Günün kasları:* Ana = günün tüm hareketlerinin ana kaslarının birleşimi; yardımcı = yardımcıların birleşimi eksi ana.
   Etiket sırası katalogdaki sıraya göre (ilk geçtiği yer).
4. *Bitiş özeti:* "N set" = girilen (boş olmayan) set sayısı; "M hareket ilerledi" = tekrarı artan ya da seviye atlayan
   hareket sayısı ("en üst seviye" ilerleme sayılmaz).
5. *Bugün ekranı, antrenman devam ederken:* kart "Antrenman devam ediyor" der ve o oturumun gününün kaslarını gösterir.
6. *Boyutlar:* Antrenman başı figür ~190 px, bitiş ~150 px, Bugün/Sıradaki kartı ~90 px (yazı solda, figür sağda).
7. *Renk:* Figür yeşil degrade üzerinde yarı saydam beyaz zemin, turuncu ana / açık turuncu yardımcı; aynı renkler açık
   ve koyu temada kullanılır (degrade iki temada da aynı). Kart etiketlerinde ana kas turuncu, yardımcı gri.

## Hedef olmayanlar
Hareketin nasıl yapıldığını gösteren çizimler ya da fotoğraflar; kas başına haftalık hacim istatistiği; animasyon.

## Builder'a bırakılanlar
Figürün tam çizgileri, boyutları, degrade tonları; etiket sıralaması.

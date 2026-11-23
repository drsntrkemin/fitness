# Kas Haritası — Kısa Tasarım

Tarih: 2026-11-23 · Durum: Onay bekliyor · Ana tasarım: `2026-11-23-fitness-app-design.md`

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
  16 bölge: omuz, göğüs, biceps, ön kol, karın, yan karın, ön bacak, baldır (ön görünüm); trapez, arka omuz, üst sırt,
  kanat, bel, triceps, kalça, arka bacak (arka görünüm; ön kol ve baldır arkada da görünür).
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
| Bantlı Pallof press | Karın, Yan karın | — |
| Bantlı göğüs fly | Göğüs | Omuz |
| Bantlı triceps pushdown | Triceps | — |

## Hedef olmayanlar
Hareketin nasıl yapıldığını gösteren çizimler ya da fotoğraflar; kas başına haftalık hacim istatistiği; animasyon.

## Builder'a bırakılanlar
Figürün tam çizgileri, boyutları, degrade tonları; etiket sıralaması.

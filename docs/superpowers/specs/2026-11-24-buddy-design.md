# Kaslı Dost ve Hareket Başına Kas Figürü — Kısa Tasarım

Tarih: 2026-11-24 · Durum: Onaylandı · Ana tasarımlar: `2026-11-23-fitness-app-design.md`, `2026-11-23-muscle-map-design.md`

## Amaç
Kullanıcı: "tüm günün kas gruplarını görmek motivasyon kaybı yapıyor; hareketi yaparken o kasları düşüneceğim için
hareketin yanında küçük kas şekli zevkli olur." Ayrıca antrenman sayfasında, antrenman tamamladıkça gelişen küçük, tatlı,
kas yapan bir karakter istiyor: "1. seviye biraz kilolu olsun, sonra zayıflasın, sonra kaslansın; tamamladıkça seviye atlasın."

## Değişiklikler
1. **Hareket kartı:** Her hareketin sağında küçük ön/arka kas figürü (~84 px). Yalnız o hareketin kasları:
   ana kas **kırmızı** (`#ef4444`), yardımcı **açık kırmızı** (`#fca5a5`). Kas etiketleri de kırmızı tonda.
2. **Kaldırılan:** Antrenman başındaki "Bugün çalışacak kasların 🔥" büyük gün haritası; Bugün/Antrenman "Sıradaki"
   kartındaki gün figürü (yerine kaslı dost gelir).
3. **Kalan:** Bitişteki "Bugün çalıştırdığın kaslar" (ödül; renkleri kırmızıya döner).
4. **Kaslı dost:** "Sıradaki" kartında (Bugün ekranı ve Antrenman sekmesi) solda karakter, sağda
   "Kaslı dostun · Seviye N", "M antrenman tamamladın 💪", ilerleme çubuğu, "Sonraki seviyeye K antrenman"
   (en üstte "En üst seviye! 🏆").

## Seviye kuralı
- Tamamlanan antrenman sayısı = bitmiş oturum sayısı (ev + seyahat).
- Seviye = 1 + ⌊tamamlanan / 3⌋, en fazla 10. Antrenman kaçırınca seviye düşmez.

## Karakterin evresi
| Seviye | Evre | Görünüş |
|---|---|---|
| 1–3 | Tombul | Göbek ve yuvarlak yanaklar; göbek 1→3 küçülür |
| 4–5 | Fit | Düz karın, ince kollar |
| 6–10 | Kaslı | Omuz/pazı her seviyede büyür; 7+ göğüs çizgileri, 8+ karın kasları, 10'da ✨ |

Hep gülümser ve iki kolunu kasar (her seviyede motive edici). Ekran okuyucu: "Kaslı dostun, seviye N, tombul/fit/kaslı".

## İki kez kontrol
1. *Motivasyon:* Büyüme antrenmana bağlı (günlere değil) → ödül anlamlı; küçülme yok → kaçırılan gün cezalandırılmaz.
   Gün haritasını kaldırmak kullanıcının açık isteği; bitiş haritası yapılanı gösterdiği için kalır.
2. *Yapım:* Karakter uygulama içi SVG (internetsiz), şekil parametreleri saf fonksiyon (`buddyShape(level)`), test
   edilebilir; kas figürü mevcut `BodyMap` bileşeni (renk değişkenleri değişir). Eski veride (seviye hesabı yalnız
   oturum sayısından) uyumsuzluk yok.

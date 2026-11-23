# Ev Fitness Uygulaması — Tasarım Belgesi

Tarih: 2026-11-23
Durum: Onaylandı

## 1. Amaç ve neden

Tek kullanıcılı (sahibi), kişisel, her gün kullanılacak sade bir fitness uygulaması.
Kullanıcı evde direnç bantları, kademeli bir İsveç merdiveni ve barfiks barıyla çalışıyor.

Kullanıcının hedefi **rekompozisyon**: kas kazanmak, genel güç kazanmak ve yağ oranını düşürmek.

Uygulama iki işi yapar:

1. **Antrenman koçu:** Kullanıcının ekipmanına göre hazır bir program sunar. Kayıt dokunarak yapılır.
   Bir sonraki antrenmanın hedefini (tekrar sayısı veya zorluk) kurallara göre kendisi belirler.
2. **Beslenme defteri:** Kullanıcı günlük kalori ve makro hedefini, yediklerini de **elle** girer.
   Uygulama gün toplamını ve hedefe ne kadar kaldığını gösterir.

Ayrıca bir **"Claude'a sor"** butonu son 2 haftanın özetini panoya kopyalar.
Kullanıcı bunu claude.ai'ye (kendi aboneliğiyle) yapıştırıp detaylı tavsiye alır.

**Başarı ölçütü:** Kullanıcının uygulamayı her gün açıp birkaç saniyede kayıt girebilmesi.
Antrenmanda "bugün ne yapacağım, hangi bantla, kaç tekrar" sorusunun cevabını hemen görebilmesi.

## 2. Hedefler, hedef olmayanlar, kaçınılacaklar

### Hedefler
- Bugün ekranı: sıradaki antrenman, kalori ve protein durumu tek bakışta görünür.
- Dokunarak antrenman kaydı ve otomatik ilerleme (çift aşamalı ilerleme).
- Elle öğün girişi: kalori, protein, karbonhidrat ve yağ. Daha önce girilen öğünler hızlıca tekrar eklenebilir.
- Haftalık kilo ve bel ölçüsü kaydı.
- Geçmiş: önceki antrenmanlar ve öğünler, kilo/bel değişimi.
- "Claude'a sor" özet kopyalama.
- Yedekle / geri yükle.
- iPhone'da ana ekrana eklenen, internetsiz çalışan web uygulaması (PWA).

### Hedef olmayanlar (v1'de yok)
- Uygulama içi yapay zekâ ya da API entegrasyonu. Kullanıcı bunu açıkça istemedi.
- Fotoğraftan kalori tahmini, besin veritabanı araması.
- Mikro besin (vitamin/mineral) takibi.
- Üyelik, giriş, bulut senkronizasyonu, birden fazla kullanıcı.
- Sosyal özellikler, egzersiz videoları.
- App Store / Play Store uygulaması.
- Dinlenme zamanlayıcısı, bildirimler/hatırlatıcılar. İleride eklenebilir.

### Kaçınılacaklar (bunlar olursa teknik olarak çalışsa bile başarısızlık sayılır)
- Kullanıcıyı "uğraştıran" akışlar. Bir öğün eklemek 3-4 dokunuştan fazla sürmemeli,
  bir seti kaydetmek tek dokunuş olmalı.
- Veri kaybı. Kayıtlar sessizce kaybolmamalı. Yedekleme kolay olmalı ve kullanıcıya hatırlatılmalı.
- Programın kullanıcıyı bir takvime kilitlemesi. Kaçırılan gün programı bozmamalı,
  kullanıcı kaldığı yerden devam etmeli.

## 3. Kısıtlar

- **Platform:** iPhone, Safari üzerinden "Ana Ekrana Ekle" ile kurulan PWA. iOS'taki PWA kısıtlarına uyulmalı
  (bkz. §6.4).
- **Maliyet:** Sıfır. Sunucu yok, ücretli servis yok.
- **Veri:** Tamamen cihazda (IndexedDB). Ağ bağlantısı gerekmez.
- **Dil:** Arayüz Türkçe.
- **Repo:** `drsntrkemin/fitness`. Yayınlama: GitHub Pages (bkz. §8).

## 4. Değerlendirilen yaklaşımlar

| # | Yaklaşım | Artısı | Eksisi |
|---|---|---|---|
| **1** | **PWA, veriler telefonda (seçildi)** | Ücretsiz, hesap/sunucu yok, internetsiz çalışır, sade | Telefon kaybolur ya da veri silinirse kayıtlar gider. Yedekle/geri yükle ile hafifletiliyor |
| 2 | PWA + bulut veritabanı | Otomatik yedek, cihazlar arası senkron | Bulut servisi kurulumu, giriş ekranı, bakım. Tek kullanıcılı ve tek cihazlı bir uygulama için gereksiz yük |
| 3 | Yerel (native) mağaza uygulaması | Tam yerel his | iOS için yıllık 99 $ geliştirici hesabı ve mağaza süreci. İhtiyaca göre gereksiz |

Kullanıcı **1. yaklaşımı** seçti. Veri katmanı, ileride 2'ye geçişi engellemeyecek şekilde ayrık tutulacak
(tüm okuma/yazma tek bir depolama modülünden geçer).

Daha önce elenen bir başka seçenek: uygulama içi Claude sohbet çubuğu (API ile kalori tahmini ve doğal dilde
kayıt). Kullanıcı API ile uğraşmak istemediği için elendi. Yerine kural tabanlı koç ve "Claude'a sor"
kopyalama butonu geldi.

## 5. Kullanıcının verdiği kararlar

- Kullanıcı: tek kişi, sahibi.
- Beslenme: elle giriş. Kalori + protein + karbonhidrat + yağ. API yok.
- Koçluk: dokunarak kayıt ve kendi kendine ilerleyen program.
- İlerleme: tekrar sayısı bir sınıra kadar artar, sonra **zorluk** artar (çift aşamalı ilerleme).
- "Claude'a sor" butonu: olacak.
- Hedef: kas kazanmak, genel güç, yağ oranını azaltmak.
- Haftada **3 gün** (ayarlarda 2 gün seçeneği de bulunur).
- Teknik yaklaşım: PWA, veriler telefonda. Telefon: **iPhone**.

## 6. Tasarım

### 6.1 Ekranlar

Alt sekme çubuğunda 4 sekme: **Bugün · Antrenman · Beslenme · İlerleme**. Ayarlar, Bugün ekranının
sağ üstündeki çark ikonundan açılır.

**Bugün**
```
Pazartesi, 23 Kasım                      ⚙
┌───────────────────────────────────────┐
│ Sıradaki: Antrenman A  (5 hareket)    │
│ [ Başla ]                             │
└───────────────────────────────────────┘
Kalori   1450 / 2200   ██████░░░░
Protein   95 / 160 g   █████░░░░░
Karb 140 / 220 g · Yağ 50 / 70 g
[ + Öğün ekle ]
(son ölçümden 7 gün geçtiyse) Haftalık ölçüm: [ Kilo / bel gir ]
[ Claude'a sor ]
```

**Antrenman (aktif oturum)**
```
Antrenman A                         [Bitir]
Barfiks — Bant destekli (Kırmızı)
Hedef: 3 × 6   (aralık 4–8)
 Set 1 [ 6 ]✓   Set 2 [ 6 ]✓   Set 3 [ 5 ]
Eğimli şınav — Merdiven 4. kademe
Hedef: 3 × 10  (aralık 8–12)
 Set 1 [10 ]    Set 2 [   ]    Set 3 [   ]
...
```
- Her set kutusu hedef sayıyla önceden doludur. **Tek dokunuş = hedefi yaptım (✓)**.
  Farklı sayı yapıldıysa kutuya dokunup +/− ile ya da klavyeyle düzeltilir.
- Hareket satırında "seviyeyi değiştir" seçeneği vardır (elle bir üst/alt seviyeye geçmek için).
- "Bitir" denince ilerleme kuralları çalışır. Bir özet gösterilir
  (ör. "Barfiks: bir sonraki sefer 3×7", "Squat: Yeşil banda geçtin 🎉").
- Yarıda kalan oturum kaydedilir (uygulama kapansa da kaldığı yerden devam eder).

**Antrenman sekmesi (oturum dışı):** Sıradaki gün (A/B), her hareketin mevcut seviyesi ve hedefi,
son oturumların listesi.

**Beslenme**
- Seçilen günün öğün listesi ve toplamları. Varsayılan gün bugündür, önceki günlere geçilebilir.
- **Öğün ekle formu:** ad (isteğe bağlı), kcal, protein, karb, yağ. Sayısal klavye açılır.
- **Sık kullanılanlar:** Daha önce girilmiş öğünler (ad + değerler) listede görünür.
  Tek dokunuşla tekrar eklenir. Liste en sık/son kullanılanlara göre sıralanır.
- Öğünler düzenlenip silinebilir.

**İlerleme**
- Kilo ve bel ölçüsünün zamanla değişimi (basit çizgi grafik).
- Son 7 / 30 günün ortalama kalori ve protein değeri, hedefle karşılaştırmalı. Ortalamaya sadece kayıt girilen günler katılır; karşılaştırma güncel hedefle yapılır.
- Hareket bazında geçmiş: tarih, seviye ve setler.

**Ayarlar**
- Günlük hedefler: kcal, protein, karb, yağ.
- Haftalık gün sayısı: 3 (varsayılan) / 2.
- Ekipman: bant listesi, merdiven kademe sayısı (bkz. §6.2).
- Hareketlerin tekrar aralıkları ve set sayıları (varsayılanlar hazır, değiştirilebilir).
- Yedekle / Geri yükle. Son yedek tarihi görünür.
- Verileri sıfırla (onaylı).

**İlk açılış (kurulum):** 3 kısa adım.
1. Bantlar: kullanıcı bantlarını **hafiften ağıra** sıralı ekler (ad/renk).
2. Merdiven: kaç kademe olduğu, 1 = en alt kademe.
3. Günlük beslenme hedefleri. Atlanabilir, sonradan girilebilir.

**Başlangıç seviyeleri:** İlk antrenmanda her hareketin yanında "Başlangıç seviyeni seç" listesi açılır.
Kullanıcı bildiği seviyeyi seçer, ör. "Bant destekli – Kırmızı" ya da "Tam barfiks". Ayrı bir test oturumu yok.

### 6.2 Program ve zorluk merdivenleri

Tüm vücut, **A/B dönüşümlü**. Uygulama "sıradaki gün" mantığıyla çalışır (son tamamlanan A ise sıradaki B).
Takvime bağlı değildir. Haftalık gün sayısı ayarı (2/3) sadece Bugün ekranındaki haftalık hedef göstergesini
ve set sayılarını etkiler: 2 günde ana hareketler 4 set, 3 günde 3 set.

**Antrenman A**
| Hareket | Tekrar aralığı | Zorluk merdiveni (kolaydan zora) |
|---|---|---|
| Barfiks | 4–8 | Negatif barfiks (yavaş iniş) → Bant destekli (ağır banttan hafif banda) → Tam barfiks → Yavaş tempolu barfiks (3 sn iniş) |
| Şınav | 8–12 | Merdivende eğimli şınav, en üst kademeden aşağı doğru → Yer şınavı → Ayaklar merdivende (alçaktan yükseğe kademe) |
| Bantlı squat | 8–12 | Bantlar hafiften ağıra |
| Bantlı Romanian deadlift | 8–12 | Bantlar hafiften ağıra |
| Asılı diz/bacak kaldırma | 8–12 | Asılı diz çekme → Asılı düz bacak kaldırma |

**Antrenman B**
| Hareket | Tekrar aralığı | Zorluk merdiveni |
|---|---|---|
| Ters row (merdivende) | 8–12 | Üst kademeden alta (vücut yataylaştıkça zorlaşır) |
| Bantlı omuz press | 8–12 | Bantlar hafiften ağıra |
| Bantlı geri lunge | 8–12 (her bacak) | Vücut ağırlığı → Bantlar hafiften ağıra |
| Bantlı hip thrust | 8–12 | Bantlar hafiften ağıra |
| Bantlı Pallof press | 8–12 (her taraf) | Bantlar hafiften ağıra |

**Ek 1 (2026-11-23, kullanıcı onayıyla): görünüm hedefi için ek hareketler ve merdiven devamları**

Kullanıcının hedefi "kaslı ve şekilli" görünüm. İlk programda göğüs haftada ~4,5 set, yan omuz ve kollar
doğrudan hiç çalışmıyordu. Her güne iki **yardımcı hareket** eklenir. Bunlar günün sonunda, ikişer süperset
olarak yapılır; tekrar aralığı 10–15, haftada 2 günde de 3 set (karın hareketleri gibi):

| Gün | Hareket | Tekrar | Zorluk merdiveni |
|---|---|---|---|
| A | Bantlı lateral raise | 10–15 | Bantlar hafiften ağıra |
| A | Bantlı biceps curl | 10–15 | Bantlar hafiften ağıra |
| B | Bantlı göğüs fly (merdivene bağlı) | 10–15 | Bantlar hafiften ağıra |
| B | Bantlı triceps pushdown (merdivenin üstüne bağlı) | 10–15 | Bantlar hafiften ağıra |

Bantlar zamanla bacak ve omuz press için hafif kalacağı için iki merdiven **sonuna** aşama eklenir (sona
eklendiği için mevcut seviyeler kaymaz):
- Bantlı squat → … en ağır bant → Bulgar split squat (arka ayak merdivende, her bacak) → Merdivene tutunarak tek bacak squat (her bacak)
- Bantlı omuz press → … en ağır bant → Pike şınav (ayaklar yerde) → Pike şınav – ayaklar 1.–3. kademede (güvenlik için en fazla 3. kademe)

Yeni sürüm indiğinde ana ekran uygulaması kendini bir kez yeniler (her set dokunuşta kaydedildiği için güvenli).

Merdivenler, kurulumda girilen ekipmandan **otomatik üretilir**. Örneğin kullanıcının 4 bandı ve
10 kademesi varsa "Bantlı squat" 4 seviyeli, "Ters row" 10 seviyeli olur.
Bant destekli barfiks, bantları ters sırada kullanır (en ağır bant en çok destek verir, en kolay seviyedir).

Hareket listesi ve aralıklar **veri olarak** tanımlanır (kodda sabit bir tablo/JSON). İleride
hareket eklemek ya da değiştirmek kod mantığına dokunmadan yapılabilir. v1'de kullanıcı arayüzünden hareket
ekleme/çıkarma yok. Sadece aralık ve set sayısı ayarlanabilir.

### 6.3 İlerleme kuralı (çift aşamalı ilerleme)

Her hareket için saklanan durum: `seviye` (merdivendeki indeks), `hedefTekrar`.

Oturum bitince, o harekette:
1. **Tüm setlerde** `hedefTekrar` veya fazlası yapıldıysa → `hedefTekrar += 1`.
2. Bu artışla `hedefTekrar` aralığın üst sınırını aşıyorsa → `seviye += 1`, `hedefTekrar = alt sınır`.
   Merdivenin en üstündeyse seviye sabit kalır, tekrar üst sınırda tutulur ve kullanıcıya
   "En üst seviyedesin" bilgisi gösterilir.
3. Setlerden en az biri hedefin altında kaldıysa → hedef aynı kalır.
4. **Geri düşme:** Aynı seviyede **üst üste 2 oturumda** herhangi bir set aralığın **alt sınırının**
   altında kaldıysa → `seviye -= 1`, `hedefTekrar = üst sınır − 2`.
5. Hareket o oturumda hiç yapılmadıysa (tüm setler boş) → durum değişmez.

Kullanıcı seviyeyi elle değiştirirse `hedefTekrar = alt sınır` olur.

Bu kural saf bir fonksiyon olarak yazılır (`önceki durum + oturum setleri → yeni durum`) ve birim testlerle
kapsanır.

### 6.4 iPhone (iOS PWA) notları

- `manifest.webmanifest` (ad, ikon, `display: standalone`, tema rengi) ve Apple'a özel meta etiketleri
  (`apple-mobile-web-app-capable`, `apple-touch-icon`) eklenir.
- Service worker ile tüm dosyalar önbelleğe alınır, uygulama internetsiz açılır.
- Ana ekrana eklenmiş PWA'nın depolaması Safari'den ayrıdır. Safari'nin "7 gün kullanılmayan site verisini
  silme" kuralı ana ekran uygulamasına uygulanmaz. Yine de `navigator.storage.persist()` istenir.
- Uygulama Safari sekmesinde açılırsa (ana ekrandan değil) "Ana Ekrana Ekle" talimatı gösterilir.
  Veriler orada ayrı tutulacağı için kullanıcı yanlışlıkla iki ayrı kopya oluşturmamalı.
- Yedekleme: JSON dosyası üretilip **Web Share API** (`navigator.share({ files })`) ile paylaşılır.
  Kullanıcı "Dosyalara Kaydet" ile iCloud Drive'a kaydeder. Paylaşım desteklenmezse dosya indirme yedek yoldur.
- Geri yükleme: `<input type="file">` ile JSON seçilir. Mevcut verinin üzerine yazmadan önce onay alınır.
- Son yedekten 30 gün geçtiyse Bugün ekranında küçük bir "Yedek alma zamanı" hatırlatması çıkar.
- Pano: "Claude'a sor" butonu `navigator.clipboard.writeText` ile kopyalar (kullanıcı dokunuşuyla
  tetiklendiği için iOS'ta çalışır). Ardından "Kopyalandı. claude.ai'yi aç" bağlantısı gösterilir.

### 6.5 "Claude'a sor" özeti

Düz metin, Türkçe. İçeriği:
- Kısa bağlam: hedef (rekompozisyon), ekipman, haftalık gün sayısı.
- Son 14 günün antrenmanları: tarih, gün (A/B), her hareketin seviyesi ve set tekrarları.
- Her hareketin mevcut seviyesi ve hedefi.
- Son 14 günün günlük ortalama kalori/protein/karb/yağ değerleri, hedeflerle birlikte; kayıt girilen gün sayısı.
- Son 4 haftanın kilo ve bel ölçüleri.
- Sonda hazır bir soru: "Bu verilere bakarak programımı ve beslenmemi nasıl ayarlamalıyım?"
  Kullanıcı yapıştırdıktan sonra bunu değiştirebilir.

### 6.6 Veri modeli (IndexedDB)

- `ayarlar`: hedefler, haftalık gün sayısı, bantlar (sıralı liste), merdiven kademe sayısı,
  hareket bazında aralık/set ayarları, son yedek tarihi.
- `hareketDurumu`: hareketId → { seviye, hedefTekrar, başarısızSayaç }.
- `oturumlar`: { id, tarih, gün (A/B), durum (devam/bitti), hareketler: [{ hareketId, seviye, setler: [tekrar] }] }.
- `öğünler`: { id, tarih (gün), saat, ad, kcal, protein, karb, yağ }.
- `ölçümler`: { tarih, kilo, bel }.

Yedek dosyası tüm bu tabloları ve bir `sürüm` alanını içerir. İleride şema değişirse geri yükleme
sırasında taşıma (migration) yapılabilsin diye.

### 6.7 Teknoloji

- React + TypeScript + Vite.
- Depolama: IndexedDB, ince bir sarmalayıcıyla (ör. `idb` ya da Dexie). Tüm erişim tek bir modülden geçer.
- PWA: `vite-plugin-pwa` (manifest + service worker).
- Grafik: hafif bir kütüphane ya da elle çizilen SVG.
- Testler: Vitest. İlerleme kuralı, merdiven üretimi, günlük toplamlar ve "Claude'a sor" metni için birim testleri.
- Mobil öncelikli tasarım, iPhone ekranına göre. Açık/koyu tema sistem ayarını izler.

## 7. Builder'a bırakılanlar

- Görsel tasarımın ayrıntıları (renkler, tipografi, ikonlar). Sade, büyük dokunma alanları, tek elle kullanım.
- Bileşen yapısı, durum yönetimi, klasör düzeni.
- Grafik kütüphanesi seçimi.
- Uygulama ikonu.
- Hareket açıklamaları (her hareket için 1-2 cümlelik "nasıl yapılır" notu). İçerik builder tarafından yazılır.

## 8. Yayınlama

Kullanıcının kararı: repo **public** yapılacak (kodda kişisel veri yok, tüm veriler telefonda).
Uygulama **GitHub Pages** üzerinden, GitHub Actions ile otomatik derlenip yayınlanır.
Repoyu public yapmak ve Pages kaynağını "GitHub Actions" olarak seçmek kullanıcının GitHub ayarlarında
yapacağı tek seferlik bir adımdır.

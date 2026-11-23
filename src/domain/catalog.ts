import type { ExerciseDef } from './types';

// Kas eşleşmeleri: docs/superpowers/specs/2026-11-23-muscle-map-design.md tablosu.

/** Program verisi (spec §6.2). Hareket eklemek/değiştirmek için sadece bu tablo düzenlenir. */
export const EXERCISES: ExerciseDef[] = [
  // ── Antrenman A ──
  {
    id: 'pullup', name: 'Barfiks', day: 'A', repMin: 4, repMax: 8,
    stages: [
      { kind: 'fixed', label: 'Negatif barfiks (yavaş iniş)' },
      { kind: 'bands', label: 'Bant destekli ({band})', reversed: true },
      { kind: 'fixed', label: 'Tam barfiks' },
      { kind: 'fixed', label: 'Yavaş tempolu barfiks (3 sn iniş)' },
    ],
    howTo: 'Barı omuz genişliğinden biraz geniş, avuçlar karşıya bakacak şekilde tut. Çene barın üstüne çıkana kadar çek, kontrollü in. Negatifte yukarıdan başla ve 3–5 saniyede in; bant destekte bandı bara bağlayıp ayağını/dizini içine koy.',
    muscles: { primary: ['lats', 'biceps'], secondary: ['upperBack', 'rearDelts', 'forearms'] },
  },
  {
    id: 'pushup', name: 'Şınav', day: 'A', repMin: 8, repMax: 12,
    stages: [
      { kind: 'rungs', label: 'Eğimli şınav – {rung}. kademe', order: 'desc' },
      { kind: 'fixed', label: 'Yer şınavı' },
      { kind: 'rungs', label: 'Ayaklar merdivende – {rung}. kademe', order: 'asc', max: 3 },
    ],
    howTo: 'Eller omuz genişliğinde, vücut baştan topuğa dümdüz. Göğüs ellere ya da basamağa yaklaşana kadar in, dirsekler gövdeye yaklaşık 45° açıyla kalsın. Basamak alçaldıkça hareket zorlaşır.',
    muscles: { primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] },
  },
  {
    id: 'band-squat', name: 'Bantlı squat', day: 'A', repMin: 8, repMax: 12,
    // Merdiven devamları SONA eklenir: mevcut seviyeler kaymaz.
    stages: [
      { kind: 'bands', label: 'Bantlı squat ({band})' },
      { kind: 'fixed', label: 'Bulgar split squat (her bacak)' },
      { kind: 'fixed', label: 'Merdivene tutunarak tek bacak squat (her bacak)' },
    ],
    howTo: 'Bandın ortasına omuz genişliğinde bas, uçlarını omuz hizasında tut. Kalçayı geriye iterek uyluklar yere paralel olana kadar çömel, topuklardan itip kalk. Bulgar split squatta arka ayağının üstünü merdivenin alt kademesine koy ve tek bacakla çömel; tek bacak squatta merdivene hafifçe tutunarak dengeni koru. Bu iki aşamada tekrarlar her bacak için sayılır.',
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lowerBack'] },
  },
  {
    id: 'band-rdl', name: 'Bantlı Romanian deadlift', day: 'A', repMin: 8, repMax: 12,
    stages: [{ kind: 'bands', label: 'Bantlı Romanian deadlift ({band})' }],
    howTo: 'Bandın ortasına bas, uçlarını ellerinle tut. Dizler hafif bükük ve sırt düz; kalçayı geriye iterek öne eğil, arka bacakta gerilmeyi hissedince kalçanı sıkarak doğrul.',
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lowerBack'] },
  },
  {
    id: 'hanging-raise', name: 'Asılı bacak kaldırma', day: 'A', repMin: 8, repMax: 12, core: true,
    stages: [
      { kind: 'fixed', label: 'Asılı diz çekme' },
      { kind: 'fixed', label: 'Asılı düz bacak kaldırma' },
    ],
    howTo: 'Bara ya da en üst basamağa asıl, sallanmadan dizlerini göğsüne çek. İleri seviyede bacakları düz tutup kalça hizasına kaldır. Yavaşça indir.',
    muscles: { primary: ['abs'], secondary: ['obliques', 'forearms'] },
  },
  {
    id: 'band-lateral-raise', name: 'Bantlı lateral raise', day: 'A', repMin: 10, repMax: 15, accessory: true,
    stages: [{ kind: 'bands', label: 'Bantlı lateral raise ({band})' }],
    howTo: 'Bandın ortasına bas, uçlarını iki elinle yanlarda tut. Dirsekler hafif bükük, kollarını yana doğru omuz hizasına kadar kaldır, yavaşça indir. Biceps curl ile sırayla (süperset) yapabilirsin.',
    muscles: { primary: ['shoulders'], secondary: ['traps'] },
  },
  {
    id: 'band-curl', name: 'Bantlı biceps curl', day: 'A', repMin: 10, repMax: 15, accessory: true,
    stages: [{ kind: 'bands', label: 'Bantlı biceps curl ({band})' }],
    howTo: 'Bandın ortasına bas, avuçlar öne bakacak şekilde uçlarını tut. Dirseklerini gövdene sabitle, elleri omuzlara doğru kıvır, yavaşça indir.',
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
  },
  // ── Antrenman B ──
  {
    id: 'inverted-row', name: 'Ters row', day: 'B', repMin: 8, repMax: 12,
    stages: [{ kind: 'rungs', label: 'Ters row – {rung}. kademe', order: 'desc' }],
    howTo: 'Bir basamağı omuz genişliğinde tut, ayaklarını öne uzat ve vücudunu tahta gibi düz tut. Göğsünü basamağa çek, kontrollü in. Basamak alçaldıkça vücut yataylaşır ve hareket zorlaşır.',
    muscles: { primary: ['upperBack', 'lats'], secondary: ['biceps', 'rearDelts'] },
  },
  {
    id: 'band-press', name: 'Bantlı omuz press', day: 'B', repMin: 8, repMax: 12,
    stages: [
      { kind: 'bands', label: 'Bantlı omuz press ({band})' },
      { kind: 'fixed', label: 'Pike şınav (ayaklar yerde)' },
      { kind: 'rungs', label: 'Pike şınav – ayaklar {rung}. kademe', order: 'asc', max: 3 },
    ],
    howTo: 'Bandın ortasına bas, uçlarını omuz hizasında tut. Belini kavislemeden kollarını tam yukarı it, kontrollü indir. Pike şınavda kalçanı yukarı kaldırıp vücudunla ters "V" yap ve başını ellerinin arasına doğru indir; ileri seviyede ayaklarını merdivenin alt kademelerine koy.',
    muscles: { primary: ['shoulders'], secondary: ['triceps', 'traps'] },
  },
  {
    id: 'band-lunge', name: 'Geri lunge', day: 'B', repMin: 8, repMax: 12, perSide: true,
    stages: [
      { kind: 'fixed', label: 'Geri lunge (vücut ağırlığı)' },
      { kind: 'bands', label: 'Bantlı geri lunge ({band})' },
    ],
    howTo: 'Bir adım geri at, arka diz yere yaklaşana kadar in, ön topuktan itip başlangıca dön. Bantlıda bandın ortasına ön ayağınla bas. Tekrarlar her bacak için sayılır.',
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'] },
  },
  {
    id: 'band-hip-thrust', name: 'Bantlı hip thrust', day: 'B', repMin: 8, repMax: 12,
    stages: [{ kind: 'bands', label: 'Bantlı hip thrust ({band})' }],
    howTo: 'Sırtüstü yat, bandı kalçanın üstünden geçirip uçlarını ellerinle yere bastır. Topuklardan itip kalçanı yukarı kaldır, tepede 1 saniye sık, yavaşça indir.',
    muscles: { primary: ['glutes'], secondary: ['hamstrings'] },
  },
  {
    id: 'band-pallof', name: 'Bantlı Pallof press', day: 'B', repMin: 8, repMax: 12, perSide: true, core: true,
    stages: [{ kind: 'bands', label: 'Bantlı Pallof press ({band})' }],
    howTo: 'Bandı merdivene göğüs hizasında bağla ve merdivene yan dur. Bandı göğsünün önünde tutup kollarını düz öne it; gövdenin dönmesine izin verme, 2 saniye tutup geri çek. Tekrarlar her taraf için sayılır.',
    muscles: { primary: ['obliques', 'abs'], secondary: [] },
  },
  {
    id: 'band-fly', name: 'Bantlı göğüs fly', day: 'B', repMin: 10, repMax: 15, accessory: true,
    stages: [{ kind: 'bands', label: 'Bantlı göğüs fly ({band})' }],
    howTo: 'Bandın ortasını merdivene göğüs hizasında dola, sırtın merdivene dönük dur ve uçlarını iki elinle tut. Dirsekler hafif bükük, kollarını önde birleştir ("sarılır gibi"), yavaşça aç. Triceps pushdown ile sırayla (süperset) yapabilirsin.',
    muscles: { primary: ['chest'], secondary: ['shoulders'] },
  },
  {
    id: 'band-pushdown', name: 'Bantlı triceps pushdown', day: 'B', repMin: 10, repMax: 15, accessory: true,
    stages: [{ kind: 'bands', label: 'Bantlı triceps pushdown ({band})' }],
    howTo: 'Bandı merdivenin üst kademesine dola, merdivene dönük dur. Dirseklerini gövdene sabitle ve uçları aşağı, kolların tam düzleşene kadar it; yavaşça bırak.',
    muscles: { primary: ['triceps'], secondary: [] },
  },
];

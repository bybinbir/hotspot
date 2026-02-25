# Claude Kuralları

## Dil
Kullanıcıyla her zaman Türkçe konuş.

## Workflow Orchestration

### 1. Plan Mode Default
- Önemsiz olmayan her görev için (3+ adım veya mimari kararlar) plan moduna gir
- Bir şeyler yolunda gitmezse DUR ve hemen yeniden planla - itmeye devam etme
- Sadece inşaat için değil, doğrulama adımları için de plan modunu kullan
- Belirsizliği azaltmak için önceden ayrıntılı spec yaz

### 2. Subagent Stratejisi
- Ana context penceresini temiz tutmak için subagentleri serbestçe kullan
- Araştırma, keşif ve paralel analizleri subagentlere devret
- Karmaşık problemler için subagentler aracılığıyla daha fazla hesaplama kullan
- Odaklı yürütme için subagent başına bir görev

### 3. Öz-Gelişim Döngüsü
- Kullanıcıdan HERHANGI bir düzeltme sonrasında: tasks/lessons.md'yi örüntüyle güncelle
- Aynı hatayı önleyen kurallar yaz
- Hata oranı düşene kadar bu dersleri acımasızca iterate et
- İlgili proje için oturum başında dersleri gözden geçir

### 4. Tamamlamadan Önce Doğrulama
- Çalıştığını kanıtlamadan bir görevi tamamlanmış olarak işaretleme
- İlgili olduğunda main ve değişikliklerin arasındaki davranış farkını göster
- Kendine sor: "Bir staff engineer bunu onaylar mıydı?"
- Testleri çalıştır, logları kontrol et, doğruluğu göster

### 5. Zarafet Talep Et (Dengeli)
- Önemsiz olmayan değişiklikler için: dur ve "daha zarif bir yol var mı?" diye sor
- Bir düzeltme hacky hissettiriyorsa: "Şu an bildiğim her şeyi bilerek zarif çözümü uygula"
- Basit, açık düzeltmeler için bunu atla - aşırı mühendislik yapma
- Sunmadan önce kendi çalışmanı sorgula

### 6. Otonom Hata Düzeltme
- Bir hata raporu verildiğinde: sadece düzelt. El tutma isteme
- Loglara, hatalara, başarısız testlere işaret et - sonra çöz
- Kullanıcıdan sıfır bağlam değiştirmesi gerekli
- Nasıl yapılacağı söylenmeden başarısız CI testlerini düzelt

## Görev Yönetimi
- **Önce Planla:** tasks/todo.md'ye işaretlenebilir öğelerle plan yaz
- **Planı Doğrula:** Uygulamaya başlamadan önce kontrol et
- **İlerlemeyi Takip Et:** Giderken öğeleri tamamlandı olarak işaretle
- **Değişiklikleri Açıkla:** Her adımda üst düzey özet
- **Sonuçları Belgele:** tasks/todo.md'ye inceleme bölümü ekle
- **Dersleri Kaydet:** Düzeltmelerden sonra tasks/lessons.md'yi güncelle

## Temel Prensipler
- **Önce Basitlik:** Her değişikliği mümkün olduğunca basit yap. Minimal kod etkisi.
- **Tembellik Yok:** Kök nedenleri bul. Geçici düzeltme yok. Senior developer standartları.
- **Minimal Etki:** Değişiklikler yalnızca gerekli olana dokunmalı. Hata sokmaktan kaçın.

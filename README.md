# FinFlow - Gelişmiş Kişisel Finans Yönetimi

FinFlow, modern web teknolojileri kullanılarak geliştirilmiş, **çoklu dil** ve **tema desteğine** sahip kapsamlı bir kişisel finans yönetimi uygulamasıdır. Gelir-gider takibi, bütçe planlaması ve detaylı raporlama özellikleriyle finansal özgürlüğünüze giden yolda size rehberlik eder.

## 🌟 Öne Çıkan Özellikler

### 🌍 Çoklu Dil Desteği (i18n)
Uygulama, **Türkçe (TR)** ve **İngilizce (EN)** dillerini tam olarak desteklemektedir.
- **next-intl** altyapısı ile güçlü ve hızlı çeviri yönetimi.
- Kullanıcı tercihine göre anlık dil değişimi (Ayarlar menüsünden).
- Tarayıcı diline göre otomatik varsayılan dil algılama.
- Tüm arayüz, formlar ve hata mesajları seçilen dilde dinamik olarak sunulur.

### 🎨 Gelişmiş Tema Yönetimi
- **Karanlık (Dark) ve Aydınlık (Light) Mod:** Göz yormayan, sistem tercihlerine duyarlı modern arayüz.
- **Tailwind CSS v4** ile optimize edilmiş renk paletleri ve geçiş efektleri.

### 💰 Finansal Yönetim
- **Çoklu Para Birimi:** TRY, USD ve EUR hesaplarını tek bir yerden yönetin.
- **Hesap Türleri:** Vadesiz, Vadeli, Kredi Kartı ve Nakit varlıklarınızı ayrı ayrı takip edin.
- **İşlem Kategorileri:** Harcamalarınızı ve gelirlerinizi detaylı kategorilere ayırın.

### 📊 Analiz ve Raporlama
- **İnteraktif Dashboard:** Varlık dağılımı, aylık harcama trendleri ve özet kartlar.
- **Bütçe Takibi:** Kategorilere özel harcama limitleri belirleyin ve aşım durumunda görsel uyarılar alın.
- **Görsel Grafikler:** Recharts ile oluşturulmuş detaylı veri görselleştirmeleri.

> [!NOTE]
> **Kur Bilgisi Hakkında:** Uygulama içerisindeki döviz kurları şu anda manuel olarak girilmektedir. İhtiyaç duyulması halinde otomatik kur çekme özelliği (API entegrasyonu) sisteme kolayca entegre edilebilir.

## 🛠️ Teknik Altyapı

Bu proje, modern ve ölçeklenebilir bir mimari üzerine inşa edilmiştir:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Dil:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/)
- **Monorepo Tool:** [Turborepo](https://turbo.build/)

## 📸 Uygulama Görüntüleri

### Ana Sayfa (Dashboard)
![Ana Sayfa](apps/Uygulama%20Görüntüleri/Ana%20Sayfa%20TR.png)

### Hesaplar
![Hesaplar](apps/Uygulama%20Görüntüleri/Hesaplar%20Sayfası%20TR.png)

### İşlemler
![İşlemler](apps/Uygulama%20Görüntüleri/İşlemler%20Sayfası%20TR.png)

### Bütçeler
![Bütçeler](apps/Uygulama%20Görüntüleri/Bütçeler%20Sayfası%20TR.png)

### Raporlar
![Raporlar](apps/Uygulama%20Görüntüleri/Raporlar%20Sayfası%20TR.png)

### Ayarlar ve Tercihler
![Ayarlar](apps/Uygulama%20Görüntüleri/Ayarlar%20Sayfası%20TR.png)
![Tercihler](apps/Uygulama%20Görüntüleri/Tercihler%20Sayfası.png)

### Veri Yönetimi ve Kategoriler
![Veri Yönetimi](apps/Uygulama%20Görüntüleri/Veri%20Yönetimi%20Sayfası.png)
![Kategoriler](apps/Uygulama%20Görüntüleri/Katagori%20Sayfası.png)

### Kur Ayarları
![Kur Ayarları](apps/Uygulama%20Görüntüleri/Para%20Birimi%20ve%20Kur%20Ayarları%20Sayfası.png)

## 📦 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/mehmetulucayy/gelismis-finflow.git
   cd gelismis-finflow
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   pnpm install
   ```

3. **Çevresel Değişkenleri Ayarlayın:**
   `.env.local` dosyasını oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin.

4. **Uygulamayı Başlatın:**
   ```bash
   pnpm dev
   ```
   Tarayıcınızda `http://localhost:3000` adresine gidin.

---
*FinFlow, finansal verilerinizi güvenle yönetmeniz için tasarlanmıştır.*

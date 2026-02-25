# Onspot Hotspot Yonetim Sistemi - Linux Kurulum Rehberi

## Icindekiler

1. [Sistem Gereksinimleri](#1-sistem-gereksinimleri)
2. [Sunucu Hazırlığı](#2-sunucu-hazırlığı)
3. [Proje Dosyalarini Kopyalama](#3-proje-dosyalarini-kopyalama)
4. [Ortam Degiskenlerini Yapilandirma](#4-ortam-degiskenlerini-yapilandirma)
5. [DNS Yapilandirmasi](#5-dns-yapilandirmasi)
6. [SSL Sertifikasi (Let's Encrypt)](#6-ssl-sertifikasi-lets-encrypt)
7. [Docker ile Production Deploy](#7-docker-ile-production-deploy)
8. [Ilk Calistirma ve Super Admin Olusturma](#8-ilk-calistirma-ve-super-admin-olusturma)
9. [Firewall Yapilandirmasi](#9-firewall-yapilandirmasi)
10. [Router Entegrasyonu (MikroTik / Cisco / Juniper)](#10-router-entegrasyonu)
11. [Yedekleme](#11-yedekleme)
12. [Sorun Giderme](#12-sorun-giderme)
13. [Guncelleme](#13-guncelleme)

---

## 1. Sistem Gereksinimleri

### Minimum Donanim
| Kaynak | Minimum | Onerilen |
|--------|---------|----------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB SSD | 50 GB SSD |
| Ag | 100 Mbps | 1 Gbps |

### Yazilim
- **OS:** Ubuntu 22.04 LTS / 24.04 LTS (veya Debian 12+)
- **Docker:** 24.0+ ve Docker Compose V2
- **Git:** 2.x

### Ag Gereksinimleri
| Port | Protokol | Aciklama |
|------|----------|----------|
| 80 | TCP | HTTP (Nginx) |
| 443 | TCP | HTTPS (Nginx + SSL) |
| 22 | TCP | SSH (yonetim) |
| 1812 | UDP | RADIUS Authentication |
| 1813 | UDP | RADIUS Accounting |
| 3799 | UDP | RADIUS CoA (Change of Authorization) |

---

## 2. Sunucu Hazirligi

### 2.1 Sistemi Guncelle

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Gerekli Paketleri Kur

```bash
sudo apt install -y curl git ufw apt-transport-https ca-certificates gnupg lsb-release
```

### 2.3 Docker Kur

```bash
# Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker repo
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Kur
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Kullaniciyi docker grubuna ekle
sudo usermod -aG docker $USER

# Cikis yap ve tekrar giris yap (grup degisikligi icin)
newgrp docker
```

### 2.4 Docker'i Dogrula

```bash
docker --version
docker compose version
```

---

## 3. Proje Dosyalarini Kopyalama

### 3.1 Proje Dizinini Olustur

```bash
sudo mkdir -p /opt/hotspot
sudo chown $USER:$USER /opt/hotspot
```

### 3.2 Kaynak Kodu Kopyala

**Secenk A - Git ile:**
```bash
cd /opt/hotspot
git clone https://github.com/KULLANICI/hotspot.git .
```

**Secenek B - SCP ile (git repo yoksa):**
```bash
# Yerel makineden sunucuya kopyala
scp -r ./hotspot/* kullanici@sunucu-ip:/opt/hotspot/
```

### 3.3 Dosya Yapisini Dogrula

```bash
ls -la /opt/hotspot/
# Gorulmesi gereken:
# docker-compose.yml
# apps/
# freeradius/
# nginx/
# .env.example
```

---

## 4. Ortam Degiskenlerini Yapilandirma

### 4.1 .env Dosyasini Olustur

```bash
cd /opt/hotspot
cp .env.example .env
```

### 4.2 Degiskenleri Duzenle

```bash
nano .env
```

```env
# ── Veritabani ─────────────────────────────────────────────
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=hotspot
DB_PASSWORD=COK_GUCLU_BIR_SIFRE_BURAYA    # DEGISTIR!
DB_DATABASE=hotspot

# ── Redis ──────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379

# ── JWT (Kimlik Dogrulama) ─────────────────────────────────
JWT_SECRET=EN_AZ_32_KARAKTER_RASTGELE_DEGER  # DEGISTIR!
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Uygulama ──────────────────────────────────────────────
API_PORT=3001
BASE_DOMAIN=onspot.com.tr                     # Kendi domaininiz

# ── FreeRADIUS ─────────────────────────────────────────────
RADIUS_SECRET=RADIUS_PAYLASIM_ANAHTARI        # DEGISTIR!

# ── SMS (Opsiyonel) ───────────────────────────────────────
# SMS_PROVIDER=log                    # Gelistirme: konsola yazar
# SMS_PROVIDER=twilio                 # Production: Twilio kullan
# TWILIO_ACCOUNT_SID=ACxxxxxxxx
# TWILIO_AUTH_TOKEN=xxxxxxxx
# TWILIO_PHONE_NUMBER=+905xxxxxxxxx
```

### 4.3 Guvenli Degerler Uret

```bash
# JWT Secret icin:
openssl rand -hex 32

# Veritabani sifresi icin:
openssl rand -base64 24

# RADIUS secret icin:
openssl rand -hex 16
```

> **ONEMLI:** `.env` dosyasindaki varsayilan sifreleri MUTLAKA degistirin!

---

## 5. DNS Yapilandirmasi

Domain saglayicinizda asagidaki DNS kayitlarini olusturun:

### 5.1 Gerekli DNS Kayitlari

| Kayit Tipi | Alan Adi | Deger |
|------------|----------|-------|
| A | onspot.com.tr | SUNUCU_IP |
| A | *.onspot.com.tr | SUNUCU_IP |
| A | api.onspot.com.tr | SUNUCU_IP |
| A | admin.onspot.com.tr | SUNUCU_IP |

> **NOT:** Wildcard (`*`) kaydi, her yeni tenant icin otomatik subdomain yonlendirmesi saglar. Ornegin `otelx.onspot.com.tr` icin ayri DNS kaydi gerekmez.

### 5.2 DNS Yayilimini Dogrula

```bash
# A kayitlarini kontrol et
dig +short onspot.com.tr
dig +short admin.onspot.com.tr
dig +short test.onspot.com.tr

# Hepsinin sunucu IP'sini gostermesi gerekir
```

---

## 6. SSL Sertifikasi (Let's Encrypt)

### 6.1 Certbot Kur

```bash
sudo apt install -y certbot
```

### 6.2 Wildcard Sertifika Al

Wildcard sertifika icin DNS-01 dogrulama gerekir:

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "onspot.com.tr" \
  -d "*.onspot.com.tr"
```

Certbot bir TXT kaydi eklemenizi isteyecek. Domain saglayicinizda:
- Kayit Tipi: `TXT`
- Alan Adi: `_acme-challenge.onspot.com.tr`
- Deger: Certbot'un verdigi deger

> DNS yayilimini bekleyin (1-5 dk), sonra Enter'a basin.

### 6.3 Nginx SSL Yapilandirmasi

Sertifika alindiktan sonra nginx config'ini guncelleyin:

```bash
nano /opt/hotspot/nginx/conf.d/hotspot.conf
```

Her `server` bloguna SSL ekleyin. Ornek (API):

```nginx
# API: api.onspot.com.tr
server {
    listen 80;
    server_name api.onspot.com.tr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.onspot.com.tr;

    ssl_certificate /etc/letsencrypt/live/onspot.com.tr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/onspot.com.tr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> Ayni SSL bloklarini `admin`, `portal.*` ve wildcard `*` server bloklarina da ekleyin.

### 6.4 SSL Sertifikalarini Docker'a Bagla

`docker-compose.yml` dosyasinda nginx servisine volume ekleyin:

```yaml
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro          # EKLE
    depends_on:
      - api
      - admin
```

### 6.5 Otomatik Sertifika Yenileme

```bash
# Cron job ekle (ayda 2 kez yenile)
sudo crontab -e
```

Asagidaki satiri ekleyin:
```
0 3 1,15 * * certbot renew --quiet && docker compose -f /opt/hotspot/docker-compose.yml restart nginx
```

---

## 7. Docker ile Production Deploy

### 7.1 Imajlari Olustur ve Baslat

```bash
cd /opt/hotspot

# Tum servisleri olustur ve baslat
docker compose up -d --build
```

Bu komut 6 container baslatir:
1. **postgres** - PostgreSQL 16 veritabani
2. **redis** - Redis 7 onbellek/kuyruk
3. **freeradius** - FreeRADIUS 3.2.3 (RADIUS sunucusu)
4. **api** - NestJS API (port 3001)
5. **admin** - Next.js Admin Panel (port 3000)
6. **nginx** - Reverse proxy (port 80/443)

### 7.2 Container Durumlarini Kontrol Et

```bash
docker compose ps
```

Tum servislerin `running` ve `healthy` durumda oldugunu dogrulayin:

```
NAME           STATUS              PORTS
postgres       running (healthy)   0.0.0.0:5432->5432/tcp
redis          running (healthy)   0.0.0.0:6379->6379/tcp
freeradius     running             0.0.0.0:1812->1812/udp, 1813->1813/udp
api            running             0.0.0.0:3001->3001/tcp
admin          running             0.0.0.0:3000->3000/tcp
nginx          running             0.0.0.0:80->80/tcp, 443->443/tcp
```

### 7.3 Loglari Kontrol Et

```bash
# Tum loglar
docker compose logs -f

# Belirli servis
docker compose logs -f api
docker compose logs -f freeradius
docker compose logs -f nginx
```

### 7.4 Veritabani Tabloların Otomatik Olusturuldugunu Dogrula

TypeORM `synchronize: true` (production disinda) ile tablolari otomatik olusturur.
Production icin migration kullanin:

```bash
docker compose exec api node -e "console.log('DB connection OK')"
```

---

## 8. Ilk Calistirma ve Super Admin Olusturma

### 8.1 Veritabani Seed (Ilk Veriler)

```bash
# Super admin kullaniciyi olustur
docker compose exec api node -e "
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('ADMIN_SIFRENIZ', 10);
console.log('Password hash:', hash);
"
```

### 8.2 Super Admin'i Veritabanina Ekle

```bash
docker compose exec postgres psql -U hotspot -d hotspot -c "
INSERT INTO admin_users (id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@onspot.com.tr',
  '\$2b\$10\$HASH_BURAYA',
  'Super Admin',
  'super_admin',
  true,
  NOW(),
  NOW()
);
"
```

> `$HASH_BURAYA` kismini 8.1'deki hash ciktisiyla degistirin.

### 8.3 Giris Testi

1. Tarayicida `https://admin.onspot.com.tr` adresine gidin
2. Email: `admin@onspot.com.tr`
3. Sifre: Belirlediginiz sifre
4. Dashboard'u gormelisiniz

### 8.4 Ilk Tenant Olusturma

1. Sol menude **Super Admin > Musteriler** bolumune gidin
2. **Musteri Ekle** butonuna tiklatin
3. 4 adimli wizard'i tamamlayin:
   - Isletme adi, subdomain, admin bilgileri
   - Musteri paketi sablonu
   - Hiz paketi sablonu (opsiyonel)
   - Ozet ve onay
4. Tenant olusturulduktan sonra `https://tenant-slug.onspot.com.tr` adresinden admin paneline erisilebilir

---

## 9. Firewall Yapilandirmasi

### 9.1 UFW ile Guvenlik Duvari

```bash
# Varsayilan politika
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH
sudo ufw allow 22/tcp

# Web (HTTP/HTTPS)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# RADIUS (sadece router IP'lerinden)
# Tek router:
sudo ufw allow from ROUTER_IP to any port 1812 proto udp
sudo ufw allow from ROUTER_IP to any port 1813 proto udp
sudo ufw allow from ROUTER_IP to any port 3799 proto udp

# Veya tum ag icin:
# sudo ufw allow from 10.0.0.0/8 to any port 1812 proto udp
# sudo ufw allow from 10.0.0.0/8 to any port 1813 proto udp

# Firewall'i etkinlestir
sudo ufw enable
sudo ufw status verbose
```

> **UYARI:** RADIUS portlarini tum internete ACMAYIN. Sadece router IP adreslerinden erisime izin verin.

### 9.2 PostgreSQL/Redis Portlarini Kapatma

Docker default olarak 5432 ve 6379 portlarini host'a baglar. Production'da bunlari disariya kapatin:

`docker-compose.yml` dosyasinda portlari `127.0.0.1`'e sinirlayin:

```yaml
  postgres:
    ports:
      - "127.0.0.1:5432:5432"    # Sadece localhost'tan erisim

  redis:
    ports:
      - "127.0.0.1:6379:6379"    # Sadece localhost'tan erisim
```

---

## 10. Router Entegrasyonu

### 10.1 NAS Cihazini Sisteme Ekleme

1. Admin panelinde **Cihazlar** sayfasina gidin
2. **Cihaz Ekle** butonuna tiklayin
3. Doldurun:
   - **Cihaz Adi:** MikroTik-Lobi (tanitici isim)
   - **IP Adresi:** Router'in WAN IP'si
   - **RADIUS Secret:** .env dosyasindaki `RADIUS_SECRET` ile ayni
   - **Cihaz Tipi:** MikroTik / Cisco / Juniper / Generic
   - **Port:** Auth portu (varsayilan: 1812)

### 10.2 MikroTik Yapilandirmasi

MikroTik routerda terminal'den:

```routeros
# RADIUS sunucusunu ekle
/radius
add service=hotspot address=SUNUCU_IP secret=RADIUS_SECRET \
    authentication-port=1812 accounting-port=1813 timeout=3000ms

# Hotspot sunucusunu yapilandir
/ip hotspot profile
set default use-radius=yes radius-accounting=yes \
    login-by=http-chap,http-pap nas-port-type=wireless-802.11

# Hotspot sunucusunu olustur (LAN arayuzunde)
/ip hotspot
add name=hotspot1 interface=bridge-lan address-pool=dhcp-pool \
    profile=default

# Walled garden (captive portal erisim izni)
/ip hotspot walled-garden ip
add dst-host=portal.TENANT_SLUG.onspot.com.tr action=accept
add dst-host=api.onspot.com.tr action=accept

# CoA (Change of Authorization) icin
/radius incoming
set accept=yes port=3799
```

### 10.3 Cisco WLC Yapilandirmasi

```
# RADIUS sunucusu tanimla
radius-server host SUNUCU_IP auth-port 1812 acct-port 1813 key RADIUS_SECRET

# AAA yapilandirmasi
aaa new-model
aaa authentication login hotspot_auth group radius
aaa accounting network hotspot_acct start-stop group radius

# Guest WLAN
wlan guest-hotspot 10 guest-hotspot
  security web-auth authentication-list hotspot_auth
  accounting-list hotspot_acct
  no shutdown
```

### 10.4 Juniper SRX Yapilandirmasi

```
set access radius-server SUNUCU_IP port 1812 secret RADIUS_SECRET
set access radius-server SUNUCU_IP accounting-port 1813

set access profile hotspot-profile authentication-order radius
set access profile hotspot-profile radius authentication-server SUNUCU_IP
set access profile hotspot-profile radius accounting-server SUNUCU_IP
set access profile hotspot-profile accounting order radius
```

### 10.5 Baglantivi Test Et

```bash
# Sunucuda radtest ile test et
docker compose exec freeradius radtest testuser testpass localhost 0 testing123

# Disaridan test (router gibi)
radtest testuser testpass SUNUCU_IP 0 RADIUS_SECRET
```

---

## 11. Yedekleme

### 11.1 Veritabani Yedekleme Scripti

`/opt/hotspot/scripts/backup.sh` dosyasi olusturun:

```bash
#!/bin/bash
BACKUP_DIR="/opt/hotspot/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETAIN_DAYS=30

mkdir -p $BACKUP_DIR

# PostgreSQL yedekle
docker compose -f /opt/hotspot/docker-compose.yml exec -T postgres \
  pg_dump -U hotspot -d hotspot --no-owner --no-acl \
  | gzip > "$BACKUP_DIR/hotspot_db_${TIMESTAMP}.sql.gz"

# Eski yedekleri sil
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETAIN_DAYS -delete

echo "Yedekleme tamamlandi: hotspot_db_${TIMESTAMP}.sql.gz"
```

```bash
chmod +x /opt/hotspot/scripts/backup.sh
```

### 11.2 Otomatik Yedekleme (Cron)

```bash
sudo crontab -e
```

```
# Her gun gece 02:00'de yedekle
0 2 * * * /opt/hotspot/scripts/backup.sh >> /var/log/hotspot-backup.log 2>&1
```

### 11.3 Yedekten Geri Yukleme

```bash
# Yedegi ac ve geri yukle
gunzip -c backups/hotspot_db_20260225_020000.sql.gz | \
  docker compose exec -T postgres psql -U hotspot -d hotspot
```

---

## 12. Sorun Giderme

### 12.1 Genel Kontrol Listesi

```bash
# Container durumlarini kontrol et
docker compose ps

# Servis loglarini incele
docker compose logs api --tail 100
docker compose logs freeradius --tail 100
docker compose logs nginx --tail 100

# Veritabani baglantisini test et
docker compose exec postgres psql -U hotspot -d hotspot -c "SELECT 1;"

# Redis baglantisini test et
docker compose exec redis redis-cli ping

# Disk kullanimini kontrol et
df -h

# Docker disk kullanimini kontrol et
docker system df
```

### 12.2 Sik Karsilasilan Sorunlar

#### API 502 Bad Gateway
```bash
# API container loglarini kontrol et
docker compose logs api --tail 50

# Container'i yeniden baslat
docker compose restart api
```

#### FreeRADIUS Baglanti Hatasi
```bash
# RADIUS loglarini kontrol et
docker compose logs freeradius --tail 50

# RADIUS'u debug modunda calistir
docker compose exec freeradius freeradius -X
```

#### "Access-Reject" Yaniti
1. Kullanicinin aktif oldugunu dogrulayin (admin panel > Kullanicilar)
2. Paket suresi dolmamis olmali
3. NAS cihazinin IP adresi kayitli olmali
4. RADIUS secret eslesmeli

```bash
# radcheck tablosunu kontrol et
docker compose exec postgres psql -U hotspot -d hotspot -c \
  "SELECT * FROM radcheck WHERE username = 'testuser';"

# NAS cihazlarini kontrol et
docker compose exec postgres psql -U hotspot -d hotspot -c \
  "SELECT shortname, nasname, secret FROM nas_devices;"
```

#### Portal Sayfasi Yuklenmiyor
```bash
# Portal erisimini test et
curl -H "Host: portal.tenant-slug.onspot.com.tr" http://localhost/login

# Nginx error log
docker compose logs nginx --tail 50
```

#### Docker Disk Dolu
```bash
# Kullanilmayan imajlari temizle
docker system prune -a --volumes

# Sadece dangling imajlari temizle
docker image prune
```

### 12.3 Performans Izleme

```bash
# Container kaynak kullanimini goruntule
docker stats

# PostgreSQL aktif baglantilari
docker compose exec postgres psql -U hotspot -d hotspot -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Aktif RADIUS oturumlarini say
docker compose exec postgres psql -U hotspot -d hotspot -c \
  "SELECT count(*) FROM radacct WHERE acctstoptime IS NULL;"
```

---

## 13. Guncelleme

### 13.1 Sifir Kesintili Guncelleme

```bash
cd /opt/hotspot

# Yedek al
./scripts/backup.sh

# Kaynak kodu guncelle
git pull origin main

# Yeniden olustur ve baslat
docker compose up -d --build

# Loglari kontrol et
docker compose logs -f --tail 20
```

### 13.2 Geri Alma (Rollback)

```bash
# Onceki commit'e don
git log --oneline -5
git checkout COMMIT_HASH

# Yeniden olustur
docker compose up -d --build
```

---

## Hizli Baslangic Ozeti

Tum adimlari tek seferde calistirmak icin:

```bash
# 1. Sunucu hazirla
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# 2. Docker kur
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 3. Projeyi kopyala
sudo mkdir -p /opt/hotspot && sudo chown $USER:$USER /opt/hotspot
cd /opt/hotspot
git clone https://github.com/KULLANICI/hotspot.git .

# 4. Yapilandir
cp .env.example .env
nano .env  # Sifreleri degistir!

# 5. DNS'i ayarla (domain saglayicida wildcard A kaydi)

# 6. Baslat
docker compose up -d --build

# 7. Super admin olustur
# (Asagidaki komutu gercek sifre hash'iyle calistirin)

# 8. Firewall
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable

# 9. SSL
sudo apt install -y certbot
sudo certbot certonly --manual --preferred-challenges dns -d "onspot.com.tr" -d "*.onspot.com.tr"
# nginx config'e SSL ekle, docker compose restart nginx
```

---

## Mimari Diyagram

```
                    Internet
                       |
                   [Firewall]
                       |
              ┌────────┴────────┐
              │   Nginx (80/443) │
              └────────┬────────┘
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │ Admin UI │  │  API     │  │ Captive Portal│
   │ Next.js  │  │ NestJS   │  │  (SSR/HBS)   │
   │  :3000   │  │  :3001   │  │   via API     │
   └──────────┘  └────┬─────┘  └──────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌───────────────┐
   │PostgreSQL│ │  Redis   │ │  FreeRADIUS   │
   │  :5432   │ │  :6379   │ │ :1812/:1813   │
   └──────────┘ └──────────┘ └───────┬───────┘
                                     │
                              ┌──────┴──────┐
                              │   Routerlar  │
                              │ MikroTik/    │
                              │ Cisco/Juniper│
                              └─────────────┘
```

---

**Destek:** Sorun bildirmek icin GitHub Issues kullanin.
**Versiyon:** 1.0.0
**Son Guncelleme:** 2026-02-25

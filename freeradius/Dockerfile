FROM freeradius/freeradius-server:3.2.3

# PostgreSQL client kütüphanesi
RUN apt-get update && \
    apt-get install -y freeradius-postgresql && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Config dosyalarını kopyala
COPY raddb/mods-enabled/sql /etc/freeradius/mods-enabled/sql
COPY raddb/mods-config/sql/main/postgresql/queries.conf /etc/freeradius/mods-config/sql/main/postgresql/queries.conf
COPY raddb/sites-enabled/default /etc/freeradius/sites-enabled/default
COPY raddb/clients.conf /etc/freeradius/clients.conf

# Dictionary dosyalarını kopyala
COPY dictionary/ /etc/freeradius/dictionary.d/

# FreeRADIUS debug modunda çalıştır (production'da -X kaldırılmalı)
CMD ["freeradius", "-f"]

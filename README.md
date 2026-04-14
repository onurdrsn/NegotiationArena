# Negotiation Arena

Negotiation Arena, gerçek hayat kriz durumlarında baskı altında AI karakterlerle (Cloudflare Workers AI - Llama 3) metin tabanlı müzakere ettiğiniz, skorunuzun gerçek zamanlı hesaplandığı ve bir liderlik tablosu üzerinden yarışabildiğiniz web tabanlı bir sosyal simülasyon oyunudur.

## 🚀 Teknolojiler
- **Frontend:** React + Vite + TypeScript, Tailwind CSS v4, Zustand.
- **Backend:** Cloudflare Workers, Hono.js, Drizzle ORM.
- **Veritabanı:** Neon DB (PostgreSQL Serverless).
- **Yapay Zeka:** Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`).
- **Altyapı:** Cloudflare Pages (Frontend), Cloudflare KV (Rate limit, session, cache).

## 🗂 Klasör Yapısı
Proje pnpm monorepo olarak tasarlanmıştır:
- `apps/web`: React Frontend arayüzü.
- `apps/worker`: Hono tabanlı Cloudflare Backend API.
- `packages/shared`: Ortak tip tanımlamaları (TypeScript) ve Zod doğrulama şemaları.

## 🛠 Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js (v18+)
- pnpm
- Cloudflare hesabı
- Neon DB hesabı

### 2. Geliştirme (Development)
Bağımlılıkları yükleyin:
```bash
make install
```

`apps/worker/.dev.vars` dosyasını oluşturup gerekli ortam değişkenlerini doldurun (Neon DB URL, JWT secret gibi).

Tüm projeyi yerel olarak çalıştırmak için:
```bash
make dev
```
(Veya ayrı ayrı çalıştırmak isterseniz: `make dev-api`, `make dev-web`).

### 3. Prodüksiyona Çıkma (Deploy)
Production için Cloudflare tarafında `NEGOTIATION_ARENA_KV` isminde bir KV namespace oluşturmalı ve ID'sini `wrangler.toml` içerisine girmelisiniz. Ayrıca `wrangler secret put` komutuyla secret verilerini yapılandırmalısınız.

Dışa aktarım için `Makefile` kullanılabilir:
- Sunucuyu (Worker API) yayına almak için: `make prod-api`
- Frontend'i (Cloudflare Pages) yayına almak için: `make prod-web`

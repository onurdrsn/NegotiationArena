# NEGOTIATION ARENA MAKEFILE

.PHONY: dev dev-api dev-web prod-api prod-web install clean

# === KURULUM VE TEMİZLİK ===
install:
	pnpm install

clean:
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

# === DEVELOPMENT ENV ===
dev:
	pnpm --parallel -r dev

dev-api:
	pnpm --filter ./apps/worker run dev

dev-web:
	pnpm --filter ./apps/web run dev

# === PRODUCTION ENV ===
prod-api:
	pnpm --filter ./apps/worker run deploy

prod-web:
	pnpm --filter ./apps/web run build
	npx wrangler pages deploy apps/web/dist --project-name negotiation-arena

db-push:
	pnpm --filter ./apps/worker run db:push

db-studio:
	pnpm --filter ./apps/worker run db:studio

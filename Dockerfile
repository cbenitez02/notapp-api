# --- Etapa deps (para cache eficiente) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Evitar husky en entornos de build/CI
RUN npm pkg delete scripts.prepare || true
RUN npm ci --no-audit --no-fund

# --- Etapa builder (compila TS con deps de dev) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Necesitamos devDeps para compilar
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Etapa runner (solo prod) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    TZ=America/Argentina/Cordoba

# Usuario no-root
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copiar solo node_modules de producción
COPY --from=deps /app/node_modules ./node_modules
# Copiar artefactos ya compilados
COPY --from=builder /app/dist ./dist
# Si necesitas archivos estáticos u otros (ej. .env ejemplo, public/)
# COPY --from=builder /app/public ./public

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000),res=>{if(res.statusCode<500)process.exit(0);process.exit(1)}).on('error',()=>process.exit(1))"

# Ajustá el entrypoint si es Nest/Express
CMD ["node", "dist/main.js"]
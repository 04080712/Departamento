# Estágio de Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Argumentos de build para as variáveis de ambiente (Vite precisa disso no build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GEMINI_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Gerar o build de produção
RUN npm run build

# Estágio de Produção
FROM nginx:stable-alpine

# Copiar os arquivos gerados no build para o diretório do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Etapa 1: Construcción
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servidor de producción
FROM nginx:stable-alpine as production-stage

# Copiamos la construcción de la etapa anterior
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copiamos configuración de Nginx para manejar rutas de React (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

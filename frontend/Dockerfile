FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Разработка: Vite с портом 5173 (в compose — volume + отдельный volume для node_modules)
FROM deps AS development
COPY . .
EXPOSE 5173
ENV VITE_API_BASE_URL=http://localhost:8000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Сборка статики для nginx
FROM deps AS build
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

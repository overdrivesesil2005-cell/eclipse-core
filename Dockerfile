# Используем официальный образ Node.js
FROM node:20-slim

# Создаем пользователя (требование Hugging Face для безопасности) [citation:2][citation:7]
RUN useradd -m -u 1000 user
USER user

# Устанавливаем рабочую директорию
WORKDIR /home/user/app

# Копируем файлы проекта
COPY --chown=user package*.json ./
COPY --chown=user . .

# Устанавливаем зависимости
RUN npm install --production

# Открываем порт 7860 (стандартный порт Hugging Face) [citation:6][citation:12]
EXPOSE 7860
ENV PORT=7860

# Запускаем наш сервер
CMD ["node", "server.js"]

FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
COPY supabase ./supabase
ENV PORT=7860
EXPOSE 7860
CMD ["node", "src/index.js"]
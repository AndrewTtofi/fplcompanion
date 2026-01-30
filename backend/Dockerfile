FROM node:18-slim

# Install ffmpeg for audio compression (needed for files >25MB)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create temp directory for audio files
RUN mkdir -p temp/audio

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]

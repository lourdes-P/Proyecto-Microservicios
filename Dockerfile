# Usa la imagen oficial de Node.js como base
FROM node:18

# Expone el puerto que utilizará la aplicación
EXPOSE 3000

# Crea y establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia el package.json y el package-lock.json al contenedor
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación al contenedor
COPY . .

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
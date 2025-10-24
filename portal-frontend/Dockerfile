# --- STAGE 1: The "Build" Stage ---
# Use a Node.js image to build our React app
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Build the production app
RUN npm run build

# --- STAGE 2: The "Serve" Stage ---
# Use a tiny Nginx image to serve the static files
FROM nginx:1.25-alpine

# Copy the built files from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# ⭐️ Crucial: Copy our custom Nginx config file
# This will handle routing and proxying API requests
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Tell Docker the container listens on port 80
EXPOSE 80

# The default Nginx command will run automatically
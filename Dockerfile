# Set the base image moody will run on
FROM node:20-alpine AS build
# Setting the working directory inside the container
WORKDIR /app
# Copies package files first (for better caching)
COPY package*.json ./
# Executes the command while building the image
RUN npm install && npm cache clean --force
# Copy the rest of the application code
COPY . .
# Accept environment variables as build arguments
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_AUTH_DOMAIN
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_STORAGE_BUCKET
ARG NEXT_PUBLIC_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_APP_ID
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
# Make them available during build
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_AUTH_DOMAIN=$NEXT_PUBLIC_AUTH_DOMAIN
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_STORAGE_BUCKET=$NEXT_PUBLIC_STORAGE_BUCKET
ENV NEXT_PUBLIC_MESSAGING_SENDER_ID=$NEXT_PUBLIC_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.next .next
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
# Exposes the port moody will run on
EXPOSE 3000
# Command to run the application
CMD ["npm", "start"]

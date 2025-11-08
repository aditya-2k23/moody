# Set the base image moody will run on
FROM node:20

# Setting the working directory inside the container
WORKDIR /app

# Copies package files first (for better caching)
COPY package*.json ./

# Executes the command while building the image
RUN npm install

# Copy the rest of the application code
COPY . .

# Accept environment variables as build arguments
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_AUTH_DOMAIN
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_STORAGE_BUCKET
ARG NEXT_PUBLIC_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_APP_ID

# Make them available during build
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_AUTH_DOMAIN=$NEXT_PUBLIC_AUTH_DOMAIN
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_STORAGE_BUCKET=$NEXT_PUBLIC_STORAGE_BUCKET
ENV NEXT_PUBLIC_MESSAGING_SENDER_ID=$NEXT_PUBLIC_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_APP_ID=$NEXT_PUBLIC_APP_ID

# Build the Next.js app for production
RUN npm run build

# Exposes the port moody will run on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]

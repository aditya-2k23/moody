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

# Build the Next.js app for production
RUN npm run build

# Exposes the port moody will run on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]

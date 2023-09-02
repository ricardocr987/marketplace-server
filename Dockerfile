# Use a base image that provides Node.js
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the application code into the container
COPY ./ ./

# Install dependencies
RUN bun install

# Command to run when the container starts
CMD ["bun", "run", "dev"]

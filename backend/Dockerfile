FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

# RUN npm install --production
RUN npm install 

COPY . .

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/src ./src

# Create app directory and set permissions
RUN mkdir -p /app/logs && \
    chmod 777 /app/logs

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Give ownership of the application directory to appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000

CMD ["node", "src/index.js"]


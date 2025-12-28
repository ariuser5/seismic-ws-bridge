# seismic-ws-bridge
Real-time earthquake alerts via SeismicPortal WebSocket.

## Setup
1. Clone the repository:
   ```bash
   git clone
   ```
2. Navigate to the project directory:
   ```bash
   cd seismic-ws-bridge
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your configuration:
   ```env
   HA_WEBHOOK=your_home_assistant_webhook_url
   LOG_LEVEL=info
   ADMIN_PORT=3000
   NOTIFICATION_FILTERS=create,update
   ```
5. Start the application:
   ```bash
   node src/node.js
   ```

## Configuration
- Ensure your Home Assistant instance is set up to receive webhook events.
- Modify the WebSocket URL in `src/node.js` if needed to connect to a different seismic data source.

### Environment Variables
- `HA_WEBHOOK` (required): Your Home Assistant webhook URL
- `LOG_LEVEL` (optional, default: `info`): Log level - valid values: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`
- `ADMIN_PORT` (optional, default: `3000`): Port for the admin HTTP server
- `NOTIFICATION_FILTERS` (optional, default: `all`): Comma-separated list of notification types to process - valid values: `create`, `update`, `delete`, `other` (for unknown/future action types), `all`. Examples: `create,update` or `all`

## Runtime Management

The application includes an HTTP admin server for runtime management without restarting.

### Health Check
Check the application status and current log level:
```bash
curl http://localhost:3000/health
```

### Change Log Level at Runtime
Change the log level without restarting:
```bash
curl -X POST http://localhost:3000/log-level \
  -H "Content-Type: application/json" \
  -d '{"level":"debug"}'
```

Valid log levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`

## Docker Usage

You can build and run this project as a Docker container. This is the recommended way to deploy in production or on servers.

### Build the Docker image
In the project root (where the Dockerfile is):
```bash
docker build -t <yourdockerhubusername>/seismic-ws-bridge:latest .
```

### Run the Docker container
Pass environment variables at runtime (do NOT hardcode secrets in the image):
```bash
docker run -d --name seismic-ws-bridge \
  -e HA_WEBHOOK=your_home_assistant_webhook_url \
  -e LOG_LEVEL=info \
  -p 3000:3000 \
  <yourdockerhubusername>/seismic-ws-bridge:latest
```

Or, use a `.env` file (recommended for local/dev):
1. Create a `.env` file in your project directory:
   ```env
   HA_WEBHOOK=your_home_assistant_webhook_url
   LOG_LEVEL=info
   ADMIN_PORT=3000
   NOTIFICATION_FILTERS=create,update
   ```
2. Run:
   ```bash
   docker run -d --name seismic-ws-bridge \
     --env-file .env \
     -p 3000:3000 \
     <yourdockerhubusername>/seismic-ws-bridge:latest
   ```

### Runtime Management in Docker
With the admin port exposed (`-p 3000:3000`), you can manage the container at runtime:

**Health check:**
```bash
curl http://localhost:3000/health
```

**Change log level:**
```bash
curl -X POST http://localhost:3000/log-level \
  -H "Content-Type: application/json" \
  -d '{"level":"debug"}'
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author
Darius Emanuel Ciuverca [DCiuve] (https://github.com/ariuser5)


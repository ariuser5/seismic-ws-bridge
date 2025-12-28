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
4. Create a `.env` file in the root directory and add your Home Assistant webhook URL:
   ```env
   HA_WEBHOOK=your_home_assistant_webhook_url
   ```
5. Start the application:
   ```bash
   node src/node.js
   ```

## Configuration
- Ensure your Home Assistant instance is set up to receive webhook events.
- Modify the WebSocket URL in `src/node.js` if needed to connect to a different seismic data source.


## Docker Usage

You can build and run this project as a Docker container. This is the recommended way to deploy in production or on servers.

### Build the Docker image
In the project root (where the Dockerfile is):
```bash
docker build -t <yourdockerhubusername>/seismic-ws-bridge:latest .
```

### Run the Docker container with environment variable
Pass the `HA_WEBHOOK` environment variable at runtime (do NOT hardcode secrets in the image):
```bash
docker run -e HA_WEBHOOK=your_home_assistant_webhook_url <yourdockerhubusername>/seismic-ws-bridge:latest
```
Optionally, you can set the log level by spefifying the `LOG_LEVEL` environment variable. For example, to set it to debug:
```bash
-e LOG_LEVEL=debug
```


Or, use a `.env` file (recommended for local/dev):
1. Create a `.env` file in your project directory:
   ```env
   HA_WEBHOOK=your_home_assistant_webhook_url
   ```
2. Run:
   ```bash
   docker run -d --name seismic-ws-bridge --env-file .env yourdockerhubusername/seismic-ws-bridge:latest
   ```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author
Darius Emanuel Ciuverca [DCiuve] (https://github.com/ariuser5)


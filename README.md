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

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author
Darius Emanuel Ciuverca [DCiuve] (https://github.com/ariuser5)


# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-12-30

### Improved
- Enhanced error logging with structured error details (message, code, cause)
- Added debug-level logging for full error objects to aid troubleshooting
- Improved WebSocket close event logging with detailed status codes and descriptions
- Fixed Winston logger format to properly display metadata objects

### Technical Details
- Error logs now include structured information instead of empty objects
- WebSocket disconnect logs now show close codes (e.g., 1000, 1006) with human-readable descriptions
- Added RFC 6455 compliant close code descriptions for better diagnostics

## [1.0.0] - 2025-12-28

### Added
- Initial release
- Real-time earthquake alerts via SeismicPortal WebSocket
- Home Assistant webhook integration
- Docker support with multi-platform images
- Runtime configuration for log levels via HTTP endpoint
- Runtime configuration for notification filters (create, update, delete, other, all)
- Configurable notification filters via environment variables
- Health check endpoint
- Automatic reconnection on WebSocket disconnection
- Winston-based structured logging

[1.0.1]: https://github.com/ariuser5/seismic-ws-bridge/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ariuser5/seismic-ws-bridge/releases/tag/v1.0.0

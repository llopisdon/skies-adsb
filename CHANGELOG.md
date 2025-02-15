# Changelog

## [2.0.4] - 2025-02-15

## Added

- Added documentation for enabling remote access to Raspberry Pi dump1090-mutability
- Added documentation for customizing default visualization settings
- Added documentation for create map layers for larger coverage areas
- Added --skip-aerodromes option to build-map-layers.py script

## Changed

- Refactored many default settings to be user configurable via src/utils.js file
- Updated instructions on how to work with existing ADS-B receivers
- Updated project README.md
- Update Vite to 5.4.14
- Update @mapbox/sphericalmercator to 2.0.1

## [2.0.3] - 2025-02-11

### Changed

- Updated project README.md
- Updated DEVELOPMENT.md

## [2.0.2] - 2025-02-11

### Changed

- Fixed typo in BUILD-MAPS.md

## [2.0.1] - 2025-02-11

### Added

- Build-map-layers.sh bash automation script

### Changed

- Misc documentation typo fixes
- Updated map layer building instructions to use build-map-layers.sh script

## [2.0.0] - 2025-02-02

### Added

- Generate custom GeoJSON map layers from Natural Earth, FAA, and OpenStreetMap data
- Aircraft trails visualization
- Enhanced map renderer with multi-layer vector support:
  - Aerodromes
  - Airspaces
  - States / Provinces
  - Counties
  - Urban areas
  - Roads
  - Rivers
  - Lakes
- New aircraft follow camera controls
- Added project sponsor button via Buy Me a Coffee

### Changed

- Major codebase refactoring and simplification
- Simplified setup and build process
- Updated documentation to reflect migration to Raspberry Pi OS 64-bit
- Update project screenshots and recordings
- Updated the project README
- Updated METAR api call to use new aviationweather.gov JSON endpoint

### Removed

- Removed outdated CLOUDFLARE-TUNNEL.md documentation

## [1.3.2] - 2024-12-24

### Changed

- Misc refactoring of main.js

## [1.3.1] - 2024-12-24

### Changed

- Misc refactoring of aircraft.js

## [1.3.0] - 2024-12-23

### Changed

- Refactored aircraft follow camera logic and controls

## [1.2.5] - 2024-03-19

### Removed

- Removed TODO

## [1.2.4] - 2024-03-12

### Changed

- Updated Raspberry Pi Install Guide

## [1.2.3] - 2024-03-12

### Changed

- Updated localhost Install Guide

## [1.2.2] - 2024-03-10

### Changed

- Updated Raspberry Pi Install Guide with additional Vite environment variable usage instructions

## [1.2.1] - 2024-03-10

### Changed

- Updated Raspberry Pi Install Guide with Vite environment variable usage instructions

## [1.2.0] - 2024-03-10

### Changed

- Migrated project build system to use Vite instead of webpack
- Updated project documentation to reflect usage of Vite

## [1.1.1] - 2023-11-22

### Changed

- Misc updates to project README

## [1.1.0] - 2023-11-18

### Changed

- Migrated flask app to use FlightAware AeroAPI v4

## [1.0.2] - 2022-05-22

### Changed

- Disable user-select CSS on aircraft dialog to prevent loss of focus on main rendering widow

## [1.0.1] - 2022-05-15

### Changed

- Disable user-select CSS on HUD buttons to prevent loss of focus on main rendering widow

## [1.0.0] - 2022-05-14

- First stable release

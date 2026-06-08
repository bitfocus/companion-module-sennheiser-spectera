# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Mobile Device - Command Behavior action
- Mobile Device - Command Behavior and Command State feedbacks
- Command Behavior variable for all mobile devices

### Fixed

- Mobile Device - Connected feedback breaking after updating Spectera Basestation to v1.4.0
- Mobile Device - Connected variable now derived from device state instead of the deprecated `connected` field

## [1.0.1] - 2026-04-29

### Fixed

- Cleanup unused audio links when performing actions where a new audio link is created
- List SKM devices in applicable dropdowns that previously only showed SEK devices
- Require confirmation when using the "RF - State" presets to prevent accidental changes

## [1.0.0] - 2026-04-16

### Added

- Initial release

[Unreleased]: https://github.com/bitfocus/companion-module-sennheiser-spectera/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/bitfocus/companion-module-sennheiser-spectera/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/bitfocus/companion-module-sennheiser-spectera/releases/tag/v1.0.0

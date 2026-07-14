# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-14

### Added

- **Mobile Device - Command Behavior** action, feedback, and variable
- **Mobile Device - Command State** feedback
- **Mobile Device - Set Settings From JSON** action to copy settings from another device between connections.
- **Mobile Device - Settings (JSON)** variable for all mobile devices, for use with the "Set Settings From JSON" action
- API compatibility check now logs a warning when the connected Base Station firmware is unsupported

### Changed

- Mobile Devices and DADs now use configurable LED colors instead of LED brightness. All existing actions and feedbacks will migrate to the default color values.
- DAD - LED Colors (previously LED brightness) can be customized separately for RF active and RF muted states
- **Breaking:** LED brightness variable IDs have been renamed. Update any button text or expressions that reference the old IDs:
  - Mobile Device: `*_led_brightness` → `*_connected_state_color`
  - DAD: `dad_*_led_brightness` → `dad_*_led_rf_active` and `dad_*_led_rf_muted`
- Audio Output - Interface actions and feedbacks now support Command Mode. All existing actions and feedbacks will be set to "Disabled" by default.

### Fixed

- Mobile Device - Connected feedback and `connected` variable breaking after updating Spectera Basestation to v1.4.0
- MADI audio level variables showing no value
- More performant audio meter updates for feedback and variables

## [1.0.1] - 2026-04-29

### Fixed

- Cleanup unused audio links when performing actions where a new audio link is created
- List SKM devices in applicable dropdowns that previously only showed SEK devices
- Require confirmation when using the "RF - State" presets to prevent accidental changes

## [1.0.0] - 2026-04-16

### Added

- Initial release

[1.1.0]: https://github.com/bitfocus/companion-module-sennheiser-spectera/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/bitfocus/companion-module-sennheiser-spectera/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/bitfocus/companion-module-sennheiser-spectera/releases/tag/v1.0.0

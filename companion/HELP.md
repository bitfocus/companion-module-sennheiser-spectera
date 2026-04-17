## Sennheiser Spectera

This connection controls and monitors a **Sennheiser Spectera** Base Station and connected devices.

### Requirements

- **Spectera firmware 1.3 or newer** is required.

_Please note, using many different link modes on the same RF channel and continually deleting and creating new link modes can in rare circumstances require Spectera to rearrange audio data causing a brief audio interruption in any connected device._

_In a future firmware update this will be addressed, until then please either avoid creating new and previously unused linkIDs during a production to avoid this interruption._

### Getting Started

- In the module configuration, set **Base Station IP** and **Password**

### Mobile Device Variables

Actions and feedbacks that target a **Mobile Device** use the device **serial number** (dropdown entries show name and serial). You can also type a serial or use **variables** in those fields where supported.

**Per-device variables** are created for each discovered device. The variable id pattern is:

`{TYPE}_{SERIAL}_{field}`

Example: `SEK_1234567890_name`, `SKM_9876543210_battery_level`.

### Actions with Confirmation

Some sensitive actions that could result in disruption of audio (ex. changing the RF frequency) support **Require confirmation**. When enabled, the **first** button press arms the action; the **second** press within **5 seconds** executes it. If nothing is confirmed, the pending state clears after the timeout.

Use the **Confirm Pending** feedback to style a button while a matching confirmation is waiting (action type and options must match the armed action).

Confirmable actions include: **RF - Frequency**, **Audio Input - Interface**, **DAD - RF Channel**, **Audio Output - Interface**, and **Mobile Device - Copy All Settings**.

### Presets

Built-in presets are grouped by category, including **RF Configuration**, **Audio Inputs**, **Audio Outputs**, **SEKs** / **SKMs** (per-device status and controls), **Instrument Switch Mode**, **Backup Mode** (copy settings between devices), **Engineer Mode** (IEM routing helpers for detected SEKs), and **Base Station** (status, PSUs, fans, audio interface status).

import type { AudioInput, AudioOutput, RfChannel, Antenna, MobileDevice } from './types.js'

export class SpecteraState {
	public readonly audioInputs = new Map<number, AudioInput>()
	public readonly audioOutputs = new Map<number, AudioOutput>()
	public readonly rfChannels = new Map<number, RfChannel>()
	public readonly antennas = new Map<string, Antenna>()
	public readonly mobileDevices = new Map<number, MobileDevice>()

	public updateAudioInput(input: AudioInput): void {
		this.audioInputs.set(input.inputId, input)
	}

	public updateAudioOutput(output: AudioOutput): void {
		this.audioOutputs.set(output.outputId, output)
	}

	public updateRfChannel(channel: RfChannel): void {
		this.rfChannels.set(channel.rfChannelId, channel)
	}

	public updateAntenna(antenna: Antenna): void {
		this.antennas.set(antenna.antennaPortId, antenna)
	}

	public updateMobileDevice(device: MobileDevice): void {
		this.mobileDevices.set(device.mtUid, device)
	}

	public removeMobileDevice(mtUid: number): void {
		this.mobileDevices.delete(mtUid)
	}

	public clear(): void {
		this.audioInputs.clear()
		this.audioOutputs.clear()
		this.rfChannels.clear()
		this.antennas.clear()
		this.mobileDevices.clear()
	}
}

import type {
	AudioInput,
	AudioOutput,
	RfChannel,
	Antenna,
	MobileDevice,
	HealthState,
	PsuState,
	TempState,
	FanState,
	DeviceIdentity,
	DeviceState,
	DeviceSite,
	DeviceInfoState,
} from './types.js'
import { PsuStatus as PsuStatusEnum, TempStatus as TempStatusEnum } from './types.js'

export class SpecteraState {
	public readonly audioInputs = new Map<number, AudioInput>()
	public readonly audioOutputs = new Map<number, AudioOutput>()
	public readonly rfChannels = new Map<number, RfChannel>()
	public readonly antennas = new Map<string, Antenna>()
	public readonly mobileDevices = new Map<number, MobileDevice>()
	public health: HealthState = {
		psu: { psu1State: PsuStatusEnum.Unconnected, psu2State: PsuStatusEnum.Unconnected },
		temp: { state: TempStatusEnum.Normal },
		fans: {},
	}
	public deviceInfo: DeviceInfoState = {}

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

	public updatePsuState(state: PsuState): void {
		this.health.psu = state
	}

	public updateTempState(state: TempState): void {
		this.health.temp = state
	}

	public updateFanState(fanId: string, state: FanState): void {
		this.health.fans[fanId] = state
	}

	public updateDeviceIdentity(identity: DeviceIdentity): void {
		this.deviceInfo.identity = identity
	}

	public updateDeviceState(state: DeviceState): void {
		this.deviceInfo.state = state
	}

	public updateDeviceSite(site: DeviceSite): void {
		this.deviceInfo.site = site
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

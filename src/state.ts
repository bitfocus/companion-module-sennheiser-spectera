import type {
	AudioInput,
	AudioOutput,
	RfChannel,
	Antenna,
	MobileDevice,
	AudioLink,
	HealthState,
	PsuState,
	TempState,
	FanState,
	BaseStationInfo,
	BaseStationSite,
	BaseStationState,
	BaseStationIdentity,
	AudioLevels,
} from './types.js'
import { PsuStatus as PsuStatusEnum, TempStatus as TempStatusEnum } from './types.js'

export class SpecteraState {
	public readonly audioInputs = new Map<number, AudioInput>()
	public readonly audioOutputs = new Map<number, AudioOutput>()
	public readonly rfChannels = new Map<number, RfChannel>()
	public readonly antennas = new Map<string, Antenna>()
	public readonly mobileDevices = new Map<number, MobileDevice>()
	public readonly audioLinks = new Map<number, AudioLink>()
	public audioLevels: AudioLevels = { updateCounter: 0 }
	public health: HealthState = {
		psu: { psu1: PsuStatusEnum.Unconnected, psu2: PsuStatusEnum.Unconnected },
		temp: { value: TempStatusEnum.Normal },
		fans: {},
	}
	public basestation: BaseStationInfo = {}

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

	public updateAudioLink(link: AudioLink): void {
		this.audioLinks.set(link.audiolinkId, link)
	}

	public updatePsuState(state: PsuState): void {
		this.health.psu = state
	}

	public updateTempState(state: TempState): void {
		this.health.temp.value = state.value
	}

	public updateFanState(fanId: string, state: FanState): void {
		this.health.fans[fanId] = state
	}

	public updateBaseStationIdentity(info: BaseStationIdentity): void {
		this.basestation.identity = info
	}

	public updateBaseStationState(state: BaseStationState): void {
		this.basestation.state = state
	}

	public updateBaseStationSite(site: BaseStationSite): void {
		this.basestation.site = site
	}

	public updateAudioLevels(levels: AudioLevels): void {
		this.audioLevels = levels
	}

	public removeMobileDevice(mtUid: number): void {
		this.mobileDevices.delete(mtUid)
	}

	public removeAudioLink(audiolinkId: number): void {
		this.audioLinks.delete(audiolinkId)
	}

	public clear(): void {
		this.audioInputs.clear()
		this.audioOutputs.clear()
		this.rfChannels.clear()
		this.antennas.clear()
		this.mobileDevices.clear()
		this.audioLinks.clear()
	}
}

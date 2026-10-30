import {
	InputSource,
	MicLowCutHzSEK,
	MicLowCutHzSKM,
	MtState,
	MtType,
	type MobileDevice,
	type AudioInput,
	type AudioOutput,
	type SEKDevice,
	type SKMDevice,
} from '../../src/types.js'

export function makeAudioInput(overrides: Partial<AudioInput> = {}): AudioInput {
	return {
		inputId: 0,
		iemAudiolinkId: -1,
		inputSource: InputSource.Dante,
		name: 'Input 1',
		...overrides,
	}
}

export function makeAudioOutput(overrides: Partial<AudioOutput> = {}): AudioOutput {
	return {
		outputId: 0,
		micAudiolinkId: -1,
		aoIpEnableIfCommandIsDisabled: 'On',
		madi1EnableIfCommandIsDisabled: 'On',
		madi2EnableIfCommandIsDisabled: 'On',
		aoIpEnableIfCommandIsEnabled: 'On',
		madi1EnableIfCommandIsEnabled: 'On',
		madi2EnableIfCommandIsEnabled: 'On',
		...overrides,
	}
}

export function makeSekDevice(overrides: Partial<SEKDevice> = {}): SEKDevice {
	return {
		mtUid: 1,
		type: MtType.SEK,
		identify: false,
		name: 'SEK 1',
		serial: 'SEK-001',
		sleep: false,
		state: MtState.Connected,
		headphoneVolume: 0,
		headphoneBalance: 0,
		micPreampGain: 0,
		micLowCutHz: MicLowCutHzSEK.Off,
		...overrides,
	}
}

export function makeSkmDevice(overrides: Partial<SKMDevice> = {}): SKMDevice {
	return {
		mtUid: 2,
		type: MtType.SKM,
		identify: false,
		name: 'SKM 1',
		serial: 'SKM-001',
		sleep: false,
		state: MtState.Connected,
		micPreampGain: 0,
		micLowCutHz: MicLowCutHzSKM.Off,
		...overrides,
	}
}

export function makeMobileDevice(overrides: Partial<MobileDevice> = {}): MobileDevice {
	return makeSekDevice(overrides as Partial<SEKDevice>)
}

import type {
	CompanionMigrationAction,
	CompanionMigrationFeedback,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig, ModuleSecrets } from './config.js'

// Firmware v1.4.1 - Migrate LED colors from from brightness to HEX values
function upgradeLedColors(
	_context: CompanionUpgradeContext<ModuleConfig>,
	props: CompanionStaticUpgradeProps<ModuleConfig, ModuleSecrets>,
): CompanionStaticUpgradeResult<ModuleConfig, ModuleSecrets> {
	const legacyConnectedStateColors: Record<string, string> = {
		Off: '#000000',
		Dim: '#008700',
		Standard: '#00A100',
		Bright: '#00FF00',
	}

	const legacyAntennaColors: Record<string, { rfActive: string; rfMuted: string }> = {
		Off: { rfActive: '#000000', rfMuted: '#000000' },
		Dim: { rfActive: '#008700', rfMuted: '#877200' },
		Standard: { rfActive: '#00A100', rfMuted: '#A18700' },
		Bright: { rfActive: '#00FF00', rfMuted: '#FFD700' },
	}

	const resolveLegacyBrightness = (brightness: unknown): string => {
		if (typeof brightness === 'string' && brightness in legacyConnectedStateColors) {
			return brightness
		}
		return 'Standard'
	}

	const updatedActions: CompanionMigrationAction[] = []
	const updatedFeedbacks: CompanionMigrationFeedback[] = []

	for (const action of props.actions) {
		if (action.actionId === 'dadLedBrightness') {
			const colors = legacyAntennaColors[resolveLegacyBrightness(action.options.ledBrightness)]
			updatedActions.push({
				...action,
				actionId: 'dadConnectedStateColor',
				options: {
					dad: action.options.dad,
					rfActive: colors.rfActive,
					rfMuted: colors.rfMuted,
				},
			})
		} else if (action.actionId === 'mobileDeviceLedBrightness') {
			updatedActions.push({
				...action,
				actionId: 'mobileDeviceConnectedStateColor',
				options: {
					serial: action.options.serial,
					connectedStateColor: legacyConnectedStateColors[resolveLegacyBrightness(action.options.ledBrightness)],
				},
			})
		}
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === 'dadLedBrightness') {
			const colors = legacyAntennaColors[resolveLegacyBrightness(feedback.options.ledBrightness)]
			updatedFeedbacks.push({
				...feedback,
				feedbackId: 'dadConnectedStateColor',
				options: {
					dad: feedback.options.dad,
					rfActive: colors.rfActive,
					rfMuted: colors.rfMuted,
				},
			})
		} else if (feedback.feedbackId === 'mobileDeviceLedBrightness') {
			updatedFeedbacks.push({
				...feedback,
				feedbackId: 'mobileDeviceConnectedStateColor',
				options: {
					serial: feedback.options.serial,
					connectedStateColor: legacyConnectedStateColors[resolveLegacyBrightness(feedback.options.brightness)],
				},
			})
		}
	}

	return {
		updatedConfig: props.config,
		updatedActions,
		updatedFeedbacks,
	}
}

// Firmware v1.4.1 - Default new Command Mode to "disabled" if not set
function upgradeAudioOutputCommandContext(
	_context: CompanionUpgradeContext<ModuleConfig>,
	props: CompanionStaticUpgradeProps<ModuleConfig, ModuleSecrets>,
): CompanionStaticUpgradeResult<ModuleConfig, ModuleSecrets> {
	const updatedActions: CompanionMigrationAction[] = []
	const updatedFeedbacks: CompanionMigrationFeedback[] = []

	for (const action of props.actions) {
		if (action.actionId === 'setAudioOutputInterface' && action.options.context === undefined) {
			action.options.context = 'disabled'
			updatedActions.push(action)
		}
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === 'audioOutputInterface' && feedback.options.context === undefined) {
			feedback.options.context = 'disabled'
			updatedFeedbacks.push(feedback)
		} else if (
			feedback.feedbackId === 'confirmPending' &&
			feedback.options.setAudioOutputInterface_context === undefined
		) {
			feedback.options.setAudioOutputInterface_context = 'disabled'
			updatedFeedbacks.push(feedback)
		}
	}

	return {
		updatedConfig: null,
		updatedActions,
		updatedFeedbacks,
	}
}

// Firmware v1.4.1 - Migrate InputSource values (`dante`/`madi1`/`madi2` → `AoIp`/`Madi1`/`Madi2`)
function upgradeAudioInputSourceValues(
	_context: CompanionUpgradeContext<ModuleConfig>,
	props: CompanionStaticUpgradeProps<ModuleConfig, ModuleSecrets>,
): CompanionStaticUpgradeResult<ModuleConfig, ModuleSecrets> {
	const legacyInputSources: Record<string, string> = {
		dante: 'AoIp',
		madi1: 'Madi1',
		madi2: 'Madi2',
	}

	const migrateInputSource = (value: unknown): string | undefined => {
		if (typeof value !== 'string') return undefined
		return legacyInputSources[value]
	}

	const updatedActions: CompanionMigrationAction[] = []
	const updatedFeedbacks: CompanionMigrationFeedback[] = []

	for (const action of props.actions) {
		if (action.actionId !== 'setAudioInputInterface') continue

		let changed = false
		const nextInterface = migrateInputSource(action.options.interface)
		if (nextInterface !== undefined) {
			action.options.interface = nextInterface
			changed = true
		}
		const nextToggle = migrateInputSource(action.options.toggleInterface)
		if (nextToggle !== undefined) {
			action.options.toggleInterface = nextToggle
			changed = true
		}
		if (changed) updatedActions.push(action)
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === 'audioInputInterface') {
			const nextInterface = migrateInputSource(feedback.options.interface)
			if (nextInterface !== undefined) {
				feedback.options.interface = nextInterface
				updatedFeedbacks.push(feedback)
			}
		} else if (feedback.feedbackId === 'confirmPending') {
			const nextInterface = migrateInputSource(feedback.options.setAudioInputInterface_interface)
			if (nextInterface !== undefined) {
				feedback.options.setAudioInputInterface_interface = nextInterface
				updatedFeedbacks.push(feedback)
			}
		}
	}

	return {
		updatedConfig: null,
		updatedActions,
		updatedFeedbacks,
	}
}

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig, ModuleSecrets>[] = [
	upgradeLedColors,
	upgradeAudioOutputCommandContext,
	upgradeAudioInputSourceValues,
]

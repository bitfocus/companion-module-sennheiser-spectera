import type {
	CompanionMigrationAction,
	CompanionMigrationFeedback,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig, ModuleSecrets } from './config.js'

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

/**
 * API 18.0 split each audio-output interface routing into two contexts: one for when the Command
 * button feature is disabled and one for when it is enabled. The "Command Mode" (`context`)
 * option was added to the `setAudioOutputInterface` action and the `audioOutputInterface` /
 * `confirmPending` feedbacks. Existing buttons saved before this option existed have no `context`
 * value, so default them to `'disabled'` to preserve the previous (Command-disabled) behavior.
 */
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

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig, ModuleSecrets>[] = [
	upgradeLedColors,
	upgradeAudioOutputCommandContext,
]

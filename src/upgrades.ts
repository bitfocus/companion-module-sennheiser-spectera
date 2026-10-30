import type {
	CompanionMigrationAction,
	CompanionMigrationFeedback,
	CompanionMigrationOptionValues,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
	ExpressionOrValue,
	JsonValue,
} from '@companion-module/base'
import { FixupNumericOrVariablesValueToExpressions } from '@companion-module/base'
import type { ModuleConfig, ModuleSecrets } from './config.js'
import { AntennaPortId, InputSource, RFChannels, RfState } from './types.js'

// API 2.x stores option values as `{ isExpression, value }`. Read the underlying value...
function readOpt(v: CompanionMigrationOptionValues[string]): JsonValue | undefined {
	return v ? v.value : undefined
}

// ...and wrap a plain value back into the stored shape when writing.
function plainOpt(value: JsonValue | undefined): ExpressionOrValue<JsonValue | undefined> {
	return { isExpression: false, value }
}

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
			const colors = legacyAntennaColors[resolveLegacyBrightness(readOpt(action.options.ledBrightness))]
			updatedActions.push({
				...action,
				actionId: 'dadConnectedStateColor',
				options: {
					dad: action.options.dad,
					rfActive: plainOpt(colors.rfActive),
					rfMuted: plainOpt(colors.rfMuted),
				},
			})
		} else if (action.actionId === 'mobileDeviceLedBrightness') {
			updatedActions.push({
				...action,
				actionId: 'mobileDeviceConnectedStateColor',
				options: {
					serial: action.options.serial,
					connectedStateColor: plainOpt(
						legacyConnectedStateColors[resolveLegacyBrightness(readOpt(action.options.ledBrightness))],
					),
				},
			})
		}
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === 'dadLedBrightness') {
			const colors = legacyAntennaColors[resolveLegacyBrightness(readOpt(feedback.options.ledBrightness))]
			updatedFeedbacks.push({
				...feedback,
				feedbackId: 'dadConnectedStateColor',
				options: {
					dad: feedback.options.dad,
					rfActive: plainOpt(colors.rfActive),
					rfMuted: plainOpt(colors.rfMuted),
				},
			})
		} else if (feedback.feedbackId === 'mobileDeviceLedBrightness') {
			updatedFeedbacks.push({
				...feedback,
				feedbackId: 'mobileDeviceConnectedStateColor',
				options: {
					serial: feedback.options.serial,
					connectedStateColor: plainOpt(
						legacyConnectedStateColors[resolveLegacyBrightness(readOpt(feedback.options.brightness))],
					),
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
			action.options.context = plainOpt('disabled')
			updatedActions.push(action)
		}
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === 'audioOutputInterface' && feedback.options.context === undefined) {
			feedback.options.context = plainOpt('disabled')
			updatedFeedbacks.push(feedback)
		} else if (
			feedback.feedbackId === 'confirmPending' &&
			feedback.options.setAudioOutputInterface_context === undefined
		) {
			feedback.options.setAudioOutputInterface_context = plainOpt('disabled')
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
		const nextInterface = migrateInputSource(readOpt(action.options.interface))
		if (nextInterface !== undefined) {
			action.options.interface = plainOpt(nextInterface)
			changed = true
		}
		const nextToggle = migrateInputSource(readOpt(action.options.toggleInterface))
		if (nextToggle !== undefined) {
			action.options.toggleInterface = plainOpt(nextToggle)
			changed = true
		}
		if (changed) updatedActions.push(action)
	}

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === 'audioInputInterface') {
			const nextInterface = migrateInputSource(readOpt(feedback.options.interface))
			if (nextInterface !== undefined) {
				feedback.options.interface = plainOpt(nextInterface)
				updatedFeedbacks.push(feedback)
			}
		} else if (feedback.feedbackId === 'confirmPending') {
			const nextInterface = migrateInputSource(readOpt(feedback.options.setAudioInputInterface_interface))
			if (nextInterface !== undefined) {
				feedback.options.setAudioInputInterface_interface = plainOpt(nextInterface)
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

// API 2.x strictly validates every defined option against its choices. Backfill the
// missing static-choice dropdowns with their defaults so existing controls validate again.
const CONFIRM_PENDING_DEFAULTS: Record<string, JsonValue> = {
	rfFrequency_rfChannel: 0,
	setAudioInputInterface_interface: InputSource.Dante,
	setAudioInputInterface_mode: 'On',
	dadRfBinding_dad: AntennaPortId.A,
	dadRfBinding_rfChannel: RFChannels['RF Channel 1'],
	setAudioOutputInterface_interface: 'commandModeAudioNetwork',
	setAudioOutputInterface_context: 'disabled',
	setAudioOutputInterface_mode: 'On',
	setRfChannelState_rfChannel: 0,
	setRfChannelState_state: RfState.Active,
}

function upgradeConfirmPendingDefaults(
	_context: CompanionUpgradeContext<ModuleConfig>,
	props: CompanionStaticUpgradeProps<ModuleConfig, ModuleSecrets>,
): CompanionStaticUpgradeResult<ModuleConfig, ModuleSecrets> {
	const updatedFeedbacks: CompanionMigrationFeedback[] = []

	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId !== 'confirmPending') continue
		let changed = false
		for (const [key, value] of Object.entries(CONFIRM_PENDING_DEFAULTS)) {
			if (feedback.options[key] === undefined) {
				feedback.options[key] = plainOpt(value)
				changed = true
			}
		}
		if (changed) updatedFeedbacks.push(feedback)
	}

	return {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks,
	}
}

// API 1.x callbacks ran parseVariablesInString on these custom-value dropdowns; API 2.x only resolves
// variables in expression mode, so convert any stored value containing a variable into an expression.
const SERIAL_OPTION_IDS = ['serial', 'serial1', 'serial2', 'sourceSerial', 'targetSerial']

function serialVariablesToExpression(
	value: ExpressionOrValue<JsonValue | undefined> | undefined,
): ExpressionOrValue<JsonValue | undefined> | undefined {
	if (!value || value.isExpression || typeof value.value !== 'string' || !value.value.includes('$(')) return undefined
	const trimmed = value.value.trim()
	if (trimmed.startsWith('$(') && trimmed.endsWith(')') && !trimmed.slice(2).includes('$(')) {
		return { isExpression: true, value: trimmed }
	}
	return {
		isExpression: true,
		value: `parseVariables("${value.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`,
	}
}

function upgradeSerialVariablesToExpressions(
	_context: CompanionUpgradeContext<ModuleConfig>,
	props: CompanionStaticUpgradeProps<ModuleConfig, ModuleSecrets>,
): CompanionStaticUpgradeResult<ModuleConfig, ModuleSecrets> {
	const upgradeOptions = (options: CompanionMigrationOptionValues): boolean => {
		let changed = false
		for (const id of SERIAL_OPTION_IDS) {
			const next = serialVariablesToExpression(options[id])
			if (next) {
				options[id] = next
				changed = true
			}
		}
		return changed
	}

	return {
		updatedConfig: null,
		updatedActions: props.actions.filter((action) => upgradeOptions(action.options)),
		updatedFeedbacks: props.feedbacks.filter((feedback) => upgradeOptions(feedback.options)),
	}
}

// Numeric options that used to be text inputs (so users could type variables), keyed by action/feedback id,
// with the number field's default for values that were left blank
const NUMERIC_ACTION_OPTIONS: Record<string, Record<string, number>> = {
	rfFrequency: { frequency: 474 },
	mobileDeviceHeadphoneVolume: { volume: -20, adjustment: 0.5 },
	mobileDeviceHeadphoneBalance: { balance: 0, adjustment: 1 },
	mobileDeviceMicPreampGain: { gain: 12, adjustment: 1 },
	mobileDeviceMicTestTone: { level: -20 },
}

const NUMERIC_FEEDBACK_OPTIONS: Record<string, Record<string, number>> = {
	rfFrequency: { frequency: 446 },
	dadInterferencePower: { interferencePower: -80 },
	dadTemperature: { temperature: 25 },
	mobileDeviceBatteryLevel: { threshold: 10 },
	mobileDeviceBatteryRuntime: { threshold: 30 },
	mobileDeviceMicTestToneLevel: { level: -20 },
	mobileDeviceHeadphoneVolume: { volume: -20 },
	mobileDeviceHeadphoneBalance: { balance: 0 },
	mobileDeviceMicPreampGain: { gain: 12 },
	mobileDeviceHeadphoneVolumeLimit: { limit: 0 },
	mobileDeviceHeadphoneVolumeMax: { max: 0 },
	mobileDeviceHeadphoneVolumeMin: { min: 0 },
	audioLevelThreshold: { channel: 1, threshold: -20 },
	mobileDeviceMicLqi: { micLqiThreshold: 4 },
	mobileDeviceIemLqi: { iemLqiThreshold: 4 },
	mobileDeviceRSSI: { rssiThreshold: -20 },
	confirmPending: { rfFrequency_frequency: 474 },
}

// Text inputs → number fields: plain numbers stay numbers, variables become expressions
function upgradeNumericTextInputs(
	_context: CompanionUpgradeContext<ModuleConfig>,
	props: CompanionStaticUpgradeProps<ModuleConfig, ModuleSecrets>,
): CompanionStaticUpgradeResult<ModuleConfig, ModuleSecrets> {
	const upgradeOptions = (options: CompanionMigrationOptionValues, defaults: Record<string, number> | undefined) => {
		if (!defaults) return false
		let changed = false
		for (const [id, fallback] of Object.entries(defaults)) {
			const current = options[id]
			if (!current || current.isExpression || typeof current.value === 'number') continue
			const blank =
				current.value === undefined ||
				current.value === null ||
				(typeof current.value === 'string' && current.value.trim() === '')
			options[id] = blank ? plainOpt(fallback) : FixupNumericOrVariablesValueToExpressions(current)
			changed = true
		}
		return changed
	}

	return {
		updatedConfig: null,
		updatedActions: props.actions.filter((action) =>
			upgradeOptions(action.options, NUMERIC_ACTION_OPTIONS[action.actionId]),
		),
		updatedFeedbacks: props.feedbacks.filter((feedback) =>
			upgradeOptions(feedback.options, NUMERIC_FEEDBACK_OPTIONS[feedback.feedbackId]),
		),
	}
}

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig, ModuleSecrets>[] = [
	upgradeLedColors,
	upgradeAudioOutputCommandContext,
	upgradeAudioInputSourceValues,
	upgradeConfirmPendingDefaults,
	upgradeSerialVariablesToExpressions,
	upgradeNumericTextInputs,
]

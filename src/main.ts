import {
	InstanceBase,
	type InstanceTypes,
	type CompanionCompositeElementSchema,
	InstanceStatus,
	type SomeCompanionConfigField,
} from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { SpecteraApi } from './api.js'
import { SpecteraState } from './state.js'
import { UpdatePresets } from './presets.js'
import { UpdateCompositeElements } from './graphics.js'

export interface SpecteraInstanceTypes extends InstanceTypes {
	config: ModuleConfig
	secrets: ModuleSecrets
	compositeElements: {
		audioMeter: CompanionCompositeElementSchema<{
			channelMode: string
			ch1Level: string
			ch1Peak: string
			ch2Level: string
			ch2Peak: string
		}>
		rssiMeter: CompanionCompositeElementSchema<{ rssi: string }>
		signalBars: CompanionCompositeElementSchema<{ bars: string }>
	}
}

export default class SpecteraInstance extends InstanceBase<SpecteraInstanceTypes> {
	config!: ModuleConfig
	secrets!: ModuleSecrets
	api?: SpecteraApi
	public readonly state = new SpecteraState()
	public readonly pendingConfirmations = new Map<string, NodeJS.Timeout>()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets

		this.updateStatus(InstanceStatus.Connecting)

		this.initApi().catch((e) => {
			this.log('error', `Error initializing API: ${e}`)
		})

		this.updateCompositeElements()
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		for (const timeout of this.pendingConfirmations.values()) {
			clearTimeout(timeout)
		}
		this.pendingConfirmations.clear()
		await this.api?.disconnect()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets

		await this.api?.disconnect()
		await this.initApi()
	}

	private async initApi(): Promise<void> {
		if (this.config.host && this.secrets.password) {
			this.api = new SpecteraApi(this, this.state, this.config.host, this.secrets.password)

			try {
				await this.api.performLogin()
				await this.api.startMonitoring()
				this.updateStatus(InstanceStatus.Ok)
				this.log('info', `Successfully connected to Spectera`)
			} catch (err) {
				this.updateStatus(InstanceStatus.AuthenticationFailure)
				this.log('error', `Login failed: ${err instanceof Error ? err.message : String(err)} `)
				this.api.scheduleReconnect()
			}
		} else {
			this.updateStatus(InstanceStatus.BadConfig)
			this.log('debug', 'Missing host or password')
		}
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateCompositeElements(): void {
		UpdateCompositeElements(this)
	}

	//Module Confirmation Functions
	public confirmationKey(actionId: string, options: Record<string, unknown>): string {
		const parts = Object.entries(options)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${k}=${v}`)
		return `${actionId}:${parts.join(',')}`
	}

	//Generic confirm-or-execute helper. Returns true if action should execute (second press)
	public confirmAction(key: string, timeoutMs = 5000): boolean {
		const existing = this.pendingConfirmations.get(key)
		if (existing !== undefined) {
			clearTimeout(existing)
			this.pendingConfirmations.delete(key)
			this.checkFeedbacks('confirmPending')
			return true
		}
		const timeout = setTimeout(() => {
			this.pendingConfirmations.delete(key)
			this.checkFeedbacks('confirmPending')
		}, timeoutMs)
		this.pendingConfirmations.set(key, timeout)
		this.checkFeedbacks('confirmPending')
		return false
	}
}

export { UpgradeScripts, SpecteraInstance }

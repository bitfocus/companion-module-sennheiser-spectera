import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { SpecteraApi } from './api.js'
import { SpecteraState } from './state.js'
import { UpdatePresets } from './presets.js'

export class SpecteraInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	config!: ModuleConfig
	secrets!: ModuleSecrets
	api?: SpecteraApi
	public readonly state = new SpecteraState()

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

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		await this.api?.disconnect()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets

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
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.log('error', `Login failed: ${err instanceof Error ? err.message : String(err)} `)
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
}

runEntrypoint(SpecteraInstance, UpgradeScripts)

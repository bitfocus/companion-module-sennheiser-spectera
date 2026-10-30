import type { SpecteraInstance } from './main.js'
import type { SomeButtonGraphicsElement, CompanionGraphicsElementValue } from '@companion-module/base'
import { Color } from './utils.js'

// Element x/y/width/height are percentages of the placement box, so meters fill it edge-to-edge; in stereo the two bars split that width with a gap.
const STEREO_BAR_WIDTH = 45
const STEREO_GAP = 100 - STEREO_BAR_WIDTH * 2
const STEREO_CH1_X = 0
const STEREO_CH2_X = STEREO_BAR_WIDTH + STEREO_GAP

// Non-linear dB -> percent mapping for the audio meter gauges
const SCALE_POINTS: [db: number, percent: number][] = [
	[-90, 0],
	[-66, 12.5],
	[-42, 25],
	[-30, 37.5],
	[-18, 50],
	[-12, 62.5],
	[-6, 75],
	[-3, 87.5],
	[0, 100],
]

// Main (filled) bar color thresholds.
const YELLOW_AT_DB = -20
const RED_AT_DB = -3
// Marker overlay color thresholds.
const PEAK_YELLOW_AT_DB = -12
const PEAK_RED_AT_DB = -3

// Piecewise-linear dB -> percent (0-100) over SCALE_POINTS, clamped at the ends. Build-time only.
export function dbToPercent(db: number): number {
	const [minDb] = SCALE_POINTS[0]
	const [maxDb] = SCALE_POINTS[SCALE_POINTS.length - 1]
	if (db <= minDb) return SCALE_POINTS[0][1]
	if (db >= maxDb) return SCALE_POINTS[SCALE_POINTS.length - 1][1]
	for (let i = 0; i < SCALE_POINTS.length - 1; i++) {
		const [db0, pct0] = SCALE_POINTS[i]
		const [db1, pct1] = SCALE_POINTS[i + 1]
		if (db <= db1) {
			return pct0 + ((db - db0) * (pct1 - pct0)) / (db1 - db0)
		}
	}
	return 100
}

// Runtime version of dbToPercent against an option/variable reference. Companion re-parses this on every
// render, so it reads the level once and walks SCALE_POINTS in a loop rather than unrolling a ternary per
// segment. A non-numeric level fails `db > minDb` and draws an empty meter.
export function dbToPercentExpression(dbExpr: string): string {
	const [minDb, minPct] = SCALE_POINTS[0]
	const [maxDb, maxPct] = SCALE_POINTS[SCALE_POINTS.length - 1]
	return [
		`const db = ${dbExpr}`,
		`if (!(db > ${minDb})) return ${minPct}`,
		`if (db >= ${maxDb}) return ${maxPct}`,
		`const p = ${JSON.stringify(SCALE_POINTS)}`,
		`let i = 1`,
		`while (db > p[i][0]) i++`,
		`const a = p[i - 1]`,
		`const b = p[i]`,
		`a[1] + ((db - a[0]) * (b[1] - a[1])) / (b[0] - a[0])`,
	].join('\n')
}

// Expression resolving to the color of the highest ascending stop whose threshold <= value, else baseColor.
function thresholdColorExpression(
	expr: string,
	baseColor: number,
	stops: [threshold: number, color: number][],
): string {
	let out = `${baseColor}`
	stops.forEach(([threshold, color], i) => {
		out = `(${expr}) >= (${threshold}) ? ${color} : ${i === 0 ? out : `(${out})`}`
	})
	return out
}

// RSSI is inverted vs dB meters (higher is better), so blue is the top tier here.
const RSSI_YELLOW_AT = -80
const RSSI_BLUE_AT = -70

interface AudioMeterChannel {
	levelOptionId: string
	ch1PeakOptionId: string
	x: CompanionGraphicsElementValue<number>
	width: CompanionGraphicsElementValue<number>
	// When set, this channel's gauges only draw while the expression is true (e.g. stereo mode).
	enabledExpression?: string
}

// One channel of the audio meter: a multi-colour filled gauge (RMS) plus a marker overlay (peak).
function buildAudioMeterChannelElements(channel: AudioMeterChannel): SomeButtonGraphicsElement[] {
	const base = {
		type: 'gauge' as const,
		x: channel.x,
		y: 0,
		width: channel.width,
		height: 100,
		opacity: 100,
		orientation: 'vertical' as const,
		reverse: false,
		enabled: channel.enabledExpression ? { isExpression: true as const, value: channel.enabledExpression } : undefined,
		min: 0,
		max: 100,
		origin: 0,
	}

	return [
		{
			...base,
			value: { isExpression: true, value: dbToPercentExpression(`$(options:${channel.levelOptionId})`) },
			fillEnabled: true,
			multiColour: true,
			stops: [
				{ value: 0, color: Color.SpecteraGreen, gradient: false },
				{ value: dbToPercent(YELLOW_AT_DB), color: Color.SpecteraYellow, gradient: false },
				{ value: dbToPercent(RED_AT_DB), color: Color.SpecteraRed, gradient: false },
			],
			trackAmount: 25,
			trackStyle: 'dimmed',
		},
		{
			...base,
			value: { isExpression: true, value: dbToPercentExpression(`$(options:${channel.ch1PeakOptionId})`) },
			fillEnabled: false,
			multiColour: false,
			markerEnabled: true,
			markerWidth: 10,
			markerColor: {
				isExpression: true,
				value: thresholdColorExpression(`$(options:${channel.ch1PeakOptionId})`, Color.SpecteraGreen, [
					[PEAK_YELLOW_AT_DB, Color.SpecteraYellow],
					[PEAK_RED_AT_DB, Color.SpecteraRed],
				]),
			},
			trackAmount: 0,
			trackStyle: 'transparent',
		},
	]
}

function buildSignalBarElements(): SomeButtonGraphicsElement[] {
	const layout = [
		{ x: 6, y: 72, height: 28 },
		{ x: 30, y: 52, height: 48 },
		{ x: 54, y: 30, height: 70 },
		{ x: 78, y: 10, height: 90 },
	]
	const width = 16
	const elements: SomeButtonGraphicsElement[] = []
	layout.forEach((bar, index) => {
		// Dim background track, always visible so the full set of bars is always shown.
		elements.push({
			type: 'box',
			x: bar.x,
			y: bar.y,
			width,
			height: bar.height,
			color: Color.LightGray,
			opacity: 50,
		})
		// Active bar, enabled only when the value reaches this bar.
		elements.push({
			type: 'box',
			x: bar.x,
			y: bar.y,
			width,
			height: bar.height,
			color: Color.SpecteraPurple,
			enabled: { isExpression: true, value: `$(options:bars) >= ${index + 1}` },
			opacity: 100,
		})
	})
	return elements
}

// Single flat-fill gauge whose color steps by RSSI threshold (red -> yellow -> blue).
function buildRssiMeterElements(): SomeButtonGraphicsElement[] {
	const rssiColor = {
		isExpression: true as const,
		value: thresholdColorExpression('$(options:rssi)', Color.SpecteraRed, [
			[RSSI_YELLOW_AT, Color.SpecteraYellow],
			[RSSI_BLUE_AT, Color.SpecteraBlue],
		]),
	}
	return [
		{
			type: 'gauge',
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			opacity: 100,
			orientation: 'vertical',
			stops: [
				{ value: -90, color: rssiColor, gradient: false },
				{ value: -30, color: rssiColor, gradient: false },
			],
			value: { isExpression: true, value: '$(options:rssi)' },
			min: -90,
			max: -30,
			origin: -90,
			fillEnabled: true,
			multiColour: false,
			markerEnabled: false,
			trackAmount: 25,
			trackStyle: 'dimmed',
		},
	]
}

export function UpdateCompositeElements(self: SpecteraInstance): void {
	self.setCompositeElementDefinitions({
		signalBars: {
			type: 'composite',
			name: 'LQI Signal Bars',
			description:
				'Cell-phone-style signal bars. Set "Bars" to a value of 1-4 (or a variable) to light that many bars.',
			options: [
				{
					type: 'textinput',
					id: 'bars',
					label: 'Bars (1-4)',
					default: '4',
					useVariables: true,
				},
			],
			elements: buildSignalBarElements(),
		},
		audioMeter: {
			type: 'composite',
			name: 'Audio Meter',
			description: 'An audio level meter in dBFS with both peak and RMS levels.',
			options: [
				{
					type: 'dropdown',
					id: 'channelMode',
					label: 'Channels',
					choices: [
						{ id: 'mono', label: 'Mono' },
						{ id: 'stereo', label: 'Stereo' },
					],
					default: 'mono',
					disableAutoExpression: true,
				},
				{
					type: 'textinput',
					id: 'ch1Level',
					label: 'Ch 1 - Level (dBFS)',
					default: '',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'ch1Peak',
					label: 'Ch 1 - Peak Level (dBFS)',
					default: '',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'ch2Level',
					label: 'Ch 2 - Level (dBFS)',
					default: '',
					useVariables: true,
					isVisibleExpression: '$(options:channelMode) === "stereo"',
				},
				{
					type: 'textinput',
					id: 'ch2Peak',
					label: 'Ch 2 - Peak Level (dBFS)',
					default: '',
					useVariables: true,
					isVisibleExpression: '$(options:channelMode) === "stereo"',
				},
			],
			elements: [
				...buildAudioMeterChannelElements({
					levelOptionId: 'ch1Level',
					ch1PeakOptionId: 'ch1Peak',
					x: STEREO_CH1_X,
					width: {
						isExpression: true,
						value: `$(options:channelMode) === "stereo" ? ${STEREO_BAR_WIDTH} : 100`,
					},
				}),
				...buildAudioMeterChannelElements({
					levelOptionId: 'ch2Level',
					ch1PeakOptionId: 'ch2Peak',
					x: STEREO_CH2_X,
					width: STEREO_BAR_WIDTH,
					enabledExpression: '$(options:channelMode) === "stereo"',
				}),
			],
		},
		rssiMeter: {
			type: 'composite',
			name: 'RSSI Meter',
			description: 'A gauge meter for RSSI level in dBm. Set "RSSI" to an rssi_* variable.',
			options: [
				{
					type: 'textinput',
					id: 'rssi',
					label: 'RSSI Level (dBm)',
					default: '',
					useVariables: true,
				},
			],
			elements: buildRssiMeterElements(),
		},
	})
}

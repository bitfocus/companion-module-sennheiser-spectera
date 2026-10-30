import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['tests/**/*.spec.ts'],
		typecheck: {
			tsconfig: './tsconfig.test.json',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/types.ts'],
		},
	},
})

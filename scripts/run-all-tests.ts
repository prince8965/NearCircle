import { spawnSync } from 'node:child_process'

console.log('=================================================================')
console.log('           NearCircle: Executing All Automated Test Suites        ')
console.log('=================================================================\n')

console.log('>> [1/2] Running Phase 6 Test Suite...')
const res6 = spawnSync('npx', ['vite-node', 'scripts/test-phase6.ts'], {
  stdio: 'inherit',
  shell: true,
})

if (res6.status !== 0) {
  console.error('\n✗ Phase 6 tests failed!')
  process.exit(res6.status ?? 1)
}

console.log('\n>> [2/2] Running Phase 7 Test Suite...')
const res7 = spawnSync('npx', ['vite-node', 'scripts/test-phase7.ts'], {
  stdio: 'inherit',
  shell: true,
})

if (res7.status !== 0) {
  console.error('\n✗ Phase 7 tests failed!')
  process.exit(res7.status ?? 1)
}

console.log('\n=================================================================')
console.log('       All Test Suites Passed Successfully (Phase 6 & Phase 7)    ')
console.log('=================================================================\n')

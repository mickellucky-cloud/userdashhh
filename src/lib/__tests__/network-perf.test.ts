import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSlowConnection,
  shouldPrefetchRoute,
  getOptimalQueryConfig,
} from '../network-perf';

test('isSlowConnection detects saveData and 2g/3g connections', () => {
  assert.equal(isSlowConnection(undefined), false);
  assert.equal(isSlowConnection({ effectiveType: '4g', downlink: 10, rtt: 50 }), false);
  assert.equal(isSlowConnection({ saveData: true, effectiveType: '4g' }), true);
  assert.equal(isSlowConnection({ effectiveType: 'slow-2g' }), true);
  assert.equal(isSlowConnection({ effectiveType: '2g' }), true);
  assert.equal(isSlowConnection({ effectiveType: '3g' }), true);
  assert.equal(isSlowConnection({ effectiveType: '4g', downlink: 0.8 }), true);
  assert.equal(isSlowConnection({ effectiveType: '4g', rtt: 550 }), true);
});

test('shouldPrefetchRoute disables speculative prefetch on saveData and 2g', () => {
  assert.equal(shouldPrefetchRoute(undefined), true);
  assert.equal(shouldPrefetchRoute({ effectiveType: '4g' }), true);
  assert.equal(shouldPrefetchRoute({ effectiveType: '3g' }), true);
  assert.equal(shouldPrefetchRoute({ saveData: true, effectiveType: '4g' }), false);
  assert.equal(shouldPrefetchRoute({ effectiveType: '2g' }), false);
  assert.equal(shouldPrefetchRoute({ effectiveType: 'slow-2g' }), false);
});

test('getOptimalQueryConfig extends cache lifetimes on slow connections', () => {
  const fastConfig = getOptimalQueryConfig({ effectiveType: '4g', downlink: 25, rtt: 40 });
  const slowConfig = getOptimalQueryConfig({ effectiveType: '3g', saveData: true });

  assert.equal(fastConfig.staleTime, 60_000);
  assert.equal(fastConfig.gcTime, 600_000);
  assert.equal(fastConfig.refetchOnWindowFocus, false);

  assert.equal(slowConfig.staleTime, 180_000);
  assert.equal(slowConfig.gcTime, 900_000);
  assert.equal(slowConfig.refetchOnWindowFocus, false);
  assert.equal(slowConfig.retryDelay(0), 1000);
  assert.equal(slowConfig.retryDelay(1), 2000);
});

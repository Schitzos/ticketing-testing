/**
 * RBT-005 — CI toolchain smoke test.
 * Purpose: give `npm test` / Jest something to execute so the CI gate and the SonarCloud
 * lcov upload are exercised from the first PR. Feature tests (RNTL component tests, domain
 * unit tests) land with their owning stories (RBT-003/004/010+). This file intentionally
 * asserts nothing about product code — it lives at the repo root, NOT inside any package,
 * to respect RBT-005 file ownership.
 */
describe('CI toolchain smoke', () => {
  it('runs Jest', () => {
    expect(1 + 1).toBe(2);
  });

  it('supports async tests', async () => {
    await expect(Promise.resolve('ok')).resolves.toBe('ok');
  });
});

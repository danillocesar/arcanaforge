import { describe, it, expect } from 'vitest';
import { DEFAULT_PAGE_SIZE, initialCount, grownCount } from './infiniteList';

describe('initialCount', () => {
  it('shows one page when the list is longer than a page', () => {
    expect(initialCount(202, 40)).toBe(40);
  });

  it('shows everything when the list is shorter than a page', () => {
    expect(initialCount(7, 40)).toBe(7);
  });

  it('handles an empty list', () => {
    expect(initialCount(0, 40)).toBe(0);
  });

  it('defaults to the shared page size', () => {
    expect(initialCount(1000)).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('grownCount', () => {
  it('adds a page when there is more to show', () => {
    expect(grownCount(40, 202, 40)).toBe(80);
  });

  it('never grows past the total', () => {
    // The last page is partial: 200 shown of 202 must land on 202, not 240.
    expect(grownCount(200, 202, 40)).toBe(202);
  });

  it('is a no-op once everything is visible, so the observer can fire freely', () => {
    expect(grownCount(202, 202, 40)).toBe(202);
  });

  it('never returns less than it was given', () => {
    // Guards against a stale count from a longer previous filter shrinking the view.
    expect(grownCount(80, 10, 40)).toBe(80);
  });
});

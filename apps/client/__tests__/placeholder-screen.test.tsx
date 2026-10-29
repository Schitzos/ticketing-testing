/**
 * RBT-002 — RNTL tests for the shared PlaceholderScreen (routing-layer presentation).
 * Covers both robots states (index / noindex) and the params echo branch.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlaceholderScreen } from '../components/screens/PlaceholderScreen';

jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

describe('PlaceholderScreen', () => {
  it('renders title and route', () => {
    render(<PlaceholderScreen title="Home" route="/" />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('/')).toBeTruthy();
    expect(
      screen.getByText('Placeholder — real UI lands in a later feature story.'),
    ).toBeTruthy();
  });

  it('echoes resolved params when present', () => {
    render(
      <PlaceholderScreen
        title="Event detail"
        route="/events/[eventId]"
        params={{ eventId: 'evt-123' }}
      />,
    );
    expect(screen.getByText('eventId: evt-123')).toBeTruthy();
  });

  it('drops null/undefined params (no param line)', () => {
    render(
      <PlaceholderScreen
        title="Waiting room"
        route="/waiting/[eventId]"
        params={{ eventId: undefined }}
        noindex
      />,
    );
    expect(screen.getByText('Waiting room')).toBeTruthy();
    expect(screen.queryByText(/eventId:/)).toBeNull();
  });

  it('renders for both noindex=true and the default index path', () => {
    const r = render(<PlaceholderScreen title="Checkout" route="/checkout/[sessionId]" noindex />);
    expect(screen.getByText('Checkout')).toBeTruthy();
    r.rerender(<PlaceholderScreen title="Browse" route="/browse" />);
    expect(screen.getByText('Browse')).toBeTruthy();
  });
});

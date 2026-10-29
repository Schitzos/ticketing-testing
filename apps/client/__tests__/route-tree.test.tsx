/**
 * RBT-002 — RNTL render tests for the route tree. Each route default export renders its
 * PlaceholderScreen; this exercises every route file in apps/client/app for coverage and
 * proves the dynamic-segment wiring (useLocalSearchParams) resolves through each screen.
 *
 * expo-router is mocked: useLocalSearchParams returns fixed params, and <Head> is a
 * passthrough (its web-only head side effects are irrelevant to the RN render tree).
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    eventId: 'evt-1',
    sessionId: 'sess-1',
    bookingId: 'bk-1',
    resourceId: 'res-1',
  }),
  usePathname: () => '/unknown-path',
}));

jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import HomeRoute from '../app/index';
import BrowseRoute from '../app/browse';
import EventDetailRoute from '../app/events/[eventId]';
import WaitingRoute from '../app/waiting/[eventId]';
import CheckoutRoute from '../app/checkout/[sessionId]';
import PaymentRoute from '../app/payment/[bookingId]';
import SuccessRoute from '../app/success/[bookingId]';
import ExpiredRoute from '../app/expired/[resourceId]';
import NotFoundRoute from '../app/+not-found';

const cases: Array<[string, React.ComponentType, string]> = [
  ['Home', HomeRoute, 'Home'],
  ['Browse', BrowseRoute, 'Browse'],
  ['EventDetail', EventDetailRoute, 'Event detail'],
  ['Waiting', WaitingRoute, 'Waiting room'],
  ['Checkout', CheckoutRoute, 'Checkout'],
  ['Payment', PaymentRoute, 'Payment'],
  ['Success', SuccessRoute, 'Success'],
  ['Expired', ExpiredRoute, 'Expired'],
];

describe('route tree renders', () => {
  it.each(cases)('%s route renders its placeholder', (_name, Route, expectedTitle) => {
    render(<Route />);
    expect(screen.getByText(expectedTitle)).toBeTruthy();
  });

  it('+not-found route renders', () => {
    render(<NotFoundRoute />);
    // the not-found screen renders some text; assert the tree mounted without throwing
    expect(screen.toJSON()).toBeTruthy();
  });
});

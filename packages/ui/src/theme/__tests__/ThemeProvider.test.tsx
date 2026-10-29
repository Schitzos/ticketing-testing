import React from "react";
import { AccessibilityInfo, Text } from "react-native";
import { render, renderHook, act, screen } from "@testing-library/react-native";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme, useMotionDuration } from "../useTheme";

// Deterministic control over the OS signals the provider reads.
let reduceMotionListener: ((v: boolean) => void) | undefined;

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(() => "light"),
}));

beforeEach(() => {
  reduceMotionListener = undefined;
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(
    ((event: string, cb: (v: boolean) => void) => {
      if (event === "reduceMotionChanged") reduceMotionListener = cb;
      return { remove: jest.fn() };
    }) as unknown as typeof AccessibilityInfo.addEventListener,
  );
});

afterEach(() => jest.restoreAllMocks());

function wrapper(props: { children: React.ReactNode }) {
  return <ThemeProvider initialReducedMotion={false}>{props.children}</ThemeProvider>;
}

describe("ThemeProvider / useTheme", () => {
  it("provides the light theme by default with brand red", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    // let the async isReduceMotionEnabled resolve
    await act(async () => {});
    expect(result.current.mode).toBe("light");
    expect(result.current.theme.color.brand.primary).toBe("#EC1C24");
    expect(result.current.reducedMotion).toBe(false);
  });

  it("forces a mode when the mode prop is set (dark surface + text pair)", async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider mode="dark">{children}</ThemeProvider>
      ),
    });
    await act(async () => {});
    expect(result.current.mode).toBe("dark");
    expect(result.current.theme.color.surface.base).toBe("#0A0A0C");
    expect(result.current.theme.color.text.primary).toBe("#FBFBFD");
  });

  it("toggleMode flips light <-> dark", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.mode).toBe("light");
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("dark");
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe("light");
  });

  it("reads the OS reduced-motion setting on mount", async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.reducedMotion).toBe(true);
  });

  it("updates reduced-motion live when the OS setting changes", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.reducedMotion).toBe(false);
    await act(async () => {
      reduceMotionListener?.(true);
    });
    expect(result.current.reducedMotion).toBe(true);
  });

  it("useMotionDuration collapses to 0 when reduced motion is on", async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useMotionDuration(250), { wrapper });
    await act(async () => {});
    expect(result.current).toBe(0);
  });

  it("renders children inside the provider", () => {
    render(
      <ThemeProvider>
        <Text>hello</Text>
      </ThemeProvider>,
    );
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("useTheme throws when used outside a provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useTheme())).toThrow(
      /must be used within a <ThemeProvider>/,
    );
    spy.mockRestore();
  });
});

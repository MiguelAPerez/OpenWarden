import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Helper component to test useTheme hook
const ThemeTestComponent = () => {
    const { theme, toggleTheme, mounted } = useTheme();
    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="mounted">{mounted.toString()}</span>
            <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        jest.clearAllMocks();
        
        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(), 
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('provides default light theme if no preference', () => {
        render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        act(() => {
            jest.advanceTimersByTime(0);
        });

        expect(screen.getByTestId('theme').textContent).toBe('light');
    });

    test('provides dark theme if preferred by system', () => {
        (window.matchMedia as jest.Mock).mockImplementation(query => ({
            matches: query === '(prefers-color-scheme: dark)',
        }));

        render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        act(() => {
            jest.advanceTimersByTime(0);
        });

        expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    test('initializes from localStorage', () => {
        localStorage.setItem('theme', 'dark');
        
        render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        act(() => {
            jest.advanceTimersByTime(0);
        });

        expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    test('toggles theme and updates localStorage/DOM', () => {
        const { getByTestId } = render(
            <ThemeProvider>
                <ThemeTestComponent />
            </ThemeProvider>
        );

        act(() => {
            jest.advanceTimersByTime(0);
        });

        const toggleBtn = getByTestId('toggle');
        
        // Initial state should be light (mocked matches: false)
        expect(getByTestId('theme').textContent).toBe('light');

        // Toggle to dark
        act(() => {
            toggleBtn.click();
        });

        expect(getByTestId('theme').textContent).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        // Toggle back to light
        act(() => {
            toggleBtn.click();
        });

        expect(getByTestId('theme').textContent).toBe('light');
        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    test('throws error if useTheme is used outside Provider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => render(<ThemeTestComponent />)).toThrow('useTheme must be used within a ThemeProvider');
        
        consoleSpy.mockRestore();
    });
});

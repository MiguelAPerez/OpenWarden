import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { NavLinks } from '../NavLinks';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

describe('NavLinks Keyboard Shortcut', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('navigates to /code-search when cmd+k is pressed', () => {
    render(<NavLinks />);

    fireEvent.keyDown(window, {
      key: 'k',
      metaKey: true,
    });

    expect(mockPush).toHaveBeenCalledWith('/code-search');
  });

  it('navigates to /code-search when ctrl+k is pressed', () => {
    render(<NavLinks />);

    fireEvent.keyDown(window, {
      key: 'k',
      ctrlKey: true,
    });

    expect(mockPush).toHaveBeenCalledWith('/code-search');
  });

  it('does not navigate when only k is pressed', () => {
    render(<NavLinks />);

    fireEvent.keyDown(window, {
      key: 'k',
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

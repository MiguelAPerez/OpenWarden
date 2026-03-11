import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RepositoryList from '../RepositoryList';

// Mock Server Actions
jest.mock('@/app/actions/repositories', () => ({
  toggleRepositoryEnabled: jest.fn(),
  getCachedRepositories: jest.fn(),
}));

const mockRepos = [
  {
    id: '1',
    source: 'gitea',
    fullName: 'user/repo1',
    description: 'Description 1',
    url: 'https://gitea.com/user/repo1',
    stars: 10,
    forks: 5,
    language: 'TypeScript',
    topics: JSON.stringify(['topic1']),
    docsMetadata: {},
    agentMetadata: {},
    enabled: true,
  },
  {
    id: '2',
    source: 'github',
    fullName: 'user/repo2',
    description: 'Description 2',
    url: 'https://github.com/user/repo2',
    stars: 20,
    forks: 10,
    language: 'JavaScript',
    topics: JSON.stringify(['topic2']),
    docsMetadata: {},
    agentMetadata: {},
    enabled: false,
  },
];

describe('RepositoryList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes "Enabled Only" toggle to ON if any repo is enabled', () => {
    render(<RepositoryList initialRepos={mockRepos} />);
    

    // When ON, it has specific classes. We can check if only the enabled one is shown.
    expect(screen.getByText('repo1')).toBeInTheDocument();
    expect(screen.queryByText('repo2')).not.toBeInTheDocument();
  });

  it('initializes "Enabled Only" toggle to OFF if no repos are enabled', () => {
    const disabledRepos = mockRepos.map(r => ({ ...r, enabled: false }));
    render(<RepositoryList initialRepos={disabledRepos} />);
    
    // Both should be shown (or rather, the filter is off, so it shows all matching other filters)
    expect(screen.getByText('repo1')).toBeInTheDocument();
    expect(screen.getByText('repo2')).toBeInTheDocument();
    
    const toggleBtn = screen.getByText(/Enabled Only/i);
    expect(toggleBtn).toBeDisabled();
  });

  it('toggles "Enabled Only" filter', () => {
    render(<RepositoryList initialRepos={mockRepos} />);
    
    const toggleBtn = screen.getByText(/Enabled Only/i);
    
    // Turn off
    fireEvent.click(toggleBtn);
    expect(screen.getByText('repo1')).toBeInTheDocument();
    expect(screen.getByText('repo2')).toBeInTheDocument();
    
    // Turn on
    fireEvent.click(toggleBtn);
    expect(screen.getByText('repo1')).toBeInTheDocument();
    expect(screen.queryByText('repo2')).not.toBeInTheDocument();
  });

  it('automatically turns OFF "Enabled Only" filter when the last enabled repo is disabled', async () => {
    render(<RepositoryList initialRepos={[mockRepos[0]]} />);
    
    expect(screen.getByText('repo1')).toBeInTheDocument();
    
    // Find the toggle in the card
    const repoToggle = screen.getByRole('button', { name: /Enabled — click to disable/i });
    fireEvent.click(repoToggle);
    
    // Now it should show all (even if disabled) because the global filter turned off
    await waitFor(() => {
        expect(screen.getByText('repo1')).toBeInTheDocument();
        const globalToggle = screen.getByText(/Enabled Only/i);
        expect(globalToggle).toBeDisabled();
    });
  });

  it('automatically turns ON "Enabled Only" filter when a repo is enabled and filter was off', async () => {
    const disabledRepos = [ { ...mockRepos[0], enabled: false } ];
    render(<RepositoryList initialRepos={disabledRepos} />);
    
    const globalToggle = screen.getByText(/Enabled Only/i);
    expect(globalToggle).toBeDisabled();
    
    const repoToggle = screen.getByRole('button', { name: /Disabled — click to enable/i });
    fireEvent.click(repoToggle);
    
    await waitFor(() => {
        expect(screen.getByText(/Enabled Only/i)).not.toBeDisabled();
        // Since it auto-turned ON, it should still be showing (because it's now enabled)
        expect(screen.getByText('repo1')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GitHubConfiguration from '../GitHubConfiguration';
import * as githubActions from '@/app/actions/github';

// Mock Server Actions
jest.mock('@/app/actions/github', () => ({
  getGitHubConfigs: jest.fn(),
  saveGitHubConfig: jest.fn(),
  deleteGitHubConfig: jest.fn(),
  testGitHubConnection: jest.fn(),
}));

describe('GitHubConfiguration Component', () => {
  const mockConfigs = [
    {
      id: '1',
      name: 'App 1',
      appId: '123',
      clientId: 'cid1',
      hasSecret: true,
      hasPrivateKey: true,
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (githubActions.getGitHubConfigs as jest.Mock).mockResolvedValue(mockConfigs);
  });

  it('renders existing configurations', async () => {
    render(<GitHubConfiguration />);
    
    expect(await screen.findByText(/GitHub App Configurations/i)).toBeInTheDocument();
    expect(await screen.findByText('App 1')).toBeInTheDocument();
    expect(screen.getByText(/App ID: 123/i)).toBeInTheDocument();
  });

  it('shows add form when clicking "+ Add New App"', async () => {
    render(<GitHubConfiguration />);
    await waitFor(() => screen.getByText('App 1'));
    
    const addBtn = screen.getByText(/\+ Add New App/i);
    fireEvent.click(addBtn);
    
    expect(screen.getByLabelText(/Config Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/App ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Private Key/i)).toBeInTheDocument();
  });

  it('tests connection and shows success result', async () => {
    (githubActions.testGitHubConnection as jest.Mock).mockResolvedValue({
      success: true,
      app: { name: 'Test App', slug: 'test-app' },
      installations: [{ id: 1, account: 'user', type: 'user' }],
    });

    render(<GitHubConfiguration />);
    await waitFor(() => screen.getByText('App 1'));
    
    fireEvent.click(screen.getByText(/\+ Add New App/i));
    
    fireEvent.change(screen.getByLabelText(/App ID/i), { target: { value: '456' } });
    fireEvent.change(screen.getByLabelText(/Private Key/i), { target: { value: 'pk' } });
    
    const testBtn = screen.getByText(/Test Connection/i);
    fireEvent.click(testBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Connection Successful!/i)).toBeInTheDocument();
      expect(screen.getByText(/App: Test App/i)).toBeInTheDocument();
    });
  });

  it('saves a new configuration', async () => {
    (githubActions.saveGitHubConfig as jest.Mock).mockResolvedValue({ id: '2' });
    
    render(<GitHubConfiguration />);
    await waitFor(() => screen.getByText('App 1'));
    
    fireEvent.click(screen.getByText(/\+ Add New App/i));
    
    fireEvent.change(screen.getByLabelText(/Config Name/i), { target: { value: 'App 2' } });
    fireEvent.change(screen.getByLabelText(/App ID/i), { target: { value: '456' } });
    fireEvent.change(screen.getByLabelText(/Client ID/i), { target: { value: 'cid2' } });
    fireEvent.change(screen.getByLabelText(/Client Secret/i), { target: { value: 'cs2' } });
    fireEvent.change(screen.getByLabelText(/Private Key/i), { target: { value: 'pk2' } });
    
    const saveBtn = screen.getByText(/Save Config/i);
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(githubActions.saveGitHubConfig).toHaveBeenCalled();
      expect(githubActions.getGitHubConfigs).toHaveBeenCalledTimes(2); // Initial + After save
    });
  });

  it('deletes a configuration after confirmation', async () => {
    window.confirm = jest.fn(() => true);
    
    render(<GitHubConfiguration />);
    await waitFor(() => screen.getByText('App 1'));
    
    // In actual UI, icons are shown on hover. 
    // The test might need to find the button by text/role or simulate hover if necessary.
    // Our implementation has buttons with role:
    // <button onClick={() => handleDelete(config.id)} ...> 🗑️ </button>
    
    const deleteBtn = screen.getByText('🗑️');
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(githubActions.deleteGitHubConfig).toHaveBeenCalledWith('1');
    });
  });
});

import { getGitHubConfigs, saveGitHubConfig, deleteGitHubConfig, testGitHubConnection } from '../github';
import { db } from '@/../db';
import { getServerSession } from 'next-auth/next';
import { App } from 'octokit';

jest.mock('@/../db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          all: jest.fn(() => []),
          get: jest.fn(() => null),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => ({
          get: jest.fn(() => ({})),
        })),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => ({
            get: jest.fn(() => ({})),
          })),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({
        run: jest.fn(),
      })),
    })),
  },
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/auth', () => ({
  authOptions: {},
}));

jest.mock('octokit', () => ({
  App: jest.fn().mockImplementation(() => ({
    octokit: {
      request: jest.fn(),
    },
  })),
}));

describe('GitHub actions', () => {
  const mockSession = {
    user: { id: 'user1' },
  };

  const mockConfigs = [
    { id: '1', name: 'App 1', appId: '123', clientId: 'cid1', clientSecret: 'cs1', privateKey: 'pk1', updatedAt: Date.now() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getGitHubConfigs', () => {
    it('throws unauthorized if no session', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      await expect(getGitHubConfigs()).rejects.toThrow('Unauthorized');
    });

    it('returns formatted configurations', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            all: jest.fn(() => mockConfigs),
          })),
        })),
      });

      const results = await getGitHubConfigs();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('App 1');
      expect(results[0].hasSecret).toBe(true);
      expect(results[0].hasPrivateKey).toBe(true);
    });
  });

  describe('saveGitHubConfig', () => {
    it('inserts a new configuration', async () => {
      const newData = {
        name: 'New App',
        appId: '456',
        clientId: 'cid2',
        clientSecret: 'cs2',
        privateKey: 'pk2',
      };

      await saveGitHubConfig(newData);
      expect(db.insert).toHaveBeenCalled();
    });

    it('updates an existing configuration', async () => {
      const updateData = {
        id: '1',
        name: 'Updated App',
        appId: '123',
        clientId: 'cid1',
        clientSecret: 'cs1',
        privateKey: 'pk1',
      };

      await saveGitHubConfig(updateData);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('deleteGitHubConfig', () => {
    it('deletes a configuration', async () => {
      await deleteGitHubConfig('1');
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('testGitHubConnection', () => {
    it('returns success on valid response', async () => {
      const mockAppInstance = {
        octokit: {
          request: jest.fn()
            .mockResolvedValueOnce({ data: { name: 'Test App', id: 123, slug: 'test-app' } }) // GET /app
            .mockResolvedValueOnce({ data: [] }), // GET /app/installations
        },
      };
      (App as unknown as jest.Mock).mockImplementation(() => mockAppInstance);

      const result = await testGitHubConnection({ appId: '123', privateKey: 'pk1' });
      expect(result.success).toBe(true);
      expect(result.app?.name).toBe('Test App');
    });

    it('returns failure on error', async () => {
      const mockAppInstance = {
        octokit: {
          request: jest.fn().mockRejectedValue(new Error('GitHub Error')),
        },
      };
      (App as unknown as jest.Mock).mockImplementation(() => mockAppInstance);

      const result = await testGitHubConnection({ appId: '123', privateKey: 'pk1' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('GitHub Error');
    });
  });
});

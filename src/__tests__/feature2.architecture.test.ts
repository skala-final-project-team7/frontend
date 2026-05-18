import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { API_LAYER_BOUNDARY } from '@/api';
import { UI_STATE_POLICY } from '@/composables';
import { SERVER_STATE_POLICY } from '@/stores';

const sourceRoot = join(process.cwd(), 'src');

describe('feature2 architecture skeleton', () => {
  it('creates the required frontend folder layers', () => {
    const requiredDirectories = [
      'pages',
      'features',
      'shared',
      'api',
      'types',
      'mocks',
      'stores',
      'composables',
      'router',
    ];

    for (const directory of requiredDirectories) {
      expect(existsSync(join(sourceRoot, directory)), `${directory} directory`).toBe(true);
    }
  });

  it('documents the API layer as the only fetch boundary for components', () => {
    expect(API_LAYER_BOUNDARY.directFetchAllowedOutsideApi).toBe(false);
    expect(API_LAYER_BOUNDARY.allowedNetworkLayer).toBe('src/api');
  });

  it('documents server and UI state ownership', () => {
    expect(SERVER_STATE_POLICY.owner).toBe('pinia');
    expect(UI_STATE_POLICY.owner).toBe('component-or-composable');
  });

  it('keeps standard TypeScript header comments on key modules', () => {
    const keyModulePaths = [
      'api/index.ts',
      'stores/index.ts',
      'composables/index.ts',
      'types/api.ts',
    ];

    for (const path of keyModulePaths) {
      const file = readFileSync(join(sourceRoot, path), 'utf8');

      expect(file).toContain('작성자');
      expect(file).toContain('작성목적');
      expect(file).toContain('작성일');
      expect(file).toContain('[호환성]');
    }
  });
});

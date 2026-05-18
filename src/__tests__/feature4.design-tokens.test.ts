import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import tailwindConfig from '../../tailwind.config.js';
import {
  mascotImageUrl,
  mascotRealizeImageUrl,
  mascotSearchImageUrl,
  searchImageUrl,
  skpSymbolImageUrl,
} from '@/shared/assets';

const projectRoot = process.cwd();
const srcRoot = join(projectRoot, 'src');

type Feature4ThemeExtension = {
  colors: {
    primary: Record<string, string>;
    bg: Record<number, string>;
    status: Record<string, string>;
    overlay: {
      dark: Record<number, string>;
      white: Record<number, string>;
    };
  };
  borderRadius: Record<string, string>;
  spacing: Record<string, string>;
};

describe('feature4 design tokens and base styles', () => {
  it('registers design-reference CSS variables as Tailwind theme tokens', () => {
    const extension = tailwindConfig.theme?.extend as Feature4ThemeExtension;

    expect(extension.colors.primary).toEqual({
      DEFAULT: 'var(--color-primary)',
      light: 'var(--color-primary-light)',
      white: 'var(--color-primary-white)',
    });
    expect(extension.colors.bg).toMatchObject({
      100: 'var(--color-bg-100)',
      200: 'var(--color-bg-200)',
      300: 'var(--color-bg-300)',
      400: 'var(--color-bg-400)',
    });
    expect(extension.colors.status).toMatchObject({
      success: 'var(--color-success)',
      error: 'var(--color-error)',
      warning: 'var(--color-warning)',
    });
    expect(extension.colors.overlay).toMatchObject({
      dark: {
        80: 'var(--color-dark-80)',
        40: 'var(--color-dark-40)',
        20: 'var(--color-dark-20)',
        10: 'var(--color-dark-10)',
        4: 'var(--color-dark-04)',
      },
      white: {
        80: 'var(--color-white-80)',
        40: 'var(--color-white-40)',
        20: 'var(--color-white-20)',
        15: 'var(--color-white-15)',
        10: 'var(--color-white-10)',
        4: 'var(--color-white-04)',
      },
    });
    expect(extension.borderRadius).toMatchObject({
      card: 'var(--border-radius-card)',
      item: 'var(--border-radius-item)',
      button: 'var(--border-radius-button)',
      tag: 'var(--border-radius-tag)',
    });
    expect(extension.spacing).toMatchObject({
      card: 'var(--padding-card)',
      item: 'var(--padding-item)',
      button: 'var(--padding-button)',
      default: 'var(--gap-default)',
      tight: 'var(--gap-tight)',
      xs: 'var(--gap-xs)',
    });
  });

  it('defines minimum layout, typography, button, and panel style contracts', () => {
    const mainCss = readFileSync(join(srcRoot, 'styles/main.css'), 'utf8');

    expect(mainCss).toContain('@layer base');
    expect(mainCss).toContain('@layer components');
    expect(mainCss).toContain('.lina-app-layout');
    expect(mainCss).toContain('.lina-heading');
    expect(mainCss).toContain('.lina-body');
    expect(mainCss).toContain('.lina-button-primary');
    expect(mainCss).toContain('.lina-button-ghost');
    expect(mainCss).toContain('.lina-panel');
  });

  it('keeps Chat shell placeholder styling on project tokens instead of arbitrary palettes', () => {
    const chatPage = readFileSync(join(srcRoot, 'pages/ChatPage.vue'), 'utf8');

    expect(chatPage).toContain('bg-bg-100');
    expect(chatPage).toContain('border-bg-300');
    expect(chatPage).not.toMatch(
      /bg-white|text-neutral-|border-neutral-|bg-\[#|text-\[#|border-\[#/,
    );
  });

  it('exports importable URLs for existing frontend asset images', () => {
    const requiredAssetPaths = [
      'frontend/assets/mascot.png',
      'frontend/assets/mascot-realize-nobg.png',
      'frontend/assets/mascot-search-nobg.png',
      'frontend/assets/search.png',
      'frontend/assets/skp_symbol-nobg.png',
    ];

    for (const assetPath of requiredAssetPaths) {
      expect(existsSync(join(projectRoot, assetPath)), assetPath).toBe(true);
    }

    expect(mascotImageUrl).toContain('mascot.png');
    expect(mascotRealizeImageUrl).toContain('mascot-realize-nobg.png');
    expect(mascotSearchImageUrl).toContain('mascot-search-nobg.png');
    expect(searchImageUrl).toContain('search.png');
    expect(skpSymbolImageUrl).toContain('skp_symbol-nobg.png');
  });
});

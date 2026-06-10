import { describe, expect, it } from 'vitest';

import { useTabPagination } from '@/composables/useTabPagination';

const ADMIN_TABS = ['operations', 'dashboard', 'feedback', 'sync'] as const;
type AdminSectionKey = (typeof ADMIN_TABS)[number];

describe('feature14-refactor useTabPagination', () => {
  it('initializes every tab with currentPage 1', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    for (const tab of ADMIN_TABS) {
      expect(pagination[tab].currentPage.value).toBe(1);
    }
  });

  it('initializes every tab with the default pageSize of 20', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    for (const tab of ADMIN_TABS) {
      expect(pagination[tab].pageSize.value).toBe(20);
    }
  });

  it('accepts a custom default pageSize', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS, 50);
    for (const tab of ADMIN_TABS) {
      expect(pagination[tab].pageSize.value).toBe(50);
    }
  });

  it('changing operations currentPage does not affect dashboard currentPage', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    pagination['operations'].currentPage.value = 3;
    expect(pagination['dashboard'].currentPage.value).toBe(1);
  });

  it('changing sync pageSize does not affect feedback pageSize', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    pagination['sync'].pageSize.value = 50;
    expect(pagination['feedback'].pageSize.value).toBe(20);
  });

  it('preserves operations currentPage after switching to sync and back', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    pagination['operations'].currentPage.value = 5;
    // simulate tab switch: read sync
    void pagination['sync'].currentPage.value;
    // simulate return to operations
    expect(pagination['operations'].currentPage.value).toBe(5);
  });

  it('each tab holds a separate ref — mutations do not share state', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    pagination['operations'].currentPage.value = 2;
    pagination['dashboard'].currentPage.value = 4;
    pagination['feedback'].currentPage.value = 7;
    pagination['sync'].currentPage.value = 9;

    expect(pagination['operations'].currentPage.value).toBe(2);
    expect(pagination['dashboard'].currentPage.value).toBe(4);
    expect(pagination['feedback'].currentPage.value).toBe(7);
    expect(pagination['sync'].currentPage.value).toBe(9);
  });

  it('provides pagination state for all four admin tabs', () => {
    const { pagination } = useTabPagination<AdminSectionKey>(ADMIN_TABS);
    for (const tab of ADMIN_TABS) {
      expect(pagination[tab]).toHaveProperty('currentPage');
      expect(pagination[tab]).toHaveProperty('pageSize');
    }
  });
});

import { ref, type Ref } from 'vue';

interface TabPaginationState {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
}

type TabPaginationMap<T extends string> = {
  [K in T]: TabPaginationState;
};

/**
 * 탭별 독립 페이지네이션 상태 관리.
 * 탭 전환 시 다른 탭의 currentPage/pageSize가 초기화되지 않도록 탭 키 기준 상태 맵으로 관리한다.
 */
export function useTabPagination<T extends string>(
  tabKeys: readonly T[],
  defaultPageSize = 20,
): { pagination: TabPaginationMap<T> } {
  const pagination = Object.fromEntries(
    tabKeys.map((key) => [
      key,
      {
        currentPage: ref(1),
        pageSize: ref(defaultPageSize),
      },
    ]),
  ) as TabPaginationMap<T>;

  return { pagination };
}

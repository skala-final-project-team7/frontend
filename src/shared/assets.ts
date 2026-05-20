/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend에서 정적 이미지 asset을 Vite import 경로로 노출한다.
 *           feature 화면이 frontend/assets 이미지를 직접 경로 추측 없이 참조하도록 한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature4 구현, mascot 및 SKP symbol 이미지 import 경로 추가
 *   - 2026-05-18, SCR-400 확인, mascot/search 이미지 import 경로 보강
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import mascotRealizeImageUrl from '../../frontend/assets/mascot-realize-nobg.png';
import mascotSearchImageUrl from '../../frontend/assets/mascot-search-nobg.png';
import mascotImageUrl from '../../frontend/assets/mascot.png';
import mascotWrongImageUrl from '../../frontend/assets/mascot-wrong.png';
import searchImageUrl from '../../frontend/assets/search.png';
import skpSymbolImageUrl from '../../frontend/assets/skp_symbol-nobg.png';

export {
  mascotImageUrl,
  mascotRealizeImageUrl,
  mascotSearchImageUrl,
  mascotWrongImageUrl,
  searchImageUrl,
  skpSymbolImageUrl,
};

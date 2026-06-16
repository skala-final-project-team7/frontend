/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend에서 정적 이미지 asset을 Vite import 경로로 노출한다.
 *           feature 화면이 frontend/assets 이미지를 직접 경로 추측 없이 참조하도록 한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature4 구현, mascot 및 SKP symbol 이미지 import 경로 추가
 *   - 2026-05-18, SCR-400 확인, mascot/search 이미지 import 경로 보강
 *   - 2026-06-10, admin 데이터 현황 벤토 개선, lina-desk 이미지 import 경로 추가
 *   - 2026-06-10, admin 파이프라인 IDLE 캐릭터, lina-waiting 이미지 import 경로 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import confluenceIconImageUrl from '../../frontend/assets/icons/confluence-icon.png';
import iconsImageUrl from '../../frontend/assets/icons/icons.png';
import notionIconImageUrl from '../../frontend/assets/icons/notion-icon.png';
import searchImageUrl from '../../frontend/assets/icons/search.png';
import slackIconImageUrl from '../../frontend/assets/icons/slack-icon.png';
import skpSymbolImageUrl from '../../frontend/assets/icons/skp_symbol-nobg.png';
import linaAdminImageUrl from '../../frontend/assets/lina-character/lina-admin.png';
import linaAskImageUrl from '../../frontend/assets/lina-character/lina-ask.png';
import linaDeskImageUrl from '../../frontend/assets/lina-character/lina-desk.png';
import linaFlagImageUrl from '../../frontend/assets/lina-character/lina-flag.png';
import linaRunningImageUrl from '../../frontend/assets/lina-character/lina-running.png';
import linaSearchImageUrl from '../../frontend/assets/lina-character/lina-search.png';
import linaUserImageUrl from '../../frontend/assets/lina-character/lina-user.png';
import linaVerifyImageUrl from '../../frontend/assets/lina-character/lina-verify.png';
import linaWaitingImageUrl from '../../frontend/assets/lina-character/lina-waiting.png';
import mascotFaceImageUrl from '../../frontend/assets/lina-character/mascot-face.png';
import mascotRealizeImageUrl from '../../frontend/assets/lina-character/mascot-realize-nobg.png';
import mascotSearchImageUrl from '../../frontend/assets/lina-character/mascot-search-nobg.png';
import mascotWrongImageUrl from '../../frontend/assets/lina-character/mascot-wrong.png';
import mascotImageUrl from '../../frontend/assets/lina-character/mascot.png';
import logoLinaCuteImageUrl from '../../frontend/assets/logos/logo-lina-cute4.png';
import chatScreenshotImageUrl from '../../frontend/assets/screenshots/chat-screenshot.png';
import confluenceScreenshot1ImageUrl from '../../frontend/assets/screenshots/confluence-screenshot1.png';
import confluenceScreenshot2ImageUrl from '../../frontend/assets/screenshots/confluence-screenshot2.png';
import chatInputBoxImageUrl from '../../frontend/assets/ui/chat-input-box.png';

export {
  chatInputBoxImageUrl,
  chatScreenshotImageUrl,
  confluenceScreenshot1ImageUrl,
  confluenceScreenshot2ImageUrl,
  confluenceIconImageUrl,
  iconsImageUrl,
  linaAdminImageUrl,
  linaAskImageUrl,
  linaDeskImageUrl,
  linaFlagImageUrl,
  linaRunningImageUrl,
  linaSearchImageUrl,
  linaUserImageUrl,
  linaVerifyImageUrl,
  linaWaitingImageUrl,
  logoLinaCuteImageUrl,
  mascotFaceImageUrl,
  mascotImageUrl,
  mascotRealizeImageUrl,
  mascotSearchImageUrl,
  mascotWrongImageUrl,
  notionIconImageUrl,
  searchImageUrl,
  slackIconImageUrl,
  skpSymbolImageUrl,
};

/// <reference types="vite/client" />

/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend Vite 기본 타입 선언.
 *           Vite client 타입을 Vue 애플리케이션 컴파일 과정에 연결한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, 최초 작성, Vite client 타입 선언 추가
 *   - 2026-05-18, feature4 구현, Tailwind config 테스트 import 타입 선언 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
declare module '*tailwind.config.js' {
  import type { Config } from 'tailwindcss';

  const config: Config;
  export default config;
}

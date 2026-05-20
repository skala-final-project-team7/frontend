/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          white: 'var(--color-primary-white)',
        },
        bg: {
          100: 'var(--color-bg-100)',
          200: 'var(--color-bg-200)',
          300: 'var(--color-bg-300)',
          400: 'var(--color-bg-400)',
        },
        status: {
          success: 'var(--color-success)',
          error: 'var(--color-error)',
          warning: 'var(--color-warning)',
        },
        overlay: {
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
        },
      },
      fontFamily: {
        lina: ['var(--font-family)'],
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
      fontSize: {
        heading: ['var(--font-size-heading)', { lineHeight: 'var(--line-height-heading)' }],
        body: ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)' }],
        caption: ['var(--font-size-caption)', { lineHeight: 'var(--line-height-caption)' }],
        button: ['var(--font-size-button)', { lineHeight: 'var(--line-height-button)' }],
        small: ['var(--font-size-small)', { lineHeight: 'var(--line-height-small)' }],
      },
      borderRadius: {
        card: 'var(--border-radius-card)',
        item: 'var(--border-radius-item)',
        button: 'var(--border-radius-button)',
        tag: 'var(--border-radius-tag)',
      },
      spacing: {
        card: 'var(--padding-card)',
        item: 'var(--padding-item)',
        button: 'var(--padding-button)',
        default: 'var(--gap-default)',
        tight: 'var(--gap-tight)',
        xs: 'var(--gap-xs)',
      },
      boxShadow: {
        primary: '0 0 4px var(--color-primary)',
        focus: '0 0 6px var(--color-primary), 0 2px 5.5px var(--color-dark-10)',
        floating: '0 4px 22px var(--color-dark-10)',
      },
      backdropBlur: {
        panel: '9.25px',
      },
    },
  },
  plugins: [],
};

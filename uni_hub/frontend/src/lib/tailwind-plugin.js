// eslint-disable-next-line @typescript-eslint/no-require-imports
const plugin = require('tailwindcss/plugin');

const removeButtonOutlinesPlugin = plugin(function({ addBase }) {
  addBase({
    // Only target buttons and button-like elements
    'button:focus, [type="button"]:focus, [type="submit"]:focus, [type="reset"]:focus, a[role="button"]:focus, .btn:focus': {
      outline: 'none !important',
      boxShadow: 'none !important',
      borderColor: 'inherit !important',
      ring: '0 !important',
      ringWidth: '0 !important',
      ringColor: 'transparent !important',
      ringOpacity: '0 !important',
      ringOffsetWidth: '0 !important'
    },
    // Button-specific browser overrides
    'button::-moz-focus-inner, [type="button"]::-moz-focus-inner, [type="submit"]::-moz-focus-inner, [type="reset"]::-moz-focus-inner': {
      border: 'none !important',
      outline: 'none !important'
    }
  });
});

module.exports = removeButtonOutlinesPlugin; 
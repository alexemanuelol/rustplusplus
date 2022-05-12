const colors = require('tailwindcss/colors')

module.exports = {
    purge: { content: ['./public/**/*.html', './src/**/*.vue'] },
    darkMode: false,
    theme: {
        extend: {
            colors: {
                primary: colors.blueGray,
                info: colors.gray,
                error: colors.red,
            }
        },
        zIndex: {
            'bottom-bar': 999,
            'modal': 1000,
            'tooltip': 1001,
            'auto': 'auto',
        }
    },
    variants: {
        extend: {
            opacity: ['disabled'],
        }
    },
    plugins: [
        require('@tailwindcss/forms'),
    ]
}

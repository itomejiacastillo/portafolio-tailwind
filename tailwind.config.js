/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.{html,js}"],
  theme: {
    extend: {
      screens:{
        print: {raw: 'print'},
      },
      fontFamily: {
          mifont: ['Merry', 'sans-serif'], // 'sans-serif' es un fallback
        },
      
    },
  },
  plugins: [],
}
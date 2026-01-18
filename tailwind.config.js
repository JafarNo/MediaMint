/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}","./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary colors from logo
        primary: {
          DEFAULT: '#0B3D2E',
          light: '#145A32',
          dark: '#073D2E',
        },
        // Teal/Cyan gradient from logo "M"
        mint: {
          DEFAULT: '#00CED1',
          light: '#00E5E8',
          dark: '#00B4D8',
        },
        // Lime green from logo leaves
        leaf: {
          DEFAULT: '#7FFF00',
          light: '#90EE90',
          dark: '#32CD32',
        },
        // Legacy colors
        LogoGreen: '#0B3D2E',
        BGColor: '#F5F5F5',
        BGCSec: '#f3f4f6',
      },
      fontFamily: {
        inter: ['Inter_600SemiBold'], 
      },
      
    },
  },
  plugins: [],
}


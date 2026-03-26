import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Hook to update favicon color based on theme (light/dark)
 * SVG logo path is embedded and colors change dynamically
 */
export const useFaviconTheme = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Color mapping based on theme
    const colors = {
      light: '#22c55e', // White logo for light theme
      dark: '#22c55e',  // Green logo for dark theme
    };

    const logoColor = colors[theme] || colors.dark;

    // SVG path with dynamic color
    const svgPath = `M 179.09766,0 C 128.22023,-0.03247996 79.729541,21.570907 45.791016,59.474609 77.073228,65.667683 87.714844,91.881077 87.714844,132.46484 H 49.455078 c 0,-23.91148 -4.97857,-36.345699 -19.164062,-36.345699 -6.037033,-0.10295 -11.58741,3.299791 -14.234375,8.726559 -0.424429,0.92657 -0.829832,1.86042 -1.236329,2.79297 -1.180377,3.39248 -1.759387,6.96502 -1.710937,10.55664 0,49.61635 81.484375,47.14833 81.484375,123.41407 0,29.78176 -22.828226,57.54882 -48.539062,57.54882 35.194764,38.88535 83.249002,58.57833 131.460932,58.97266 48.21195,0.39433 96.58209,-18.50998 132.40821,-56.81445 -30.12251,-7.5919 -56.34766,-50.91443 -56.34766,-119.76758 0,-71.73449 26.53566,-116.999077 58.23633,-121.775392 C 280.13574,20.815626 227.16573,0.03068997 179.09766,0 Z M 110.2207,64.560547 h 40.99024 v 94.767573 h 44.33789 V 64.560547 h 40.97265 V 299.7793 H 195.54883 V 197.86914 H 151.3125 V 299.7793 h -41.0918 z m 216.64453,33.978515 c -21.03611,10e-7 -32.56054,39.627518 -32.56054,79.207028 0,41.73154 10.96849,82.07032 32.56054,82.07032 17.96353,0 31.31836,-38.30515 31.31836,-80.74805 0,-19.32647 -6.3129,-80.529298 -31.31836,-80.529298 z M 0.00585938,175.79883 c -0.37062818,51.91784 15.69317562,86.52344 35.40820262,86.52344 11.441653,0 19.564454,-10.07343 19.564454,-24.69532 0.02391,-30.33174 -26.559821,-36.17109 -54.97265662,-61.82812 z`;

    // Create SVG with dynamic color - smaller scale for compact favicon
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 320 330" preserveAspectRatio="xMidYMid meet">
      <g transform="scale(0.9)">
        <path style="fill:${logoColor};fill-opacity:1" d="${svgPath}"/>
      </g>
    </svg>`;

    // Convert to data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    // Update favicon
    let favicon = document.getElementById('theme-favicon');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.id = 'theme-favicon';
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      document.head.appendChild(favicon);
    }
    favicon.href = dataUrl;
  }, [theme]);
};

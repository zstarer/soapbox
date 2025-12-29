'use client';

/**
 * ColorVisionFilters
 * 
 * SVG filters for simulating color vision deficiencies.
 * These are used for the premium "Color Vision Preview" accessibility feature.
 * 
 * Filters based on: https://www.color-blindness.com/coblis-color-blindness-simulator/
 */
export function ColorVisionFilters() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Protanopia (Red-Blind) */}
        <filter id="protanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"
          />
        </filter>

        {/* Deuteranopia (Green-Blind) */}
        <filter id="deuteranopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"
          />
        </filter>

        {/* Tritanopia (Blue-Blind) */}
        <filter id="tritanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default ColorVisionFilters;



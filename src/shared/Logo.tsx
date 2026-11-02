/** The EcoGrid mark: a lightning bolt inside a hexagonal grid cell. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <path
        d="M15 2 26.3 8.5v13L15 28 3.7 21.5v-13z"
        fill="none"
        stroke="#6FD6E8"
        strokeWidth="1.6"
      />
      <path d="M16.5 7.5 11 16h4.5l-1.5 6.5L20 14h-4.6z" fill="#F2B33D" />
    </svg>
  );
}

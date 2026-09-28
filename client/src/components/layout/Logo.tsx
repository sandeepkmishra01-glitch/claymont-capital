export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 48 L25 21 L33 33 L40 25 L56 48 Z" fill="none" stroke="#d8a15f" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="46" cy="17" r="3" fill="#d8a15f" />
    </svg>
  );
}

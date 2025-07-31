export function SayWithLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 150 40"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <text
        x="0"
        y="30"
        fontFamily="'Space Grotesk', sans-serif"
        fontSize="32"
        fontWeight="bold"
      >
        Say<tspan fill="hsl(var(--primary))">With</tspan>
      </text>
    </svg>
  );
}

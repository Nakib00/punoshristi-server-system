export default function Icon({ name, filled = false, className = '', style, size }) {
  return (
    <span
      className={`material-symbols-outlined${filled ? ' filled' : ''} ${className}`}
      style={{ ...(size ? { fontSize: size } : {}), ...style }}
    >
      {name}
    </span>
  );
}

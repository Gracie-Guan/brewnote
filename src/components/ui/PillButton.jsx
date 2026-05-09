export default function PillButton({
  children,
  onClick,
  variant = 'glass',
  disabled = false,
  type = 'button',
  style = {},
  ...props
}) {
  const variantStyle = disabled ? variants.disabled : variants[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variantStyle, ...(disabled && { cursor: 'not-allowed' }), ...style }}
      {...props}
    >
      {children}
    </button>
  )
}

const base = {
  fontFamily: 'var(--font-body)',
  border: 'none',
  borderRadius: '99px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const variants = {
  // Frosted glass — nav pills, Cancel
  glass: {
    background: 'rgba(245, 244, 237, 0.5)',
    boxShadow: '4px 6px 8px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.8)',
    color: 'var(--color-dark)',
  },
  // Dark fill — primary action (Add Beans, Confirm, etc.)
  dark: {
    background: 'rgba(74, 57, 51, 0.8)',
    boxShadow: '2px 2px 4px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.3)',
    color: 'var(--color-porcelain)',
  },
  // Disabled state
  disabled: {
    background: 'rgba(154, 143, 134, 0.2)',
    color: 'var(--color-taupe)',
  },
}

/**
 * @file Input.jsx
 * @description Accessible Form Text Input Component.
 * Supports labels, mandatory field indicators, inline left/right icon prefixes, error state highlighting,
 * helper messages, and standard HTML5 input attributes.
 *
 * @module components/common/Input
 */

import './Input.css';

/**
 * Reusable Form Input Component.
 * @param {Object} props - Input component properties.
 * @param {string} [props.label] - Field label text.
 * @param {string} props.name - HTML input name and ID attribute.
 * @param {string} [props.type='text'] - Input type (text, email, password, date, number, etc.).
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string|number} props.value - Input state value.
 * @param {Function} props.onChange - Input change callback handler.
 * @param {string} [props.error] - Validation error message text.
 * @param {boolean} [props.required=false] - Displays red asterisk and enforces browser validation.
 * @param {boolean} [props.disabled=false] - Disables field interaction.
 * @param {React.ReactNode} [props.leftIcon] - Prefix icon rendered inside input.
 * @param {React.ReactNode} [props.rightIcon] - Suffix icon rendered inside input.
 * @returns {React.ReactNode} Form input element.
 */
export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) {
  const wrapperClasses = ['input-wrapper', error ? 'has-error' : '', className].filter(Boolean).join(' ');
  const classes = ['input', leftIcon ? 'has-left-icon' : '', rightIcon ? 'has-right-icon' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="input-container">
        {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={classes}
          {...props}
        />
        {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

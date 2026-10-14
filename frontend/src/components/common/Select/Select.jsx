/**
 * @file Select.jsx
 * @description Accessible Form Dropdown Select Component.
 * Supports labels, mandatory field flags, option mapping ({ label, value }), error state highlights,
 * and custom placeholder configurations.
 *
 * @module components/common/Select
 */

import './Select.css';

/**
 * Reusable Dropdown Select Component.
 * @param {Object} props - Select properties.
 * @param {string} [props.label] - Field label text.
 * @param {string} props.name - HTML name and ID attribute.
 * @param {string|number} props.value - Selected option value.
 * @param {Function} props.onChange - Selection change callback.
 * @param {Array<{value: string|number, label: string}>} [props.options=[]] - Select options list.
 * @param {string} [props.placeholder='Select...'] - Default unselected option placeholder text.
 * @param {boolean} [props.required=false] - Mandates selection and displays red asterisk.
 * @param {boolean} [props.disabled=false] - Disables dropdown interaction.
 * @param {string} [props.error] - Validation error message text.
 * @param {string} [props.className=''] - Additional custom CSS class names.
 */
export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  required = false,
  disabled = false,
  error,
  className = '',
}) {
  const wrapperClasses = ['select-wrapper', error ? 'has-error' : '', className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={name} className="select-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="select"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="select-error">{error}</span>}
    </div>
  );
}

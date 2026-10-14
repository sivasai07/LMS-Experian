/**
 * @file LeavePolicyModal.jsx
 * @description Modal component displaying comprehensive company leave policy breakdown.
 * Styled with dark blue headers and dynamic theme-compatible matter boxes for Light and Dark mode.
 */

import Modal from '../../../components/common/Modal/Modal';

export default function LeavePolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave Policy" size="md">
      <div
        style={{
          maxHeight: '75vh',
          overflowY: 'auto',
          padding: '4px 10px 30px 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          fontFamily: 'inherit',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* Section 1: Earned Leave */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              background: '#0f4c81',
              color: '#ffffff',
              padding: '11px 18px',
              fontWeight: 700,
              fontSize: '14.5px',
              letterSpacing: '0.01em',
            }}
          >
            Earned Leave
          </div>
          <div
            style={{
              padding: '16px 18px 20px 18px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '13.5px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              lineHeight: 1.55,
            }}
          >
            <div><strong>Annual Quota:</strong> 20 days per year</div>
            <div><strong>Accrual Rate:</strong> 1.67 days per accrual</div>
            <div><strong>Minimum Balance After Encashment:</strong> 10 days</div>
            <div><strong>Leave Beyond Allocation:</strong> Allowed, up to 5 days</div>
            <div style={{ paddingTop: 2 }}><strong>Half-Day Leave:</strong> Allowed</div>
          </div>
        </div>

        {/* Section 2: Unpaid Leave */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              background: '#0f4c81',
              color: '#ffffff',
              padding: '11px 18px',
              fontWeight: 700,
              fontSize: '14.5px',
              letterSpacing: '0.01em',
            }}
          >
            Unpaid Leave
          </div>
          <div
            style={{
              padding: '16px 18px 20px 18px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '13.5px',
              lineHeight: 1.55,
            }}
          >
            <div><strong>Half-Day Leave:</strong> Allowed</div>
          </div>
        </div>

        {/* Section 3: Compensatory Leave */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              background: '#0f4c81',
              color: '#ffffff',
              padding: '11px 18px',
              fontWeight: 700,
              fontSize: '14.5px',
              letterSpacing: '0.01em',
            }}
          >
            Compensatory Leave
          </div>
          <div
            style={{
              padding: '16px 18px 20px 18px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '13.5px',
              lineHeight: 1.55,
            }}
          >
            <div><strong>Half-Day Leave:</strong> Allowed</div>
          </div>
        </div>

        {/* Section 4: Optional Leave */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              background: '#0f4c81',
              color: '#ffffff',
              padding: '11px 18px',
              fontWeight: 700,
              fontSize: '14.5px',
              letterSpacing: '0.01em',
            }}
          >
            Optional Leave
          </div>
          <div
            style={{
              padding: '16px 18px 20px 18px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '13.5px',
              lineHeight: 1.55,
            }}
          >
            <div><strong>Annual Quota:</strong> 4 days per year</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

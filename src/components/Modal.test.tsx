import React from 'react';
import { render, screen } from '@testing-library/react';
import Modal from './Modal';

describe('Modal Component', () => {
  it('should render children when open', () => {
    render(
      <Modal isOpen={true}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <Modal isOpen={false}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render overlay', () => {
    const { container } = render(
      <Modal isOpen={true}>
        <div>Content</div>
      </Modal>
    );
    
    const overlay = container.querySelector('div[style*="position: fixed"]');
    expect(overlay).toBeInTheDocument();
  });
});

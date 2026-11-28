import { fireEvent, screen } from '@testing-library/react';

/** Open the title-area Filters drawer (idempotent: a second call keeps it open). */
export const openFilters = () => {
  if (!screen.queryByRole('dialog', { name: 'Filters' })) {
    fireEvent.click(screen.getByRole('button', { name: /^Filters/ }));
  }
};

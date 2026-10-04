import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders with label and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner and disables button when isLoading is true', () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disables button when disabled prop is provided', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Action
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Badge', () => {
    it('renders children with default variant', () => {
      render(<Badge>Standard</Badge>);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('resolves variant and label from status string', () => {
      render(<Badge status="CONFIRMED" />);
      const badge = screen.getByText('CONFIRMED');
      expect(badge).toBeInTheDocument();
      // Should have success style
      expect(badge.closest('span')).toHaveClass('text-[#34D399]');
    });

    it('formats multi-word statuses with space', () => {
      render(<Badge status="PENDING_PAYMENT" />);
      expect(screen.getByText('PENDING PAYMENT')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders card with header, title, and content', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card body text</p>
          </CardContent>
        </Card>,
      );

      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card body text')).toBeInTheDocument();
    });
  });
});

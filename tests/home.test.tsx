import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
	it('renders the title', () => {
		render(<HomePage />);
		expect(
			screen.getByRole('heading', { name: /Day-to-Day Optimization Planner/i })
		).toBeInTheDocument();
	});
});



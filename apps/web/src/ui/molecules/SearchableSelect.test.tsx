// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchableSelect } from './SearchableSelect';

afterEach(() => {
  cleanup();
});

const SAMPLE_OPTIONS = [
  { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'anthropic/claude-haiku-4', label: 'Claude Haiku 4' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
];

function renderSelect(props: Partial<Parameters<typeof SearchableSelect>[0]> = {}) {
  const onChange = props.onChange ?? vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <SearchableSelect
        value={props.value ?? ''}
        options={props.options ?? SAMPLE_OPTIONS}
        onChange={onChange}
        ariaLabel={props.ariaLabel ?? 'Test select'}
        placeholder={props.placeholder}
        searchPlaceholder={props.searchPlaceholder ?? 'Search…'}
        emptyLabel={props.emptyLabel}
        size={props.size}
      />
    </ChakraProvider>
  );
  return { onChange };
}

describe('SearchableSelect', () => {
  it('renders the placeholder when no value is selected', () => {
    renderSelect({ placeholder: 'Pick one' });
    const trigger = screen.getByRole('button', { name: 'Test select' });
    expect(trigger).toHaveTextContent('Pick one');
  });

  it('renders the selected option label when a value matches', () => {
    renderSelect({ value: 'openai/gpt-4o' });
    const trigger = screen.getByRole('button', { name: 'Test select' });
    expect(trigger).toHaveTextContent('GPT-4o');
  });

  it('opens a popover with the search input focused on click', async () => {
    renderSelect();
    const trigger = screen.getByRole('button', { name: 'Test select' });
    await userEvent.click(trigger);
    const searchInput = await screen.findByPlaceholderText('Search…');
    expect(searchInput).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders all options in the listbox when no query is entered', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(SAMPLE_OPTIONS.length);
  });

  it('filters options by label match', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const search = await screen.findByPlaceholderText('Search…');
    await userEvent.type(search, 'claude');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    for (const opt of options) {
      expect(opt.textContent?.toLowerCase()).toContain('claude');
    }
  });

  it('filters options by value (model id) match', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const search = await screen.findByPlaceholderText('Search…');
    await userEvent.type(search, 'gpt-4o-mini');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('GPT-4o Mini');
  });

  it('shows the empty label when the filter has no matches', async () => {
    renderSelect({ emptyLabel: 'Nothing found' });
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const search = await screen.findByPlaceholderText('Search…');
    await userEvent.type(search, 'nonexistent-zzz');
    expect(screen.getByText(/Nothing found/)).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('commits the clicked option via onChange and closes the popover', async () => {
    const { onChange } = renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const claudeSonnet = screen.getByRole('option', { name: /Claude Sonnet 4/ });
    await userEvent.click(claudeSonnet);
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-sonnet-4');
    // popover should close
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();
  });

  it('commits via Enter on the highlighted option', async () => {
    const { onChange } = renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const search = await screen.findByPlaceholderText('Search…');
    await userEvent.type(search, 'haiku');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-haiku-4');
  });

  it('moves the highlight with arrow keys and commits with Enter', async () => {
    const { onChange } = renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const search = await screen.findByPlaceholderText('Search…');
    // Type triggers focus implicitly. ArrowDown moves the highlight; Enter commits.
    await userEvent.type(search, '{ArrowDown}{Enter}');
    // Default first option = Claude Opus 4 (idx 0); ArrowDown → idx 1 = Claude Sonnet 4
    expect(onChange).toHaveBeenCalledWith('anthropic/claude-sonnet-4');
  });

  it('closes on Escape without committing', async () => {
    const { onChange } = renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    expect(await screen.findByPlaceholderText('Search…')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a "filtered of total" footer count', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    expect(screen.getByText(`${SAMPLE_OPTIONS.length} of ${SAMPLE_OPTIONS.length}`)).toBeInTheDocument();
    const search = screen.getByPlaceholderText('Search…');
    await userEvent.type(search, 'gpt');
    expect(screen.getByText(`2 of ${SAMPLE_OPTIONS.length}`)).toBeInTheDocument();
  });

  it('renders the selected option with aria-selected for accessibility', async () => {
    renderSelect({ value: 'openai/gpt-4o' });
    await userEvent.click(screen.getByRole('button', { name: 'Test select' }));
    const selected = screen.getByRole('option', { selected: true });
    expect(selected).toHaveTextContent('GPT-4o');
  });
});

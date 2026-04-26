// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HermesUiProvider } from '@hermes-recipes/ui';
import { RECIPE_TEMPLATE_REGISTRY } from '../../features/recipe-templates/template-registry';
import { resolveTemplateGalleryFilterButtonStyles } from '../../features/recipe-templates/template-style-helpers';
import { RecipesPage } from './RecipesPage';

// Mock react-markdown to avoid JSX transform issues in test environment
vi.mock('react-markdown', () => ({
  default({ children }: { children?: string }) {
    return <div data-testid="markdown">{children}</div>;
  }
}));

// Polyfill browser APIs missing in jsdom
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

function renderRecipesPage(width?: number) {
  return render(
    <HermesUiProvider>
      <div style={width ? { width } : undefined}>
        <RecipesPage />
      </div>
    </HermesUiProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe('RecipesPage', () => {
  it('ships the gallery recipes with required metadata and preview specs', () => {
    expect(RECIPE_TEMPLATE_REGISTRY.length).toBeGreaterThanOrEqual(13);

    for (const template of RECIPE_TEMPLATE_REGISTRY) {
      expect(template.name.length).toBeGreaterThan(3);
      expect(template.useCase.length).toBeGreaterThan(10);
      expect(template.primaryUserGoal.length).toBeGreaterThan(10);
      expect(template.whenHermesShouldChoose.length).toBeGreaterThan(10);
      expect(template.idealDataShape.length).toBeGreaterThan(0);
      expect(template.requiredSections.length).toBeGreaterThan(0);
      expect(template.smallPaneAdaptationNotes.length).toBeGreaterThan(0);
      expect(template.references.length).toBeGreaterThan(0);
      expect(template.populationInstructions.steps.length).toBeGreaterThan(0);
      expect(template.populationInstructions.guardrails.length).toBeGreaterThan(0);
      expect(template.updateRules.patchPrefer.length).toBeGreaterThan(0);
      expect(template.updateRules.persistAcrossUpdates.length).toBeGreaterThan(0);
      expect(template.preview.sections.length).toBeGreaterThan(0);
    }
  });

  it('does not render Create Recipe or My Recipes tabs', () => {
    renderRecipesPage();
    expect(screen.queryByRole('tab', { name: 'Create Recipe' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'My Recipes' })).not.toBeInTheDocument();
  });

  it('renders the gallery, category filtering, and the detail drawer', async () => {
    renderRecipesPage();

    for (const template of RECIPE_TEMPLATE_REGISTRY) {
      expect(screen.getByTestId(`spaces-template-card-${template.id}`)).toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole('button', { name: 'Travel & Local' }));

    expect(screen.getByTestId('spaces-template-card-restaurant-finder')).toBeInTheDocument();
    expect(within(screen.getByTestId('spaces-template-inspector')).getByText('Selected venue')).toBeInTheDocument();

    const hotelCard = screen.getByTestId('spaces-template-card-hotel-shortlist');
    // The desktop gallery lives inside a display:none responsive container (hidden on base breakpoint).
    // Use hidden:true to find elements within display:none parents.
    await userEvent.click(within(hotelCard).getByRole('button', { name: 'Details', hidden: true }));

    const drawer = await screen.findByTestId('recipe-template-detail-drawer');
    expect(within(drawer).getByText('Hotel Shortlist')).toBeInTheDocument();
    expect(within(drawer).getByRole('tab', { name: 'Info' })).toBeInTheDocument();
    expect(within(drawer).getByRole('tab', { name: 'Preview' })).toBeInTheDocument();
    expect(within(drawer).getByRole('tab', { name: 'Instructions' })).toBeInTheDocument();
    expect(within(drawer).getByRole('tab', { name: 'Update Behavior' })).toBeInTheDocument();
    expect(within(drawer).getByRole('tab', { name: 'UI Contract' })).toBeInTheDocument();
  });

  it('keeps gallery filter tags readable in both themes', () => {
    expect(resolveTemplateGalleryFilterButtonStyles(true)).toEqual({
      bg: 'var(--surface-accent)',
      color: 'var(--text-primary)',
      darkColor: 'whiteAlpha.940'
    });
    expect(resolveTemplateGalleryFilterButtonStyles(false)).toEqual({
      bg: 'var(--surface-2)',
      color: 'var(--text-secondary)',
      darkColor: 'whiteAlpha.860'
    });
  });

  it('renders representative previews in a small pane without dropping key controls', async () => {
    renderRecipesPage(420);
    const inspector = screen.getByTestId('spaces-template-inspector');

    // 'Price grid' is a section title in the selected template's preview, shown in the inspector.
    // Use getAllByText because the mobile-preview drawer may also be mounted in the DOM.
    expect(screen.getAllByText('Price grid').length).toBeGreaterThan(0);

    const inboxCard = screen.getByTestId('spaces-template-card-inbox-triage-board');
    await userEvent.click(inboxCard);
    expect(within(inspector).getByText('Promotions')).toBeInTheDocument();

    const restaurantCard = screen.getByTestId('spaces-template-card-restaurant-finder');
    await userEvent.click(restaurantCard);
    expect(within(inspector).getByText('Selected venue')).toBeInTheDocument();
  });

  it('shows rendered recipe content in previews without hero sections', async () => {
    renderRecipesPage(420);
    const inspector = screen.getByTestId('spaces-template-inspector');

    await userEvent.click(screen.getByRole('button', { name: 'Research & Review' }));
    await userEvent.click(screen.getByTestId('spaces-template-card-research-notebook'));
    expect(within(inspector).getByText('Findings')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pipelines & Planning' }));
    await userEvent.click(screen.getByTestId('spaces-template-card-job-search-pipeline'));
    expect(within(inspector).getByText('Job listings')).toBeInTheDocument();
  });

  it('hides the local-discovery-comparison template from the gallery', () => {
    renderRecipesPage();
    expect(screen.queryByTestId('spaces-template-card-local-discovery-comparison')).not.toBeInTheDocument();
  });
});

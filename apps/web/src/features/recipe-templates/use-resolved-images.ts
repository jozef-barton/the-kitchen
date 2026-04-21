import { useEffect, useMemo, useRef, useState } from 'react';
import type { RecipeTemplateImage, RecipeTemplateSection, RecipeTemplateState } from '@hermes-recipes/protocol';
import { resolveImages } from '../../lib/api';

// Walks a template state (recursively through split/tabs) and collects every image query that is still missing a src.
function collectPendingQueries(sections: RecipeTemplateSection[], out: Set<string>): void {
  for (const section of sections) {
    switch (section.kind) {
      case 'image':
        collectFromImage(section.image, out);
        break;
      case 'card-grid':
        for (const card of section.cards) {
          if (card.image) collectFromImage(card.image, out);
        }
        break;
      case 'comparison-table':
        for (const row of section.rows) {
          if (row.leadingImage) collectFromImage(row.leadingImage, out);
        }
        break;
      case 'split':
        collectPendingQueries(section.left, out);
        collectPendingQueries(section.right, out);
        break;
      case 'tabs':
        for (const pane of Object.values(section.panes)) {
          collectPendingQueries(pane, out);
        }
        break;
      default:
        break;
    }
  }
}

function collectFromImage(image: RecipeTemplateImage, out: Set<string>): void {
  if (!image.src && image.query) {
    out.add(image.query.trim());
  }
}

// Returns an image with src filled in from the cache when it was pending. Pure.
function hydrateImage(image: RecipeTemplateImage, cache: Map<string, string>): RecipeTemplateImage {
  if (image.src || !image.query) {
    return image;
  }
  const resolved = cache.get(image.query.trim());
  return resolved ? { ...image, src: resolved } : image;
}

function hydrateSections(sections: RecipeTemplateSection[], cache: Map<string, string>): RecipeTemplateSection[] {
  return sections.map((section) => hydrateSection(section, cache));
}

function hydrateSection(section: RecipeTemplateSection, cache: Map<string, string>): RecipeTemplateSection {
  switch (section.kind) {
    case 'image':
      return { ...section, image: hydrateImage(section.image, cache) };
    case 'card-grid':
      return {
        ...section,
        cards: section.cards.map((card) => (card.image ? { ...card, image: hydrateImage(card.image, cache) } : card))
      };
    case 'comparison-table':
      return {
        ...section,
        rows: section.rows.map((row) =>
          row.leadingImage ? { ...row, leadingImage: hydrateImage(row.leadingImage, cache) } : row
        )
      };
    case 'split':
      return {
        ...section,
        left: hydrateSections(section.left, cache),
        right: hydrateSections(section.right, cache)
      };
    case 'tabs':
      return {
        ...section,
        panes: Object.fromEntries(
          Object.entries(section.panes).map(([key, pane]) => [key, hydrateSections(pane, cache)])
        )
      };
    default:
      return section;
  }
}

export function useResolvedTemplateState(state: RecipeTemplateState | null): RecipeTemplateState | null {
  const [cache, setCache] = useState<Map<string, string>>(() => new Map());
  const inflightRef = useRef<Set<string>>(new Set());

  const pendingQueries = useMemo(() => {
    if (!state) return [];
    const collected = new Set<string>();
    collectPendingQueries(state.sections, collected);
    return Array.from(collected);
  }, [state]);

  useEffect(() => {
    if (pendingQueries.length === 0) {
      return;
    }

    const toFetch = pendingQueries.filter((query) => !cache.has(query) && !inflightRef.current.has(query));
    if (toFetch.length === 0) {
      return;
    }

    toFetch.forEach((query) => inflightRef.current.add(query));

    let cancelled = false;
    void resolveImages(toFetch)
      .then((response) => {
        if (cancelled) return;
        setCache((prev) => {
          const next = new Map(prev);
          for (const result of response.results) {
            if (result.url) {
              next.set(result.query.trim(), result.url);
            }
          }
          return next;
        });
      })
      .catch(() => {
        // Leave images as skeletons on failure; the user can retry by re-rendering.
      })
      .finally(() => {
        toFetch.forEach((query) => inflightRef.current.delete(query));
      });

    return () => {
      cancelled = true;
    };
  }, [cache, pendingQueries]);

  return useMemo(() => {
    if (!state) return null;
    if (cache.size === 0) return state;
    return { ...state, sections: hydrateSections(state.sections, cache) };
  }, [cache, state]);
}

import Image from '@tiptap/extension-image';

export const MediaImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-media-id'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes['mediaId']) return {};
          return { 'data-media-id': attributes['mediaId'] };
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes['alt']) return {};
          return { alt: attributes['alt'] };
        },
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-caption'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes['caption']) return {};
          return { 'data-caption': attributes['caption'] };
        },
      },
      alignment: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-alignment'),
        renderHTML: (attributes: Record<string, unknown>) => {
          const VALID = new Set(['left', 'center', 'right', 'full']);
          if (!attributes['alignment'] || !VALID.has(attributes['alignment'] as string)) return {};
          return { 'data-alignment': attributes['alignment'] };
        },
      },
    };
  },
}).configure({ inline: false, allowBase64: false });

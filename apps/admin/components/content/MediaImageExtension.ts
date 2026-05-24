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
    };
  },
}).configure({ inline: false, allowBase64: false });

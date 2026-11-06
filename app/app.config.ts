export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },

    link: {
      variants: {
        active: {
          true: 'text-primary',
          false: 'text-primary'
        },
        disabled: {
          true: 'cursor-not-allowed opacity-75'
        }
      },
      compoundVariants: [
        {
          active: false,
          disabled: false,
          class: [
            'hover:text-primary',
            'transition-colors'
          ]
        }
      ]
    }
  }
})

import { create } from 'twrnc';

// Create a custom tw instance with Inter font family
const tw = create({
  theme: {
    fontFamily: {
      sans: 'Inter-Regular',
      light: 'Inter-Light',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
      extrabold: 'Inter-ExtraBold',
      black: 'Inter-Black',
    },
  },
});

export default tw;

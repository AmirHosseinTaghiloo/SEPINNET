import Vue from 'vue';
import { Plugin as Tippy } from 'vue-tippy';

Vue.use(Tippy, {
  // تنظیمات پیش‌فرض Tippy.js
  defaultProps: {
    arrow: true,
    animation: 'scale',
    theme: 'light',
  },
});
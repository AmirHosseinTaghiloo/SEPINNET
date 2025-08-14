<template>
  <div class="login-container fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gradient-to-br from-pink-500 to-black">
    <form class="login-form bg-white/10 rounded-lg p-10 shadow-lg text-center w-96 z-10" @submit.prevent="login">
      <div>
        <img class="mx-auto h-[150px]" src="../img/logo-1.png" alt="/" >
      </div>
      <h1 class="text-white mt-5 text-3xl font-semibold mb-8">ورود</h1>

      <div class="input-group mb-5 text-right">
        <label for="phone" class="block text-gray-300 font-bold mb-2">:شماره همراه</label>
        <input
          id="phone"
          v-model="phone"
          type="tel"
          required
          class="w-full px-4 py-3 border border-white/20 rounded-md bg-white/5 text-white text-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
      </div>

      <div class="input-group mb-8 text-right">
        <label for="password" class="block text-gray-300 font-bold mb-2">:رمز عبور</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          class="w-full px-4 py-3 border border-white/20 rounded-md bg-white/5 text-white text-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
      </div>

      <button
        type="submit"
        class="login-button bg-pink-700 hover:bg-pink-800 text-white font-bold py-4 px-8 rounded-md transition-colors duration-300"
      >
        ورود
      </button>
    </form>
  </div>
</template>

<script>
const baseURL = 'http://185.:5000';

export default {
  data() {
    return {
      phone: '',
      password: '',
    };
  },
  methods: {
    async login() {
      try {
        const response = await fetch(`${baseURL}/server/login-admin-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': '',
          },
          body: JSON.stringify({ login_data: this.phone, password: this.password }), // ارسال شماره همراه و رمز عبور
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Login successful:', data);
          localStorage.setItem('phoneNumber', this.phone); // ذخیره شماره همراه
          localStorage.setItem('password', this.password); // ذخیره رمز عبور
          this.$router.push('/checkcode'); // به صفحه چک کد منتقل می‌شود
        } else {
          console.error('Login failed:', data.message);
        }
      } catch (error) {
        console.error('Error during login:', error);
      }
    },
  },
};
</script>

<style scoped>
</style>

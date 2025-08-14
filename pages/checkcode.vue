<template>
  <div class="login-container fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gradient-to-br from-pink-500 to-black">
    <form class="login-form bg-white/10 rounded-lg p-10 shadow-lg text-center w-96 z-10" @submit.prevent="verifyCode">
      <div><img class="mx-auto h-[150px]" src="../img/logo-1.png" alt="/"></div>
      <h1 class="text-white mt-5 text-3xl font-semibold mb-2">تایید کد</h1>
      <p class="text-gray-300 mb-8">کد ۶ رقمی ارسال شده را وارد کنید.</p>

      <div v-if="errorMessage" class="error-message bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-md mb-6">
        {{ errorMessage }}
      </div>

      <div class="input-group mb-5 text-right">
        <label for="code" class="block text-gray-300 font-bold mb-2">:کد تایید</label>
        <input 
          id="code" 
          type="tel" 
          v-model="code"
          @input="handleInput"
          required 
          class="w-full px-4 py-3 border border-white/20 rounded-md bg-white/5 text-white text-lg tracking-[1rem] text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
          maxlength="6"
          autocomplete="one-time-code"
          placeholder="------"
        >
      </div>
      
      <div class="resend-container mb-8 text-sm">
        <button 
          v-if="canResend"
          type="button" 
          @click="resendCode"
          class="bg-transparent text-pink-400 hover:text-pink-300 font-semibold disabled:text-gray-500 disabled:cursor-not-allowed"
          :disabled="isSubmitting"
        >
          ارسال مجدد کد
        </button>
        <p v-else class="text-gray-400">
          ارسال مجدد تا {{ resendCooldown }} ثانیه دیگر
        </p>
      </div>

      <button 
        type="submit" 
        class="login-button w-full bg-pink-700 hover:bg-pink-800 text-white font-bold py-4 px-8 rounded-md transition-colors duration-300 disabled:bg-pink-900 disabled:cursor-wait"
        :disabled="isSubmitting || code.length < 6"
      >
        <span v-if="isSubmitting">درحال بررسی...</span>
        <span v-else>تایید و ورود</span>
      </button>
    </form>
  </div>
</template>

<script>
const baseURL = 'http://185.44.112.7:5000';

export default {
  name: 'CheckCode',
  data() {
    return {
      code: '',
      resendCooldown: 0,
      canResend: false,
      timer: null,
      isSubmitting: false,
      errorMessage: '',
    };
  },
  created() {
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      this.$router.push('/');
    }
    this.startCooldownTimer();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    handleInput(event) {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length > 6) {
        value = value.slice(0, 6);
      }
      this.code = value;
      event.target.value = this.code;
    },

    startCooldownTimer() {
      this.canResend = false;
      this.timer = setInterval(() => {
        if (this.resendCooldown > 0) {
          this.resendCooldown--;
        } else {
          this.canResend = true;
          clearInterval(this.timer);
        }
      }, 1000);
    },

    async resendCode() {
      if (!this.canResend || this.isSubmitting) return;

      this.isSubmitting = true;
      this.errorMessage = '';
      const phone = localStorage.getItem('phoneNumber');

      if (!phone) {
        this.errorMessage = 'اطلاعات ورود یافت نشد. لطفا به صفحه لاگین بازگردید.';
        this.$router.push('/');
        this.isSubmitting = false;
        return;
      }
      
      try {
        const response = await fetch(`${baseURL}/server/login-admin-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': '93c8b887-afb4-46a2-9398-aa88f635cafb',
          },
          body: JSON.stringify({ login_data: phone }),
        });
        
        const data = await response.json();

        if (data && !data.has_error) {
          alert('کد جدید با موفقیت ارسال شد.');
          this.resendCooldown = 60;
          this.startCooldownTimer();
        } else {
          this.errorMessage = `خطا در ارسال مجدد: ${data.message || 'مشکلی پیش آمد.'}`;
        }
      } catch (error) {
        console.error('Error during resending code:', error);
        this.errorMessage = 'خطا در برقراری ارتباط با سرور.';
      } finally {
        this.isSubmitting = false;
      }
    },

    async verifyCode() {
      if (this.code.length < 6) {
          this.errorMessage = 'کد تایید باید ۶ رقمی باشد.';
          return;
      }

      this.isSubmitting = true;
      this.errorMessage = '';
      const phoneNumber = localStorage.getItem('phoneNumber');

      try {
        const response = await fetch(`${baseURL}/server/login-admin-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': '93c8b887-afb4-46a2-9398-aa88f635cafb',
          },
          body: JSON.stringify({ 
            login_data: phoneNumber, 
            code: this.code 
          }),
        });

        const data = await response.json();
        if (data && !data.has_error) {
          console.log('OTP Verification successful:', data);
          
          localStorage.setItem('accessToken', data.payload.access_token);
          localStorage.setItem('refreshToken', data.payload.refresh_token);
          
          this.$router.push('/Users'); 
        } else {
          this.errorMessage = data.message || 'کد وارد شده صحیح نیست.';
          console.error('API returned an error:', data);
        }
      } catch (error) {
        console.error('Error during OTP verification:', error);
        this.errorMessage = 'خطا در ارتباط با سرور.';
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
input[type="tel"] {
  direction: ltr;
}
.error-message {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
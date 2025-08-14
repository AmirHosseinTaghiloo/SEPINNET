<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-pink-500 to-black">
    <UContainer class="py-8">
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold text-white">
          جزئیات تیکت #{{ ticketId }}
        </h1>
        <UButton
   
        >
          بستن تیکت
        </UButton>
      </header>

      <!-- نمایش پیام‌های قبلی -->
      <h2 class="text-xl font-semibold text-white mb-4">پیام‌های قبلی</h2>
      <div class="space-y-6 mb-8">
        <div v-if="isLoading" class="text-center text-white">
          در حال بارگذاری پیام‌ها...
        </div>
        <UCard
          v-for="message in previousMessages"
          :key="message.date"
          class="bg-gradient-to-r from-gray-800 via-pink-500 to-black backdrop-filter backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg p-4"
        >
          <template #header>
            <div class="flex justify-between text-sm text-white">
              <strong
                >{{ message.user_first_name }} {{ message.user_last_name }} ({{
                  message.role
                }})</strong
              >
              <span class="text-gray-300">{{ formatDate(message.date) }}</span>
            </div>
          </template>
          <p class="text-white">{{ message.text }}</p>
        </UCard>
      </div>

      <!-- فرم پاسخ جدید -->
      <UCard
        class="bg-gradient-to-r from-gray-800 via-pink-500 to-black backdrop-filter backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg p-4"
      >
        <template #header>
          <h3 class="font-semibold text-white">پاسخ جدید</h3>
        </template>
        <UFormGroup label="متن پاسخ">
          <UTextarea
            v-model="newReply"
            placeholder="پاسخ خود را اینجا بنویسید..."
            class="bg-gray-700 text-white"
          />
        </UFormGroup>
        <template #footer>
          <UButton
            :loading="isSubmitting"
            class="bg-gradient-to-r from-pink-500 to-black text-white"
            @click="sendReply"
          >
            ارسال پاسخ
          </UButton>
        </template>
      </UCard>
    </UContainer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

const baseURL = "http://185.44.112.7:5000";
const route = useRoute();
const ticketId = route.params.id;

const previousMessages = ref([]); // پیام‌های قبلی
const newReply = ref("");
const isLoading = ref(false);
const isSubmitting = ref(false);

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("توکن یافت نشد. به صفحه اصلی منتقل می‌شوید.");
    window.location.href = "/";
    return null;
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Api-Key": "93c8b887-afb4-46a2-9398-aa88f635cafb",
    "Content-Type": "application/json",
  };
};

const fetchMessages = async () => {
  isLoading.value = true;
  const headers = getAuthHeaders();
  if (!headers) return;

  try {
    const response = await fetch(`${baseURL}/server/ticket-message-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ticket_id: Number(ticketId) }),
    });

    const data = await response.json();
    console.log(data); // بررسی داده‌های دریافتی

    if (data && !data.has_error) {
      previousMessages.value = data.payload.data; // استخراج پیام‌های قبلی
    } else {
      alert("خطا در دریافت پیام‌ها.");
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    alert("خطا در دریافت پیام‌ها.");
  } finally {
    isLoading.value = false;
  }
};

const sendReply = async () => {
  if (!newReply.value.trim()) return;
  isSubmitting.value = true;
  const headers = getAuthHeaders();
  if (!headers) return;

  try {
    const response = await fetch(`${baseURL}/server/support-ticket`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ticket_id: Number(ticketId),
        text: newReply.value,
      }),
    });

    const data = await response.json();
    if (data && !data.has_error) {
      alert("پاسخ شما با موفقیت ثبت شد.");
      newReply.value = "";
      await fetchMessages(); // بازخوانی پیام‌ها برای نمایش پاسخ جدید
    } else {
      alert("خطا در ارسال پاسخ.");
    }
  } catch (error) {
    console.error("Error sending reply:", error);
    alert("خطا در ارسال پاسخ.");
  } finally {
    isSubmitting.value = false;
  }
};


const formatDate = (date) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleString("fa-IR");
};

onMounted(fetchMessages);
</script>

<style scoped>
/* استایل‌های عمومی */
body {
  background: linear-gradient(to right, #0f0c29, #302b63, #24243e);
}

.backdrop-filter {
  backdrop-filter: blur(10px);
}

input,
textarea {
  transition: background-color 0.3s ease;
}

input:focus,
textarea:focus {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
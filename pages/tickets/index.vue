<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-pink-500 to-black">
    <UContainer>
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white">لیست تیکت‌ها</h1>
      </header>

      <!-- فیلترها -->
      <UCard class="mb-8 p-6 shadow-lg bg-white rounded-lg">
        <h2 class="text-xl font-semibold text-primary-500 mb-4">فیلترها</h2>
        <div class="flex gap-4">
          <!-- شماره همراه ادمین -->
          <UFormGroup label="شماره همراه ادمین" class="flex-1">
            <UInput
              v-model="filters.admin_phone"
              label="شماره همراه ادمین"
              placeholder="مثال: 09123456789"
              type="tel"
              maxlength="11"
              @input="validatePhoneInput"
            />
          </UFormGroup>

          <!-- نام خانوادگی ادمین -->
          <UFormGroup label="نام خانوادگی ادمین" class="flex-1">
            <UInput
              v-model="filters.admin_last_name"
              label="نام خانوادگی ادمین"
              placeholder="مثال: محمدی"
            />
          </UFormGroup>

          <!-- دکمه جستجو -->
          <div class="self-end">
            <UButton
              icon="i-heroicons-magnifying-glass"
              @click="applyFilters"
              class="bg-pink-700 text-white hover:bg-pink-800"
            >
              جستجو
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- جدول تیکت‌ها -->
      <UCard>
        <UTable :rows="tickets" :columns="columns" :loading="isLoading">
          <template #actions-data="{ row }">
            <UButton
              variant="ghost"
              icon="i-heroicons-eye"
              @click="viewTicket(row.id)"
              class="text-blue-500 hover:text-blue-700"
            >
              مشاهده
            </UButton>
          </template>
          <template #status-data="{ row }">
            <UBadge :color="row.status === 'open' ? 'green' : 'gray'">{{ row.status }}</UBadge>
          </template>
        </UTable>
      </UCard>
    </UContainer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from 'vue-router'; // برای ناوبری به تیکت‌ها

const router = useRouter();

const baseURL = "http://185.44.112.7:5000";

const tickets = ref([]);
const isLoading = ref(false);
const filters = reactive({
  admin_phone: "",
  admin_last_name: "",
  page: 1,
  page_length: 15,
  excel: false,
});

const columns = [
  { id: "id", key: "id", label: "شناسه تیکت" },
  { id: "subject", key: "subject", label: "موضوع" },
  { id: "user", key: "user", label: "کاربر" },
  { id: "status", key: "status", label: "وضعیت" },
  { id: "actions", key: "actions", label: "عملیات" },
];

// متد دریافت لیست تیکت‌ها
const fetchTickets = async () => {
  isLoading.value = true;
  const accessToken = localStorage.getItem("accessToken");
  const params = new URLSearchParams(filters);

  try {
    const data = await $fetch(
      `${baseURL}/server/get-ticket-list/?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Api-Key": "93c8b887-afb4-46a2-9398-aa88f635cafb",
        },
      }
    );
      console.log(data)
    if (data && !data.has_error) {
      tickets.value = data.payload.items;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    alert(`خطا: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

// متد جستجو با فیلترها
const applyFilters = () => {
  // اطمینان از این‌که شماره تلفن فقط شامل عدد است و طول آن 11 رقم است
  if (!/^\d{11}$/.test(filters.admin_phone)) {
    alert("خطا: شماره همراه باید دقیقا 11 رقم باشد و فقط شامل عدد باشد.");
    return;
  }

  // اگر همه چیز درست است، تیکت‌ها را دریافت می‌کنیم
  fetchTickets();
};

// متد مشاهده تیکت
const viewTicket = (ticketId) => {
  router.push(`/tickets/${ticketId}`);
};

// متد برای جلوگیری از ورود کاراکترهای غیرعددی
const validatePhoneInput = (event) => {
  let value = event.target.value;
  // فقط اعداد نگه می‌دارد
  value = value.replace(/[^0-9]/g, '');
  // محدود کردن طول به 11 کاراکتر
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  filters.admin_phone = value;
};

onMounted(fetchTickets);
</script>

<style scoped>
/* اضافه کردن استایل‌های سفارشی در صورت نیاز */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
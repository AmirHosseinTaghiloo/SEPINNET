<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-pink-500 to-black">
    <UContainer class="py-8">
      <header class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-white">لیست کاربران</h1>
        <p class="text-gray-300 mt-1">کاربران سیستم را مدیریت و مشاهده کنید.</p>
      </header>

      <UCard class="mb-8 bg-gradient-to-br from-pink-500 to-black backdrop-filter backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg">
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-white">فیلترها</h3>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UFormGroup label="شماره همراه" :ui="{ label: { base: 'text-gray-300' } }">
            <UInput v-model="filters.user_phone" placeholder="مثال: 0912..." icon="i-heroicons-phone" class="bg-gray-800 text-white" />
          </UFormGroup>
          <UFormGroup label="نام خانوادگی" :ui="{ label: { base: 'text-gray-300' } }">
            <UInput v-model="filters.user_last_name" placeholder="مثال: محمدی" icon="i-heroicons-user" class="bg-gray-800 text-white" />
          </UFormGroup>
          <UFormGroup label="از تاریخ" :ui="{ label: { base: 'text-gray-300' } }">
            <UInput v-model="filters.start_date" type="date" class="bg-gray-800 text-white" />
          </UFormGroup>
          <UFormGroup label="تا تاریخ" :ui="{ label: { base: 'text-gray-300' } }">
            <UInput v-model="filters.end_date" type="date" class="bg-gray-800 text-white" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="white" icon="i-heroicons-x-mark" variant="ghost" @click="resetFilters">پاک کردن</UButton>
            <UButton icon="i-heroicons-magnifying-glass" @click="applyFilters">اعمال فیلتر</UButton>

            <div class="relative inline-block mt-2">
              <UButton
                variant="solid"
                color="primary"
                icon="i-heroicons-arrow-path"
                @click="fetchUsers"
              />
              <span class="tooltip"></span>
            </div>

            <!-- دکمه خروجی اکسل به صورت مستطیل و سبز رنگ -->
            <button class="excel-icon-button flex items-center" @click="exportToExcel">
              <i class="i-heroicons-document-download text-white mr-2"></i>
              اکسل
            </button>
          </div>
        </template>
      </UCard>

      <!-- نمایش اطلاعات کاربران -->
      <UCard class="mt-8 bg-gradient-to-br from-pink-500 to-black backdrop-filter backdrop-blur-lg border border-gray-700 rounded-lg shadow-lg">
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-white">اطلاعات کاربران</h3>
        </template>

        <div class="user-list">
          <template v-if="formattedUsers.length > 0">
            <ul>
              <li v-for="(user, index) in formattedUsers" :key="index" class="user-item bg-gradient-to-br from-pink-700 to-black p-4 rounded-lg mb-4 shadow-lg">
                <p class="text-white"><strong>نام:</strong> {{ user.full_name }}</p>
                <p class="text-white"><strong>شماره همراه:</strong> {{ user.phone_number || 'نامشخص' }}</p>
                <p class="text-white"><strong>تاریخ ثبت‌نام:</strong> {{ formatTimestamp(user.created_at) }}</p>
                <p class="text-white"><strong>وضعیت:</strong> {{ user.is_active ? 'فعال' : 'غیرفعال' }}</p>
              </li>
            </ul>
          </template>
          <template v-else>
            <p class="no-data text-white">کاربری یافت نشد!</p>
          </template>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx'; // استفاده از کتابخانه برای خروجی اکسل

const baseURL = 'http://185.:5000';
const toast = useToast();

const users = ref([]);
const isLoading = ref(false);

const filters = reactive({
  user_phone: '',
  user_last_name: '',
  start_date: '',
  end_date: '',
});

const page = ref(1);
const pageCount = ref(15);
const totalUsers = ref(0);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const columns = [
  { id: 'full_name', key: 'full_name', label: 'نام و نام خانوادگی' },
  { id: 'phone_number', key: 'username', label: 'شماره همراه' },
  { id: 'created_at', key: 'created_at', label: 'تاریخ ثبت‌نام' },
  { id: 'is_active', key: 'is_active', label: 'وضعیت' },
];

// محاسبه کاربران فرمت‌بندی‌شده
const formattedUsers = computed(() => {
  return users.value.map(user => ({
    full_name: `${user.first_name} ${user.last_name}`,
    phone_number: user.username,
    created_at: user.created_at,
    is_active: user.is_verified,
  }));
});

const applyFilters = () => {
  page.value = 1;
  fetchUsers();
};

const resetFilters = () => {
  Object.keys(filters).forEach(key => filters[key] = '');
  applyFilters();
};

const fetchUsers = async () => {
  isLoading.value = true;

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    toast.add({ title: 'خطا', description: 'توکن دسترسی یافت نشد. لطفا دوباره وارد شوید.', color: 'red' });
    navigateTo('/');
    return;
  }

  const params = new URLSearchParams();
  params.append('page', page.value);
  params.append('page_length', pageCount.value);

  if (filters.user_phone) {
    params.append('user_phone', filters.user_phone);
  }
  if (filters.user_last_name) {
    params.append('user_last_name', filters.user_last_name);
  }
  if (filters.start_date) {
    params.append('start_date', new Date(filters.start_date).getTime());
  }
  if (filters.end_date) {
    params.append('end_date', filters.end_date ? new Date(filters.end_date).getTime() : new Date().getTime());
  }

  try {
    const response = await $fetch(`${baseURL}/server/get-users-list/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': '',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Response from server:', response);
    if (response && !response.has_error) {
      users.value = response.payload.data || [];
      totalUsers.value = response.payload.total_records || 0;
      page.value = response.payload.current_page || 1;
    } else {
      console.error('Error in response:', response.message || 'Unknown error');
    }
  } catch (error) {
    toast.add({ title: 'خطا', description: error.message || 'مشکلی در ارتباط با سرور پیش آمد.', color: 'red' });
    users.value = [];
    totalUsers.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// ایجاد خروجی اکسل
const exportToExcel = () => {
  if (formattedUsers.value.length === 0) {
    toast.add({ title: 'خطا', description: 'هیچ کاربری برای صادرات وجود ندارد.', color: 'red' });
    return;
  }

  const ws = XLSX.utils.json_to_sheet(formattedUsers.value); // تبدیل داده‌ها به شیت اکسل
  const wb = XLSX.utils.book_new(); // ایجاد کتاب اکسل
  XLSX.utils.book_append_sheet(wb, ws, "Users"); // افزودن شیت به کتاب
  XLSX.writeFile(wb, "users.xlsx"); // ذخیره فایل اکسل
};

onMounted(() => {
  fetchUsers();
});

watch(page, () => {
  fetchUsers();
});

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Number(timestamp)));
};
</script>

<style>
.excel-icon-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem; /* برای مستطیل کردن */
  background-color: #00C16A; /* رنگ سبز */
  color: white;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.excel-icon-button:hover {
  background-color: #059669; /* رنگ دکمه در حالت هاور */
}

.user-list {
  background: #f8fafc; /* رنگ پس‌زمینه لیست کاربران */
  padding: 1rem;
  border-radius: 0.5rem;
}

.user-item {
  margin-bottom: 1rem;
}

.no-data {
  text-align: center;
  font-size: 1rem;
  color: #6b7280; /* رنگ متن در صورت عدم وجود کاربر */
}
</style>

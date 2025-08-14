<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-pink-500 to-black">
      <UContainer class="py-8">
          <header class="mb-8">
              <h1 class="text-3xl font-bold text-primary-500 dark:text-primary-400">لیست تراکنش‌ها</h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">تراکنش‌های کاربران را جستجو و مشاهده کنید.</p>
          </header>

          <!-- بخش فیلترها -->
          <UCard class="mb-8">
              <template #header>
                  <h3 class="text-base font-semibold">فیلترها</h3>
              </template>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <UFormGroup label="شماره همراه کاربر">
                      <UInput v-model="filters.user_phone" placeholder="0912..." icon="i-heroicons-phone" />
                  </UFormGroup>

                  <UFormGroup label="نوع لیست">
                      <USelectMenu v-model="filters.which_list" :options="whichListOptions" placeholder="انتخاب کنید" />
                  </UFormGroup>

                  <UFormGroup label="نوع پرداخت">
                      <USelectMenu v-model="filters.payment_type" :options="paymentTypeOptions" multiple placeholder="همه انواع" />
                  </UFormGroup>

                  <UFormGroup label="وضعیت تراکنش">
                      <USelectMenu v-model="filters.status" :options="statusOptions" multiple placeholder="همه وضعیت‌ها" />
                  </UFormGroup>

                  <!-- فیلترهای شرطی -->
                  <UFormGroup label="سرویس‌دهنده (Provider)">
                      <USelectMenu 
                          v-model="filters.providers" 
                          :options="providerOptions" 
                          multiple 
                          placeholder="انتخاب سرویس‌دهنده"
                          :disabled="!!filters.service_codes.length"
                      />
                  </UFormGroup>

                  <UFormGroup label="کد سرویس">
                      <USelectMenu 
                          v-model="filters.service_codes" 
                          :options="serviceCodeOptions" 
                          multiple 
                          placeholder="انتخاب کد سرویس"
                          :disabled="!!filters.providers.length"
                      />
                  </UFormGroup>

                  <UFormGroup label="از تاریخ">
                      <UInput v-model="filters.start_date" type="date" />
                  </UFormGroup>

                  <UFormGroup label="تا تاریخ">
                      <UInput v-model="filters.end_date" type="date" />
                  </UFormGroup>
              </div>

              <template #footer>
                  <div class="flex justify-end gap-3">
                      <UButton @click="resetFilters" color="gray" variant="ghost" icon="i-heroicons-x-mark">پاک کردن</UButton>
                      <UButton @click="applyFilters" icon="i-heroicons-magnifying-glass">اعمال فیلتر</UButton>
                      <div class="tooltip-wrapper">
                          <UButton 
                              @click="exportToExcel" 
                              color="green" 
                              icon="i-heroicons-document-arrow-down"
                              :loading="isExporting"
                              :disabled="isExportDisabled"
                          >
                              خروجی اکسل
                          </UButton>
                          <span v-if="isExportDisabled" class="tooltip">لطفا بازه زمانی را مشخص کنید</span>
                      </div>
                  </div>
              </template>
          </UCard>

          <!-- جدول تراکنش‌ها -->
          <UCard>
              <UTable 
                  :rows="transactions" 
                  :columns="columns" 
                  :loading="isLoading"
                  :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'درحال بارگذاری...' }"
              >
              </UTable>
              <template #footer>
                  <div class="flex justify-end">
                      <UPagination v-model="page" :page-count="pageCount" :total="totalItems" />
                  </div>
              </template>
          </UCard>
      </UContainer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';

const baseURL = 'http://185.:5000';
const toast = useToast();

// State
const transactions = ref([]);
const isLoading = ref(false);
const isExporting = ref(false);

const filters = reactive({
    user_phone: '',
    which_list: 'main',
    excel: false,
    providers: [],
    service_codes: [],
    start_date: '',
    end_date: '',
    status: [],
    payment_type: [],
});

const page = ref(1);
const pageCount = ref(15);
const totalItems = ref(0);

// Options for Select Menus
const whichListOptions = ['total', 'main', 'ipg'];
const statusOptions = ['confirm', 'fail', 'pending', 'expired'];
const paymentTypeOptions = ['send', 'receive', 'pay'];
const serviceCodeOptions = reactive([]);

// Conditional provider options
const providerOptions = computed(() => {
    if (filters.which_list === 'ipg') {
        return ['sepnex', 'ghabzino', 'api24', 'bmi', 'zarinpal'];
    }
    return ['bmi', 'zarinpal'];
});

// Enforce only one of providers or service_codes
watch(() => filters.providers, (newVal) => {
    if (newVal && newVal.length > 0) filters.service_codes = [];
});
watch(() => filters.service_codes, (newVal) => {
    if (newVal && newVal.length > 0) filters.providers = [];
});

const isExportDisabled = computed(() => !filters.start_date || !filters.end_date);

const columns = [
    { id: 'id', key: 'id', label: 'شناسه' },
    { id: 'amount', key: 'amount', label: 'مبلغ' },
    { id: 'status', key: 'status', label: 'وضعیت' },
    { id: 'payment_type', key: 'payment_type', label: 'نوع پرداخت' },
    { id: 'created_at', key: 'created_at', label: 'تاریخ' },
];

// متد fetchTransactions
const fetchTransactions = async () => {
    isLoading.value = true;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        toast.add({ title: 'خطا', description: 'توکن یافت نشد.', color: 'red' });
        return navigateTo('/');
    }

    const body = { ...filters, page: page.value };
    if (filters.start_date) body.start_date = new Date(filters.start_date).getTime();
    if (filters.end_date) body.end_date = new Date(filters.end_date).getTime();

    try {
        const response = await $fetch(`${baseURL}/server/transactions-list`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Api-Key': '',
            },
            body,
        });
        console.log(response)

        transactions.value = response.data;
        pageCount.value = response.meta.page_count;
        totalItems.value = response.meta.total_items;
    } catch (error) {
        toast.add({ title: 'خطا', description: error.message, color: 'red' });
    } finally {
        isLoading.value = false;
    }
};

// متد applyFilters
const applyFilters = () => {
    page.value = 1;
    fetchTransactions();
};

// متد resetFilters
const resetFilters = () => {
    Object.keys(filters).forEach(key => {
        if (Array.isArray(filters[key])) filters[key] = [];
        else filters[key] = '';
    });
    filters.which_list = 'main';
    applyFilters();
};

// اجرای fetchTransactions هنگام mount شدن کامپوننت
onMounted(fetchTransactions);

// نظارت بر تغییر صفحه و اجرای fetchTransactions
watch(page, fetchTransactions);
</script>

<style scoped>
.tooltip-wrapper {
position: relative;
display: inline-block;
}

.tooltip {
visibility: hidden;
position: absolute;
background-color: rgba(0, 0, 0, 0.75);
color: #fff;
padding: 0.5rem;
border-radius: 0.25rem;
font-size: 0.75rem;
top: -2.5rem;
left: 50%;
transform: translateX(-50%);
white-space: nowrap;
z-index: 1000;
}

.tooltip-wrapper:hover .tooltip {
visibility: visible;
}
</style>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="text-center text-3xl font-extrabold text-gray-900">
        日常發票載具之個人碳足跡系統
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        【使用者註冊會員】
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
        <!-- 註冊表單 -->
        <form class="space-y-6" @submit.prevent="handleRegister">
          
          <!-- 1. 輸入帳號 (手機號碼) -->
          <div>
            <label class="block text-sm font-medium text-gray-700">帳號 (手機號碼)</label>
            <div class="mt-1">
              <input 
                type="text" 
                v-model="form.phone" 
                required 
                placeholder="請輸入手機號碼"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 2. 輸入密碼 -->
          <div>
            <label class="block text-sm font-medium text-gray-700">密碼</label>
            <div class="mt-1">
              <input 
                type="password" 
                v-model="form.password" 
                required 
                placeholder="請設定密碼"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 3. 基本資料 (暱稱) -->
          <div>
            <label class="block text-sm font-medium text-gray-700">基本資料 (暱稱)</label>
            <div class="mt-1">
              <input 
                type="text" 
                v-model="form.nickname" 
                required 
                placeholder="請輸入您的暱稱"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <!-- 4. 選擇身分 -->
          <div>
            <label class="block text-sm font-medium text-gray-700">選擇身分</label>
            <div class="mt-1">
              <select 
                v-model="form.role" 
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
              >
                <option value="general">一般民眾（消費者）</option>
                <option value="admin">系統管理者</option>
              </select>
            </div>
          </div>

          <!-- 錯誤訊息提示 -->
          <div v-if="errorMessage" class="text-red-600 text-sm bg-red-50 p-2 rounded">
            {{ errorMessage }}
          </div>

          <!-- 5. 按下確認 -->
          <div>
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              確認註冊
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  phone: '',
  password: '',
  nickname: '',
  role: 'general'
})

const errorMessage = ref('')

const handleRegister = () => {
  errorMessage.value = ''
  if (form.phone === '0912345678') {
    errorMessage.value = '例外狀況：此手機號碼已被註冊過！'
    return
  }
  alert('註冊成功！')
}
</script>
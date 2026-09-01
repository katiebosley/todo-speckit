<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const user = ref(Utils.getStore("user"));
const loggingOut = ref(false);

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.length ? parts.join(" ") : user.value.username ?? "";
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

const handleLogout = async () => {
  loggingOut.value = true;

  try {
    await authServices.logoutUser();
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>

    <v-spacer />

    <template v-if="user">
      <span class="text-body-2 me-3">{{ displayName }}</span>
      <v-btn
        variant="text"
        color="white"
        class="oc-cta"
        :loading="loggingOut"
        @click="handleLogout"
      >
        Sign out
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import { emailRules } from "../config/validation.js";

const user = ref(Utils.getStore("user"));
const loggingOut = ref(false);
const menuOpen = ref(false);
const editDialogOpen = ref(false);
const editForm = ref(null);
const saveLoading = ref(false);
const dialogError = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.length ? parts.join(" ") : user.value.username ?? "";
});

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

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

const fillFormFromUser = (profile) => {
  fName.value = profile?.fName ?? "";
  lName.value = profile?.lName ?? "";
  email.value = profile?.email ?? "";
  username.value = profile?.username ?? "";
  password.value = "";
  confirmPassword.value = "";
};

const openEditDialog = () => {
  dialogError.value = "";
  fillFormFromUser(user.value);
  menuOpen.value = false;
  editDialogOpen.value = true;
};

const closeEditDialog = () => {
  editDialogOpen.value = false;
  dialogError.value = "";
};

const persistUpdatedUser = (updated) => {
  const current = Utils.getStore("user") || {};
  Utils.setStore("user", {
    ...current,
    userId: updated.id ?? current.userId,
    username: updated.username,
    email: updated.email,
    fName: updated.fName,
    lName: updated.lName,
    role: updated.role ?? current.role,
  });
  window.dispatchEvent(new CustomEvent("user-logged-in"));
};

const handleSave = async () => {
  dialogError.value = "";
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  saveLoading.value = true;

  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };

    if (password.value) {
      payload.password = password.value;
    }

    const response = await userServices.updateUser(user.value.userId, payload);
    persistUpdatedUser(response.data);
    closeEditDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    saveLoading.value = false;
  }
};

const handleLogout = async () => {
  loggingOut.value = true;
  menuOpen.value = false;

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
      <v-menu v-model="menuOpen">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-account-circle"
            variant="text"
            color="white"
            aria-label="Open profile"
          />
        </template>

        <v-card min-width="240" rounded="lg">
          <v-list>
            <v-list-item :title="displayName">
              <template #subtitle>
                <div>{{ user.username }}</div>
                <div>{{ user.email }}</div>
              </template>
            </v-list-item>
          </v-list>

          <v-card-actions class="px-4 pb-2">
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openEditDialog"
            >
              Edit Profile
            </v-btn>
          </v-card-actions>

          <v-list>
            <v-list-item
              title="Log out"
              :disabled="loggingOut"
              @click="handleLogout"
            />
          </v-list>
        </v-card>
      </v-menu>
    </template>
  </v-app-bar>

  <v-dialog v-model="editDialogOpen" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-form ref="editForm" @submit.prevent="handleSave">
          <v-text-field
            v-model="fName"
            label="First name"
            density="comfortable"
            :rules="fNameRules"
          />
          <v-text-field
            v-model="lName"
            label="Last name"
            density="comfortable"
            :rules="lNameRules"
          />
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            density="comfortable"
            :rules="emailRules"
          />
          <v-text-field
            v-model="username"
            label="Username"
            density="comfortable"
            :rules="usernameRules"
          />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            density="comfortable"
            autocomplete="new-password"
            :rules="passwordRules"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            density="comfortable"
            autocomplete="new-password"
            :rules="confirmPasswordRules"
          />
        </v-form>

        <v-alert v-if="dialogError" type="error" density="compact" class="mt-2">
          {{ dialogError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeEditDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saveLoading"
          @click="handleSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const storedUser = {
  userId: 42,
  username: "jdoe",
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

describe("Feature 4 — MenuBar profile", () => {
  const mountedWrappers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", storedUser);
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    document.body.innerHTML = "";
  });

  const MenuBarHarness = defineComponent({
    components: { MenuBar },
    template: "<v-app><MenuBar /></v-app>",
  });

  async function mountMenuBar() {
    const { wrapper } = await mountWithPlugins(MenuBarHarness, {
      attachTo: document.body,
    });
    mountedWrappers.push(wrapper);
    await flushPromises();
    return wrapper.findComponent(MenuBar);
  }

  function pageText() {
    return document.body.textContent ?? "";
  }

  async function clickAriaLabel(label) {
    const button = document.body.querySelector(`[aria-label="${label}"]`);
    expect(button).not.toBeNull();
    button.click();
    await flushPromises();
  }

  async function clickBodyButton(text) {
    const button = [...document.body.querySelectorAll("button")].find(
      (btn) => btn.textContent?.trim() === text
    );
    expect(button).toBeDefined();
    button.click();
    await flushPromises();
  }

  async function openProfileMenu() {
    await clickAriaLabel("Open profile");
  }

  async function openEditDialog() {
    await openProfileMenu();
    await clickBodyButton("Edit Profile");
  }

  function getField(wrapper, label) {
    return wrapper
      .findAllComponents({ name: "VTextField" })
      .find((field) => field.props("label") === label);
  }

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await mountMenuBar();
      await openProfileMenu();

      expect(pageText()).toContain("Jane Doe");
      expect(pageText()).toContain("jdoe");
      expect(pageText()).toContain("jane@example.com");
      expect(pageText()).toContain("Edit Profile");
      expect(pageText()).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog();

      expect(pageText()).toContain("Edit Profile");
      expect(getField(wrapper, "First name").props("modelValue")).toBe("Jane");
      expect(getField(wrapper, "Last name").props("modelValue")).toBe("Doe");
      expect(getField(wrapper, "Email").props("modelValue")).toBe("jane@example.com");
      expect(getField(wrapper, "Username").props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog();

      await getField(wrapper, "First name").setValue("Janet");
      await clickBodyButton("Cancel");

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });
      expect(wrapper.findComponent({ name: "VDialog" }).props("modelValue")).toBe(false);
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          id: 42,
          fName: "Janet",
          lName: "Doer",
          email: "janet@example.com",
          username: "janetd",
          role: "worker",
        },
      });

      const wrapper = await mountMenuBar();
      await openEditDialog();

      await getField(wrapper, "First name").setValue("Janet");
      await getField(wrapper, "Last name").setValue("Doer");
      await getField(wrapper, "Email").setValue("janet@example.com");
      await getField(wrapper, "Username").setValue("janetd");
      await clickBodyButton("Save");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalledWith(42, {
        fName: "Janet",
        lName: "Doer",
        email: "janet@example.com",
        username: "janetd",
      });
      expect(wrapper.findComponent({ name: "VDialog" }).props("modelValue")).toBe(false);
      expect(Utils.getStore("user")).toMatchObject({
        userId: 42,
        fName: "Janet",
        lName: "Doer",
        email: "janet@example.com",
        username: "janetd",
        token: "test-token",
      });

      await openProfileMenu();
      expect(pageText()).toContain("Janet Doer");
      expect(pageText()).toContain("janetd");
      expect(pageText()).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog();

      await getField(wrapper, "Email").setValue("notanemail");
      await clickBodyButton("Save");
      await flushPromises();

      expect(pageText()).toContain("Enter a valid email address.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog();

      await getField(wrapper, "New password").setValue("password123");
      await getField(wrapper, "Confirm password").setValue("different1");
      await clickBodyButton("Save");
      await flushPromises();

      expect(pageText()).toContain("Passwords do not match.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog();

      await getField(wrapper, "New password").setValue("short");
      await getField(wrapper, "Confirm password").setValue("short");
      await clickBodyButton("Save");
      await flushPromises();

      expect(pageText()).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      const wrapper = await mountMenuBar();
      await openEditDialog();
      await clickBodyButton("Save");
      await flushPromises();

      expect(pageText()).toContain("Username is already taken.");
      expect(wrapper.findComponent({ name: "VAlert" }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: "VDialog" }).props("modelValue")).toBe(true);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      await mountMenuBar();
      await openProfileMenu();

      const logoutItem = [...document.body.querySelectorAll(".v-list-item")].find((item) =>
        item.textContent.includes("Log out")
      );
      expect(logoutItem).toBeDefined();
      logoutItem.click();
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const wrapper = await mountMenuBar();

      expect(wrapper.text()).not.toContain("Sign out");
      expect(pageText()).not.toContain("Sign out");
    });
  });
});

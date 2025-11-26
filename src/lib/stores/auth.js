import { defineStore } from "pinia";
import { getMe } from "../api/auth.api";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: null,
        hydrated: false,
    }),
    getters: {
        role: (state) => state.user?.role || null,
        isAuthed: (state) => !!state.user,
    },
    actions: {
        setUser(user) {
            this.user = user;
        },
        logout() { 
            this.user = null; 
            this.hydrated = false; 
        },
        async hydrate() {
            try {
                const me = await getMe();
                this.user = me;
            } catch {
                this.user = null;
            } finally {
                this.hydrated = true;
            }
        }
    },
});
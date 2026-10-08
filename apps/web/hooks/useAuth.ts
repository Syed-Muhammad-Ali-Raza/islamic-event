import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string; redirectTo?: string }) =>
      authService.login({ email: data.email, password: data.password }),
    onSuccess: (result, variables) => {
      login(result.user, result.accessToken, result.refreshToken);
      queryClient.invalidateQueries();
      router.push(variables.redirectTo ?? "/");
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; phone?: string }) =>
      authService.register(data),
    onSuccess: (result) => {
      login(result.user, result.accessToken, result.refreshToken);
      router.push("/");
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      router.push("/");
    },
  });
}

export function useUpdateProfile() {
  const { setUser, user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; phone?: string }) => authService.updateProfile(data),
    onSuccess: (updated) => {
      setUser({ ...user!, ...updated });
      queryClient.invalidateQueries();
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { currentPassword: string; password: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

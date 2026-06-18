import { authService } from '../../api';
import useAuthStore from '../../store/authStore';
import { useAppStore } from '../store/appStore';

export const clearClientSession = async () => {
    await authService.logout();
    useAuthStore.getState().logout();
    useAppStore.getState().resetSession();
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AppActions, User, UserRating, Restaurant } from '../types';

interface ScrollEatsStore extends AppState, AppActions {
  lastSpecialBoomUsed?: Date;
  canUseSpecialBoom: () => boolean;
}

const initialState: Omit<AppState, keyof AppActions> = {
  user: null,
  currentLocation: null,
  restaurants: [],
  userRatings: [],
  favorites: [],
  isLoading: false,
  error: null,
  currentIndex: 0,
  hasMore: true,
};

export const useScrollEatsStore = create<ScrollEatsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user: User | null) => set({ user }),

      setCurrentLocation: (location: { latitude: number; longitude: number }) =>
        set({ currentLocation: location }),

      addRestaurants: (newRestaurants: Restaurant[]) =>
        set((state) => ({
          restaurants: [...state.restaurants, ...newRestaurants],
        })),

      setRestaurants: (newRestaurants: Restaurant[]) => set({ restaurants: newRestaurants }),

      clearRestaurants: () => set({ restaurants: [] }),

      addUserRating: (rating: UserRating) =>
        set((state) => ({
          userRatings: [
            ...state.userRatings.filter((r) => r.restaurantId !== rating.restaurantId),
            rating,
          ],
        })),

      toggleFavorite: (restaurantId: string) =>
        set((state) => ({
          favorites: state.favorites.includes(restaurantId)
            ? state.favorites.filter((id) => id !== restaurantId)
            : [...state.favorites, restaurantId],
        })),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),

      setCurrentIndex: (currentIndex: number) => set({ currentIndex }),

      setHasMore: (hasMore: boolean) => set({ hasMore }),

      resetState: () => set(initialState),

      canUseSpecialBoom: () => {
        // For demo purposes, always allow special boom
        return true;
      },
    }),
    {
      name: 'scrolleats-storage',
      partialize: (state) => ({
        user: state.user,
        userRatings: state.userRatings,
        favorites: state.favorites,
        currentLocation: state.currentLocation,
        lastSpecialBoomUsed: state.lastSpecialBoomUsed,
      }),
    }
  )
); 
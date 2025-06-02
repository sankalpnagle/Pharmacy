import { useLoading } from "@/context/LoadingContext";
import { useState } from "react";

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export const useApi = <T>() => {
  const { showLoader, hideLoader } = useLoading();
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = async (
    promise: Promise<T>,
    showLoadingUI: boolean = true
  ): Promise<T | null> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    if (showLoadingUI) showLoader();

    try {
      const data = await promise;
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false,
      });
      return null;
    } finally {
      if (showLoadingUI) hideLoader();
    }
  };

  return {
    ...state,
    execute,
  };
};

import { useState, useEffect } from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import useCancelTokenSource from "./use-cancel-token-source";

interface useAxiosRequestOptions<T> {
  defaultIsLoading?: boolean;
  defaultData?: T;
  immediate?: boolean;
  onError?: (error: any) => any;
  onCancelled?: (error: any) => any;
}

const useAxiosRequest = <T = any>(
  requestCallback: (
    cancelTokenConfig: AxiosRequestConfig
  ) => Promise<AxiosResponse>,
  options: useAxiosRequestOptions<T> = {}
) => {
  const cancelTokenSource = useCancelTokenSource();

  const { defaultIsLoading, defaultData, immediate, onError, onCancelled } =
    Object.assign(
      {
        defaultIsLoading: true,
        immediate: false,
      },
      options
    );

  const [state, setState] = useState({
    isLoading: defaultIsLoading,
    data: defaultData,
  });

  const executeRequest = async (): Promise<T | undefined> => {
    if (state.isLoading) return;

    try {
      setState((prev) => ({
        isLoading: true,
        data: prev.data,
      }));

      const { data } = await requestCallback({
        cancelToken: cancelTokenSource.token,
      });

      setState({
        isLoading: false,
        data,
      });

      return data;
    } catch (error) {
      if (cancelTokenSource.isCancelError(error)) {
        onCancelled && onCancelled(error);
      } else if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    immediate && executeRequest();
  }, []);

  return {
    ...state,
    execute: executeRequest,
  };
};

export default useAxiosRequest;

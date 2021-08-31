import { useState, useEffect } from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import useCancelTokenSource from "./use-cancel-token-source";

export interface useAxiosRequestOptions<TResponse, TData> {
  /**
   * @default true
   */
  defaultIsLoading?: boolean;
  /**
   * @default undefined
   */
  defaultData?: TData;
  /**
   * If the request should be executed immediately after the component is mounted.
   * @default true
   */
  immediate?: boolean;
  /**
   * If the previous request should be cancelled before executing a new one.
   * @default true
   */
  cancelPrevious?: boolean;
  middleware?: (response: AxiosResponse<TResponse>, prevData?: TData) => TData;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onCancelled?: (error: any) => void;
}

const useAxiosRequest = <TResponse = any, TData = TResponse>(
  requestCallback: (
    cancelTokenConfig: AxiosRequestConfig
  ) => Promise<AxiosResponse<TResponse>>,
  options: useAxiosRequestOptions<TResponse, TData> = {}
) => {
  const {
    defaultIsLoading,
    defaultData,
    immediate,
    cancelPrevious,
    middleware,
    onSuccess,
    onError,
    onCancelled,
  } = Object.assign(
    {
      defaultIsLoading: true,
      immediate: true,
      cancelPrevious: true,
    },
    options
  );

  const [state, setState] = useState({
    isLoading: defaultIsLoading,
    data: defaultData,
    executed: false,
  });

  const { token, cancel, isCancelError } = useCancelTokenSource({
    repeatable: cancelPrevious,
  });

  const execute = async () => {
    const cancelToken = cancelPrevious ? cancel() : token;

    try {
      setState((prev) => ({
        isLoading: true,
        data: prev.data,
        executed: prev.executed,
      }));

      const response = await requestCallback({ cancelToken });

      setState((prev) => {
        const nextData = middleware
          ? middleware(response, prev.data)
          : (response.data as unknown as TData);
        return {
          isLoading: false,
          data: nextData,
          executed: true,
        };
      });

      onSuccess && onSuccess();
    } catch (error) {
      if (isCancelError(error)) {
        onCancelled && onCancelled(error);
      } else if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    immediate && execute();
  }, []);

  return {
    ...state,
    execute,
  };
};

export default useAxiosRequest;

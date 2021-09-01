import { useState, useEffect } from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import useCancelTokenSource from "./use-cancel-token-source";

export interface UseAxiosRequestOptions<T> {
  /**
   * @default false
   */
  defaultIsExecuting?: boolean;
  /**
   * If the request should be executed immediately.
   * @default true
   */
  immediate?: boolean;
  /**
   * If the previous request should be cancelled before executing a new one.
   * @default true
   */
  cancelPrevious?: boolean;
  onSuccess?: (response: AxiosResponse<T>) => void;
  onError?: (error: any) => void;
  onCancelled?: (error: any) => void;
}

const useAxiosRequest = <T = any>(
  requestCallback: (
    cancelTokenConfig: AxiosRequestConfig
  ) => Promise<AxiosResponse<T>>,
  options: UseAxiosRequestOptions<T> = {}
) => {
  const {
    defaultIsExecuting,
    immediate,
    cancelPrevious,
    onSuccess,
    onError,
    onCancelled,
  } = Object.assign(
    {
      defaultIsExecuting: false,
      immediate: true,
      cancelPrevious: true,
    },
    options
  );

  const [state, setState] = useState({
    /**
     * If the request is still begin executed.
     */
    isExecuting: immediate ? true : defaultIsExecuting,
    /**
     * How many times has the request been successfully executed.
     */
    successCounter: 0,
  });

  const { cancel, isCancelError } = useCancelTokenSource();

  const execute = async () => {
    const cancelToken = cancelPrevious ? cancel() : undefined;

    try {
      if (!state.isExecuting) {
        setState((prev) => ({
          isExecuting: true,
          successCounter: prev.successCounter,
        }));
      }

      const response = await requestCallback({ cancelToken });

      setState((prev) => ({
        isExecuting: false,
        successCounter: prev.successCounter + 1,
      }));

      onSuccess && onSuccess(response);

      return response;
    } catch (error) {
      if (isCancelError(error)) {
        onCancelled && onCancelled(error);
        return undefined;
      } else if (onError) {
        onError(error);
        return undefined;
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

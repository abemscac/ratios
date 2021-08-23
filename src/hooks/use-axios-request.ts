import { useState, useEffect } from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import useCancelTokenSource from "./use-cancel-token-source";

export interface useAxiosRequestOptions<T> {
  /**
   * @default true
   */
  defaultIsLoading?: boolean;
  /**
   * @default undefined
   */
  defaultData?: T;
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
  onSuccess?: (data: T) => any;
  onError?: (error: any) => any;
  onCancelled?: (error: any) => any;
}

const useAxiosRequest = <T = any>(
  requestCallback: (
    cancelTokenConfig: AxiosRequestConfig
  ) => Promise<AxiosResponse<T>>,
  options: useAxiosRequestOptions<T> = {}
) => {
  const {
    defaultIsLoading,
    defaultData,
    immediate,
    cancelPrevious,
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

  const execute = async (): Promise<T | undefined> => {
    const cancelToken = cancelPrevious ? cancel() : token;

    try {
      setState((prev) => ({
        isLoading: true,
        data: prev.data,
        executed: prev.executed,
      }));

      const { data } = await requestCallback({ cancelToken });

      setState({
        isLoading: false,
        data,
        executed: true,
      });

      onSuccess && onSuccess(data);

      return data;
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

  const setData = (callback: (prevData: T | undefined) => T | undefined) => {
    setState((prev) => ({
      ...prev,
      data: callback(prev.data),
    }));
  };

  return {
    ...state,
    setData,
    execute,
  };
};

export default useAxiosRequest;

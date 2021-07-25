import { useState, useEffect } from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import useCancelTokenSource from "./use-cancel-token-source";

interface useAxiosRequestOptions<T> {
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
  onSuccess?: (data: T) => any;
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

  const {
    defaultIsLoading,
    defaultData,
    immediate,
    onSuccess,
    onError,
    onCancelled,
  } = Object.assign(
    {
      defaultIsLoading: true,
      immediate: true,
    },
    options
  );

  const [state, setState] = useState({
    isLoading: defaultIsLoading,
    data: defaultData,
    executed: false,
  });

  const execute = async (): Promise<T | undefined> => {
    try {
      setState((prev) => ({
        isLoading: true,
        data: prev.data,
        executed: prev.executed,
      }));

      const { data } = await requestCallback({
        cancelToken: cancelTokenSource.token,
      });

      setState({
        isLoading: false,
        data,
        executed: true,
      });

      onSuccess && onSuccess(data);

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

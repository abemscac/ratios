import { useState, useEffect } from "react";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import useCancelTokenSource from "./use-cancel-token-source";

interface useAxiosRequestOptions<T> {
  defaultIsLoading?: boolean;
  defaultData?: T;
  /**
   * If the request should be executed immediately after the component is mounted.
   * @default false
   */
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
        immediate: true,
      },
      options
    );

  const [state, setState] = useState({
    isLoading: defaultIsLoading,
    data: defaultData,
    executed: false,
  });

  const executeRequest = async (): Promise<T | undefined> => {
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

  const setData = (callback: (prevData: T | undefined) => T | undefined) => {
    setState((prev) => ({
      ...prev,
      data: callback(prev.data),
    }));
  };

  const execute = async () => {
    if (state.isLoading) return;
    return await executeRequest();
  };

  return {
    ...state,
    setData,
    execute,
  };
};

export default useAxiosRequest;

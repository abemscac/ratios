import { useEffect, useRef } from "react";
import axios from "axios";

export interface UseCancelTokenSourceOptions {
  /**
   * If the token can only be used once.
   * @default false
   */
  once?: boolean;
}

const useCancelTokenSource = (props: UseCancelTokenSourceOptions = {}) => {
  const ref = useRef(axios.CancelToken.source());

  const { once } = Object.assign({ once: false }, props);

  /**
   * Return a new token if "once" option is false, else return undefined.
   */
  const cancel = () => {
    if (!ref?.current) {
      return undefined;
    }

    ref.current.cancel();

    if (!once) {
      ref.current = axios.CancelToken.source();
      return ref.current.token;
    }

    return undefined;
  };

  useEffect(() => {
    return () => ref?.current?.cancel();
  }, []);

  return {
    token: ref?.current?.token,
    isCancelError: axios.isCancel,
    cancel,
  };
};

export default useCancelTokenSource;

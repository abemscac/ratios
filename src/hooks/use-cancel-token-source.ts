import { useEffect, useRef } from "react";
import axios from "axios";

interface Props {
  /**
   * If the token can be used multiple times.
   * @default true
   */
  repeatable?: boolean;
}

const useCancelTokenSource = (props: Props = {}) => {
  const ref = useRef(axios.CancelToken.source());

  const { repeatable } = Object.assign({ repeatable: true }, props);

  useEffect(() => {
    return () => ref?.current?.cancel();
  }, []);

  /**
   * Return next token if repeatable is true, else return undefined.
   */
  const cancel = () => {
    if (!ref?.current) {
      return undefined;
    }

    ref.current.cancel();

    if (repeatable) {
      ref.current = axios.CancelToken.source();
      return ref.current.token;
    } else {
      return undefined;
    }
  };

  return {
    token: ref?.current?.token,
    isCancelError: axios.isCancel,
    cancel,
  };
};

export default useCancelTokenSource;

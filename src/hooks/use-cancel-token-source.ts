import { useEffect, useRef } from "react";
import axios from "axios";

const useCancelTokenSource = () => {
  const ref = useRef(axios.CancelToken.source());

  useEffect(() => {
    return () => ref?.current?.cancel();
  }, []);

  return {
    token: ref?.current?.token,
    isCancelError: axios.isCancel,
  };
};

export default useCancelTokenSource;

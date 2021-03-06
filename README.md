# Ratios

## A React hook library for managing axios requests, includes cancellation mechanism.

## Installation

- If you're using yarn: `yarn add ratios`
- If you're using npm: `npm install ratios --save`

## Demo

See live demo on [Stackblitz](https://stackblitz.com/edit/axios-with-ratios).

## Important Notices

For 2.x, the `useAxiosRequest` hook will no longer managing the data for you.
It is now a hook that do exactly what this package is about -- to manage a request.
**It's a breaking change**, so make sure you think it through before updating from 1.x to 2.x.

## Basic usage

### 1. First, manage your axios requests in a proper way

```javascript
// File: /src/apis/user.js
import axios, { AxiosRequestConfig } from "axios";

const instance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // ...
});

const UserAPI = {
  getById: (id) => (config?: AxiosRequestConfig) =>
    instance.get(`/users/${id}`, config),
};

export default UserAPI;
```

### 2. Import the "useAxiosRequest" hook from Ratios, and use one of the axios requests we just created as argument

```javascript
import React, { useEffect } from "react";
import { useAxiosRequest } from "ratios";
import UserAPI from "../apis/user";

const MyComponent = () => {
  const [user, setUser] = useState(null);
  const getUserByIdRequest = useAxiosRequest(UserAPI.getById(1));

  const fetchUser = async () => {
    const response = await getUserByIdRequest.execute();
    if (response) {
      setUser(response.data);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div>
      {getUserByIdRequest.isExecuting ? "Loading..." : JSON.stringify(user)}
    </div>
  );
};

export default MyComponent;
```

And that's it! The hook will cancel the request for you when the component unmounts.

## Advanced usage

### 1. With custom config (e.g, query parameters)

```javascript
import React, { useState } from "react";
import { useAxiosRequest } from "ratios";
import UserAPI from "../apis/user";

const MyComponent = () => {
  const [filter, setFilter] = useState({
    name: "",
    age: 5,
  });

  const getUsersRequest = useAxiosRequest((cancelTokenConfig) =>
    UserAPI.getByQuery({
      ...cancelTokenConfig,
      params: filter,
    })
  );

  // Your other codes
};
```

### 2. With custom arguments (e.g, create user)

```javascript
import React, { useState } from "react";
import { useAxiosRequest } from "ratios";
import UserAPI from "../apis/user";

const MyComponent = () => {
  const [form, setForm] = useState({
    name: "John Doe",
    age: 10,
  });

  const createUserRequest = useAxiosRequest(UserAPI.create(form), {
    defaultIsLoading: false,
    immediate: false,
    onError: handleError,
  });

  const handleSubmitClick = async () => {
    const createdUser = await createUserRequest.execute();
    console.log("Created user: ", createdUser);
  };

  const handleError = (error) => {
    console.log("Something went wrong.");
    console.error(error);
  };

  // Your other codes
};
```

### 3. useCancelTokenSource hook

If you just want to apply cancellation mechanism to your existing app, you can use the "useCancelTokenSource" hook.

```javascript
import { useCancelTokenSource } from "ratios";

const MyComponent = () => {
  const cancelTokenSource = useCancelTokenSource();

  const myFunction = async () => {
    try {
      const { data } = await myAPI.getSomething({
        cancelToken: cancelTokenSource.token,
      });
      console.log(data);
    } catch (error) {
      if (cancelTokenSource.isCancelError(error)) {
        console.log("Request is cancelled.");
      } else {
        throw error;
      }
  };

  // Your other codes
};
```

The request will be cancelled automatically when component unmounts.

## API

### 1. Properties for useAxiosRequest()

| key       | Type                             | Description                                                                                                                                                                        |
| --------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isLoading | `boolean`                        | If the request is still going on.                                                                                                                                                  |
| data      | `<T = any>`                      | The data property returned from axios response.                                                                                                                                    |
| setData   | `(callback: (prevData: T) => T)` | The function to update data.                                                                                                                                                       |
| executed  | `boolean`                        | If the request has been executed.                                                                                                                                                  |
| execute   | `() => Promise<T>`               | Execute the request manually. If the `isLoading` property is still `true`, then it will **NOT** execute the request. Will return the data property from axios response if success. |

### 2. Options for useAxiosRequest()

| key              | Type                  | Required | Default Value | Description                                                                   |
| ---------------- | --------------------- | -------- | ------------- | ----------------------------------------------------------------------------- |
| defaultIsLoading | `boolean`             | `false`  | `true`        | The default value of request.isLoading.                                       |
| defaultData      | `any`                 | `false`  | `undefined`   | The default value of request.data.                                            |
| immediate        | `boolean`             | `false`  | `true`        | If the request should be executed immediately after the component is mounted. |
| cancelPrevious   | `boolean`             | `false`  | `true`        | If the previous request should be cancelled before executing a new one.       |
| onSuccess        | `(data: T) => any`    | `false`  | `undefined`   | Function to execute when API is successfully executed.                        |
| onError          | `(error: any) => any` | `false`  | `undefined`   | Function to execute when an error occurred during API execution.              |
| onCancelled      | `(error: any) => any` | `false`  | `undefined`   | Function to execute when the request is cancelled.                            |

### 3. Properties for useCancelTokenSource()

| key           | Type                      | Description                                                                                                     |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| token         | `CancelToken`             | The cancel token.                                                                                               |
| cancel        | `() => CancelToken        | undefined`                                                                                                      | Return next token if repeatable is true, else return undefined. |
| isCancelError | `(value: any) => boolean` | Use this method to check if an error is thrown due to cancellation. **This method equals to `axios.isCancel`.** |

### 4. Options for useCancelTokenSource()

| key        | Type      | Required | Default Value | Description                              |
| ---------- | --------- | -------- | ------------- | ---------------------------------------- |
| repeatable | `boolean` | `false`  | `true`        | If the token can be used multiple times. |

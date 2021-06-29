# Ratios

## A React hook library for managing axios requests, includes cancellation mechanism.

## Installation

- If you're using yarn: `yarn add ratios`
- If you're using npm: `npm install ratios --save`

## Demo

See live demo on [Stackblitz](https://stackblitz.com/edit/axios-with-ratios).

For more information about why we should cancel a request before component unmounts, please see [this article](https://dev.to/abemscac/ratios-yet-another-react-hook-library-for-axios-but-this-one-handles-cancel-token-for-you-2p7f).

## Basic usage

### 1. First, manage your axios requests in a proper way

```javascript
// File: /src/apis/user.js
import axios from "axios";

const instance = axios.create({
  baseURL: "/api/users",
  headers: {
    "Content-Type": "application/json",
  },
  // ...
});

const UserAPI = {
  getAll: (config) => instance.get("", config),
  create: (data, config) => instance.post("", data, config),
  updateById: (id, data, config) => instance.put(`/${id}`, data, config),
  deleteById: (id, config) => instance.delete(`/${id}`, config),
};

export default UserAPI;
```

### 2. Import the "useAxiosRequest" hook from Ratios, and use one of the axios requests we just created as argument

```javascript
import React from "react";
import { useAxiosRequest } from "ratios";
import UserAPI from "../apis/user";

const MyComponent = () => {
  const getUsersRequest = useAxiosRequest(UserAPI.getAll, {
    immediate: true,
  });

  return (
    <div>
      {getUsersRequest.isLoading ? (
        "Loading..."
      ) : (
        <ol>
          {getUsersRequest.data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ol>
      )}
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

  const createUserRequest = useAxiosRequest(
    (cancelTokenConfig) => UserAPI.create(form, cancelTokenConfig),
    {
      defaultIsLoading: false,
      immediate: false,
      onError: handleError,
    }
  );

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

| key       | Type               | Description                                                                                                                                                                        |
| --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isLoading | `boolean`          | If the request is still going on.                                                                                                                                                  |
| data      | `<T = any>`        | The data property returned from axios response.                                                                                                                                    |
| execute   | `() => Promise<T>` | Execute the request manually. If the `isLoading` property is still `true`, then it will **NOT** execute the request. Will return the data property from axios response if success. |

### 2. Options for useAxiosRequest()

| key              | Type                  | Required | Default Value | Description                                                                   |
| ---------------- | --------------------- | -------- | ------------- | ----------------------------------------------------------------------------- |
| defaultIsLoading | `boolean`             | `false`  | `true`        | The default value of request.isLoading.                                       |
| defaultData      | `any`                 | `false`  | `undefined`   | The default value of request.data.                                            |
| immediate        | `boolean`             | `false`  | `false`       | If the request should be executed immediately after the component is mounted. |
| onError          | `(error: any) => any` | `false`  | `undefined`   | Function to execute when an error occurred during API execution.              |
| onCancelled      | `(error: any) => any` | `false`  | `undefined`   | Function to execute when the request is cancelled.                            |

### 3. Properties for useCancelTokenSource()

| key           | Type                      | Description                                                                                                     |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| token         | `CancelToken`             | The cancel token.                                                                                               |
| isCancelError | `(value: any) => boolean` | Use this method to check if an error is thrown due to cancellation. **This method equals to `axios.isCancel`.** |

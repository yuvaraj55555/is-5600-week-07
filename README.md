# Lab 07 | Fullstack Prints React Part 2

## Overview

For this lab, we are going to take the existing React application that you created in the previous lab and add some additional functionality. Specifically, we are going to connect the React application to an existing Node application. The React application will fetch and store products data in the React state. The React application will also allow the user to add products to the cart. The React application will then send the cart data to the Node application to create new orders, will also be displayed in the React application.

The goal of this lab is to become familiar with how we can use state and React Context to manage data in a React application, as well as using `fetch()` and `useEffect` hooks to POST and GET data from a Node API (or any external API really).

## Instructions

1. Take a moment to review your file structure. The state of the code base should be close or mirror to where you left off in your last project.

2. Let's begin by connecting our React application to the Node API server, so we can render the product data. If you examine the `App.js` file, you'll see we are importing the `productData` from disk. This is a JSON file that contains an array of products. We could replace this with a `fetch` call to the Node API server at this component level, but then we would need to pass the data down to the `CardList` component. Instead, we are going to move the `fetch` call to the `CardList` component.
3. Let's refactor the `CardList` so that we are handing the fetching of product data in the `CardList` component - we are going to update the `SingleView` component later so that we do not need to pass an entire array of products to the component. We will use the `useEffect` hook to fetch data from the server and replace the file import in the `App.js`. The `useEffect` hook is similar to a life cycle function, and will be ran when the component boots. This will allow us to fetch the data when the app starts up.

```jsx
// CardList.js
import React, { useState, useEffect } from "react";
import { BASE_URL } from './config';

// Remove the `data` prop - we won't use that anymore
const CardList = ({}) => {

  // ...

  // Define the state object for product data
  const [products, setProducts] = useState([]);

  // Create a function to fetch the products
  const fetchProducts = () => {
    fetch(`${BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      });
  };

  // Use the useEffect hook to fetch the products when the component boots
  useEffect(() => {
    fetchProducts();
  }, []);

  // Update the return method to use the `products` state object
  return (
    <div className="cf pa2">
      <div className="mt2 mb2">
        {products && products.map((product) => (
          <Card key={product.id} {...product} />
        ))}
      </div>

      <div className="flex items-center justify-center pa4">
        <Button text="Previous" handleClick={handlePrevious} />
        <Button text="Next" handleClick={handleNext} />
      </div>
    </div>
  );

}
```

We could have implemented this in the `App.js` component, but the render would be blank. This is because we are using `fetch` to get the data from the server, which is asynchronous. This means that the code will continue to run before the data is returned from the server. Since the initial render has zero products, because we are waiting for the `fetch` promise to be fulfilled, we would pass an empty array via props to the `CardList` component. In the `CardList` component, the `data` prop is used for the initial state for the `products` state object. This means that the `CardList` product is initially rendered with an empty array. Now, React will normally rerender components when the state changes. However, since the `products` state object is initialized with an empty array, it will never change because we are not observing the `data` prop - when the `data` prop changes, nothing happens, and no rerender is triggered. You could observe this by adding a few `console.log` statements in the `App` and `CardList` to monitor the `products` and `data` objects.

Now the products are rendering the data from the server. But we need to refactor our pagination real quick. Instead of paginating against the entire data set in React state, we are going use the Node server's pagination. We just need to update the `fetchProducts` function to include the `limit` and `offset` parameters. We already have a `limit` variable, and a `offset` state variable, so let's just use those.

```jsx
// CardList.js

  // Update fetch projects to include the limit and offset parameters
  const fetchProducts = () => {
    fetch(`${BASE_URL}/products?offset=${offset}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      });
  }
  
  // Update the `useEffect` to monitor the `offset` state variable
  useEffect(() => {
   fetchProducts();
  }, [offset]);
```

By passing the `offset` variable in the `useEffect` dependency array, we are telling React to re-run the `useEffect` hook when the `offset` state variable changes. This will allow us to fetch the next page of products when the user clicks the "Next" button. Since the `handlePrevious` and `handleNext` functions are already updating the `offset` state variable, we don't need to update anything else. While we are in here, let's delete the `getPaginatedProducts` function. We won't need that anymore.
4. Next we need to take a look at the `SingleView` component. This component is currently expecting an array of products to be passed to it. We need to update this component so that it can fetch the product data from the server. First, let's remove the `data` prop from the `SingleView` component. Then, let's add a function to `fetch` the product data from the server by its `id` and configure a `useEffect` hook to monitor the `id` prop and re-render when the data is received. We will also need to add a `loading` state variable to indicate when the data is being fetched from the server. We will use this to render a loading message while the data is being fetched.

Let's start by removing the prop from the `App.js`.

```jsx
// App.js

  return (
    <div className="App">
      <Header />
      
        <Routes>
          <Route path="/" element={<CardList />} />
          <Route path="/product/:id" element={<SingleView />} />
        </Routes>
      
    </div>
  );
```

Now, open up the `SingleView` component and remove the `data` prop from the function signature. Then, add the `fetchProduct` function and the `useEffect` hook to fetch the product data from the server. Don't forget to update the imports, you'll need to add the `BASE_URL`, `useState` and `useEffect` imports.

```jsx
// SingleView.js
export default function SingleView() {

  // Define the state object for product data
  const [ product, setProduct ] = useState(null)

  // Fetch the product by id from the server
  const fetchProductById = async (id) => {
    const product = await fetch(`${BASE_URL}/products/${id}`)
      .then((res) => res.json());
    return product;
  };

  // Use the useEffect hook to fetch the product when the component boots
  useEffect(() => {
    const getProduct = async () => {
      const data = await fetchProductById(id);
      setProduct(data)
    }
    getProduct();
  }, [id, fetchProductById]);

  // show a spinner if there is no product loaded yet
  if (!product) return (<div className="loading-spinner"></div>);

  // ...
}
```

Great - so now our application is configured to get all data from the Node Server. Now we can move on to the next step - we are going to add a cart to our application.

6. The cart should work like this: the `SingleView` will include an "Add to Cart" button. When the user clicks the button, the product should be added to the cart. We have created for you a basic cart component that will render the contents of the cart, this will need to be connected to the `/cart` route. You'll note that the "Cart" icon in the header is already showing the number of items in the cart (0), we will need to link this to the actual cart as well.

To manage the cart state, we are going to use two new concepts - `Context` and `Reducer`. Context is a way to pass data through the component tree without having to pass props down manually at every level. Reducer is a way to manage state in a more predictable way. We will be using the `useReducer` hook to manage the cart state. We want to use `Context` so that we can access the cart state from anywhere in the application. We will be using the `useContext` hook to access the cart state from the `Header` component.

So first, let's start with the cart context provider. You can read more about Context here: <https://reactjs.org/docs/context.html>. We have created a `src/state/CartProvider` file for you. This file uses the reducer pattern to manage the cart state. You can read more about reducers here: <https://reactjs.org/docs/hooks-reference.html#usereducer>. We won't dive too much into the details of how this works here (you can learn more in the walkthrough), but you can see that we are exporting a `CartProvider` component that wraps the entire application. This component is using the `useReducer` hook to manage the cart state.

In order to use the cart context, we need to wrap the entire application in the `CartProvider` component. Open up the `App.js` file and import the `CartProvider` component. Then, wrap the entire application in the `CartProvider` component.

```jsx
// App.js

 return (
    <div className="App">
      <CartProvider>
        <Header />
      
        <Routes>
          <Route path="/" element={<CardList />} />
          <Route path="/product/:id" element={<SingleView />} />
        </Routes>
      </CartProvider>
    </div>
  );
```

This will make the cart state available to any component in the application. Now, let's add the cart to the `Header` component. We will use the `useContext` hook to access the cart state from the `Header` component.

```jsx
// Header.js

// ...
import { CartContext } from '../state/CartProvider';

const Header = () => {
  // Import the cart state from the CartContext
  const { cartItems } = useContext(CartContext);
  // Use the reduce function to calculate the total number of items in the cart
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // ...
}
```

7. Great, now we need to create a component to for the "Add To Cart" button. Create a new file, `src/components/AddToCart.js`. This component will need to accept a `product` prop. It will have an `onClick` handler that will add the product to the cart.

```jsx  

export default function OrderButton({product}) {
  
  // Import the addToCart function from the CartContext
  const { addToCart } = useContext(CartContext);

  const handleClick = (product) => {
    console.log("Adding to cart", product)
    addToCart(product)
  }

  return (
    <a className="f6 link dim br3 ba bw1 ph3 pv2 mb2 dib black" onClick={() => handleClick(product)}>Add to Cart</a>
  )
}
```

Finally, open the `SingleView` component and import the `AddToCart` component. Replace the `TODO` comment near the bottom of the return statement with the `AddToCart` component. Pass the `product` prop to the `AddToCart` component.

Now, when we visit the `/product/:id` route, we should see the "Add to Cart" button. When we click the button, the product should be added to the cart, we should see the number of items in the cart update in the header.

Next, let's register that `/cart` route. Open the `App.js` file and add a new route for the `/cart` route. The `element` prop should be the `Cart` component.

```jsx
// App.js

return (
    <div className="App">
      <CartProvider>
        <Header />
      
        <Routes>
          <Route path="/" element={<CardList />} />
          <Route path="/product/:id" element={<SingleView />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </CartProvider>
    </div>
  );
```

8. If we visit the `/cart` route, we will see that not all of the data is being displayed. This is because the `Cart` component is not fully functional. One the `Cart.js` file and you'll see that it is not connected to the cart context state. Using what you've learned so far, import the `CartProvider` and `useContext` hooks, then replace the `cartItems`, `updateItemQuantity`, `getCartTotal` and `removeFromCart` with the values from the `CartContext`.

You will complete the final 3 steps independently, you can read the instructions below.

## Your Task

1. Implement the `updateItemQuantity` in the cart context provider. The function stub already exists, you just need to implement the logic.

- The `CartProvider.updateItemQuantity` function should call dispatch with the `UPDATE_ITEM_QUANTITY` action type and the `id` and `quantity` as the payload.
- Add a new switch case to the `cartReducer` function that handles the `UPDATE_ITEM_QUANTITY` action type. The function should return a new array of cart items with the updated quantity. Use the `ADD_ITEM` case as a reference or template. Note that you will note need to modify the `allItems` array at all.
- The `ADD_ITEM` case is almost identical to the `UPDATE_ITEM_QUANTITY` case, the key difference is how the quantity is calculated. In the `ADD_ITEM` case, the quantity is calculated by adding the `quantity` prop to the existing quantity. In the `UPDATE_ITEM_QUANTITY` case, the quantity is calculated by using the `quantity` prop as the new quantity.

2. Implement the `getCartTotal` function in the cart context provider. The function stub already exists, you just need to implement the logic.

- The `CartProvider.getCartTotal` function should return the total price of all items in the cart. You can use the `reduce` function to calculate the total.

3. Implement the `Orders` component. This component already exists, and simply needs to be connected to the Node API.

- Register the `/orders` route in the `App.js` file. The `element` prop should be the `Orders` component. Follow the same pattern as the `/cart` route.
- Similar to the `CardList` component, the `Orders` component should fetch the orders from the Node API. You can use the `fetch` function to make the request. The URL is: <https://plankton-app-9p6gs.ondigitalocean.app/orders>
- Again, similar to the `CardList` component, the `Orders` component will need to use `useEffect` to fetch the orders from the API. The hook should call your `fetchOrders` function and then update the `orders` state with the response using the `setOrders` function.

## Guidance and Testing

- Steps 1 and 2 in the *Your Task* section are isolated to the `CartProvider` file, you should be able to test your code by visiting the `/cart` route, but all changes will be applied to the `CartProvider` file.
- Note that we will not be directly defining imports in the code snippets anymore. You will need to import the necessary modules in your code.
- For this lab, we will be using the Node API that you created in the previous labs. However, instead of using the instance deployed to your Replit, you will use an instance that has been provisioned by the instructor. The URL is: <https://plankton-app-9p6gs.ondigitalocean.app/>

## Submission

Once you have completed the lab, please submit your code to the Replit classroom. You can do this by clicking the "Share" button in the top right corner of the Replit editor. Then, click the "Share to Classroom" button. You should see a list of classes that you are enrolled in. Select the class that you are enrolled in and click the "Share" button. You should see a message that your code has been shared with the class. You can now close the share window.

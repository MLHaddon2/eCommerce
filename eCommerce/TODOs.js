// DONE: Cart persistence implemented using localStorage and remote sync via /api/cart/update/:id/:ipAddress.
//       Guest carts are preserved across refreshes and merged with authenticated carts when available.

// DONE: Browse page now fetches products on mount when they are not already loaded and renders a loading state.

//Done TODO: Fix the runtime error with the cart request for logged in customers.
// DONE: The cart update route has been updated to handle the case where the id parameter is not provided. If the id parameter is not provided, the route will use the ipAddress to identify the user instead. This allows for cart updates to work for non-authenticated users as well. Additionally, logging has been added to help debug any issues with cart updates.

//Done TODO: IP History management doesn't populate dom with an iphistory if there isnt one present in the database. Fixed...
// DONE: IP History management now creates a new IP history record if one doesn't exist for the incoming IP address, and returns the new record in the response. This ensures that even first-time visitors have an IP history created for them, allowing for cart persistence and tracking from their very first interaction. Additionally, the update logic has been adjusted to return the updated IP history record after an update operation, providing immediate feedback on the changes made.

//DoneTODO: Fix the cart update with a non-authenticated user. The cart is getting a 500 error with a message which states "error": "WHERE parameter \"id\" has invalid \"undefined\" value". This is because the cart update route is expecting an id parameter, but it is not being passed in the request. The cart update route should be updated to handle the case where the id parameter is not provided, and it should use the ipAddress to identify the user instead.
// DONE: The cart update route has been updated to handle the case where the id parameter is not provided. If the id parameter is not provided, the route will use the ipAddress to identify the user instead. This allows for cart updates to work for non-authenticated users as well.

//DONE TODO: Fix the issue with the cart loading forms twice. Its seems to be related to the UseEffect running twice. This issue has been resolved for square payments, though the credit card form still needs fixing.
// DONE: The double form rendering issue was caused by the useEffect hook running twice in development mode due to React's Strict Mode. To fix this, we added a check to ensure that the Square payment form is only initialized once, preventing the duplicate rendering of the form. This change has been applied to both the Square payment form and the credit card form, ensuring that they both render correctly without duplication.

// TODO: (For after MVP is achieved) Implement the review system so that customers may leave reviews for their products. (Noted that the admin panel is already built to accommodate that.)

// TODO: There may be some TODO's in the adminPanel. For example there may still be a bug with the other users being able to access it.

// TODO: Implement a feature to automatically use the browser location to pre-fill the shipping address form on the checkout page. This would enhance user experience by reducing the amount of manual input required during checkout.

// TODO: Implement all the missing JPGs for the items. OR wait to have actual items after deployment.
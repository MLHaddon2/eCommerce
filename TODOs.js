// DONE: Cart persistence implemented using localStorage and remote sync via /api/cart/update/:id/:ipAddress.
//       Guest carts are preserved across refreshes and merged with authenticated carts when available.

// DONE: Browse page now fetches products on mount when they are not already loaded and renders a loading state.

//Done TODO: Fix the runtime error with the cart request for logged in customers.
// DONE: The cart update route has been updated to handle the case where the id parameter is not provided. If the id parameter is not provided, the route will use the ipAddress to identify the user instead. This allows for cart updates to work for non-authenticated users as well. Additionally, logging has been added to help debug any issues with cart updates.

//Done TODO: IP History management doesn't populate dom with an iphistory if there isnt one present in the database. Fixed...
// DONE: IP History management now creates a new IP history record if one doesn't exist for the incoming IP address, and returns the new record in the response. This ensures that even first-time visitors have an IP history created for them, allowing for cart persistence and tracking from their very first interaction. Additionally, the update logic has been adjusted to return the updated IP history record after an update operation, providing immediate feedback on the changes made.

//Done TODO: Fix the cart update with a non-authenticated user. The cart is getting a 500 error with a message which states "error": "WHERE parameter \"id\" has invalid \"undefined\" value". This is because the cart update route is expecting an id parameter, but it is not being passed in the request. The cart update route should be updated to handle the case where the id parameter is not provided, and it should use the ipAddress to identify the user instead.
// DONE: The cart update route has been updated to handle the case where the id parameter is not provided. If the id parameter is not provided, the route will use the ipAddress to identify the user instead. This allows for cart updates to work for non-authenticated users as well.

//DONE TODO: Fix the issue with the cart loading forms twice. Its seems to be related to the UseEffect running twice. This issue has been resolved for square payments, though the credit card form still needs fixing.
// DONE: The double form rendering issue was caused by the useEffect hook running twice in development mode due to React's Strict Mode. To fix this, we added a check to ensure that the Square payment form is only initialized once, preventing the duplicate rendering of the form. This change has been applied to both the Square payment form and the credit card form, ensuring that they both render correctly without duplication.

//DONE TODO: There may be some TODO's in the adminPanel. For example there may still be a bug with the other users being able to access it.
//DONE: The admin panel access issue has been resolved by implementing proper authentication and authorization checks. Now, only users with the appropriate admin role can access the admin panel, ensuring that other users are restricted from accessing it. This enhances the security of the admin panel and prevents unauthorized access to sensitive features and data.

//DONE TODO: Implement a feature to automatically use the browser location to pre-fill the shipping address form on the checkout page. This would enhance user experience by reducing the amount of manual input required during checkout. 
// DONE: The browser location feature has been implemented to pre-fill the shipping address form on the checkout page. This enhancement improves user experience by reducing the amount of manual input required during checkout, making the process faster and more convenient for customers. The location data is fetched using the useGeoLocation hook and is used to populate the relevant fields in the shipping address form automatically.

//DONE TODO: Fix the UX/UI issue with the header opening a topdown bar and a sidebar when the scale is small. Currently the dropdown button toggles both the topdown bar and the sidebar, which creates a confusing user experience. The dropdown button should be updated to only toggle the sidebar. This will create a clearer and more intuitive navigation experience for users on smaller screens.
// DONE: The header dropdown button now only toggles the sidebar, resolving the UX/UI issue where both the topdown bar and sidebar were being opened simultaneously. This provides a clearer and more intuitive navigation experience for users on smaller screens.
// TODO: (For after MVP is achieved) Implement the review system so that customers may leave reviews for their products. (Noted that the admin panel is already built to accommodate that.) 

// TODO: Implement all the missing JPGs for the items. OR wait to have actual items after deployment. 

// TODO: Implement working sandbox API's for Klarna and Afterpay payment options. 

// TODO: Check for shipping state using geolocation for paypal, klarna and afterpay to ensure that they are only offered as payment options when the customer is in a state where those payment options are available.

// TODO: Add logistics integration for checkout (Order and transaction confirmations and item shipment integration specifically).

// TODO: Add the ability to change your username and password on the account page. In fact add a tabbed account management page thats modular and scalable in nature.

// TODO: The cart isn't persisting between page refreshes on the deployment build.
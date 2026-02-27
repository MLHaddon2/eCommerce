import "bootstrap/dist/css/bootstrap.css";
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./views/Main/Home";
import Login from "./views/Main/Login.js";
import Signup from "./views/Main/Signup.js";
import Header from "./views/Main/Header.js";
import BrowseProducts from './views/Main/Browse.js';
import Cart from './views/Main/Cart.js';
import Checkout from './views/Main/Checkout.js';
import Account from './views/Main/Account.js';
import ProductPage from './views/Main/ProductPage.js';
import AdminPanel from './views/Admin/AdminPanel.js';
import RequestTest from './views/Tests/RequestTest.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { DataProvider } from './contexts/DataContext.js';
import { CartProvider } from './contexts/CartContext.js';


function App() {
  return (
    <DataProvider>
    <CartProvider>
    <AuthProvider>
      <div className="App">
          <Header />
          <Routes>
              <Route path="/">
                <Route index element={<Home />} />
              </Route>
              <Route path="home">
                <Route index element={<Home />} />
              </Route>
              <Route path="login">
                <Route index element={<Login />} />
              </Route>
              <Route path="signup">
                <Route index element={<Signup />} />
              </Route>
              <Route path="/browse">
                <Route index element={ <BrowseProducts/> } />
              </Route>
              <Route path='/cart'>
                <Route index element={ <Cart /> } />
              </Route>
              <Route path="/checkout">
                <Route index element={ <Checkout /> } />
              </Route>
              <Route path="/account">
                <Route index element={ <Account /> } />
              </Route>
              <Route path="/product/:id">
                <Route index element={ <ProductPage /> } />
              </Route>
              <Route path="/adminpanel">
                <Route index element={ <AdminPanel /> } />
              </Route>
              <Route path="/tests/requesttest">
                <Route index element={ <RequestTest /> } />
              </Route>
            </Routes>
        <footer className="text-center">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <p>Copyright © Mike L. Haddon II. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
    </CartProvider>
    </DataProvider>
  );
};


export default App;
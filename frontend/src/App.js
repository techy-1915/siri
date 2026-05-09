import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import CustomerNav from "./components/CustomerNav";
import Footer from "./components/Footer";
import { FadeRoute } from "./components/anim";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceBookingPage from "./pages/ServiceBookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import VisitPage from "./pages/VisitPage";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminReports from "./pages/admin/AdminReports";

function CustomerLayout() {
  return (
    <div className="app-shell">
      <CustomerNav/>
      <main style={{ flex: "1 1 auto" }}>
        <Outlet/>
      </main>
      <Footer/>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Customer */}
        <Route element={<CustomerLayout/>}>
          <Route path="/" element={<FadeRoute><HomePage/></FadeRoute>}/>
          <Route path="/shop" element={<FadeRoute><ShopPage/></FadeRoute>}/>
          <Route path="/shop/:id" element={<FadeRoute><ProductPage/></FadeRoute>}/>
          <Route path="/cart" element={<FadeRoute><CartPage/></FadeRoute>}/>
          <Route path="/checkout" element={<FadeRoute><CheckoutPage/></FadeRoute>}/>
          <Route path="/order/:id" element={<FadeRoute><OrderConfirmationPage/></FadeRoute>}/>
          <Route path="/services" element={<FadeRoute><ServicesPage/></FadeRoute>}/>
          <Route path="/services/book/:id" element={<FadeRoute><ServiceBookingPage/></FadeRoute>}/>
          <Route path="/about" element={<FadeRoute><AboutPage/></FadeRoute>}/>
          <Route path="/visit" element={<FadeRoute><VisitPage/></FadeRoute>}/>
          <Route path="/account" element={<FadeRoute><AccountPage/></FadeRoute>}/>
        </Route>

        {/* Auth (no layout) */}
        <Route path="/login" element={<FadeRoute><LoginPage/></FadeRoute>}/>
        <Route path="/register" element={<FadeRoute><RegisterPage/></FadeRoute>}/>

        {/* Admin */}
        <Route path="/admin/login" element={<FadeRoute><AdminLogin/></FadeRoute>}/>
        <Route path="/admin" element={<AdminLayout/>}>
          <Route index element={<AdminDashboard/>}/>
          <Route path="orders" element={<AdminOrders/>}/>
          <Route path="orders/:id" element={<AdminOrderDetail/>}/>
          <Route path="bookings" element={<AdminBookings/>}/>
          <Route path="products" element={<AdminProducts/>}/>
          <Route path="customers" element={<AdminCustomers/>}/>
          <Route path="coupons" element={<AdminCoupons/>}/>
          <Route path="reports" element={<AdminReports/>}/>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AnimatedRoutes/>
          <Toaster position="top-right" richColors theme="light"/>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

import dotenv from 'dotenv';
import express from 'express';
import { UtilHQ } from "@utilhq/sdk";

import Product from "./routes/product";
import { Cart } from "./routes/cart";
import { User } from "./routes/user";
import { Order } from "./routes/order";
import { InventoryPage } from "./routes/inventory";

dotenv.config();

const app = express();
const PORT = 3000;

const utilhq = new UtilHQ({
  endpoint: "wss://app.utilhq.com/websocket",
  apiKey: process.env.UTILHQ_API_KEY,
  routes: {
    product: Product,
    cart: Cart,
    user: User,
    order: Order,
    inventory: InventoryPage,
  },
});

utilhq.listen();

app.get('/', (req, res) => {
  res.redirect('https://app.utilhq.com');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
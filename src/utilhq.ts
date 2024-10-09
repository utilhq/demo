import dotenv from 'dotenv';
import express from 'express';
import { UtilHQ } from "@utilhq/sdk";
import getPort from 'get-port';

import Product from "./routes/product";
import { Cart } from "./routes/cart";
import { User } from "./routes/user";
import { Order } from "./routes/order";
import { InventoryPage } from "./routes/inventory";

dotenv.config();

const app = express();
const DEFAULT_PORT = 3000;

const utilhq = new UtilHQ({
  endpoint: process.env.UTILHQ_ENDPOINT,
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

(async () => {
  const port = await getPort({ port: DEFAULT_PORT });
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
})();
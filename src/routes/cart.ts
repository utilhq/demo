import { Layout, Page, io } from "@utilhq/sdk";

export const Cart = new Page({
  name: "Cart",
  handler: async (c) => {
    return new Layout({
      title: "Cart",
      children: [
        io.display.table("", {
          getData: async (input) => {
            return {
              data: [
                {
                  cartID: "cart-1",
                  userID: "user-1",
                  email: "email@example.com",
                  cardID: "card-id-1",
                  shippingID: "shipping-id-1",
                  items: 10,
                  cost: 100.0,
                },
              ],
            };
          },
        }),
      ],
    });
  },
});
